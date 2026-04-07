import type { CacheEntry, CacheStore } from '../contracts/cache-store';

type BrowserCacheStoreOptions = {
  storageKey: string;
  storage?: 'localStorage' | 'sessionStorage';
};

export function createBrowserCacheStore({
  storageKey,
  storage = 'sessionStorage',
}: BrowserCacheStoreOptions): CacheStore {
  const memoryStore = new Map<string, CacheEntry<unknown>>();

  function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    try {
      return window[storage];
    } catch {
      return null;
    }
  }

  function readPersistentStore(): Record<string, CacheEntry<unknown>> {
    const browserStorage = getStorage();
    if (!browserStorage) return {};

    try {
      const raw = browserStorage.getItem(storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, CacheEntry<unknown>>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      browserStorage.removeItem(storageKey);
      return {};
    }
  }

  function writePersistentStore(store: Record<string, CacheEntry<unknown>>) {
    const browserStorage = getStorage();
    if (!browserStorage) return;
    browserStorage.setItem(storageKey, JSON.stringify(store));
  }

  return {
    read<T>(key: string, maxAgeMs: number) {
      const now = Date.now();
      const memoryEntry = memoryStore.get(key) as CacheEntry<T> | undefined;

      if (memoryEntry) {
        if (now - memoryEntry.cachedAt <= maxAgeMs) {
          return memoryEntry.data;
        }
        memoryStore.delete(key);
      }

      const persistentStore = readPersistentStore();
      const persistentEntry = persistentStore[key] as CacheEntry<T> | undefined;
      if (!persistentEntry) return null;

      if (now - persistentEntry.cachedAt > maxAgeMs) {
        delete persistentStore[key];
        writePersistentStore(persistentStore);
        return null;
      }

      memoryStore.set(key, persistentEntry);
      return persistentEntry.data;
    },
    peek<T>(key: string) {
      const memoryEntry = memoryStore.get(key) as CacheEntry<T> | undefined;
      if (memoryEntry) {
        return memoryEntry.data;
      }

      const persistentStore = readPersistentStore();
      const persistentEntry = persistentStore[key] as CacheEntry<T> | undefined;
      if (!persistentEntry) return null;

      memoryStore.set(key, persistentEntry);
      return persistentEntry.data;
    },
    write<T>(key: string, data: T) {
      const entry: CacheEntry<T> = {
        cachedAt: Date.now(),
        data,
      };

      memoryStore.set(key, entry);

      const persistentStore = readPersistentStore();
      persistentStore[key] = entry;
      writePersistentStore(persistentStore);
    },
    clear(key: string) {
      memoryStore.delete(key);

      const persistentStore = readPersistentStore();
      delete persistentStore[key];
      writePersistentStore(persistentStore);
    },
  };
}
