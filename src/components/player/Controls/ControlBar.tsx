'use client';

import { PlayerState } from '../types/player';
import PlayControls from './PlayControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import SettingsMenu from './SettingsMenu';

interface ControlBarProps {
  playerState: PlayerState;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onQualityChange: (quality: string) => void;
  onToggleFullscreen: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  availableQualities?: string[];
  isFullscreen: boolean;
  title?: string;
}

export default function ControlBar({
  playerState,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onQualityChange,
  onToggleFullscreen,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  availableQualities,
  isFullscreen,
  title,
}: ControlBarProps) {
  return (
    <>
      {/* Title overlay (fullscreen only) */}
      {isFullscreen && title && (
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-4">
          <p className="text-sm font-medium text-white/90">{title}</p>
        </div>
      )}

      {/* Play controls overlay */}
      <PlayControls
        isPlaying={playerState.isPlaying}
        isLoading={playerState.isLoading}
        onPlayPause={onPlayPause}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />

      {/* Bottom control bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 px-3 pb-2">
        {/* Progress bar */}
        <ProgressBar
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          buffered={playerState.buffered}
          onSeek={onSeek}
        />

        {/* Bottom row */}
        <div className="flex items-center gap-1">
          {/* Play/pause small button */}
          <button
            className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:text-white"
            onClick={onPlayPause}
            aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
          >
            {playerState.isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Volume */}
          <VolumeControl
            volume={playerState.volume}
            isMuted={playerState.isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />

          {/* Settings */}
          <SettingsMenu
            playbackRate={playerState.playbackRate}
            quality={playerState.quality}
            onPlaybackRateChange={onPlaybackRateChange}
            onQualityChange={onQualityChange}
            availableQualities={availableQualities}
          />

          {/* Fullscreen */}
          <button
            className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:text-white"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
