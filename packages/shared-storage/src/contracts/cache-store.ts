export type CacheEntry<T> = {
  cachedAt: number;
  data: T;
};

export interface CacheStore {
  read<T>(key: string, maxAgeMs: number): T | null;
  peek<T>(key: string): T | null;
  write<T>(key: string, data: T): void;
  clear(key: string): void;
}
