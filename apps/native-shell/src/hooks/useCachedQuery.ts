import { useEffect, useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { shellCacheStore } from '../lib/cache';

type UseCachedQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn' | 'initialData'
> & {
  allowOfflineStale?: boolean;
  cacheKey: string;
  cacheMaxAgeMs: number;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TQueryFnData>;
};

export function useCachedQuery<TQueryFnData, TData = TQueryFnData>({
  allowOfflineStale = true,
  cacheKey,
  cacheMaxAgeMs,
  queryKey,
  queryFn,
  select,
  ...options
}: UseCachedQueryOptions<TQueryFnData, TData>) {
  const initialData = useMemo(
    () => {
      const freshData = shellCacheStore.read<TQueryFnData>(cacheKey, cacheMaxAgeMs);
      if (freshData !== null) {
        return freshData;
      }

      if (allowOfflineStale && typeof navigator !== 'undefined' && !navigator.onLine) {
        return shellCacheStore.peek<TQueryFnData>(cacheKey) ?? undefined;
      }

      return undefined;
    },
    [allowOfflineStale, cacheKey, cacheMaxAgeMs]
  );

  const query = useQuery<TQueryFnData, Error, TData>({
    queryKey,
    queryFn,
    initialData,
    select,
    ...options,
  });

  useEffect(() => {
    if (query.data === undefined) return;
    shellCacheStore.write(cacheKey, query.data);
  }, [cacheKey, query.data]);

  return query;
}
