import { Link } from 'react-router-dom';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { normalizeHistoryItem, type NativeHistoryItem } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function HistoryScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const historyQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:history`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'history'],
    queryFn: () => api.user.getHistory(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const historyItems = (unwrapApiData<unknown[]>(historyQuery.data) ?? [])
    .map(normalizeHistoryItem)
    .filter((item): item is NativeHistoryItem => item !== null);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">History</p>
        <h2 className="app-hero-title">Continue watching</h2>
        <p className="app-hero-subtitle">Your latest sessions and resume progress stay together on this page.</p>
      </article>

      <QueryState
        isLoading={historyQuery.isLoading}
        isFetching={historyQuery.isFetching}
        error={historyQuery.error}
        empty={!historyItems.length}
        offline={isOffline}
        hasCachedData={Boolean(historyQuery.data)}
        emptyLabel="No watch history is available yet."
        onRetry={() => {
          void historyQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Loading history" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Recent sessions</p>
              <h3 className="section-title">Playback history</h3>
            </div>
            <span className="section-meta">{historyItems.length} items</span>
          </div>
          <div className="history-list">
          {historyItems.map((item) => (
            <Link key={item.id} className="history-card" to={routeBuilders.playEpisode(item.dramaId, item.episodeId)}>
              <div className="episode-card-topline">
                <span className="episode-pill">{item.episodeNumber ? `EP ${item.episodeNumber}` : 'Playback'}</span>
                <span className="episode-access-pill">{new Date(item.watchedAt).toLocaleDateString()}</span>
              </div>
              <div className="episode-card-title">{item.dramaTitle}</div>
              <div className="episode-card-copy">
                {item.episodeTitle || 'Resume this episode from the local player shell.'}
                {typeof item.progress === 'number' ? ` Progress: ${Math.round(item.progress)}%.` : ''}
              </div>
            </Link>
          ))}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
