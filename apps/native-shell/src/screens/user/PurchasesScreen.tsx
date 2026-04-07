import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { normalizePurchaseItem, type NativePurchaseItem } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function PurchasesScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const purchasesQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:purchases`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'purchases'],
    queryFn: () => api.profile.getPurchases(token || '', { page: 1 }),
    enabled: Boolean(token && user?._id),
  });

  const purchases = (unwrapApiData<unknown[]>(purchasesQuery.data) ?? [])
    .map(normalizePurchaseItem)
    .filter((item): item is NativePurchaseItem => item !== null);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Purchases</p>
        <h2 className="app-hero-title">Orders and unlocks</h2>
        <p className="app-hero-subtitle">Recharge orders, episode unlocks, and other payment activity appear here.</p>
      </article>

      <QueryState
        isLoading={purchasesQuery.isLoading}
        isFetching={purchasesQuery.isFetching}
        error={purchasesQuery.error}
        empty={!purchases.length}
        offline={isOffline}
        hasCachedData={Boolean(purchasesQuery.data)}
        emptyLabel="No purchase records are available yet."
        onRetry={() => {
          void purchasesQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Loading purchases" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">History</p>
              <h3 className="section-title">Transaction timeline</h3>
            </div>
            <span className="section-meta">{purchases.length} records</span>
          </div>
          <div className="purchase-list">
          {purchases.map((purchase) => (
            <article key={purchase.id} className="purchase-card">
              <div className="episode-card-topline">
                <div>
                  <div className="episode-card-title">{purchase.title}</div>
                  <div className="notification-meta">{new Date(purchase.createdAt).toLocaleString()}</div>
                </div>
                <span className="episode-access-pill">{purchase.status}</span>
              </div>
              <p className="episode-card-copy">{purchase.amountLabel}</p>
            </article>
          ))}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
