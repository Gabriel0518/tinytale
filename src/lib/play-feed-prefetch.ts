import { playFeedApi } from '@/lib/api';
import { preloadImageAsset, prefetchEpisodeStream, warmPlaybackManifest } from '@/lib/playback-prefetch';
import { readPlayFeedSession, writePlayFeedSession } from '@/lib/play-feed-session';
import type { FeedBootstrapPayload } from '@/types';

const FEED_BOOTSTRAP_CACHE_KEY = 'tinytale:play-feed-bootstrap';
const FEED_BOOTSTRAP_MAX_AGE_MS = 45 * 1000;
const inflightBootstrapPrefetches = new Map<string, Promise<FeedBootstrapPayload | null>>();

type CachedFeedEntry = {
  cachedAt: number;
  data: FeedBootstrapPayload;
};

function getEntryKey(mode: string, token?: string | null) {
  return `${token ? 'auth' : 'guest'}:${mode}`;
}

function readStore(): Record<string, CachedFeedEntry> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(FEED_BOOTSTRAP_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedFeedEntry>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    window.sessionStorage.removeItem(FEED_BOOTSTRAP_CACHE_KEY);
    return {};
  }
}

function writeStore(store: Record<string, CachedFeedEntry>) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(FEED_BOOTSTRAP_CACHE_KEY, JSON.stringify(store));
}

export function readPrefetchedPlayFeedBootstrap(
  mode: 'for-you' | 'following' = 'for-you',
  token?: string | null,
): FeedBootstrapPayload | null {
  const store = readStore();
  const key = getEntryKey(mode, token);
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > FEED_BOOTSTRAP_MAX_AGE_MS) {
    delete store[key];
    writeStore(store);
    return null;
  }
  return entry.data;
}

export function writePrefetchedPlayFeedBootstrap(
  data: FeedBootstrapPayload,
  token?: string | null,
) {
  const store = readStore();
  store[getEntryKey(data.mode, token)] = {
    cachedAt: Date.now(),
    data,
  };
  writeStore(store);

  const existingSession = readPlayFeedSession();
  writePlayFeedSession({
    activeMode: data.mode,
    windows: {
      ...(existingSession?.windows ?? {}),
      [data.mode]: data.window,
    },
  });
}

async function warmBootstrapWindow(
  payload: FeedBootstrapPayload,
  token?: string | null,
) {
  const items = [payload.window.current, ...payload.window.next.slice(0, 2)];
  items.forEach((item) => {
    preloadImageAsset(item.poster);
    warmPlaybackManifest(item.playbackUrl);
  });

  await Promise.allSettled(
    items.map((item) => prefetchEpisodeStream(item.episodeId, token))
  );
}

export async function prefetchPlayFeedBootstrap(
  mode: 'for-you' | 'following' = 'for-you',
  token?: string | null,
): Promise<FeedBootstrapPayload | null> {
  const cached = readPrefetchedPlayFeedBootstrap(mode, token);
  if (cached) return cached;

  const key = getEntryKey(mode, token);
  const inflight = inflightBootstrapPrefetches.get(key);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    try {
      const response = await playFeedApi.getBootstrap({
        mode,
        count: 3,
        token: token ?? undefined,
      });
      const payload = (response as any)?.data ?? response;
      if (!payload?.window?.current?.episodeId) return null;
      writePrefetchedPlayFeedBootstrap(payload as FeedBootstrapPayload, token);
      void warmBootstrapWindow(payload as FeedBootstrapPayload, token);
      return payload as FeedBootstrapPayload;
    } catch {
      return null;
    }
  })();

  inflightBootstrapPrefetches.set(key, request);

  try {
    return await request;
  } finally {
    inflightBootstrapPrefetches.delete(key);
  }
}
