// transcribe_engine/hf_hub.rs
//
// Dynamic Hugging Face Hub integration for discovering and downloading
// community transcription models (GGUF).

use anyhow::{anyhow, Result};
use log::info;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;

const HF_API_BASE: &str = "https://huggingface.co/api";
const USER_AGENT: &str = "Conversationaly/1.4 (Desktop; ASR Model Hub)";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfModelItem {
    pub id: String,
    pub author: Option<String>,
    #[serde(default)]
    pub downloads: u64,
    #[serde(default)]
    pub likes: u64,
    pub pipeline_tag: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub last_modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfFileItem {
    pub path: String,
    pub size: Option<u64>,
    pub r#type: String,
}

/// Search Hugging Face models by query with ASR/GGUF filters.
pub async fn search_hf_models(query: &str, limit: usize) -> Result<Vec<HfModelItem>> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent(USER_AGENT)
        .build()?;

    let trimmed = query.trim();
    let limit_str = limit.to_string();

    let request = if trimmed.is_empty() {
        // Default: discover popular ASR / transcribe GGUF models
        let url = format!("{}/models", HF_API_BASE);
        client.get(&url).query(&[
            ("filter", "gguf"),
            ("pipeline_tag", "automatic-speech-recognition"),
            ("sort", "downloads"),
            ("direction", "-1"),
            ("limit", &limit_str),
        ])
    } else {
        let url = format!("{}/models", HF_API_BASE);
        client.get(&url).query(&[
            ("search", trimmed),
            ("filter", "gguf"),
            ("limit", &limit_str),
            ("full", "false"),
        ])
    };

    info!("Searching Hugging Face models (query: '{}')", trimmed);
    let resp = request.send().await?;
    if !resp.status().is_success() {
        return Err(anyhow!("Hugging Face API returned error status: {}", resp.status()));
    }

    let items: Vec<HfModelItem> = resp.json().await?;
    Ok(items)
}

/// List files in a Hugging Face repository, filtering for GGUF and audio model files.
pub async fn get_hf_repo_files(repo_id: &str) -> Result<Vec<HfFileItem>> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent(USER_AGENT)
        .build()?;

    let url = format!("{}/models/{}/tree/main", HF_API_BASE, repo_id.trim());
    info!("Fetching Hugging Face repo tree: {}", url);

    let resp = client.get(&url).send().await?;
    if !resp.status().is_success() {
        return Err(anyhow!(
            "Failed to fetch files for repository '{}': HTTP {}",
            repo_id,
            resp.status()
        ));
    }

    let all_files: Vec<HfFileItem> = resp.json().await?;
    // Filter to only include .gguf (or .bin) files
    let filtered = all_files
        .into_iter()
        .filter(|f| {
            f.r#type == "file" && (f.path.ends_with(".gguf") || f.path.ends_with(".bin"))
        })
        .collect();

    Ok(filtered)
}

/// Import a local GGUF file from the user's filesystem into the models directory.
pub async fn import_local_gguf(source_path: &Path, models_dir: &Path) -> Result<PathBuf> {
    if !source_path.exists() {
        return Err(anyhow!("Source file does not exist: {}", source_path.display()));
    }

    let ext = source_path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    if ext != "gguf" && ext != "bin" {
        return Err(anyhow!(
            "Invalid file format: expected a .gguf file, found '{}'",
            ext
        ));
    }

    let file_name = source_path
        .file_name()
        .ok_or_else(|| anyhow!("Invalid source filename"))?;
    let target_path = models_dir.join(file_name);

    if !models_dir.exists() {
        tokio::fs::create_dir_all(models_dir).await?;
    }

    info!(
        "Copying local GGUF model: {} -> {}",
        source_path.display(),
        target_path.display()
    );
    tokio::fs::copy(source_path, &target_path).await?;
    Ok(target_path)
}
