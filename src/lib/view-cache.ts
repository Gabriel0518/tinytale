'use client';

const VIEW_CACHE_STORAGE_KEY = 'tinytale:view-cache';

type CachedViewEntry<T> = {
  cachedAt: number;
  data: T;
};

const memoryStore = new Map<string, CachedViewEntry<unknown>>();

function readSessionStore(): Record<string, CachedViewEntry<unknown>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(VIEW_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedViewEntry<unknown>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    window.sessionStorage.removeItem(VIEW_CACHE_STORAGE_KEY);
    return {};
  }
}

function writeSessionStore(store: Record<string, CachedViewEntry<unknown>>) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(VIEW_CACHE_STORAGE_KEY, JSON.stringify(store));
}

export function readViewCache<T>(key: string, maxAgeMs: number): T | null {
  const now = Date.now();
  const memoryEntry = memoryStore.get(key) as CachedViewEntry<T> | undefined;

  if (memoryEntry) {
    if (now - memoryEntry.cachedAt <= maxAgeMs) {
      return memoryEntry.data;
    }
    memoryStore.delete(key);
  }

  const store = readSessionStore();
  const sessionEntry = store[key] as CachedViewEntry<T> | undefined;
  if (!sessionEntry) return null;

  if (now - sessionEntry.cachedAt > maxAgeMs) {
    delete store[key];
    writeSessionStore(store);
    return null;
  }

  memoryStore.set(key, sessionEntry);
  return sessionEntry.data;
}

export function writeViewCache<T>(key: string, data: T) {
  const entry: CachedViewEntry<T> = {
    cachedAt: Date.now(),
    data,
  };

  memoryStore.set(key, entry);

  const store = readSessionStore();
  store[key] = entry;
  writeSessionStore(store);
}

export function clearViewCache(key: string) {
  memoryStore.delete(key);
  const store = readSessionStore();
  delete store[key];
  writeSessionStore(store);
}
