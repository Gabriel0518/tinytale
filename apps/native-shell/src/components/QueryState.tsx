import type { ReactNode } from 'react';
import { RouteSkeleton } from './RouteSkeleton';

export function QueryState({
  isLoading,
  isFetching,
  error,
  empty,
  emptyLabel,
  offline,
  hasCachedData,
  onRetry,
  skeleton,
  children,
}: {
  isLoading: boolean;
  isFetching?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyLabel?: string;
  offline?: boolean;
  hasCachedData?: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  const showCachedFallbackBanner = Boolean(error && hasCachedData);

  if (isLoading) {
    return <>{skeleton || <RouteSkeleton />}</>;
  }

  if (error && !hasCachedData) {
    return (
      <div className="route-skeleton route-skeleton-card">
        <div className="state-title">{offline ? 'Offline fallback active' : 'Failed to hydrate route data'}</div>
        <div className="state-copy">
          {offline && !hasCachedData
            ? 'Network is unavailable and no cached shell data exists for this route yet.'
            : error.message}
        </div>
        {onRetry ? (
          <button className="state-button" onClick={onRetry} type="button">
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return <div className="route-skeleton">{emptyLabel || 'No data available.'}</div>;
  }

  return (
    <>
      {showCachedFallbackBanner ? (
        <div className="state-banner state-banner-warning">
          <div>
            <div className="state-title">{offline ? 'Offline fallback active' : 'Showing cached route data'}</div>
            <div className="state-copy">
              {offline
                ? 'Live refresh is paused because the network is unavailable. Cached route data is still available below.'
                : error?.message || 'Live refresh failed, so the route is temporarily using the last cached snapshot.'}
            </div>
          </div>
          {onRetry ? (
            <button className="state-button" onClick={onRetry} type="button">
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {isFetching && hasCachedData && !showCachedFallbackBanner ? <div className="refresh-badge">Refreshing cached route data…</div> : null}
      {children}
    </>
  );
}
