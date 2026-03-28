'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useLocale } from '@/hooks/useLocale';
import { usePlatform } from '@/hooks/usePlatform';
import { useAuth } from '@/lib/authContext';
import { settingsApi } from '@/lib/api';
import {
  getNativePlatform,
  observeAppState,
  observeAppUrlOpen,
  observeBackButton,
  observeKeyboardState,
  observeNetworkStatus,
  registerPushNotifications,
  syncNativeStatusBar,
  triggerHaptic,
} from '@/lib/capacitor-bridge';
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { localizePath, SupportedLocale } from '@/lib/i18n';
import {
  mergeRuntimeSettings,
  readRuntimeSettings,
  RUNTIME_SETTINGS_EVENT,
  RuntimeSettingsSnapshot,
} from '@/lib/runtime-settings';
import { upsertInAppNotification } from '@/lib/in-app-notifications';

const RUNTIME_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { offline: 'You are offline. Some features may be unavailable.', online: 'Back online.' },
  zh: { offline: '当前处于离线状态，部分功能可能不可用。', online: '网络已恢复。' },
  ja: { offline: 'オフラインです。一部機能が利用できません。', online: 'オンラインに戻りました。' },
  es: { offline: 'Estás sin conexión. Algunas funciones pueden no estar disponibles.', online: 'Conexión restaurada.' },
  pt: { offline: 'Você está offline. Alguns recursos podem não estar disponíveis.', online: 'Conexão restaurada.' },
  hi: { offline: 'आप ऑफलाइन हैं। कुछ सुविधाएं उपलब्ध नहीं हो सकतीं।', online: 'नेटवर्क वापस आ गया।' },
  id: { offline: 'Kamu sedang offline. Beberapa fitur mungkin tidak tersedia.', online: 'Koneksi kembali normal.' },
};

function routeToNativePath(path: string, locale: SupportedLocale) {
  if (typeof window === 'undefined' || !path.startsWith('/')) return;

  const target = localizePath(path, locale);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === target) return;

  window.location.assign(target);
}

function resolveNotificationTarget(payload: any) {
  const notification = payload?.notification || payload;
  const data = notification?.data || {};
  const directPath =
    typeof data?.path === 'string'
      ? data.path
      : typeof data?.href === 'string'
        ? data.href
        : typeof data?.targetPath === 'string'
          ? data.targetPath
          : undefined;

  if (typeof directPath === 'string' && directPath.startsWith('/')) {
    return directPath;
  }

  const dramaId =
    typeof data?.dramaId === 'string'
      ? data.dramaId
      : typeof data?.drama?._id === 'string'
        ? data.drama._id
        : undefined;
  const episodeId = typeof data?.episodeId === 'string' ? data.episodeId : undefined;

  if (dramaId && episodeId) {
    return `/drama/${dramaId}/play/${episodeId}`;
  }

  if (dramaId) {
    return `/drama/${dramaId}`;
  }

  return '/user/notifications';
}

