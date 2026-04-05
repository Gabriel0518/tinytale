import { episodesApi } from "@/lib/api";
import { resolvePlaybackSource } from "@/lib/playback";
import type { StreamPlaybackInfo } from "@/types";

const STREAM_PREFETCH_CACHE_KEY = "tinytale:stream-prefetch-cache";
const STREAM_PREFETCH_MAX_AGE_MS = 5 * 60 * 1000;
const warmedPlaybackManifestUrls = new Set<string>();
const warmedPlaybackResourceUrls = new Set<string>();
const inflightStreamPrefetches = new Map<string, Promise<StreamPlaybackInfo>>();
const warmedPlaybackOrigins = new Set<string>();

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

function injectPreconnect(url: string) {
  if (typeof document === "undefined") return;

  try {
    const origin = new URL(url, window.location.origin).origin;
    if (warmedPlaybackOrigins.has(origin)) return;

    warmedPlaybackOrigins.add(origin);

    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  } catch {
    // Ignore malformed URLs. The fetch-based warm-up below is still attempted.
  }
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

export function warmPlaybackCandidates(urls: Array<string | null | undefined>) {
  const uniqueUrls = Array.from(
    new Set(urls.filter((url): url is string => Boolean(url)))
  );

  uniqueUrls.forEach((url) => {
    injectPreconnect(url);
    warmPlaybackManifest(url);
  });
}

export function warmStreamPlayback(
  streamInfo?: StreamPlaybackInfo | null,
  fallbackUrl?: string | null,
) {
  warmPlaybackCandidates([
    resolvePlaybackSource(streamInfo, fallbackUrl ?? undefined),
    streamInfo?.videoUrl,
    fallbackUrl,
  ]);
}

export async function prefetchEpisodeStream(episodeId: string, token?: string | null) {
  const cached = readPrefetchedStream(episodeId, token);
  if (cached) {
    warmStreamPlayback(cached, cached.videoUrl);
    return cached;
  }

  const key = getPrefetchKey(episodeId, token);
  const inflight = inflightStreamPrefetches.get(key);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await episodesApi.getStream(episodeId, normalizeAuthToken(token));
    const data = (response as any)?.data ?? (response as StreamPlaybackInfo);
    writePrefetchedStream(episodeId, data, token);
    warmStreamPlayback(data, data.videoUrl);
    return data;
  })();

  inflightStreamPrefetches.set(key, request);

  try {
    return await request;
  } finally {
    inflightStreamPrefetches.delete(key);
  }
}

function shouldSkipWarm(url?: string | null) {
  return typeof window === "undefined" || !url;
}

function normalizeAbsoluteUrl(input: string, baseUrl: string) {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchWarmResource(url: string) {
  if (warmedPlaybackResourceUrls.has(url)) return null;
  warmedPlaybackResourceUrls.add(url);
  try {
    return await window.fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "default",
    });
  } catch {
    warmedPlaybackResourceUrls.delete(url);
    return null;
  }
}

async function warmMediaSegments(playlistUrl: string, segmentCount = 2) {
  const playlistResponse = await fetchWarmResource(playlistUrl);
  if (!playlistResponse?.ok) return;

  const playlistText = await playlistResponse.text();
  const lines = playlistText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const initSegmentUrls = lines
    .filter((line) => line.startsWith("#EXT-X-MAP:"))
    .map((line) => {
      const uriMatch = line.match(/URI="([^"]+)"/i);
      return uriMatch?.[1] ? normalizeAbsoluteUrl(uriMatch[1], playlistUrl) : null;
    })
    .filter((line): line is string => Boolean(line));

  const mediaSegmentUrls = lines
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, segmentCount)
    .map((line) => normalizeAbsoluteUrl(line, playlistUrl))
    .filter((line): line is string => Boolean(line));

  await Promise.allSettled(
    [...initSegmentUrls, ...mediaSegmentUrls].map((url) => fetchWarmResource(url))
  );
}

export function warmPlaybackManifest(playbackUrl?: string | null) {
  // Temporarily disabled: segment warming interferes with the native HLS
  // player's own segment fetching, causing playback stalls.
  return;

  warmedPlaybackManifestUrls.add(playbackUrl!);

  void (async () => {
    try {
      const manifestResponse = await fetchWarmResource(playbackUrl!);
      if (!manifestResponse?.ok) {
        warmedPlaybackManifestUrls.delete(playbackUrl!);
        return;
      }

      const manifestText = await manifestResponse.text();
      const manifestLines = manifestText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const variantLineIndex = manifestLines.findIndex((line) => line.startsWith("#EXT-X-STREAM-INF"));
      if (variantLineIndex >= 0) {
        const variantCandidates = manifestLines
          .slice(variantLineIndex)
          .filter((line) => line && !line.startsWith("#"))
          .slice(0, 2)
          .map((line) => normalizeAbsoluteUrl(line, playbackUrl!))
          .filter((line): line is string => Boolean(line));

        await Promise.allSettled(
          variantCandidates.map((variantUrl) => warmMediaSegments(variantUrl, 4))
        );
        return;
      }

      await warmMediaSegments(playbackUrl!, 4);
    } catch {
      warmedPlaybackManifestUrls.delete(playbackUrl!);
    }
  })();
}

export function preloadImageAsset(src?: string | null) {
  if (typeof window === "undefined" || !src || src.startsWith("blob:")) return;
  const image = new window.Image();
  image.src = src;
}
