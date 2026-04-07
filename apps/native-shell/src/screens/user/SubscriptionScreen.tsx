import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { normalizeSubscriptionPlan, type NativeSubscriptionPlan } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function SubscriptionScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const plansQuery = useCachedQuery({
    cacheKey: 'subscription:plans',
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['subscription', 'plans'],
    queryFn: () => api.subscription.getPlans(),
  });

  const statusQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:subscription-status`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'subscription-status'],
    queryFn: () => api.subscription.getStatus(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const plans = (
    unwrapApiData<unknown[]>(
      plansQuery.data as unknown[] | { success: boolean; data?: unknown[] } | undefined
    ) ?? []
  )
    .map(normalizeSubscriptionPlan)
    .filter((item): item is NativeSubscriptionPlan => item !== null);
  const status =
    unwrapApiData<Record<string, unknown>>(
      statusQuery.data as Record<string, unknown> | { success: boolean; data?: Record<string, unknown> } | undefined
    ) ?? {};
  const active = Boolean(status.active ?? (user?.vipStatus === 'active'));
  const expireDate = typeof status.expireDate === 'string' ? status.expireDate : user?.vipExpireDate;

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">VIP</p>
        <h2 className="app-hero-title">{active ? 'VIP Active' : 'Upgrade to VIP'}</h2>
        <p className="app-hero-subtitle">
          View your current membership status first, then compare available VIP plans.
        </p>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Status</div>
            <div className="screen-stat-value">{active ? 'Active' : 'Inactive'}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Expires</div>
            <div className="screen-stat-value">{expireDate ? new Date(expireDate).toLocaleDateString() : 'Not subscribed'}</div>
          </article>
        </div>
      </article>

      <QueryState
        isLoading={plansQuery.isLoading || statusQuery.isLoading}
        isFetching={plansQuery.isFetching || statusQuery.isFetching}
        error={plansQuery.error || statusQuery.error}
        empty={!plans.length}
        offline={isOffline}
        hasCachedData={Boolean(plansQuery.data || statusQuery.data)}
        emptyLabel="No subscription plans are available right now."
        onRetry={() => {
          void plansQuery.refetch();
          void statusQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Loading subscription plans" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Plans</p>
              <h3 className="section-title">VIP membership</h3>
            </div>
            <span className="section-meta">{plans.length} plans</span>
          </div>
          <div className="package-grid">
          {plans.map((plan) => (
            <article key={plan.id} className="screen-card package-card">
              <div className="episode-card-topline">
                <span className="episode-pill">{plan.recommended ? 'Recommended' : 'VIP'}</span>
                <span className="episode-access-pill">${plan.price.toFixed(2)}</span>
              </div>
              <div className="episode-card-title">{plan.name}</div>
              <div className="episode-card-copy">
                Billed per {plan.period}. {plan.coins ? `Includes ${plan.coins.toLocaleString()} bonus coins.` : ''}
              </div>
              <div className="feature-list">
                {plan.features.map((feature) => (
                  <span key={feature} className="feature-pill">
                    {feature}
                  </span>
                ))}
              </div>
            </article>
          ))}
          </div>
        </section>
        <div className="paywall-card-note">
          Subscription purchase remains blocked on native billing strategy. This route now provides app-owned plan visibility and status restore without falling back to web startup.
        </div>
      </QueryState>
    </section>
  );
}
