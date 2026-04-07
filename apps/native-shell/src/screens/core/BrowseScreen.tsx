import { useMemo, useState } from 'react';
import { CategoryChips } from '../../components/CategoryChips';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapCollectionData } from '../../lib/api-response';

const BROWSE_CACHE_MAX_AGE_MS = 3 * 60 * 1000;

export function BrowseScreen() {
  const api = useShellApi();
  const { isOffline } = useNetworkStatus();
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'rating'>('latest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'completed'>('all');

  const dramasQuery = useCachedQuery({
    cacheKey: `browse:all:${sortBy}`,
    cacheMaxAgeMs: BROWSE_CACHE_MAX_AGE_MS,
    queryKey: ['browse', 'all', sortBy],
    queryFn: () => api.dramas.getAll({ limit: 36, sort: sortBy }),
  });

  const categoriesQuery = useCachedQuery({
    cacheKey: 'browse:categories',
    cacheMaxAgeMs: BROWSE_CACHE_MAX_AGE_MS,
    queryKey: ['browse', 'categories'],
    queryFn: () => api.categories.getAll(),
  });

  const dramas = unwrapCollectionData(dramasQuery.data, ['dramas', 'items']);
  const categories = unwrapCollectionData(categoriesQuery.data, ['categories', 'items']);
  const filteredDramas = useMemo(
    () =>
      dramas.filter((drama) => {
        if (statusFilter === 'completed') return Boolean(drama.isCompleted);
        if (statusFilter === 'ongoing') return !drama.isCompleted;
        return true;
      }),
    [dramas, statusFilter]
  );

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Browse</p>
        <h2 className="app-hero-title">Explore every short drama</h2>
        <p className="app-hero-subtitle">
          Start with category filters, then dive straight into the latest drama shelves.
        </p>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Library</div>
            <div className="screen-stat-value">{filteredDramas.length}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Genres</div>
            <div className="screen-stat-value">{categories.length}</div>
          </article>
        </div>
      </article>

      <QueryState
        isLoading={dramasQuery.isLoading || categoriesQuery.isLoading}
        isFetching={dramasQuery.isFetching || categoriesQuery.isFetching}
        error={dramasQuery.error || categoriesQuery.error}
        empty={!dramas.length}
        offline={isOffline}
        hasCachedData={Boolean(dramasQuery.data || categoriesQuery.data)}
        emptyLabel="Browse feed has no dramas available yet."
        onRetry={() => {
          void dramasQuery.refetch();
          void categoriesQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={4} title="Preparing browse feed" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Filter</p>
              <h3 className="section-title">Browse by category</h3>
            </div>
          </div>
          <CategoryChips allLabel="All dramas" categories={categories} includeAll />
          <div className="app-filter-stack">
            <div className="app-filter-group">
              <span className="app-filter-label">Status</span>
              <div className="app-segmented-grid">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'ongoing', label: 'Ongoing' },
                  { key: 'completed', label: 'Completed' },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`shell-button-reset app-segment-button ${statusFilter === option.key ? 'app-segment-button-active' : ''}`}
                    onClick={() => setStatusFilter(option.key as typeof statusFilter)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="app-filter-group">
              <span className="app-filter-label">Sort</span>
              <div className="app-segmented-grid">
                {[
                  { key: 'latest', label: 'Latest' },
                  { key: 'views', label: 'Popular' },
                  { key: 'rating', label: 'Top rated' },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`shell-button-reset app-segment-button ${sortBy === option.key ? 'app-segment-button-active' : ''}`}
                    onClick={() => setSortBy(option.key as typeof sortBy)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Latest releases</p>
              <h3 className="section-title">Fresh stories for you</h3>
            </div>
            <span className="section-meta">{filteredDramas.length} results</span>
          </div>
          <DramaList dramas={filteredDramas} />
        </section>
      </QueryState>
    </section>
  );
}
