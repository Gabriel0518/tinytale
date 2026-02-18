'use client';

import { useState, useRef, useEffect } from 'react';
import type { SubtitleTrack } from '@/types';

// ─── Subtitle Menu ───

interface SubtitleMenuProps {
  tracks: SubtitleTrack[];
  activeTrack: string | null; // language code or null for off
  onSelectTrack: (language: string | null) => void;
}

export function SubtitleMenu({
  tracks,
  activeTrack,
  onSelectTrack,
}: SubtitleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (tracks.length === 0) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:text-white"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Subtitles"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
          <path d="M6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-black/90 p-3 shadow-xl backdrop-blur-sm">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            Subtitles
          </h4>
          <div className="flex flex-col gap-0.5">
            <button
              className={`rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                activeTrack === null
                  ? 'bg-amber-500/20 text-amber-400 font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-pressed={activeTrack === null}
              onClick={() => {
                onSelectTrack(null);
                setIsOpen(false);
              }}
            >
              Off
            </button>
            {tracks.map((track) => (
              <button
                key={track.language}
                className={`rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                  activeTrack === track.language
                    ? 'bg-amber-500/20 text-amber-400 font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                aria-pressed={activeTrack === track.language}
                onClick={() => {
                  onSelectTrack(track.language);
                  setIsOpen(false);
                }}
              >
                {track.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subtitle Display ───

interface SubtitleDisplayProps {
  src: string | null; // VTT file URL
  className?: string;
}

/**
 * SubtitleDisplay is a thin wrapper for custom subtitle styling.
 * Video.js handles subtitle rendering natively via <track> elements,
 * so this component is provided for cases where custom overlay styling
 * is needed outside the Video.js player.
 */
export function SubtitleDisplay({ src, className }: SubtitleDisplayProps) {
  if (!src) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-16 flex justify-center ${className ?? ''}`}
    >
      {/* Video.js renders subtitles natively; this container is available
          for custom subtitle overlays if needed in the future. */}
    </div>
  );
}

export default SubtitleMenu;
