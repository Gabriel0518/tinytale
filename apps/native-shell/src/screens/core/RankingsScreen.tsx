import { useMemo, useState } from 'react';
import type { Drama } from '@domain';
import { Link } from 'react-router-dom';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapCollectionData } from '../../lib/api-response';
import { routeBuilders } from '../../router/route-builders';

const RANKINGS_CACHE_MAX_AGE_MS = 3 * 60 * 1000;

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';

function sortByViews(dramas: Drama[]) {
  return [...dramas].sort((left, right) => (right.viewCount || 0) - (left.viewCount || 0));
}

function sortByNewest(dramas: Drama[]) {
  return [...dramas].sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));
}

function sortByRating(dramas: Drama[]) {
  return [...dramas].sort((left, right) => (right.rating || 0) - (left.rating || 0));
}

export function RankingsScreen() {
  const api = useShellApi();
  const { isOffline } = useNetworkStatus();
  const [period, setPeriod] = useState<TimePeriod>('daily');

  const rankingsQuery = useCachedQuery({
    cacheKey: 'rankings:all',
    cacheMaxAgeMs: RANKINGS_CACHE_MAX_AGE_MS,
    queryKey: ['rankings', 'all'],
    queryFn: () => api.dramas.getAll({ sort: 'views', limit: 50 }),
  });

  const dramas = unwrapCollectionData<Drama>(rankingsQuery.data, ['dramas', 'items']);
  const rankedByViews = useMemo(() => sortByViews(dramas).slice(0, 10), [dramas]);
  const rankedByNewest = useMemo(() => sortByNewest(dramas).slice(0, 10), [dramas]);
  const rankedByRating = useMemo(() => sortByRating(dramas).slice(0, 10), [dramas]);
  const spotlightDrama = rankedByViews[0] || rankedByNewest[0] || rankedByRating[0] || null;
  const spotlightCover = spotlightDrama?.horizontalCover || spotlightDrama?.cover || '';

  return (
    <section className="screen-stack">
      <article className={`app-hero-card ${spotlightCover ? 'app-hero-card-media' : ''}`}>
        {spotlightCover ? (
          <div className="app-hero-cover">
            <img alt={spotlightDrama?.title || 'Rankings spotlight'} src={spotlightCover} />
          </div>
        ) : null}
        <div className="app-hero-content">
          <p className="app-kicker">Rankings</p>
          <h2 className="app-hero-title">{spotlightDrama?.title || 'Drama leaderboards'}</h2>
          <p className="app-hero-subtitle">
            The native rankings page now follows the Web mobile relationship: period tabs first, then multiple ranking shelves.
          </p>
          <div className="app-segmented-grid app-segmented-grid-compact">
            {[
              { key: 'daily', label: 'Today' },
              { key: 'weekly', label: 'This Week' },
              { key: 'monthly', label: 'This Month' },
              { key: 'all', label: 'All Time' },
            ].map((option) => (
              <button
                key={option.key}
                className={`shell-button-reset app-segment-button ${period === option.key ? 'app-segment-button-active' : ''}`}
                onClick={() => setPeriod(option.key as TimePeriod)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {spotlightDrama ? (
            <div className="app-hero-actions">
              <Link className="app-primary-button" to={routeBuilders.dramaDetail(spotlightDrama._id)}>
                View spotlight
              </Link>
            </div>
          ) : null}
        </div>
      </article>

      <QueryState
        isLoading={rankingsQuery.isLoading}
        isFetching={rankingsQuery.isFetching}
        error={rankingsQuery.error}
        empty={!dramas.length}
        offline={isOffline}
        hasCachedData={Boolean(rankingsQuery.data)}
        emptyLabel="No rankings data available."
        onRetry={() => void rankingsQuery.refetch()}
        skeleton={<RouteSkeleton blocks={4} title="Preparing rankings feed" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Hot ranking</p>
              <h3 className="section-title">Most watched</h3>
            </div>
            <span className="section-meta">{period === 'daily' ? 'Today' : period === 'weekly' ? '7d' : period === 'monthly' ? '30d' : 'All time'}</span>
          </div>
          <DramaList dramas={rankedByViews.slice(0, 8)} rankStart={1} variant="rankings" />
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">New arrivals</p>
              <h3 className="section-title">Fresh stories landing now</h3>
            </div>
          </div>
          <DramaList dramas={rankedByNewest.slice(0, 8)} rankStart={1} variant="rankings" />
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Top rated</p>
              <h3 className="section-title">Highest audience scores</h3>
            </div>
          </div>
          <DramaList dramas={rankedByRating.slice(0, 8)} rankStart={1} variant="rankings" />
        </section>
      </QueryState>
    </section>
  );
}
