'use client';

type PlaybackProgressKeyInput = {
  streamVideoId?: string | null;
  videoUrl?: string | null;
};

export function buildPlaybackProgressKey({ streamVideoId, videoUrl }: PlaybackProgressKeyInput) {
  const id = streamVideoId || videoUrl || '';
  return id ? `tinytale:progress:${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)}` : '';
}

export function readSavedPlaybackProgress(input: PlaybackProgressKeyInput) {
  if (typeof window === 'undefined') return 0;
  const progressKey = buildPlaybackProgressKey(input);
  if (!progressKey) return 0;

  try {
    const saved = window.sessionStorage.getItem(progressKey);
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
    window.sessionStorage.setItem(progressKey, String(safeTime));
  } catch {
    // Ignore storage quota / availability issues.
  }
}
