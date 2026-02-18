'use client';

import {
  createContext,
  useContext,
  useRef,
} from 'react';
import type { PlayerState } from './types/player';
import { usePlayerState } from './hooks/usePlayerState';
import { useFullscreen } from './hooks/useFullscreen';
import type { CloudflarePlayerHandle } from './CloudflarePlayer';

interface PlayerContextValue {
  state: PlayerState;
  actions: ReturnType<typeof usePlayerState>['actions'];
  playerRef: React.RefObject<CloudflarePlayerHandle | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayerContext must be used within a <PlayerRoot>');
  }
  return ctx;
}

interface PlayerRootProps {
  children: React.ReactNode;
  className?: string;
}

export default function PlayerRoot({ children, className }: PlayerRootProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<CloudflarePlayerHandle | null>(null);
  const { state, actions } = usePlayerState();
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  return (
    <PlayerContext.Provider
      value={{
        state,
        actions,
        playerRef,
        containerRef,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      <div
        ref={containerRef}
        className={`relative w-full ${className ?? ''}`}
      >
        {children}
      </div>
    </PlayerContext.Provider>
  );
}
