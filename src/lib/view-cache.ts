'use client';

import { createBrowserCacheStore } from '@storage';

const cacheStore = createBrowserCacheStore({
  storageKey: 'tinytale:view-cache',
  storage: 'sessionStorage',
});

export function readViewCache<T>(key: string, maxAgeMs: number): T | null {
  return cacheStore.read<T>(key, maxAgeMs);
}

export function writeViewCache<T>(key: string, data: T) {
  cacheStore.write<T>(key, data);
}

export function clearViewCache(key: string) {
  cacheStore.clear(key);
}
