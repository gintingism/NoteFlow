<div align="center">
  <h1>Noteflow</h1>
  <p><strong>The Ultra-Lightweight, Local-First AI Meeting & Speech Assistant</strong></p>
  <p>
    <a href="https://github.com/gintingism/conversationaly/actions/workflows/build-windows.yml"><img src="https://img.shields.io/github/actions/workflow/status/gintingism/conversationaly/build-windows.yml?label=Windows%20Build&logo=windows" alt="Windows Build"></a>
    <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
    <img src="https://img.shields.io/badge/Hardware-4GB%20RAM%20Friendly-success" alt="RAM Friendly">
    <img src="https://img.shields.io/badge/Privacy-100%25%20Offline-green" alt="Offline">
  </p>
  <p align="center">
    Records your meetings, transcribes spoken words live, and generates executive summaries — 100% locally on your machine. No accounts, no paywalls, and zero cloud round-trips.
  </p>
</div>

---

<details>
<summary><strong>Table of Contents</strong></summary>

- [Overview](#overview)
- [What's New & Enhanced in Noteflow](#whats-new--enhanced-in-noteflow)
- [Hardware Profiles (Potato to Workstation)](#hardware-profiles-potato-to-workstation)
- [Key Features](#key-features)
- [Quick Download & Installation](#quick-download--installation)
- [How It Works](#how-it-works)
- [Development & Building From Source](#development--building-from-source)
- [Lineage & Acknowledgments](#lineage--acknowledgments)
- [License](#license)

</details>

---

## Overview

**Noteflow** is a privacy-first desktop application for Windows, macOS, and Linux that captures your microphone and system audio cleanly, transcribes conversations in real-time, and formats structured notes using local AI models. 

By default, everything runs locally on your machine. Your voice data never leaves your computer, making it safe for confidential business discussions, legal proceedings, and private 1-on-1s.

---

## What's New & Enhanced in Noteflow

This project is an optimized fork and evolution of [Conversationaly](https://github.com/bykof/conversationaly) by Sujith S, specifically modified to overcome hardware barriers, eliminate inference crashes, and broaden model availability:

1. **Hugging Face Model Hub (Direct Search & 1-Click Download)**:
   - Search the entire Hugging Face library for automatic speech recognition (ASR) GGUF models directly within the application.
   - Explore repository trees to inspect `.gguf` quantizations and download them with one click.
   - Import local `.gguf` model files directly from your disk with automated validation.

2. **Adaptive Hardware Profiles (Eco / Balanced / Max Quality)**:
   - Tailored presets allowing even resource-constrained laptops (dual-core CPUs, 4GB–8GB RAM) to run live meeting transcription smoothly.
   - Includes **Moonshine Streaming Tiny (~48MB)**, using under 150MB of RAM without heating up the processor.

3. **Rock-Solid CPU Inference Engine (Zero GPU Shader Crashes)**:
   - Fixed the persistent `backend error: run: backend error (status 8)` error caused by Vulkan compute shader timeouts and VRAM exhaustion on integrated graphics (Intel UHD / Iris Xe).
   - Bundles an ultra-stable CPU inference path utilizing **tinyBLAS + AVX2**.

4. **Fixed Windows Audio Mixer Glitch**:
   - Resolved the issue where the application's audio level was stuck at 1% in the Windows Volume Mixer during audio recording sessions.

5. **Modern, Slop-Free UI/UX**:
   - Redesigned interface following strict human-first design engineering standards: unified Lucide iconography, OKLCH color palettes, clear tactile feedback, and smooth micro-interactions.

---

## Hardware Profiles (Potato to Workstation)

Noteflow automatically adapts to your system resources. You can switch profiles at any time in **Settings > Transcription Models**:

| Profile | Recommended Model | Model Size | RAM Usage | Target Hardware |
| :--- | :--- | :--- | :--- | :--- |
| 🍃 **Eco Mode** | Moonshine Streaming Tiny | **~48 MB** | **< 150 MB** | Dual-core CPUs, 4GB RAM, Thin & Light Laptops |
| ⚖️ **Balanced Mode** | Parakeet TDT 0.6B v3 | ~600 MB | ~1.2 GB | Quad-core CPUs, 8GB RAM, Standard Laptops |
| 🚀 **Max Quality** | Granite Speech Plus | ~1.6 GB | ~3.0 GB | 16GB+ RAM, Multi-core PCs, Dedicated GPUs |

---

## Key Features

- **Live Real-Time Transcription**: Streaming-native speech models transcribe continuously as you or meeting participants speak.
- **Built-in Local AI Summarizer**: Bundled `llama-helper` sidecar runs local models (like Gemma 4 or Qwen) for structured notes, key takeaways, and action items — no Ollama installation needed.
- **External Provider Freedom**: Connect your own API keys for Claude, Groq, OpenAI, or local Ollama instances if you prefer cloud or external LLM processing.
- **Clean Audio Loopback**: Captures both microphone and speaker audio with RMS ducking to avoid distortion and volume degradation.
- **Local SQLite Storage**: Past meeting minutes, full transcripts, and audio recordings remain stored safely in your local application directory.

---

## Quick Download & Installation

### Prebuilt Windows Binary (CPU-Optimized, Rock-Solid)
Ready-to-use Windows installers are automatically compiled via GitHub Actions:

1. Visit [GitHub Actions Run #43173940468](https://github.com/gintingism/conversationaly/actions/runs/43173940468).
2. Scroll to the **Artifacts** section at the bottom.
3. Download `conversationaly-windows-x64-release-1.4.1.zip`.
4. Extract the archive and execute the `.msi` or `.exe` installer.

---

## How It Works

```
┌──────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│  Audio Ingest    │ ──> │  Local Transcription  │ ──> │  Local AI Summarizer │
│  Mic + WASAPI    │     │  (transcribe.cpp)     │     │  (llama.cpp sidecar) │
│  Audio Loopback  │     │  GGUF Speech Models   │     │  Action Items & Notes│
└──────────────────┘     └───────────────────────┘     └──────────────────────┘
```

1. **Audio Capture**: Clean WASAPI loopback captures microphone and system audio without mixer attenuation.
2. **Resampling**: The stream is normalized and resampled to 16 kHz.
3. **Local Inference**: Audio buffers are processed locally by the selected model (Moonshine / Parakeet / Granite).
4. **Summary**: The final transcript is structured into notes, action points, and decisions.

---

## Development & Building From Source

### Prerequisites
- Node.js 22+ & `pnpm`
- Rust stable toolchain (`x86_64-pc-windows-msvc`)
- CMake

### Step-by-Step Build

```bash
# 1. Clone the repository
git clone https://github.com/gintingism/conversationaly.git
cd conversationaly/frontend

# 2. Install frontend dependencies
pnpm install

# 3. Launch Development Server (CPU Mode - Recommended)
pnpm run tauri:dev:cpu

# 4. Or launch with GPU Acceleration (CUDA / Vulkan)
pnpm run tauri:dev:vulkan
```

---

## Lineage & Acknowledgments

- Forked from [Conversationaly](https://github.com/bykof/conversationaly) by **Sujith S** and [Meetily](https://github.com/Zackriya-Solutions/meeting-minutes) by **Zackriya Solutions**.
- Core inference powered by [transcribe.cpp](https://github.com/handy-computer/transcribe.cpp) and [llama.cpp](https://github.com/ggerganov/llama.cpp).
- Speech model weights courtesy of **NVIDIA** (Parakeet, Nemotron) and **Useful Sensors** (Moonshine).

---

## License

Distributed under the [MIT License](LICENSE.md).
