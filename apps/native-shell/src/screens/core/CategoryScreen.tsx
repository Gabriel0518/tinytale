import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CategoryChips } from '../../components/CategoryChips';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapCollectionData } from '../../lib/api-response';

const CATEGORY_CACHE_MAX_AGE_MS = 3 * 60 * 1000;

export function CategoryScreen() {
  const api = useShellApi();
  const { isOffline } = useNetworkStatus();
  const params = useParams();
  const categoryId = useMemo(() => params.categoryId || 'featured', [params.categoryId]);

  const categoriesQuery = useCachedQuery({
    cacheKey: 'category:list',
    cacheMaxAgeMs: CATEGORY_CACHE_MAX_AGE_MS,
    queryKey: ['category', 'list'],
    queryFn: () => api.categories.getAll(),
  });

  const dramasQuery = useCachedQuery({
    cacheKey: `category:${categoryId}`,
    cacheMaxAgeMs: CATEGORY_CACHE_MAX_AGE_MS,
    queryKey: ['category', categoryId],
    queryFn: () => api.dramas.getAll({ category: categoryId, limit: 18 }),
  });

  const categories = unwrapCollectionData(categoriesQuery.data, ['categories', 'items']);
  const dramas = unwrapCollectionData(dramasQuery.data, ['dramas', 'items']);
  const activeCategory = categories.find((category) => (category.slug || category._id) === categoryId);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Category</p>
        <h2 className="app-hero-title">{activeCategory?.name || categoryId}</h2>
        <p className="app-hero-subtitle">
          Switch categories at the top, then browse every story inside the selected shelf.
        </p>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Titles</div>
            <div className="screen-stat-value">{dramas.length}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Categories</div>
            <div className="screen-stat-value">{categories.length}</div>
          </article>
        </div>
      </article>

      <QueryState
        isLoading={categoriesQuery.isLoading || dramasQuery.isLoading}
        isFetching={categoriesQuery.isFetching || dramasQuery.isFetching}
        error={categoriesQuery.error || dramasQuery.error}
        empty={!dramas.length}
        offline={isOffline}
        hasCachedData={Boolean(categoriesQuery.data || dramasQuery.data)}
        emptyLabel="This category has no dramas available yet."
        onRetry={() => {
          void categoriesQuery.refetch();
          void dramasQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Preparing category shelf" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">All categories</p>
              <h3 className="section-title">Switch shelves</h3>
            </div>
          </div>
          <CategoryChips activeId={categoryId} allLabel="All dramas" categories={categories} includeAll />
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Selected shelf</p>
              <h3 className="section-title">{activeCategory?.name || 'Category results'}</h3>
            </div>
            <span className="section-meta">{dramas.length} results</span>
          </div>
          <DramaList dramas={dramas} />
        </section>
      </QueryState>
    </section>
  );
}
