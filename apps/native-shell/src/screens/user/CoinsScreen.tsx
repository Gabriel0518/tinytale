import { useState } from 'react';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { normalizeCoinPackage, normalizePurchaseItem, type NativeCoinPackage, type NativePurchaseItem } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function CoinsScreen() {
  const api = useShellApi();
  const { user, token, refreshUser } = useNativeAuth();
  const { isOffline } = useNetworkStatus();
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const balanceQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:coin-balance`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'coin-balance'],
    queryFn: () => api.coins.getBalance(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const packagesQuery = useCachedQuery({
    cacheKey: 'coins:packages',
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['coins', 'packages'],
    queryFn: () => api.coins.getPackages(),
  });

  const transactionsQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:coin-transactions`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'coin-transactions'],
    queryFn: () => api.coins.getTransactions(token || '', { page: 1, limit: 10 }),
    enabled: Boolean(token && user?._id),
  });

  const balancePayload =
    unwrapApiData<Record<string, unknown>>(
      balanceQuery.data as Record<string, unknown> | { success: boolean; data?: Record<string, unknown> } | undefined
    ) ?? {};
  const currentBalance = Number(balancePayload.coins || user?.coins || 0);
  const packagesPayload = packagesQuery.data as { data?: unknown[] } | undefined;
  const packages = (packagesPayload?.data ?? unwrapApiData<unknown[]>(packagesQuery.data as unknown[] | { success: boolean; data?: unknown[] } | undefined) ?? [])
    .map(normalizeCoinPackage)
    .filter((item): item is NativeCoinPackage => item !== null);
  const transactions = (unwrapApiData<unknown[]>(transactionsQuery.data as unknown[] | { success: boolean; data?: unknown[] } | undefined) ?? [])
    .map(normalizePurchaseItem)
    .filter((item): item is NativePurchaseItem => item !== null);

  async function handleRedeem() {
    if (!token || !redeemCode.trim()) return;
    setRedeeming(true);
    setError('');
    setMessage('');
    try {
      await api.coins.redeem(token, redeemCode.trim());
      setRedeemCode('');
      setMessage('Redeem code applied. Balance will refresh.');
      await Promise.all([balanceQuery.refetch(), transactionsQuery.refetch(), refreshUser()]);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Redeem failed.');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Coins</p>
        <h2 className="app-hero-title">{currentBalance.toLocaleString()} coins</h2>
        <p className="app-hero-subtitle">
          The balance card in the header lands here, keeping the old app wallet flow intact.
        </p>
        <div className="meta-pill-row">
          <span className="meta-pill">{packages.length} packs available</span>
          <span className="meta-pill">{transactions.length} recent records</span>
        </div>
      </article>

      <QueryState
        isLoading={balanceQuery.isLoading || packagesQuery.isLoading || transactionsQuery.isLoading}
        isFetching={balanceQuery.isFetching || packagesQuery.isFetching || transactionsQuery.isFetching}
        error={balanceQuery.error || packagesQuery.error || transactionsQuery.error}
        offline={isOffline}
        hasCachedData={Boolean(balanceQuery.data || packagesQuery.data || transactionsQuery.data)}
        onRetry={() => {
          void balanceQuery.refetch();
          void packagesQuery.refetch();
          void transactionsQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={4} title="Loading coin wallet" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Recharge packages</p>
              <h3 className="section-title">Choose a coin pack</h3>
            </div>
          </div>
          <div className="package-grid">
            {packages.map((pkg) => (
              <article key={pkg.id} className="package-card">
                <div className="episode-card-topline">
                  <span className="episode-pill">{pkg.tag || 'Package'}</span>
                  <span className="episode-access-pill">${pkg.price.toFixed(2)}</span>
                </div>
                <div className="episode-card-title">{pkg.coins.toLocaleString()} coins</div>
                <div className="episode-card-copy">
                  {pkg.bonus > 0 ? `Includes +${pkg.bonus.toLocaleString()} bonus coins.` : 'Standard package.'}
                </div>
              </article>
            ))}
          </div>
          <div className="paywall-card-note">
            Embedded payment is not wired yet in native-shell. Next payment step is Payment Element / Play Billing evaluation, so checkout remains intentionally blocked here.
          </div>
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Redeem</p>
              <h3 className="section-title">Apply a gift code</h3>
            </div>
          </div>
          <div className="auth-inline-row">
            <input className="shell-input" onChange={(event) => setRedeemCode(event.target.value)} placeholder="Enter redeem code" value={redeemCode} />
            <button className="app-primary-button shell-button-reset auth-inline-button" disabled={redeeming} onClick={() => void handleRedeem()} type="button">
              {redeeming ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
          {message ? <div className="auth-success">{message}</div> : null}
          {error ? <div className="auth-error">{error}</div> : null}
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Wallet history</p>
              <h3 className="section-title">Recent transactions</h3>
            </div>
            <span className="section-meta">{transactions.length} records</span>
          </div>
          <div className="purchase-list">
            {transactions.length ? (
              transactions.map((transaction) => (
                <article key={transaction.id} className="purchase-card">
                  <div className="episode-card-topline">
                    <div>
                      <div className="episode-card-title">{transaction.title}</div>
                      <div className="notification-meta">{new Date(transaction.createdAt).toLocaleString()}</div>
                    </div>
                    <span className="episode-access-pill">{transaction.status}</span>
                  </div>
                  <p className="episode-card-copy">{transaction.amountLabel}</p>
                </article>
              ))
            ) : (
              <div className="route-skeleton">No coin transactions yet.</div>
            )}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
