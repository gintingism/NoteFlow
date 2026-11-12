'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  ExternalLink,
  FolderInput,
  Sparkles,
  Layers,
  FileCode,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  HardDrive
} from 'lucide-react';
import {
  TranscribeAPI,
  HfModelItem,
  HfFileItem,
  formatFileSize
} from '@/lib/transcribe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  onModelDownloaded?: (modelName: string) => void;
  onClose?: () => void;
}

// Popular community Hugging Face models curated for ASR
const CURATED_COMMUNITY_MODELS = [
  {
    repo: 'ggerganov/whisper.cpp',
    title: 'Whisper.cpp Official GGUF',
    description: 'Model Whisper standar industri (Tiny, Base, Small, Medium) dikuantisasi oleh Georgi Gerganov.',
    tag: 'Community Standard',
    downloads: '1.2M+'
  },
  {
    repo: 'handy-computer/moonshine-streaming-tiny-gguf',
    title: 'Moonshine Streaming Tiny (48MB)',
    description: 'Model ultra-ringan khusus perangkat terbatas. Latensi instan & hemat daya.',
    tag: 'Ultra Lightweight',
    downloads: '85K+'
  },
  {
    repo: 'handy-computer/parakeet-tdt-0.6b-v3-gguf',
    title: 'Parakeet TDT v3 (Fast & Accurate)',
    description: 'Model arsitektur FastConformer dengan akurasi 1.94% WER pada ucapan bahasa Inggris & Eropa.',
    tag: 'Recommended Balanced',
    downloads: '240K+'
  },
  {
    repo: 'Systran/faster-whisper-tiny',
    title: 'Faster Whisper Tiny',
    description: 'Varian Whisper ringan yang dioptimasi untuk inferensi cepat pada CPU hemat daya.',
    tag: 'Low-Spec Friendly',
    downloads: '500K+'
  }
];

