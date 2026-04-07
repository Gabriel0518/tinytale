import { useMemo } from 'react';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { localPushInboxRepository } from '../../lib/cache';
import { normalizeNotificationItem, type NativeNotificationItem } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeToTarget } from '../../router/deep-links';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function NotificationsScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const notificationsQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:notifications`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'notifications'],
    queryFn: () => api.user.getNotifications(token || ''),
    enabled: Boolean(token && user?._id),
  });

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
  const localInboxNotifications: NativeNotificationItem[] = localPushInboxRepository.list().map((item) => ({
    ...item,
  }));
  const remoteNotificationIds = useMemo(() => new Set(notifications.map((item) => item.id)), [notifications]);
  const mergedNotifications = [...localInboxNotifications, ...notifications]
    .reduce<NativeNotificationItem[]>((accumulator, item) => {
      if (accumulator.some((existing) => existing.id === item.id)) {
        return accumulator;
      }
      accumulator.push(item);
      return accumulator;
    }, [])
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  async function handleMarkAllRead() {
    if (!token) return;
    localPushInboxRepository.markAllRead();
    if (remoteNotificationIds.size > 0) {
      await api.user.markAllNotificationsRead(token);
    }
    await notificationsQuery.refetch();
  }

  async function handleMarkRead(notificationId: string) {
    if (!token) return;
    localPushInboxRepository.markRead(notificationId);
    if (remoteNotificationIds.has(notificationId)) {
      await api.user.markNotificationRead(token, notificationId);
    }
    await notificationsQuery.refetch();
  }

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Notifications</p>
        <h2 className="app-hero-title">Your updates</h2>
        <p className="app-hero-subtitle">The inbox merges local push entries with server notifications in one timeline.</p>
        <div className="app-hero-actions">
          <button className="app-secondary-button shell-button-reset" onClick={() => void handleMarkAllRead()} type="button">
            Mark All Read
          </button>
        </div>
      </article>

      <QueryState
        isLoading={notificationsQuery.isLoading}
        isFetching={notificationsQuery.isFetching}
        error={notificationsQuery.error}
        empty={!mergedNotifications.length}
        offline={isOffline}
        hasCachedData={Boolean(notificationsQuery.data || localInboxNotifications.length)}
        emptyLabel="No notifications yet."
        onRetry={() => {
          void notificationsQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Loading notifications" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Inbox</p>
              <h3 className="section-title">All notifications</h3>
            </div>
            <span className="section-meta">{mergedNotifications.length} items</span>
          </div>
          <div className="notification-list">
          {mergedNotifications.map((notification) => (
            <article key={notification.id} className={`notification-card ${notification.read ? 'notification-card-read' : ''}`}>
              <div className="episode-card-topline">
                <div>
                  <div className="episode-card-title">{notification.title}</div>
                  <div className="notification-meta">{new Date(notification.createdAt).toLocaleString()}</div>
                </div>
                {!notification.read ? (
                  <div className="screen-actions">
                    {notification.path ? (
                      <button
                        className="screen-action screen-action-secondary shell-button-reset auth-inline-button"
                        onClick={() => void routeToTarget(notification.path || '/user/notifications')}
                        type="button"
                      >
                        Open
                      </button>
                    ) : null}
                    <button
                      className="screen-action screen-action-secondary shell-button-reset auth-inline-button"
                      onClick={() => void handleMarkRead(notification.id)}
                      type="button"
                    >
                      Mark Read
                    </button>
                  </div>
                ) : (
                  <span className="episode-access-pill">Read</span>
                )}
              </div>
              <p className="episode-card-copy">{notification.message}</p>
            </article>
          ))}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
