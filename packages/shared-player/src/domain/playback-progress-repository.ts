import type { PlaybackProgress, StreamPlaybackInfo } from '@domain';
import type { CacheStore } from '@storage';

const PERSIST_MAX_AGE_MS = Number.MAX_SAFE_INTEGER;

export type PlaybackProgressTarget = {
  episodeId?: string | null;
  streamVideoId?: string | null;
  videoUrl?: string | null;
};

export type PlaybackProgressSnapshot = PlaybackProgress &
  PlaybackProgressTarget & {
    dramaId?: string;
    dramaTitle?: string;
    episodeTitle?: string;
    poster?: string;
    updatedAt: number;
  };

type ProgressIndexItem = {
  key: string;
  updatedAt: number;
};

function sanitizeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
}

function resolveProgressEntryKey(prefix: string, target: PlaybackProgressTarget) {
  const episodeId = typeof target.episodeId === 'string' ? target.episodeId.trim() : '';
  if (episodeId) return `${prefix}:episode:${sanitizeKeyPart(episodeId)}`;

  const streamVideoId = typeof target.streamVideoId === 'string' ? target.streamVideoId.trim() : '';
  if (streamVideoId) return `${prefix}:stream:${sanitizeKeyPart(streamVideoId)}`;

  const videoUrl = typeof target.videoUrl === 'string' ? target.videoUrl.trim() : '';
  return videoUrl ? `${prefix}:url:${sanitizeKeyPart(videoUrl)}` : '';
}

function normalizeSnapshot(snapshot: PlaybackProgressSnapshot): PlaybackProgressSnapshot {
  return {
    ...snapshot,
    episodeId: String(snapshot.episodeId || '').trim(),
    currentTime: Math.max(0, Number(snapshot.currentTime) || 0),
    duration: Math.max(0, Number(snapshot.duration) || 0),
    completed: Boolean(snapshot.completed),
    updatedAt: Number(snapshot.updatedAt) || Date.now(),
  };
}

function readIndex(cacheStore: CacheStore, indexKey: string) {
  return cacheStore.read<ProgressIndexItem[]>(indexKey, PERSIST_MAX_AGE_MS) ?? [];
}

export function createPlaybackProgressRepository({
  cacheStore,
  keyPrefix = 'tinytale:shared-player:progress',
  maxEntries = 48,
}: {
  cacheStore: CacheStore;
  keyPrefix?: string;
  maxEntries?: number;
}) {
  const indexKey = `${keyPrefix}:index`;

  function pruneIndex(index: ProgressIndexItem[]) {
    return index
      .filter((item) => item.key)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, Math.max(1, maxEntries));
  }

  return {
    read(target: PlaybackProgressTarget) {
      const key = resolveProgressEntryKey(keyPrefix, target);
      if (!key) return null;
      return cacheStore.read<PlaybackProgressSnapshot>(key, PERSIST_MAX_AGE_MS);
    },
    write(snapshot: PlaybackProgressSnapshot) {
      const normalized = normalizeSnapshot(snapshot);
      const key = resolveProgressEntryKey(keyPrefix, normalized);
      if (!key || !normalized.episodeId) return;

      cacheStore.write(key, normalized);

      const nextIndex = pruneIndex([
        { key, updatedAt: normalized.updatedAt },
        ...readIndex(cacheStore, indexKey).filter((item) => item.key !== key),
      ]);

      cacheStore.write(indexKey, nextIndex);
    },
    clear(target: PlaybackProgressTarget) {
      const key = resolveProgressEntryKey(keyPrefix, target);
      if (!key) return;

      cacheStore.clear(key);
      const nextIndex = readIndex(cacheStore, indexKey).filter((item) => item.key !== key);
      cacheStore.write(indexKey, nextIndex);
    },
    listRecent(limit = 10) {
      const index = pruneIndex(readIndex(cacheStore, indexKey)).slice(0, Math.max(1, limit));
      return index
        .map((item) => cacheStore.read<PlaybackProgressSnapshot>(item.key, PERSIST_MAX_AGE_MS))
        .filter((snapshot): snapshot is PlaybackProgressSnapshot => Boolean(snapshot));
    },
  };
}

export function buildPlaybackSnapshotFromStream(args: {
  progress: PlaybackProgress;
  episodeId: string;
  dramaId?: string;
  dramaTitle?: string;
  episodeTitle?: string;
  poster?: string;
  streamInfo?: StreamPlaybackInfo | null;
  fallbackVideoUrl?: string | null;
}): PlaybackProgressSnapshot {
  return {
    ...args.progress,
    episodeId: args.episodeId,
    dramaId: args.dramaId,
    dramaTitle: args.dramaTitle,
    episodeTitle: args.episodeTitle,
    poster: args.poster,
    streamVideoId: args.streamInfo?.streamVideoId || args.streamInfo?.videoUid,
    videoUrl: args.streamInfo?.videoUrl || args.streamInfo?.playbackUrl || args.fallbackVideoUrl || undefined,
    updatedAt: Date.now(),
  };
}
