import { episodesApi } from "@/lib/api";
import type { StreamPlaybackInfo } from "@/types";

const STREAM_PREFETCH_CACHE_KEY = "tinytale:stream-prefetch-cache";
const STREAM_PREFETCH_MAX_AGE_MS = 5 * 60 * 1000;

type CachedStreamEntry = {
  cachedAt: number;
  data: StreamPlaybackInfo;
};

function normalizeAuthToken(token?: string | null) {
  return token ?? undefined;
}

function readPrefetchStore() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(STREAM_PREFETCH_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedStreamEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    window.sessionStorage.removeItem(STREAM_PREFETCH_CACHE_KEY);
    return {};
  }
}

function writePrefetchStore(store: Record<string, CachedStreamEntry>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STREAM_PREFETCH_CACHE_KEY, JSON.stringify(store));
}

function getPrefetchKey(episodeId: string, token?: string | null) {
  return `${normalizeAuthToken(token) ? "auth" : "guest"}:${episodeId}`;
}

export function readPrefetchedStream(episodeId: string, token?: string | null) {
  const store = readPrefetchStore();
  const entry = store[getPrefetchKey(episodeId, token)];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > STREAM_PREFETCH_MAX_AGE_MS) {
    delete store[getPrefetchKey(episodeId, token)];
    writePrefetchStore(store);
    return null;
  }
  return entry.data;
}

export function writePrefetchedStream(episodeId: string, data: StreamPlaybackInfo, token?: string | null) {
  const store = readPrefetchStore();
  store[getPrefetchKey(episodeId, token)] = {
    cachedAt: Date.now(),
    data,
  };
  writePrefetchStore(store);
}

export async function prefetchEpisodeStream(episodeId: string, token?: string | null) {
  const cached = readPrefetchedStream(episodeId, token);
  if (cached) return cached;

  const response = await episodesApi.getStream(episodeId, normalizeAuthToken(token));
  const data = (response as any)?.data ?? (response as StreamPlaybackInfo);
  writePrefetchedStream(episodeId, data, token);
  return data;
}

export function preloadImageAsset(src?: string | null) {
  if (typeof window === "undefined" || !src || src.startsWith("blob:")) return;
  const image = new window.Image();
  image.src = src;
}
