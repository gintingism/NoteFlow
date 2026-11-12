'use client';

/**
 * Transcription model manager.
 *
 * Replaces WhisperModelManager and ParakeetModelManager, which were the same
 * component against two engines. One engine now means one catalog and one list.
 */

import { useCallback, useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  MODEL_SORT_LABELS,
  ModelInfo,
  ModelSort,
  TranscribeAPI,
  corruptedSizeMb,
  downloadProgress,
  formatFileSize,
  getModelIcon,
  getModelLabel,
  getModelUseTag,
  isDownloading,
  sortModels,
} from '@/lib/transcribe';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Layers, X, FolderOpen, Award, Sparkles, Zap, Trash2, CheckCircle2, Download as DownloadIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { languageHaystack, languageNames, languagesSummary } from '@/lib/languages';
import { cn } from '@/lib/utils';
import { HardwareProfileSelector } from './HardwareProfileSelector';
import { HuggingFaceModelHub } from './HuggingFaceModelHub';

interface Props {
  selectedModel?: string;
  onModelSelect?: (modelName: string) => void;
}

export default function TranscriptionModelManager({ selectedModel, onModelSelect }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sort, setSort] = useState<ModelSort>('catalog');
  const [query, setQuery] = useState('');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [showHfHub, setShowHfHub] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setModels(await TranscribeAPI.getAvailableModels());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Download progress arrives as events; re-read the list on each terminal event
  // rather than mirroring per-model progress into local state.
  useEffect(() => {
    const unlisteners = [
      listen<{ modelName: string; progress: number }>('model-download-progress', (e) => {
        setModels((prev) =>
          prev.map((m) =>
            m.name === e.payload.modelName
              ? { ...m, status: { Downloading: { progress: e.payload.progress } } }
              : m
          )
        );
      }),
      listen('model-download-complete', () => {
        setBusy(null);
        refresh();
      }),
      listen<{ error: string }>('model-download-error', (e) => {
        setBusy(null);
        setError(e.payload.error);
        refresh();
      }),
    ];
    return () => {
      unlisteners.forEach((p) => p.then((un) => un()));
    };
  }, [refresh]);

  const download = async (name: string) => {
    setBusy(name);
    setError(null);
    try {
      await TranscribeAPI.downloadModel(name);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const remove = async (name: string) => {
    try {
      await TranscribeAPI.deleteCorruptedModel(name);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const card = (model: ModelInfo) => {
    const available = model.status === 'Available';
    const downloading = isDownloading(model.status);
    const selected = selectedModel === model.name;
    // On disk but short of its catalog size — an interrupted download. It can
    // neither be used nor re-fetched silently, and it is still occupying the
    // disk, so the row has to say so and offer both ways out.
    const truncatedMb = corruptedSizeMb(model.status);

    // Selection is a brand border, never a filled surface — the fill is what
    // made a selected card read as a status callout. See /DESIGN.md.
    return (
      <div
        key={model.name}
        className={`rounded-lg border p-4 transition-colors ${
          selected ? 'border-brand' : 'border-line'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {model.accuracy === 'High' ? (
                <Award className="size-4 text-brand shrink-0" strokeWidth={1.75} />
              ) : model.accuracy === 'Good' ? (
                <Sparkles className="size-4 text-info-ink shrink-0" strokeWidth={1.75} />
              ) : (
                <Zap className="size-4 text-amber-500 shrink-0" strokeWidth={1.75} />
              )}
              <span className="font-semibold text-ink text-sm font-mono tracking-tight">{getModelLabel(model.name)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-3xs font-mono font-medium ${
                  model.streaming
                    ? 'bg-brand-soft text-brand-soft-ink'
                    : 'bg-warn-soft text-warn-ink'
                }`}
              >
                {getModelUseTag(model)}
              </span>
              {model.diarizes && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default rounded-full border border-line px-2 py-0.5 text-3xs font-mono text-ink-muted">
                      Labels speakers
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Marks who is speaking, as Speaker 1, Speaker 2, … You can rename
                    them once the meeting is saved.
                  </TooltipContent>
                </Tooltip>
              )}
              {model.recommended && (
                <span className="rounded-full bg-info-soft px-2 py-0.5 text-3xs font-mono text-info-ink font-medium">
                  Recommended
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">{model.description}</p>
            <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted font-mono">
              <div className="flex gap-1">
                <dt className="text-ink-faint">Quality:</dt>
                <dd className="font-medium text-ink">{model.accuracy}</dd>
              </div>
              {model.wer !== null && (
                <div className="flex gap-1">
                  <dt className="text-ink-faint">WER:</dt>
                  <dd className="readout text-ink font-semibold">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
                        {model.wer.toFixed(2)}%
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Word error rate on {model.wer_set}, measured by transcribe.cpp.
                        Lower is better.
                      </TooltipContent>
                    </Tooltip>
                  </dd>
                </div>
              )}
              <div className="flex gap-1">
                <dt className="text-ink-faint">Speed:</dt>
                <dd className="font-medium text-ink">{model.speed}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-ink-faint">Size:</dt>
                <dd className="readout text-ink font-semibold">{formatFileSize(model.size_mb)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="sr-only">Languages</dt>
                <dd>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2 text-ink-muted">
                      {languagesSummary(model.languages)}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-80">
                      {languageNames(model.languages).join(', ')}
                    </TooltipContent>
                  </Tooltip>
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {available && !selected && (
              <Button
                size="sm"
                onClick={() => onModelSelect?.(model.name)}
                className="h-7 text-xs px-3 bg-brand hover:bg-brand-hover text-brand-ink active:scale-[0.98] transition-transform"
              >
                Gunakan
              </Button>
            )}
            {available && selected && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-soft border border-brand/30 text-brand-soft-ink font-medium text-xs font-mono">
                <CheckCircle2 className="size-3.5 text-brand" strokeWidth={2} />
                <span>Terpilih</span>
              </div>
            )}
            {!available && !downloading && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => download(model.name)}
                className="h-7 text-xs px-3 active:scale-[0.98] transition-transform"
              >
                <DownloadIcon className="size-3 mr-1" strokeWidth={1.75} />
                {truncatedMb === null ? 'Download' : 'Download Ulang'}
              </Button>
            )}
            {(available || truncatedMb !== null) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(model.name)}
                className="h-7 text-xs px-2 text-ink-faint hover:text-danger-ink hover:bg-danger-soft active:scale-[0.98] transition-colors"
              >
                <Trash2 className="size-3 mr-1" strokeWidth={1.75} />
                Hapus
              </Button>
            )}
          </div>
        </div>

        {truncatedMb !== null && (
          <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn-ink">
            Damaged download — {truncatedMb} MB on disk of {model.size_mb} MB. Download
            again to repair it, or delete it to reclaim the space.
          </p>
        )}

        {downloading && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${downloadProgress(model.status)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Downloading… {downloadProgress(model.status)}%
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-ink-muted">Loading models…</div>;
  }

  // One list, every model, in whatever order the sort control asks for. The old
  // split — recommended above a collapsed "All models" — hid the catalog behind a
  // click and made a sort apply to two lists separately. What it communicated
  // survives as the "Recommended" pill on the card.
  const q = query.trim().toLowerCase();
  // On disk, not merely usable: a corrupted or half-downloaded model is still
  // installed, and hiding the row someone needs to delete or retry is the one
  // outcome this filter must not produce.
  const installedCount = models.filter((m) => m.status !== 'Missing').length;
  const listed = sortModels(models, sort)
    .filter((m) => !installedOnly || m.status !== 'Missing')
    .filter(
    (m) =>
      !q ||
      [
        getModelLabel(m.name),
        m.description,
        m.accuracy,
        m.speed,
        m.diarizes ? 'labels speakers diarization' : '',
        languageHaystack(m.languages),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger-ink">{error}</div>
      )}

      {/* Hardware Profile & Low-Spec Optimization */}
      <HardwareProfileSelector
        currentModel={selectedModel}
        onModelSelected={(modelName) => onModelSelect?.(modelName)}
        onRefreshModels={refresh}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[50ch] text-xs text-ink-muted">
          Pilih model ASR lokal di bawah, atau jelajahi ratusan model komunitas terbaru langsung dari Hugging Face Hub.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Hugging Face Hub Modal Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHfHub(true)}
            className="h-8 px-3 text-xs flex items-center gap-1.5 border-brand/40 bg-brand-soft hover:bg-brand-soft/80 text-brand-soft-ink font-medium active:scale-[0.98] transition-all"
          >
            <Layers className="size-3.5 text-brand" strokeWidth={1.75} />
            <span>Hugging Face Hub</span>
            <span className="text-3xs font-mono px-1 rounded bg-brand text-brand-ink">Explore</span>
          </Button>

          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              aria-label="Search transcription models"
              className={cn(
                'h-8 w-48 rounded-md border border-line bg-sunken pl-8 pr-2 text-xs text-ink',
                'placeholder:text-ink-muted',
                'transition-colors duration-fast',
                'hover:border-line-strong focus:border-brand focus:bg-elevated'
              )}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <Switch
              checked={installedOnly}
              onCheckedChange={setInstalledOnly}
              aria-label="Show only installed models"
            />
            Installed only
            <span className="readout text-2xs text-ink-faint">({installedCount})</span>
          </label>
          <span className="text-sm text-ink-muted">Sort by</span>
          <Select value={sort} onValueChange={(v) => setSort(v as ModelSort)}>
            <SelectTrigger className="h-8 w-40" aria-label="Sort models by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODEL_SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listed.length === 0 && (q || installedOnly) ? (
        <p className="py-6 text-center text-sm text-ink-muted">
          {installedOnly && installedCount === 0
            ? 'No models are installed yet. Turn off “Installed only” to download one.'
            : `No models match “${query.trim()}”.`}
        </p>
      ) : (
        listed.map(card)
      )}

      <div className="pt-2 flex items-center justify-between border-t border-line text-xs text-ink-muted">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
          onClick={() => TranscribeAPI.openModelsFolder()}
        >
          <FolderOpen className="size-3.5" strokeWidth={1.75} />
          <span>Buka Folder Model di File Explorer</span>
        </button>
        <span className="text-3xs font-mono text-ink-faint">
          Model disimpan secara lokal &bull; Privasi 100%
        </span>
      </div>

      {/* Hugging Face Hub Modal Dialog */}
      {showHfHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl h-[85vh] max-h-[720px] rounded-xl border border-line bg-canvas shadow-float overflow-hidden flex flex-col scale-in-95 duration-150">
            <button
              onClick={() => {
                setShowHfHub(false);
                refresh();
              }}
              className="absolute top-3.5 right-4 z-10 size-7 rounded-md border border-line bg-panel hover:bg-sunken flex items-center justify-center text-ink-muted hover:text-ink active:scale-[0.95] transition-transform"
              title="Tutup"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
            <HuggingFaceModelHub
              onModelDownloaded={(name) => {
                refresh();
                onModelSelect?.(name);
              }}
              onClose={() => {
                setShowHfHub(false);
                refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
