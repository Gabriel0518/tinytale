import { Link, useNavigate } from 'react-router-dom';
import { DramaList } from '../../components/DramaList';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData, unwrapCollectionData } from '../../lib/api-response';
import { localPushInboxRepository } from '../../lib/cache';
import {
  normalizeHistoryItem,
  normalizeNotificationItem,
  type NativeHistoryItem,
  type NativeNotificationItem,
} from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function ProfileScreen() {
  const navigate = useNavigate();
  const api = useShellApi();
  const { user, token, logout, refreshUser } = useNativeAuth();

  const favoritesQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:favorites`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'favorites'],
    queryFn: () => api.user.getFavorites(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const historyQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:history`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'history'],
    queryFn: () => api.user.getHistory(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const notificationsQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:notifications`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'notifications'],
    queryFn: () => api.user.getNotifications(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const favorites = unwrapCollectionData(favoritesQuery.data, ['favorites', 'dramas', 'items']);
  const history = (unwrapApiData<unknown[]>(historyQuery.data) ?? [])
    .map(normalizeHistoryItem)
    .filter((item): item is NativeHistoryItem => item !== null);
  const notificationsPayload =
    unwrapApiData<unknown[] | { notifications?: unknown[] }>(notificationsQuery.data) ?? [];
  const remoteNotifications = Array.isArray(notificationsPayload)
    ? notificationsPayload
    : Array.isArray(notificationsPayload.notifications)
      ? notificationsPayload.notifications
      : [];
  const notifications = remoteNotifications
    .map(normalizeNotificationItem)
    .filter((item): item is NativeNotificationItem => item !== null);
  const localInboxUnreadCount = localPushInboxRepository.list().filter((item) => !item.read).length;
  const unreadCount = notifications.filter((item) => !item.read).length + localInboxUnreadCount;
  const favoritePreview = favorites.slice(0, 8);
  const latestHistory = history[0] ?? null;

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <div className="app-profile-hero">
          <div className="app-profile-avatar">
            {user?.avatar ? <img alt={user.nickname || 'Profile avatar'} src={user.avatar} /> : <span>{(user?.nickname || 'P').slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="app-profile-meta">
            <p className="app-kicker">Profile</p>
            <h2 className="app-hero-title">{user?.nickname || 'Profile'}</h2>
          </div>
        </div>
        <p className="app-hero-subtitle">
          Your account hub keeps the old app flow: watch list, history, notifications, wallet, and subscription in one place.
        </p>
        <div className="meta-pill-row">
          <span className="meta-pill">{user?.vipStatus === 'active' ? 'VIP active' : 'Standard member'}</span>
          <span className="meta-pill">{user?.coins ?? 0} coins</span>
        </div>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Email</div>
            <div className="screen-stat-value">{user?.email || 'Unknown'}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Coins</div>
            <div className="screen-stat-value">{user?.coins ?? 0}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Favorites</div>
            <div className="screen-stat-value">{favorites.length}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Unread</div>
            <div className="screen-stat-value">{unreadCount}</div>
          </article>
        </div>
        <div className="app-hero-actions">
          <button
            className="app-secondary-button shell-button-reset"
            onClick={() => {
              void refreshUser();
            }}
            type="button"
          >
            Refresh Account
          </button>
          <button
            className="app-secondary-button shell-button-reset"
            onClick={() => {
              logout();
              navigate(routeBuilders.login(), { replace: true });
            }}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </article>

      <section className="app-section-card">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Wallet</p>
            <h3 className="section-title">Coins and membership</h3>
          </div>
          <Link className="app-inline-pill" to={routeBuilders.coins()}>
            Open wallet
          </Link>
        </div>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Coins</div>
            <div className="screen-stat-value">{user?.coins ?? 0}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">VIP</div>
            <div className="screen-stat-value">{user?.vipStatus === 'active' ? 'Active' : 'Inactive'}</div>
          </article>
        </div>
        <div className="app-link-list">
          <Link className="app-link-card" to={routeBuilders.subscription()}>
            <div>
              <p className="screen-eyebrow">Subscription</p>
              <div className="user-hub-title">{user?.vipStatus === 'active' ? 'Manage VIP' : 'Upgrade to VIP'}</div>
            </div>
            <span className="app-inline-pill">Open</span>
          </Link>
          <Link className="app-link-card" to={routeBuilders.purchases()}>
            <div>
              <p className="screen-eyebrow">Orders</p>
              <div className="user-hub-title">Recharge and unlock history</div>
            </div>
            <span className="app-inline-pill">View</span>
          </Link>
        </div>
      </section>

      <section className="app-section-card">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">My space</p>
            <h3 className="section-title">Quick access</h3>
          </div>
        </div>
        <div className="user-hub-grid">
          <Link className="user-hub-card" to={routeBuilders.favorites()}>
            <p className="screen-eyebrow">Watch list</p>
            <h3 className="user-hub-title">{favorites.length} saved titles</h3>
            <p className="episode-card-copy">Keep every saved drama together in one list.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.history()}>
            <p className="screen-eyebrow">History</p>
            <h3 className="user-hub-title">{history.length} playback entries</h3>
            <p className="episode-card-copy">Jump back to the latest place you watched.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.notifications()}>
            <p className="screen-eyebrow">Notifications</p>
            <h3 className="user-hub-title">{unreadCount} unread updates</h3>
            <p className="episode-card-copy">Read and open message links without leaving the app shell.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.purchases()}>
            <p className="screen-eyebrow">Purchases</p>
            <h3 className="user-hub-title">Order history</h3>
            <p className="episode-card-copy">Review unlocks, recharges, and payment activity.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.coins()}>
            <p className="screen-eyebrow">Coins</p>
            <h3 className="user-hub-title">{user?.coins ?? 0} wallet balance</h3>
            <p className="episode-card-copy">Balance, redeem codes, and wallet history live here.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.subscription()}>
            <p className="screen-eyebrow">Subscription</p>
            <h3 className="user-hub-title">{user?.vipStatus === 'active' ? 'VIP active' : 'VIP plans'}</h3>
            <p className="episode-card-copy">Check your VIP status and available plans.</p>
          </Link>
          <Link className="user-hub-card" to={routeBuilders.settings()}>
            <p className="screen-eyebrow">Settings</p>
            <h3 className="user-hub-title">Profile and playback prefs</h3>
            <p className="episode-card-copy">Manage nickname, notifications, playback, and security.</p>
          </Link>
        </div>
      </section>

      <section className="app-section-card">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Library</p>
            <h3 className="section-title">Saved and recent</h3>
          </div>
          <Link className="app-inline-pill" to={routeBuilders.favorites()}>
            View all
          </Link>
        </div>
        {latestHistory ? (
          <Link className="history-card history-card-featured" to={routeBuilders.playEpisode(latestHistory.dramaId, latestHistory.episodeId)}>
            <div className="history-card-main">
              <div className="history-title">{latestHistory.dramaTitle}</div>
              <div className="history-copy">
                {latestHistory.episodeTitle || 'Continue watching'}
                {typeof latestHistory.progress === 'number' ? ` · ${Math.round(latestHistory.progress)}%` : ''}
              </div>
            </div>
            <span className="app-inline-pill">Resume</span>
          </Link>
        ) : null}
        <DramaList dramas={favoritePreview} emptyLabel="No saved titles yet." variant="reel" />
      </section>
    </section>
  );
}
