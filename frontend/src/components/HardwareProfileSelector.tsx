'use client';

import React, { useState } from 'react';
import {
  HARDWARE_PROFILES,
  HardwareProfile,
  TranscribeAPI
} from '@/lib/transcribe';
import { Cpu, Zap, Scale, Award, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  currentModel?: string;
  onModelSelected?: (modelName: string) => void;
  onRefreshModels?: () => void;
}

export function HardwareProfileSelector({
  currentModel,
  onModelSelected,
  onRefreshModels
}: Props) {
  const [selectedProfile, setSelectedProfile] = useState<HardwareProfile>('balanced');
  const [isApplying, setIsApplying] = useState(false);

  const profiles: {
    id: HardwareProfile;
    icon: React.ReactNode;
    color: string;
    details: typeof HARDWARE_PROFILES['eco'];
  }[] = [
    {
      id: 'eco',
      icon: <Zap className="size-4" strokeWidth={1.75} />,
      color: 'text-brand',
      details: HARDWARE_PROFILES.eco
    },
    {
      id: 'balanced',
      icon: <Scale className="size-4" strokeWidth={1.75} />,
      color: 'text-info-ink',
      details: HARDWARE_PROFILES.balanced
    },
    {
      id: 'max_quality',
      icon: <Award className="size-4" strokeWidth={1.75} />,
      color: 'text-warn-ink',
      details: HARDWARE_PROFILES.max_quality
    }
  ];

  const handleApplyProfile = async (profileId: HardwareProfile) => {
    setSelectedProfile(profileId);
    const targetModel = HARDWARE_PROFILES[profileId].recommendedModel;
    setIsApplying(true);

    try {
      // Check if target model is available locally
      const models = await TranscribeAPI.getAvailableModels();
      const existing = models.find((m) => m.name === targetModel);

      if (existing && existing.status === 'Available') {
        onModelSelected?.(targetModel);
        toast.success(`Profil ${HARDWARE_PROFILES[profileId].title} aktif dengan model ${targetModel}!`);
      } else {
        toast.info(
          `Profil dipilih. Model ${targetModel} belum diunduh, memulai download otomatis...`
        );
        await TranscribeAPI.downloadModel(targetModel);
        onModelSelected?.(targetModel);
        onRefreshModels?.();
        toast.success(`Model ${targetModel} siap digunakan!`);
      }
    } catch (err) {
      toast.error('Gagal menerapkan profil: ' + String(err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-xl border border-line bg-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-brand/10 text-brand flex items-center justify-center">
            <Cpu className="size-3.5" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <span>Optimasi Hardware &amp; Profil Perangkat</span>
              <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-brand-soft text-brand-soft-ink">
                Auto-Tuning
              </span>
            </h4>
            <p className="text-2xs text-ink-muted">
              Pilih profil sesuai kapasitas laptop/PC Anda agar transkripsi berjalan mulus dan hemat daya.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {profiles.map(({ id, icon, color, details }) => {
          const isCurrentActive =
            currentModel === details.recommendedModel ||
            (selectedProfile === id && !currentModel);

          return (
            <div
              key={id}
              onClick={() => setSelectedProfile(id)}
              className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2.5 ${
                selectedProfile === id
                  ? 'border-brand bg-elevated ring-1 ring-brand/30 shadow-xs'
                  : 'border-line bg-canvas hover:border-border-strong'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-ink">
                    <span className={color}>{icon}</span>
                    <span>{details.title}</span>
                  </div>
                  <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-sunken text-ink-muted">
                    {details.badge}
                  </span>
                </div>
                <p className="text-2xs text-ink-muted mt-1 leading-snug">
                  {details.description}
                </p>
              </div>

              <div className="pt-2 border-t border-line/60 space-y-1 font-mono text-3xs text-ink-faint">
                <div className="flex justify-between">
                  <span>RAM:</span>
                  <span className="font-semibold text-ink">{details.ramEstimate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-brand truncate max-w-[120px]">{details.recommendedModel}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant={isCurrentActive ? 'secondary' : 'outline'}
                disabled={isApplying}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyProfile(id);
                }}
                className={`h-7 text-xs w-full active:scale-[0.98] ${
                  isCurrentActive ? 'bg-brand/10 text-brand border-brand/20 font-medium' : ''
                }`}
              >
                {isApplying && selectedProfile === id ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : isCurrentActive ? (
                  <>
                    <Check className="size-3 mr-1 text-brand" strokeWidth={2} />
                    <span>Aktif</span>
                  </>
                ) : (
                  <span>Terapkan Profil</span>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
