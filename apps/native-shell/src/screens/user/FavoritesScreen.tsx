import type { Drama } from '@domain';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapCollectionData } from '../../lib/api-response';
import { useNativeAuth } from '../../providers/AuthProvider';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function FavoritesScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const favoritesQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:favorites`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'favorites'],
    queryFn: () => api.user.getFavorites(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const favorites = unwrapCollectionData<Drama>(favoritesQuery.data, ['favorites', 'dramas', 'items']);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Watch list</p>
        <h2 className="app-hero-title">My saved dramas</h2>
        <p className="app-hero-subtitle">The Watch list tab keeps every title you want to come back to later.</p>
      </article>

      <QueryState
        isLoading={favoritesQuery.isLoading}
        isFetching={favoritesQuery.isFetching}
        error={favoritesQuery.error}
        empty={!favorites.length}
        offline={isOffline}
        hasCachedData={Boolean(favoritesQuery.data)}
        emptyLabel="No favorites yet. Add a drama from detail to see it here."
        onRetry={() => {
          void favoritesQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={4} title="Loading favorites" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Saved titles</p>
              <h3 className="section-title">Watch list</h3>
            </div>
            <span className="section-meta">{favorites.length} titles</span>
          </div>
          <DramaList dramas={favorites} emptyLabel="Favorites are empty." />
        </section>
      </QueryState>
    </section>
  );
}
