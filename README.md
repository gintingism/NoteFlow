<div align="center">
  <h1>Noteflow</h1>
  <p><strong>Lightweight, local meeting recorder and speech transcription app</strong></p>
  <p>
    <a href="https://github.com/gintingism/NoteFlow/actions/workflows/build-windows.yml"><img src="https://img.shields.io/github/actions/workflow/status/gintingism/NoteFlow/build-windows.yml?label=Windows%20Build&logo=windows" alt="Windows Build"></a>
    <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
    <img src="https://img.shields.io/badge/RAM-4GB%20Friendly-green" alt="RAM Friendly">
    <img src="https://img.shields.io/badge/Privacy-Local%20Only-blue" alt="Local Only">
  </p>
  <p align="center">
    Records meeting audio, generates live transcripts, and creates structured summaries entirely on your machine. No accounts, no paywalls, and no cloud requests unless you choose to add an API key.
  </p>
</div>

---

## What Noteflow Does

Noteflow is a desktop app for Windows, macOS, and Linux. It records your microphone alongside system audio, transcribes what people say in real time, and turns the transcript into structured meeting minutes using local AI models.

Everything stays on your device. Your audio files and database live on your local drive, so confidential conversations never leave your room.

---

## Enhancements in this Version

This repository is an updated and optimized fork of Conversationaly (by Sujith S), focusing on better stability, wider model choices, and smooth execution on everyday laptops.

1. **Hugging Face Model Hub**
   Search the Hugging Face library for ASR speech models directly inside the app. Browse repository file trees to select quantized GGUF weights, download them with a single click, or import GGUF files already stored on your drive.

2. **Hardware Presets for Any Computer**
   * **Eco Mode (Moonshine Streaming Tiny, about 48MB)**: Designed for dual core processors, thin laptops, and systems with 4GB RAM. Uses under 150MB of system memory.
   * **Balanced Mode (Parakeet TDT 0.6B)**: Fast and accurate speech recognition for standard quad core systems with 8GB RAM.
   * **Quality Mode (Granite Speech Plus)**: Higher precision for multi speaker meetings on workstations with dedicated hardware.

3. **Broad Hardware and GPU Compatibility**
   * **NVIDIA GPUs**: Supported through CUDA or Vulkan compute.
   * **AMD GPUs**: Supported through Vulkan on Windows and ROCm on Linux.
   * **Intel GPUs**: Supported through Vulkan across integrated and discrete Arc graphics.
   * **Apple Silicon**: Supported through Metal acceleration.
   * **CPUs**: Built with tinyBLAS and AVX2 vector math, ensuring stable execution on both Intel Core and AMD Ryzen processors without crashing on systems lacking AVX-512.

4. **Resolved Windows Volume Mixer Issue**
   Fixed the issue where recording capture previously caused application volume to stay locked at 1 percent in the Windows sound mixer.

5. **Interface Polish**
   Clean layout with unified Lucide icons, readable typography, and clear status indicators for live recording.

---

## Hardware Presets

You can select a preset at any time under Settings > Transcription Models:

| Preset | Model | Size | Typical RAM | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Eco** | Moonshine Streaming Tiny | ~48 MB | Under 150 MB | Dual core CPUs, thin laptops, 4GB RAM |
| **Balanced** | Parakeet TDT 0.6B | ~600 MB | ~1.2 GB | Quad core CPUs, general laptops, 8GB RAM |
| **Quality** | Granite Speech Plus | ~1.6 GB | ~3.0 GB | Multi core PCs, workstations, dedicated GPUs |

---

## Ready to Use Windows Download

Prebuilt installers are created automatically through GitHub Actions:

1. Open [GitHub Actions Run 43173940468](https://github.com/gintingism/NoteFlow/actions/runs/43173940468) or the latest run.
2. Go to the **Artifacts** section at the bottom of the page.
3. Download `conversationaly-windows-x64-release-1.4.1.zip`.
4. Extract the folder and launch the installer file.

---

## How It Works

1. **Audio Capture**: Captures microphone and speaker audio via clean WASAPI loopback on Windows without volume reduction.
2. **Audio Processing**: Normalizes and resamples the stream to 16 kHz.
3. **Speech Transcription**: Passes audio buffers to the active speech model running locally via transcribe.cpp.
4. **Summary Generation**: Summarizes the finished text into key points, decisions, and action items using the bundled llama.cpp engine or an optional cloud provider.

---

## Building from Source

### Requirements
* Node.js 22 or newer with pnpm
* Rust stable toolchain (x86_64-pc-windows-msvc)
* CMake

### Build Commands

```bash
# Clone repository
git clone https://github.com/gintingism/NoteFlow.git
cd NoteFlow/frontend

# Install dependencies
pnpm install

# Start development app using CPU mode
pnpm run tauri:dev:cpu

# Or start with GPU acceleration
pnpm run tauri:dev:vulkan
```

---

## History and Credits

* Maintained and updated by Bonifasius Toto Neguisa Ginting (@gintingism).
* Forked from Conversationaly by Sujith S, which was originally based on Meetily by Zackriya Solutions.
* Audio transcription powered by transcribe.cpp and ggml.
* Local summary helper powered by llama.cpp.
* Speech model architectures provided by Useful Sensors (Moonshine) and NVIDIA (Parakeet and Nemotron).

---

## License

This project is licensed under the [MIT License](LICENSE.md).