export function AppRuntime() {
  const pathname = usePathname();
  const locale = useLocale();
  const text = resolveLocaleCopy(RUNTIME_TEXT, locale);
  const { toast } = useToast();
  const { token } = useAuth();
  const { isApp, isMobile } = usePlatform();
  const hasShownOfflineRef = useRef(false);
  const syncedPushTokenRef = useRef<string>('');
  const runtimeSettingsRef = useRef<RuntimeSettingsSnapshot | null>(null);
  const [runtimeSettings, setRuntimeSettings] = useState<RuntimeSettingsSnapshot | null>(null);

  useEffect(() => {
    runtimeSettingsRef.current = runtimeSettings;
  }, [runtimeSettings]);

  useEffect(() => {
    setRuntimeSettings(readRuntimeSettings());

    if (typeof window === 'undefined') return undefined;

    const handleRuntimeSettings = (event: Event) => {
      const customEvent = event as CustomEvent<RuntimeSettingsSnapshot>;
      setRuntimeSettings(customEvent.detail || readRuntimeSettings());
    };

    window.addEventListener(RUNTIME_SETTINGS_EVENT, handleRuntimeSettings);
    return () => {
      window.removeEventListener(RUNTIME_SETTINGS_EVENT, handleRuntimeSettings);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep registration failure silent for the web app shell.
    });
  }, []);

  useEffect(() => {
    if (!isApp) return;
    void syncNativeStatusBar(pathname || '/');
  }, [isApp, pathname]);

  useEffect(() => {
    if (!isApp) return;

    return observeAppUrlOpen((path) => {
      routeToNativePath(path, locale);
    });
  }, [isApp, locale]);

  useEffect(() => {
    if (!isApp) return;

    return observeAppState((isActive) => {
      document.body.classList.toggle('app-inactive', !isActive);
      window.dispatchEvent(new CustomEvent('tinytale:app-state', { detail: { isActive } }));
    });
  }, [isApp]);

  useEffect(() => {
    if (!isMobile) return;

    return observeNetworkStatus((status) => {
      if (!status.connected) {
        if (!hasShownOfflineRef.current) {
          toast(text.offline, 'error');
          hasShownOfflineRef.current = true;
        }
        return;
      }

      if (hasShownOfflineRef.current) {
        toast(text.online, 'success');
        hasShownOfflineRef.current = false;
      }
    });
  }, [isMobile, text.offline, text.online, toast]);

  useEffect(() => {
    if (!isMobile) return;

    return observeKeyboardState((visible) => {
      document.body.classList.toggle('keyboard-open', visible);
    });
  }, [isMobile]);

  useEffect(() => {
    if (!isApp) return;
    if (!pathname?.includes('/play/') && !pathname?.startsWith(`/${locale}/auth`) && !pathname?.startsWith('/auth')) {
      return;
    }

    return observeBackButton((canGoBack) => {
      void triggerHaptic('light');

      if (canGoBack && typeof window !== 'undefined') {
        window.history.back();
        return;
      }

      if (typeof window !== 'undefined') {
        window.location.assign(localizePath('/', locale));
      }
    });
  }, [isApp, locale, pathname]);

  useEffect(() => {
    if (!isApp) return;
    if (runtimeSettings?.notifications?.push.enabled === false) return;

    let remove: () => void = () => undefined;
    let cancelled = false;
    const syncPushToken = async (pushToken: string) => {
      if (cancelled || !pushToken || !token) return;
      if (runtimeSettingsRef.current?.notifications?.push.enabled === false) return;

      const syncKey = `${token}:${pushToken}`;
      if (syncedPushTokenRef.current === syncKey) return;

      const timestamp = new Date().toISOString();
      const platform = getNativePlatform();
      const currentRuntimeSettings = runtimeSettingsRef.current;

      try {
        await settingsApi.registerPushDevice(token, {
          deviceToken: pushToken,
          platform,
          lastRegisteredAt: timestamp,
        });

        syncedPushTokenRef.current = syncKey;
        mergeRuntimeSettings({
          notifications: {
            push: {
              enabled: true,
              newReleases: currentRuntimeSettings?.notifications?.push.newReleases ?? true,
              recommendations: currentRuntimeSettings?.notifications?.push.recommendations ?? true,
              accountActivity: currentRuntimeSettings?.notifications?.push.accountActivity ?? true,
              deviceToken: pushToken,
              platform,
              lastRegisteredAt: timestamp,
            },
            email: {
              newsletter: currentRuntimeSettings?.notifications?.email.newsletter ?? false,
              promoOffers: currentRuntimeSettings?.notifications?.email.promoOffers ?? true,
              weeklyDigests: currentRuntimeSettings?.notifications?.email.weeklyDigests ?? false,
            },
            inApp: {
              systemMessages: currentRuntimeSettings?.notifications?.inApp.systemMessages ?? true,
            },
          },
        });
      } catch {
        // Keep local token persistence even if the server sync fails temporarily.
      }
    };

    const handlePushToken = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (typeof customEvent.detail === 'string') {
        void syncPushToken(customEvent.detail);
      }
    };

    const handlePushReceived = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const payload = customEvent.detail;
      const notification = payload?.notification || payload;
      const data = notification?.data || {};
      const title = String(notification?.title || data?.title || 'TinyTale');
      const message = String(notification?.body || data?.message || data?.body || '');
      const dramaId = typeof data?.dramaId === 'string'
        ? data.dramaId
        : typeof data?.drama?._id === 'string'
          ? data.drama._id
          : undefined;
      const episodeId = typeof data?.episodeId === 'string' ? data.episodeId : undefined;
      const targetPath = resolveNotificationTarget(payload);

      upsertInAppNotification({
        _id: `local-push:${String(data?.notificationId || data?.id || `${Date.now()}`)}`,
        type: dramaId ? 'release' : 'system',
        title,
        message,
        dramaId,
        episodeId,
        targetPath,
        read: false,
        createdAt: new Date().toISOString(),
        source: 'local-push',
      });

      toast(message ? `${title}: ${message}` : title, 'info');
    };

    if (typeof window !== 'undefined') {
      const existingPushToken = window.localStorage.getItem('tinytale:push-token');
      if (existingPushToken) {
        void syncPushToken(existingPushToken);
      }
      window.addEventListener('tinytale:push-token', handlePushToken);
      window.addEventListener('tinytale:push-notification-received', handlePushReceived);
    }

    void registerPushNotifications((notification) => {
      if (cancelled) return;
      if (typeof window === 'undefined') return;
      routeToNativePath(resolveNotificationTarget(notification), locale);
    }).then((result) => {
      if (cancelled) {
        result.remove();
        return;
      }
      remove = result.remove;
      if (result.token) {
        void syncPushToken(result.token);
      }
    });

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('tinytale:push-token', handlePushToken);
        window.removeEventListener('tinytale:push-notification-received', handlePushReceived);
      }
      remove();
    };
  }, [isApp, locale, runtimeSettings?.notifications?.push.enabled, toast, token]);

  useEffect(() => {
    if (!isApp || !token) return;
    if (runtimeSettings?.notifications?.push.enabled !== false) return;
    if (typeof window === 'undefined') return;

    const existingPushToken = window.localStorage.getItem('tinytale:push-token');
    if (!existingPushToken) return;

    syncedPushTokenRef.current = '';
    void settingsApi.unregisterPushDevice(token, {
      deviceToken: existingPushToken,
    }).catch(() => undefined);
  }, [isApp, runtimeSettings?.notifications?.push.enabled, token]);

  return null;
}
