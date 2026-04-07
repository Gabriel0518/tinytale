import type { ApiResponse } from '@domain';

export function unwrapApiData<T>(payload: ApiResponse<T> | T | null | undefined): T | undefined {
  if (!payload) return undefined;

  if (typeof payload === 'object' && 'success' in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export function unwrapCollectionData<T>(
  payload: ApiResponse<T[] | Record<string, unknown>> | T[] | Record<string, unknown> | null | undefined,
  keys: string[] = ['items', 'dramas', 'favorites', 'categories', 'playlists', 'notifications', 'transactions']
): T[] {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  for (const key of keys) {
    const candidate = (data as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}
