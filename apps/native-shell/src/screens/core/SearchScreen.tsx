import { useMemo, useState } from 'react';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapCollectionData } from '../../lib/api-response';

const SEARCH_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function SearchScreen() {
  const api = useShellApi();
  const { isOffline } = useNetworkStatus();
  const [term, setTerm] = useState('love');
  const normalizedTerm = useMemo(() => term.trim(), [term]);

  const resultsQuery = useCachedQuery({
    cacheKey: `search:${normalizedTerm || 'empty'}`,
    cacheMaxAgeMs: SEARCH_CACHE_MAX_AGE_MS,
    queryKey: ['search', normalizedTerm],
    queryFn: () => api.dramas.getAll({ limit: 12, search: normalizedTerm }),
    enabled: normalizedTerm.length > 0,
  });

  const dramas = unwrapCollectionData(resultsQuery.data, ['dramas', 'items']);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Search</p>
        <h2 className="app-hero-title">Search dramas, genres, actors</h2>
        <p className="app-hero-subtitle">
          Use the same search-first flow as the old app and browse results without leaving the native shell.
        </p>
        <label className="shell-input-block">
          <span className="shell-input-label">Keyword</span>
          <input
            className="shell-input"
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search dramas"
            value={term}
          />
        </label>
      </article>

      <QueryState
        isLoading={resultsQuery.isLoading}
        isFetching={resultsQuery.isFetching}
        error={resultsQuery.error}
        empty={!dramas.length}
        offline={isOffline}
        hasCachedData={Boolean(resultsQuery.data)}
        emptyLabel={normalizedTerm ? 'No search results found.' : 'Type to search the catalog.'}
        onRetry={() => void resultsQuery.refetch()}
        skeleton={<RouteSkeleton blocks={3} title="Preparing search results" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Results</p>
              <h3 className="section-title">{normalizedTerm ? `Matches for "${normalizedTerm}"` : 'Start typing'}</h3>
            </div>
            {dramas.length ? <span className="section-meta">{dramas.length} titles</span> : null}
          </div>
          <DramaList dramas={dramas} />
        </section>
      </QueryState>
    </section>
  );
}
