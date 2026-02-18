'use client';

import { useState, useRef, useCallback } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const getTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const handleClick = (e: React.MouseEvent) => {
    onSeek(getTimeFromEvent(e.clientX));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const time = getTimeFromEvent(e.clientX);
    setHoverTime(time);
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
    }
    if (isDragging) {
      onSeek(time);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onSeek(getTimeFromEvent(e.clientX));

    const handleGlobalMove = (ev: MouseEvent) => {
      onSeek(getTimeFromEvent(ev.clientX));
    };
    const handleGlobalUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    onSeek(getTimeFromEvent(e.touches[0].clientX));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    onSeek(getTimeFromEvent(e.touches[0].clientX));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex w-full flex-col gap-1">
      {/* Progress bar track */}
      <div
        ref={barRef}
        className="group relative h-1 w-full cursor-pointer transition-all hover:h-2"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTime(null)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 rounded-full bg-white/20" />
        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Played */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
          style={{ width: `${playedPercent}%` }}
        />
        {/* Seek thumb */}
        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow transition-opacity ${
            isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ left: `${playedPercent}%` }}
        />
        {/* Hover time tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-8 -translate-x-1/2 rounded bg-black/80 px-2 py-0.5 text-xs text-white"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time display */}
      <div className="flex justify-between px-0.5 text-xs text-white/70">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