export function HuggingFaceModelHub({ onModelDownloaded }: Props) {
  const [activeTab, setActiveTab] = useState<'discover' | 'direct' | 'import'>('discover');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<HfModelItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoFiles, setRepoFiles] = useState<HfFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Direct repo input state
  const [directRepo, setDirectRepo] = useState('');
  const [directFilename, setDirectFilename] = useState('');
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  // Local import state
  const [localPath, setLocalPath] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Initial search on mount
  const handleSearch = useCallback(async (searchQuery: string) => {
    setIsSearching(true);
    setSelectedRepo(null);
    setRepoFiles([]);
    try {
      const results = await TranscribeAPI.searchHf(searchQuery, 16);
      setSearchResults(results);
    } catch (err) {
      toast.error('Gagal mencari di Hugging Face: ' + String(err));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    handleSearch('');
  }, [handleSearch]);

  const handleSelectRepo = async (repoId: string) => {
    if (selectedRepo === repoId) {
      setSelectedRepo(null);
      setRepoFiles([]);
      return;
    }
    setSelectedRepo(repoId);
    setIsLoadingFiles(true);
    try {
      const files = await TranscribeAPI.getHfRepoFiles(repoId);
      setRepoFiles(files);
      if (files.length === 0) {
        toast.info('Tidak ditemukan file .gguf di branch utama repositori ini.');
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar file: ' + String(err));
      setRepoFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDownloadFile = async (repoId: string, filename: string) => {
    setDownloadingFile(filename);
    try {
      toast.info(`Mulai mengunduh ${filename} dari Hugging Face...`);
      await TranscribeAPI.downloadHfModel(repoId, filename);
      toast.success(`Berhasil mengunduh model: ${filename}`);
      onModelDownloaded?.(filename.replace(/\.gguf$/i, ''));
    } catch (err) {
      toast.error('Unduhan gagal: ' + String(err));
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDirectDownload = async () => {
    if (!directRepo.trim() || !directFilename.trim()) {
      toast.error('Silakan isi Hugging Face Repo ID dan nama file .gguf.');
      return;
    }
    setIsDirectDownloading(true);
    try {
      toast.info(`Mengunduh ${directFilename} dari ${directRepo}...`);
      await TranscribeAPI.downloadHfModel(directRepo.trim(), directFilename.trim());
      toast.success(`Model berhasil diunduh!`);
      onModelDownloaded?.(directFilename.trim().replace(/\.gguf$/i, ''));
      setDirectFilename('');
    } catch (err) {
      toast.error('Unduhan gagal: ' + String(err));
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const handleImportLocal = async () => {
    if (!localPath.trim()) {
      toast.error('Silakan masukkan path lengkap file .gguf.');
      return;
    }
    setIsImporting(true);
    try {
      const importedName = await TranscribeAPI.importLocalModel(localPath.trim());
      toast.success(`Model ${importedName} berhasil diimpor!`);
      onModelDownloaded?.(importedName);
      setLocalPath('');
    } catch (err) {
      toast.error('Gagal mengimpor file: ' + String(err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-canvas text-ink select-none">
      {/* Top Header & Navigation Tabs */}
      <div className="border-b border-line px-5 py-3.5 bg-panel flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-brand/10 text-brand flex items-center justify-center">
              <Layers className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-ink flex items-center gap-2">
                Hugging Face Model Hub
                <span className="text-2xs px-2 py-0.5 rounded-full font-mono bg-brand-soft text-brand-soft-ink font-medium">
                  Dynamic ASR
                </span>
              </h3>
              <p className="text-xs text-ink-muted">
                Jelajahi, cari, dan unduh model transkripsi GGUF komunitas langsung ke mesin lokal.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-sunken rounded-lg w-fit border border-line">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'discover'
                ? 'bg-elevated text-ink shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Search className="size-3.5" strokeWidth={1.75} />
              <span>Cari di Hub</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'direct'
                ? 'bg-elevated text-ink shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Download className="size-3.5" strokeWidth={1.75} />
              <span>Download Langsung</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'import'
                ? 'bg-elevated text-ink shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FolderInput className="size-3.5" strokeWidth={1.75} />
              <span>Import GGUF Lokal</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab 1: Discover & Search Hugging Face */}
      {activeTab === 'discover' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Search bar & quick filter chips */}
          <div className="space-y-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" strokeWidth={1.75} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari model GGUF (cth: whisper, moonshine, parakeet, indonesian)..."
                  className="pl-9 h-9 text-xs bg-elevated border-line focus-visible:ring-brand/40"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching}
                size="sm"
                className="h-9 px-3.5 bg-brand hover:bg-brand-hover text-brand-ink text-xs font-medium active:scale-[0.98] transition-transform"
              >
                {isSearching ? <Loader2 className="size-3.5 animate-spin" /> : 'Cari'}
              </Button>
            </form>

            {/* Quick Keyword Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xs text-ink-faint mr-1 font-mono">Pilihan Cepat:</span>
              {['whisper gguf', 'moonshine', 'parakeet', 'indonesian asr', 'granite-speech'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setQuery(chip);
                    handleSearch(chip);
                  }}
                  className="text-2xs px-2 py-0.5 rounded-full border border-line bg-panel hover:bg-sunken text-ink-muted transition-colors active:scale-[0.97]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Recommendations for Low-End & Balanced */}
          {query.trim() === '' && searchResults.length === 0 && !isSearching && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Sparkles className="size-3.5 text-brand" strokeWidth={1.75} />
                <span>Rekomendasi Komunitas Populer</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CURATED_COMMUNITY_MODELS.map((item) => (
                  <div
                    key={item.repo}
                    className="p-3.5 rounded-lg border border-line bg-elevated hover:border-border-strong transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-ink line-clamp-1">{item.title}</span>
                        <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-brand-soft text-brand-soft-ink font-medium shrink-0">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-2xs text-ink-muted mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-line/60">
                      <span className="text-3xs font-mono text-ink-faint">Repo: {item.repo}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectRepo(item.repo)}
                        className="h-7 text-xs px-2.5 active:scale-[0.98]"
                      >
                        Lihat File GGUF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results List */}
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted space-y-2">
              <Loader2 className="size-6 animate-spin text-brand" />
              <p className="text-xs">Menghubungi Hugging Face Hub API...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Ditemukan {searchResults.length} model di Hugging Face Hub:</span>
                <span className="text-2xs font-mono">Klik kartu untuk melihat file .gguf</span>
              </div>

              <div className="space-y-2.5">
                {searchResults.map((model) => {
                  const isSelected = selectedRepo === model.id;
                  return (
                    <div
                      key={model.id}
                      className={`rounded-lg border transition-all duration-150 overflow-hidden ${
                        isSelected
                          ? 'border-brand bg-panel ring-1 ring-brand/30'
                          : 'border-line bg-elevated hover:border-border-strong'
                      }`}
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => handleSelectRepo(model.id)}
                        className="p-3.5 cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-ink truncate">
                              {model.id}
                            </span>
                            {model.pipeline_tag && (
                              <span className="text-3xs px-1.5 py-0.5 rounded bg-sunken text-ink-muted font-mono">
                                {model.pipeline_tag}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-2xs text-ink-muted font-mono">
                            <span>⬇️ {model.downloads.toLocaleString()} unduhan</span>
                            <span>❤️ {model.likes} suka</span>
                            {model.author && <span>Oleh: {model.author}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://huggingface.co/${model.id}`, '_blank');
                            }}
                            className="size-7 p-0 text-ink-muted hover:text-ink"
                            title="Buka di Hugging Face"
                          >
                            <ExternalLink className="size-3.5" strokeWidth={1.75} />
                          </Button>
                          <Button
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            className={`h-7 px-2.5 text-xs active:scale-[0.98] ${
                              isSelected ? 'bg-brand text-brand-ink' : ''
                            }`}
                          >
                            {isSelected ? 'Tutup' : 'Pilih File'}
                          </Button>
                        </div>
                      </div>

                      {/* Expandable File List */}
                      {isSelected && (
                        <div className="border-t border-line bg-canvas p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-ink flex items-center gap-1.5">
                              <FileCode className="size-3.5 text-brand" strokeWidth={1.75} />
                              File GGUF yang Tersedia:
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSelectRepo(model.id)}
                              className="h-6 text-2xs text-ink-muted hover:text-ink px-2"
                            >
                              <RefreshCw className="size-3 mr-1" /> Refresh File
                            </Button>
                          </div>

                          {isLoadingFiles ? (
                            <div className="py-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
                              <Loader2 className="size-4 animate-spin text-brand" />
                              <span>Memuat daftar file repository...</span>
                            </div>
                          ) : repoFiles.length > 0 ? (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {repoFiles.map((file) => {
                                const isThisDownloading = downloadingFile === file.path;
                                return (
                                  <div
                                    key={file.path}
                                    className="p-2.5 rounded-md border border-line bg-panel flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-mono text-xs font-medium text-ink truncate">
                                        {file.path}
                                      </p>
                                      {file.size && (
                                        <p className="text-2xs font-mono text-ink-faint">
                                          Ukuran: {formatFileSize(Math.round(file.size / (1024 * 1024)))}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      disabled={isThisDownloading}
                                      onClick={() => handleDownloadFile(model.id, file.path)}
                                      className="h-7 px-3 bg-brand hover:bg-brand-hover text-brand-ink text-xs active:scale-[0.98] transition-transform shrink-0"
                                    >
                                      {isThisDownloading ? (
                                        <>
                                          <Loader2 className="size-3 animate-spin mr-1.5" />
                                          <span>Mengunduh...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Download className="size-3 mr-1.5" strokeWidth={1.75} />
                                          <span>Download</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-xs text-ink-muted bg-panel rounded border border-line">
                              Tidak ada file .gguf langsung di direktori utama repository ini.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : query.trim() !== '' ? (
            <div className="p-8 text-center text-ink-muted space-y-2 bg-panel rounded-lg border border-line">
              <AlertCircle className="size-5 mx-auto text-ink-faint" />
              <p className="text-xs">Tidak ditemukan model yang cocok dengan kata kunci &quot;{query}&quot;.</p>
              <p className="text-2xs text-ink-faint">Coba cari dengan kata kunci lain seperti &quot;whisper&quot; atau &quot;moonshine&quot;.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Direct Hugging Face Download */}
      {activeTab === 'direct' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-ink">Download Langsung via Repo ID & File</h4>
            <p className="text-xs text-ink-muted">
              Jika Anda memiliki link repository Hugging Face tertentu, masukkan informasi di bawah ini untuk mengunduh file .gguf secara langsung.
            </p>
          </div>

          <div className="space-y-4 p-4 rounded-lg border border-line bg-panel">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                <span>Hugging Face Repository ID</span>
                <span className="text-danger">*</span>
              </label>
              <Input
                value={directRepo}
                onChange={(e) => setDirectRepo(e.target.value)}
                placeholder="cth: ggerganov/whisper.cpp atau Systran/faster-whisper-tiny"
                className="h-9 text-xs bg-elevated border-line font-mono"
              />
              <p className="text-3xs text-ink-faint font-mono">Format: owner/nama-repo</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                <span>Nama File Model (.gguf)</span>
                <span className="text-danger">*</span>
              </label>
              <Input
                value={directFilename}
                onChange={(e) => setDirectFilename(e.target.value)}
                placeholder="cth: ggml-tiny.bin atau moonshine-tiny-Q8_0.gguf"
                className="h-9 text-xs bg-elevated border-line font-mono"
              />
              <p className="text-3xs text-ink-faint font-mono">Nama persis file di Hugging Face (termasuk ekstensi)</p>
            </div>

            <Button
              onClick={handleDirectDownload}
              disabled={isDirectDownloading}
              className="w-full h-9 bg-brand hover:bg-brand-hover text-brand-ink text-xs font-medium active:scale-[0.98] transition-transform"
            >
              {isDirectDownloading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                  <span>Memulai Unduhan...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5 mr-2" strokeWidth={1.75} />
                  <span>Unduh Model ke Mesin Lokal</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-3.5 rounded-lg border border-line bg-sunken space-y-2 text-2xs text-ink-muted">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <HelpCircle className="size-3.5 text-brand" strokeWidth={1.75} />
              <span>Contoh Model Ringan Siap Pakai:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 font-mono text-3xs">
              <li>
                <span className="text-ink">handy-computer/moonshine-streaming-tiny-gguf</span> &rarr; <span className="text-brand">moonshine-streaming-tiny-Q8_0.gguf</span> (48MB, hemat daya)
              </li>
              <li>
                <span className="text-ink">ggerganov/whisper.cpp</span> &rarr; <span className="text-brand">ggml-tiny.bin</span> (75MB, standar cepat)
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Import Local .GGUF File */}
      {activeTab === 'import' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-ink">Import File .GGUF Lokal</h4>
            <p className="text-xs text-ink-muted">
              Punya file model GGUF yang sudah didownload sebelumnya di disk Anda? Salin langsung ke folder aplikasi tanpa perlu mengunduh ulang.
            </p>
          </div>

          <div className="space-y-4 p-4 rounded-lg border border-line bg-panel">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                <span>Path Lengkap File GGUF di Komputer Anda</span>
                <span className="text-danger">*</span>
              </label>
              <Input
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="cth: C:\Downloads\custom-model.gguf atau /home/user/model.gguf"
                className="h-9 text-xs bg-elevated border-line font-mono"
              />
            </div>

            <Button
              onClick={handleImportLocal}
              disabled={isImporting}
              className="w-full h-9 bg-brand hover:bg-brand-hover text-brand-ink text-xs font-medium active:scale-[0.98] transition-transform"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                  <span>Mengimpor File...</span>
                </>
              ) : (
                <>
                  <FolderInput className="size-3.5 mr-2" strokeWidth={1.75} />
                  <span>Impor ke Folder Model Aplikasi</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-3.5 rounded-lg border border-line bg-sunken space-y-2 text-2xs text-ink-muted">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <HardDrive className="size-3.5 text-brand" strokeWidth={1.75} />
              <span>Lokasi Folder Model Aplikasi</span>
            </div>
            <p className="text-3xs leading-relaxed">
              Anda juga bisa membuka folder model aplikasi secara langsung di File Explorer melalui tombol &quot;Buka Folder Model&quot; di menu Pengaturan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
