import type { FeedWindowState } from '@/types';

export type PlayFeedMode = 'for-you' | 'following';

export interface PlayFeedSessionState {
  activeMode: PlayFeedMode;
  windows: Partial<Record<PlayFeedMode, FeedWindowState>>;
  updatedAt: number;
}

const PLAY_FEED_SESSION_STORAGE_KEY = 'tinytale:play-feed-session';
const PLAY_FEED_SESSION_MAX_AGE_MS = 15 * 60 * 1000;

function isClient() {
  return typeof window !== 'undefined';
}

export function readPlayFeedSession(): PlayFeedSessionState | null {
  if (!isClient()) return null;

  try {
    const raw = window.sessionStorage.getItem(PLAY_FEED_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PlayFeedSessionState;
    if (!parsed || typeof parsed !== 'object') return null;

    if (Date.now() - Number(parsed.updatedAt || 0) > PLAY_FEED_SESSION_MAX_AGE_MS) {
      window.sessionStorage.removeItem(PLAY_FEED_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.sessionStorage.removeItem(PLAY_FEED_SESSION_STORAGE_KEY);
    return null;
  }
}

export function writePlayFeedSession(
  state: Omit<PlayFeedSessionState, 'updatedAt'> | PlayFeedSessionState,
) {
  if (!isClient()) return;

  const payload: PlayFeedSessionState = {
    ...state,
    updatedAt: Date.now(),
  };

  window.sessionStorage.setItem(PLAY_FEED_SESSION_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPlayFeedSession() {
  if (!isClient()) return;
  window.sessionStorage.removeItem(PLAY_FEED_SESSION_STORAGE_KEY);
}
