'use client';

import { useState, useRef, useEffect } from 'react';
import { PLAYBACK_RATES } from '../types/player';
import { getQualityMenuOptions, type QualityMenuOption } from '@/lib/playerQuality';

interface SettingsMenuProps {
  playbackRate: number;
  quality: string;
  onPlaybackRateChange: (rate: number) => void;
  onQualityChange: (quality: string) => void;
  qualityOptions?: QualityMenuOption[];
}

const DEFAULT_QUALITY_OPTIONS: QualityMenuOption[] = getQualityMenuOptions(true);

export default function SettingsMenu({
  playbackRate,
  quality,
  onPlaybackRateChange,
  onQualityChange,
  qualityOptions,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const qualities = qualityOptions ?? DEFAULT_QUALITY_OPTIONS;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const rateLabel = (rate: number) => (rate === 1 ? 'Normal' : `${rate}x`);

  return (
    <div ref={menuRef} className="relative">
      <button
        className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:text-white"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-56 rounded-lg bg-black/90 p-3 shadow-xl backdrop-blur-sm">
          {/* Playback speed */}
          <div className="mb-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              Speed
            </h4>
            <div className="flex flex-wrap gap-1">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  className={`rounded px-2.5 py-1 text-sm transition-colors ${
                    playbackRate === rate
                      ? 'bg-amber-500 text-black font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    onPlaybackRateChange(rate);
                  }}
                >
                  {rateLabel(rate)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              Quality
            </h4>
            <div className="flex flex-col gap-0.5">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  className={`rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                    q.disabled
                      ? 'cursor-not-allowed text-white/35'
                      : quality === q.value
                      ? 'bg-amber-500/20 text-amber-400 font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    if (q.disabled) return;
                    onQualityChange(q.value);
                  }}
                  disabled={q.disabled}
                >
                  <span>{q.label}</span>
                  {q.badge ? <span className="ml-2 text-[10px] uppercase tracking-wide text-purple-300">{q.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
