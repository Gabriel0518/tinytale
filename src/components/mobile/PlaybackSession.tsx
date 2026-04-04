'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface PlaybackQueueItem {
  dramaId: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  poster?: string;
  duration: number;
}

export interface PlaybackSession {
  dramaId: string;
  episodeId: string;
  dramaTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  poster?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  updatedAt: number;
  queue: PlaybackQueueItem[];
  currentIndex: number;
}

type PlaybackSessionContextValue = {
  session: PlaybackSession | null;
  recentSessions: PlaybackSession[];
  startSession: (session: PlaybackSession) => void;
  updateSession: (patch: Partial<PlaybackSession>) => void;
  resumeSession: (session: PlaybackSession) => void;
  clearSession: () => void;
};

const STORAGE_KEY = 'tinytale:playback-session';
const HISTORY_STORAGE_KEY = 'tinytale:playback-history';
const MAX_RECENT_SESSIONS = 8;

function readStorageValue(key: string) {
  if (typeof window === 'undefined') return null;

  try {
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
  } catch {
    // Ignore session storage availability issues.
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null) {
  if (typeof window === 'undefined') return;

  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignore session storage availability issues.
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore local storage availability issues.
  }
}

const PlaybackSessionContext = createContext<PlaybackSessionContextValue>({
  session: null,
  recentSessions: [],
  startSession: () => undefined,
  updateSession: () => undefined,
  resumeSession: () => undefined,
  clearSession: () => undefined,
});

function getSessionKey(session: Pick<PlaybackSession, 'dramaId' | 'episodeId'>) {
  return `${session.dramaId}:${session.episodeId}`;
}

function normalizeRecentSessions(sessions: PlaybackSession[]) {
  const seen = new Set<string>();
  const unique: PlaybackSession[] = [];

  for (const session of sessions) {
    const key = getSessionKey(session);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(session);
    if (unique.length >= MAX_RECENT_SESSIONS) break;
  }

  return unique;
}

function readStoredJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = readStorageValue(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    writeStorageValue(key, null);
    return null;
  }
}

export function readPlaybackSession() {
  return readStoredJson<PlaybackSession>(STORAGE_KEY);
}

export function usePlaybackSession() {
  return useContext(PlaybackSessionContext);
}

export function PlaybackSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlaybackSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<PlaybackSession[]>([]);

  useEffect(() => {
    const cachedSession = readStoredJson<PlaybackSession>(STORAGE_KEY);
    if (cachedSession) {
      setSession(cachedSession);
    }

    const cachedHistory = readStoredJson<PlaybackSession[]>(HISTORY_STORAGE_KEY);
    if (cachedHistory?.length) {
      setRecentSessions(normalizeRecentSessions(cachedHistory));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!session) {
      writeStorageValue(STORAGE_KEY, null);
      return;
    }

    writeStorageValue(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!recentSessions.length) {
      writeStorageValue(HISTORY_STORAGE_KEY, null);
      return;
    }

    writeStorageValue(HISTORY_STORAGE_KEY, JSON.stringify(recentSessions));
  }, [recentSessions]);

  const syncRecentSessions = useCallback((nextSession: PlaybackSession) => {
    setRecentSessions((current) =>
      normalizeRecentSessions([nextSession, ...current.filter((item) => getSessionKey(item) !== getSessionKey(nextSession))])
    );
  }, []);

  const startSession = useCallback((nextSession: PlaybackSession) => {
    setSession(nextSession);
    syncRecentSessions(nextSession);
  }, [syncRecentSessions]);

  const updateSession = useCallback((patch: Partial<PlaybackSession>) => {
    setSession((current) => {
      if (!current) return current;

      const nextSession = {
        ...current,
        ...patch,
        updatedAt: Date.now(),
      };

      setRecentSessions((history) =>
        normalizeRecentSessions(
          history.map((item) =>
            getSessionKey(item) === getSessionKey(current)
              ? nextSession
              : item
          )
        )
      );

      return nextSession;
    });
  }, []);

  const resumeSession = useCallback((nextSession: PlaybackSession) => {
    setSession(nextSession);
    syncRecentSessions({
      ...nextSession,
      updatedAt: Date.now(),
    });
  }, [syncRecentSessions]);

  const clearSession = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      recentSessions,
      startSession,
      updateSession,
      resumeSession,
      clearSession,
    }),
    [clearSession, recentSessions, resumeSession, session, startSession, updateSession]
  );

  return (
    <PlaybackSessionContext.Provider value={value}>
      {children}
    </PlaybackSessionContext.Provider>
  );
}
