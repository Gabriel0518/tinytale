import { useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../hooks/useCachedQuery';
import { useShellApi } from '../hooks/useShellApi';
import { localPushInboxRepository } from '../lib/cache';
import { unwrapApiData } from '../lib/api-response';
import { addDebugPushListener } from '../lib/debug-push';
import { useNativeAuth } from '../providers/AuthProvider';
import {
  clearPendingRoute,
  consumePendingRoute,
  handleIncomingRouteTarget,
  resolveNotificationTarget,
} from '../router/deep-links';

const APP_REFRESH_STALE_MS = 60 * 1000;

function readStoredPushToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('tinytale:native-shell:push-token') || '';
}

function writeStoredPushToken(token: string) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem('tinytale:native-shell:push-token', token);
  } else {
    window.localStorage.removeItem('tinytale:native-shell:push-token');
  }
}

function normalizePushInboxItem(payload: unknown) {
  const notification =
    payload && typeof payload === 'object' && 'notification' in payload
      ? (payload as { notification?: Record<string, unknown> }).notification
      : payload;
  const notificationRecord = notification && typeof notification === 'object' ? (notification as Record<string, unknown>) : {};
  const data =
    notificationRecord.data && typeof notificationRecord.data === 'object'
      ? (notificationRecord.data as Record<string, unknown>)
      : {};

  return {
    id: String(notificationRecord.id || data.id || `${Date.now()}`),
    title: String(notificationRecord.title || data.title || 'Push Notification'),
    message: String(notificationRecord.body || data.body || data.message || 'Notification received.'),
    read: false,
    createdAt: new Date().toISOString(),
    path: resolveNotificationTarget(payload),
    type: typeof data.type === 'string' ? data.type : undefined,
  };
}

function updatePushSettingsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Record<string, unknown>
) {
  queryClient.setQueryData(['user', userId, 'settings'], (current: unknown) => {
    if (!current || typeof current !== 'object') {
      return current;
    }

    const envelope =
      'data' in (current as Record<string, unknown>)
        ? (current as Record<string, unknown>)
        : null;
    const baseSettings = (
      envelope && envelope.data && typeof envelope.data === 'object'
        ? envelope.data
        : current
    ) as Record<string, unknown>;
    const notifications =
      baseSettings.notifications && typeof baseSettings.notifications === 'object'
        ? (baseSettings.notifications as Record<string, unknown>)
        : {};
    const push =
      notifications.push && typeof notifications.push === 'object'
        ? (notifications.push as Record<string, unknown>)
        : {};
    const nextSettings = {
      ...baseSettings,
      notifications: {
        ...notifications,
        push: {
          ...push,
          ...patch,
        },
      },
    };

    if (!envelope) {
      return nextSettings;
    }

    return {
      ...envelope,
      data: nextSettings,
    };
  });
}

