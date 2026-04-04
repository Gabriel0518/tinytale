'use client';

type PlaybackProgressKeyInput = {
  progressKeyId?: string | null;
  episodeId?: string | null;
  streamVideoId?: string | null;
  videoUrl?: string | null;
};

function sanitizeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 96);
}

function readStorageValue(key: string) {
  if (typeof window === 'undefined') return null;

  try {
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
  } catch {
    // Ignore session storage failures.
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore session storage failures.
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore local storage failures.
  }
}

export function buildPlaybackProgressKey({ progressKeyId, episodeId, streamVideoId, videoUrl }: PlaybackProgressKeyInput) {
  const stableEpisodeId = typeof progressKeyId === 'string' && progressKeyId.trim()
    ? progressKeyId.trim()
    : typeof episodeId === 'string'
      ? episodeId.trim()
      : '';
  if (stableEpisodeId) {
    return `tinytale:progress:episode:${sanitizeKeyPart(stableEpisodeId)}`;
  }

  const stableStreamId = typeof streamVideoId === 'string' ? streamVideoId.trim() : '';
  if (stableStreamId) {
    return `tinytale:progress:stream:${sanitizeKeyPart(stableStreamId)}`;
  }

  const safeVideoUrl = typeof videoUrl === 'string' ? videoUrl.trim() : '';
  return safeVideoUrl ? `tinytale:progress:url:${sanitizeKeyPart(safeVideoUrl)}` : '';
}

export function readSavedPlaybackProgress(input: PlaybackProgressKeyInput) {
  if (typeof window === 'undefined') return 0;
  const progressKey = buildPlaybackProgressKey(input);
  if (!progressKey) return 0;

  try {
    const saved = readStorageValue(progressKey);
    const time = saved ? parseFloat(saved) : 0;
    return Number.isFinite(time) ? Math.max(0, time) : 0;
  } catch {
    return 0;
  }
}

export function writeSavedPlaybackProgress(input: PlaybackProgressKeyInput, currentTime: number) {
  if (typeof window === 'undefined') return;
  const progressKey = buildPlaybackProgressKey(input);
  const safeTime = Math.max(0, currentTime);
  if (!progressKey || safeTime <= 0) return;

  try {
    writeStorageValue(progressKey, String(safeTime));
  } catch {
    // Ignore storage quota / availability issues.
  }
}
