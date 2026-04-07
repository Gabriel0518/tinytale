import type { KeyValueStore } from '../contracts/kv-store';

export type BrowserStorageKind = 'localStorage' | 'sessionStorage';

function getBrowserStorage(kind: BrowserStorageKind): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window[kind];
  } catch {
    return null;
  }
}

export function createBrowserKeyValueStore(kind: BrowserStorageKind = 'localStorage'): KeyValueStore {
  return {
    getItem(key) {
      return getBrowserStorage(kind)?.getItem(key) ?? null;
    },
    setItem(key, value) {
      getBrowserStorage(kind)?.setItem(key, value);
    },
    removeItem(key) {
      getBrowserStorage(kind)?.removeItem(key);
    },
  };
}

export function readJsonValue<T>(
  store: KeyValueStore,
  key: string,
  normalize?: (value: unknown) => T | null
): T | null {
  const raw = store.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalize ? normalize(parsed) : (parsed as T);
  } catch {
    store.removeItem(key);
    return null;
  }
}

export function writeJsonValue<T>(store: KeyValueStore, key: string, value: T) {
  store.setItem(key, JSON.stringify(value));
}
