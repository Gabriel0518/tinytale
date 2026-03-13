'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PlayControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function PlayControls({
  isPlaying,
  isLoading,
  onPlayPause,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PlayControlsProps) {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) setVisible(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, resetHideTimer]);

  const handleOverlayClick = () => {
    onPlayPause();
    resetHideTimer();
  };

  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={handleOverlayClick}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleOverlayClick();
        }
      }}
    >
      {/* Previous episode button */}
      {hasPrevious && onPrevious && (
        <button
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          aria-label="Previous episode"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
          </svg>
        </button>
      )}

      {/* Center play/pause / loading */}
      <button
        className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110 active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause();
          resetHideTimer();
        }}
        aria-label={isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <svg
            className="h-8 w-8 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : isPlaying ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>

      {/* Next episode button */}
      {hasNext && onNext && (
        <button
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next episode"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
          </svg>
        </button>
      )}

      {/* Bottom gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}