export function AppRuntimeCoordinator() {
  const api = useShellApi();
  const queryClient = useQueryClient();
  const { token, user, refreshUser } = useNativeAuth();
  const lastForegroundAtRef = useRef(Date.now());
  const syncedPushTokenRef = useRef('');
  const isNativePlatform = useMemo(() => Capacitor.isNativePlatform(), []);
  const userId = user?._id || 'guest';

  const settingsQuery = useCachedQuery({
    cacheKey: `user:${userId}:settings`,
    cacheMaxAgeMs: 2 * 60 * 1000,
    queryKey: ['user', userId, 'settings'],
    queryFn: () => api.settings.getSettings(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const pushEnabled = useMemo(() => {
    const settings = unwrapApiData<Record<string, unknown>>(settingsQuery.data as Record<string, unknown> | { success: boolean; data?: Record<string, unknown> } | undefined);
    const notifications =
      settings?.notifications && typeof settings.notifications === 'object'
        ? (settings.notifications as Record<string, unknown>)
        : {};
    const push =
      notifications.push && typeof notifications.push === 'object'
        ? (notifications.push as Record<string, unknown>)
        : {};
    return Boolean(push.enabled ?? true);
  }, [settingsQuery.data]);

  function handleNotificationAction(notification: unknown) {
    const inboxItem = normalizePushInboxItem(notification);
    localPushInboxRepository.prepend(inboxItem);
    void handleIncomingRouteTarget(inboxItem.path || '/user/notifications');
    void clearPendingRoute();
    void queryClient.invalidateQueries({ queryKey: ['user', userId, 'notifications'] });
  }

  useEffect(() => {
    void consumePendingRoute().then((target) => {
      if (!target) return;
      if (target.kind === 'native') {
        void handleIncomingRouteTarget(target.path, 500);
        return;
      }
      void handleIncomingRouteTarget(target.url, 500);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let removeOpenListener = () => undefined;
    let removeAppStateListener = () => undefined;

    if (!isNativePlatform) {
      return () => {
        cancelled = true;
      };
    }

    void import('@capacitor/app').then(async ({ App }) => {
      if (cancelled) return;

      const launchUrl = await App.getLaunchUrl();
      if (!cancelled && launchUrl?.url) {
        await handleIncomingRouteTarget(launchUrl.url);
        await clearPendingRoute();
      }

      const openListener = await App.addListener('appUrlOpen', (event: { url?: string }) => {
        if (!event?.url) return;
        void handleIncomingRouteTarget(event.url);
        void clearPendingRoute();
      });
      removeOpenListener = () => {
        void openListener.remove();
      };

      const stateListener = await App.addListener('appStateChange', (event: { isActive: boolean }) => {
        if (!event.isActive) return;

        const now = Date.now();
        if (now - lastForegroundAtRef.current >= APP_REFRESH_STALE_MS) {
          lastForegroundAtRef.current = now;
          void queryClient.invalidateQueries();
          if (token) {
            void refreshUser();
          }
        }
      });
      removeAppStateListener = () => {
        void stateListener.remove();
      };
    });

    return () => {
      cancelled = true;
      removeOpenListener();
      removeAppStateListener();
    };
  }, [isNativePlatform, queryClient, refreshUser, token]);

  useEffect(() => {
    if (!isNativePlatform) {
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    void addDebugPushListener((payload) => {
      if (cancelled) {
        return;
      }

      handleNotificationAction(payload);
    }).then((cleanup) => {
      if (cancelled) {
        cleanup();
        return;
      }

      unsubscribe = cleanup;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isNativePlatform, queryClient, userId]);

  useEffect(() => {
    if (!isNativePlatform || !token || !pushEnabled) return undefined;

    let cancelled = false;
    let unregister = () => undefined;

    const syncPushToken = async (deviceToken: string) => {
      if (!token || !deviceToken || syncedPushTokenRef.current === deviceToken) return;

      syncedPushTokenRef.current = deviceToken;
      writeStoredPushToken(deviceToken);
      const lastRegisteredAt = new Date().toISOString();

      await api.settings.registerPushDevice(token, {
        deviceToken,
        platform: 'android',
        lastRegisteredAt,
      });
      updatePushSettingsCache(queryClient, userId, {
        deviceToken,
        platform: 'android',
        lastRegisteredAt,
      });
      await queryClient.invalidateQueries({ queryKey: ['user', userId, 'settings'] });
    };

    void import('@capacitor/push-notifications').then(async ({ PushNotifications }) => {
      if (cancelled) return;

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      const listeners = [
        await PushNotifications.addListener('registration', (pushToken: { value: string }) => {
          void syncPushToken(pushToken.value);
        }),
        await PushNotifications.addListener('pushNotificationReceived', (notification: unknown) => {
          localPushInboxRepository.prepend(normalizePushInboxItem(notification));
          void queryClient.invalidateQueries({ queryKey: ['user', userId, 'notifications'] });
        }),
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification: unknown) => {
          handleNotificationAction(notification);
        }),
      ];

      unregister = () => {
        listeners.forEach((listener) => {
          void listener.remove();
        });
      };

      await PushNotifications.register();

      const existingPushToken = readStoredPushToken();
      if (existingPushToken) {
        await syncPushToken(existingPushToken);
      }
    });

    return () => {
      cancelled = true;
      unregister();
    };
  }, [api.settings, isNativePlatform, pushEnabled, queryClient, token, userId]);

  useEffect(() => {
    if (!token || pushEnabled) return;

    const existingPushToken = readStoredPushToken();
    if (!existingPushToken) return;

    syncedPushTokenRef.current = '';
    void api.settings
      .unregisterPushDevice(token, {
        deviceToken: existingPushToken,
      })
      .finally(() => {
        writeStoredPushToken('');
        updatePushSettingsCache(queryClient, userId, {
          deviceToken: '',
          platform: 'unknown',
          lastRegisteredAt: '',
        });
        void queryClient.invalidateQueries({ queryKey: ['user', userId, 'settings'] });
      });
  }, [api.settings, pushEnabled, queryClient, token, userId]);

  useEffect(() => {
    const handleOnline = () => {
      void queryClient.invalidateQueries();
      if (token) {
        void refreshUser();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient, refreshUser, token]);

  return null;
}
