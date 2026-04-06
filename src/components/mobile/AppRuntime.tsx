'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useLocale } from '@/hooks/useLocale';
import { usePlatform } from '@/hooks/usePlatform';
import { useAuth } from '@/lib/authContext';
import { settingsApi } from '@/lib/api';
import {
  dismissActiveKeyboard,
  getNativePlatform,
  hideNativeSplashScreen,
  KeyboardState,
  observeAppState,
  observeAppUrlOpen,
  observeBackButton,
  observeKeyboardState,
  observeNetworkStatus,
  registerPushNotifications,
  syncNativeStatusBar,
  triggerHaptic,
  exitNativeApp,
} from '@/lib/capacitor-bridge';
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { localizePath, removeLocalePrefix, SupportedLocale } from '@/lib/i18n';
import {
  mergeRuntimeSettings,
  readRuntimeSettings,
  RUNTIME_SETTINGS_EVENT,
  RuntimeSettingsSnapshot,
} from '@/lib/runtime-settings';
import { upsertInAppNotification } from '@/lib/in-app-notifications';

const RUNTIME_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { offline: 'You are offline. Some features may be unavailable.', online: 'Back online.', backAgain: 'Tap back again to exit.' },
  zh: { offline: '当前处于离线状态，部分功能可能不可用。', online: '网络已恢复。', backAgain: '再按一次返回退出应用。' },
  ja: { offline: 'オフラインです。一部機能が利用できません。', online: 'オンラインに戻りました。', backAgain: 'もう一度戻るを押すと終了します。' },
  es: { offline: 'Estás sin conexión. Algunas funciones pueden no estar disponibles.', online: 'Conexión restaurada.', backAgain: 'Pulsa atrás otra vez para salir.' },
  pt: { offline: 'Você está offline. Alguns recursos podem não estar disponíveis.', online: 'Conexão restaurada.', backAgain: 'Toque em voltar novamente para sair.' },
  hi: { offline: 'आप ऑफलाइन हैं। कुछ सुविधाएं उपलब्ध नहीं हो सकतीं।', online: 'नेटवर्क वापस आ गया।', backAgain: 'ऐप से बाहर निकलने के लिए फिर से बैक दबाएं।' },
  id: { offline: 'Kamu sedang offline. Beberapa fitur mungkin tidak tersedia.', online: 'Koneksi kembali normal.', backAgain: 'Tekan kembali sekali lagi untuk keluar.' },
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

function isKeyboardFocusableElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;

  if (target instanceof HTMLInputElement) {
    return target.type !== 'hidden' && !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLSelectElement) {
    return !target.disabled;
  }

  return target.isContentEditable;
}

function resolveKeyboardScrollContainer(target: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = target.parentElement;

  while (current && current !== document.body) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight + 4;

    if (isScrollable) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function scrollKeyboardTargetIntoView(target: HTMLElement) {
  const keyboardState = window.__tinytaleLastKeyboardState__;
  const keyboardHeight = keyboardState?.height ?? 0;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const scrollContainer = resolveKeyboardScrollContainer(target);
  const topInset = 92;
  const bottomInset = keyboardHeight > 0
    ? Math.max(28, Math.min(92, Math.round(keyboardHeight * 0.18)))
    : 32;
  const visibleBottom = viewportHeight - bottomInset;
  const rect = target.getBoundingClientRect();
  const containerRect = scrollContainer?.getBoundingClientRect();
  const visibleTopBoundary = Math.max(topInset, containerRect?.top ?? 0);
  const visibleBottomBoundary = Math.min(visibleBottom, containerRect?.bottom ?? visibleBottom);

  if (rect.top >= visibleTopBoundary && rect.bottom <= visibleBottomBoundary) {
    return;
  }

  const deltaTop = rect.top < visibleTopBoundary ? rect.top - visibleTopBoundary - 16 : 0;
  const deltaBottom = rect.bottom > visibleBottomBoundary ? rect.bottom - visibleBottomBoundary + 16 : 0;
  const delta = deltaTop || deltaBottom;

  if (!delta) return;

  if (scrollContainer) {
    scrollContainer.scrollBy({
      top: delta,
      behavior: 'smooth',
    });
    return;
  }

  window.scrollBy({
    top: delta,
    behavior: 'smooth',
  });
}

function resetKeyboardVisualState() {
  if (typeof window === 'undefined') return;

  document.body.classList.remove('keyboard-open');
  document.documentElement.style.setProperty('--tinytale-keyboard-inset', '0px');
  window.__tinytaleLastKeyboardState__ = {
    visible: false,
    height: 0,
  };
}

export function AppRuntime() {
  const pathname = usePathname();
  const locale = useLocale();
  const text = resolveLocaleCopy(RUNTIME_TEXT, locale);
  const { toast } = useToast();
  const { token, loading: authLoading } = useAuth();
  const { isApp, isMobile } = usePlatform();
  const hasShownOfflineRef = useRef(false);
  const lastBackTapRef = useRef(0);
  const syncedPushTokenRef = useRef<string>('');
  const runtimeSettingsRef = useRef<RuntimeSettingsSnapshot | null>(null);
  const launchStartedAtRef = useRef<number | null>(null);
  const launchReadyRef = useRef(false);
  const launchBrandTimerRef = useRef<number | null>(null);
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
    if (!isApp || typeof window === 'undefined') return;
    if (launchReadyRef.current) return;

    if (launchStartedAtRef.current === null) {
      launchStartedAtRef.current = window.performance.now();
      document.documentElement.classList.remove('native-app-launch-hiding');
      document.documentElement.classList.add('native-app-launching');
      document.body.classList.add('native-app-launching');
      document.documentElement.classList.add('native-app-boot');
      document.body.classList.add('native-app-boot');
      document.documentElement.classList.remove('native-app-brand-visible');
      launchBrandTimerRef.current = window.setTimeout(() => {
        document.documentElement.classList.add('native-app-brand-visible');
        launchBrandTimerRef.current = null;
      }, 260);
    }

    const waitForWindowLoad = async () => {
      if (document.readyState === 'complete') return;
      await new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true });
      });
    };

    const waitForFonts = async () => {
      const fonts = document.fonts;
      if (!fonts?.ready) return;

      await Promise.race([
        fonts.ready.then(() => undefined).catch(() => undefined),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 900);
        }),
      ]);
    };

    const waitForRouteReady = async () => {
      const normalizedPath = removeLocalePrefix(pathname || '/') || '/';
      if (normalizedPath !== '/') return;

      const readyPath = document.documentElement.getAttribute('data-native-route-ready');
      if (readyPath === normalizedPath) return;

      await Promise.race([
        new Promise<void>((resolve) => {
          const handleRouteReady = (event: Event) => {
            const customEvent = event as CustomEvent<{ pathname?: string }>;
            const nextPath = customEvent.detail?.pathname || normalizedPath;
            if (nextPath !== normalizedPath) return;

            window.removeEventListener('tinytale:route-ready', handleRouteReady as EventListener);
            resolve();
          };

          window.addEventListener('tinytale:route-ready', handleRouteReady as EventListener);
        }),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 2200);
        }),
      ]);
    };

    const finishLaunch = async () => {
      if (launchReadyRef.current) return;

      launchReadyRef.current = true;
      await hideNativeSplashScreen();
      document.documentElement.classList.add('native-app-launch-hiding');

      window.setTimeout(() => {
        document.documentElement.classList.remove('native-app-launch-hiding');
        document.documentElement.classList.remove('native-app-brand-visible');
        document.documentElement.classList.remove('native-app-boot');
        document.documentElement.classList.remove('native-app-launching');
        document.body.classList.remove('native-app-boot');
        document.body.classList.remove('native-app-launching');
      }, 260);
    };

    const hardTimeout = window.setTimeout(() => {
      void finishLaunch();
    }, 4500);

    if (authLoading) {
      return () => window.clearTimeout(hardTimeout);
    }

    let cancelled = false;

    void (async () => {
      await waitForWindowLoad();
      await waitForFonts();
      await waitForRouteReady();

      const elapsed = window.performance.now() - (launchStartedAtRef.current ?? window.performance.now());
      const remaining = Math.max(0, 900 - elapsed);

      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      }

      if (cancelled) return;
      await finishLaunch();
    })();

    return () => {
      cancelled = true;
      if (launchBrandTimerRef.current !== null) {
        window.clearTimeout(launchBrandTimerRef.current);
        launchBrandTimerRef.current = null;
      }
      window.clearTimeout(hardTimeout);
    };
  }, [authLoading, isApp, pathname]);

  useEffect(() => {
    if (isApp || typeof document === 'undefined') return;

    document.documentElement.classList.remove('native-app-launch-hiding');
    document.documentElement.classList.remove('native-app-brand-visible');
    document.documentElement.classList.remove('native-app-boot');
    document.documentElement.classList.remove('native-app-launching');
    document.body.classList.remove('native-app-boot');
    document.body.classList.remove('native-app-launching');
  }, [isApp]);

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

    return observeKeyboardState(({ visible, height }) => {
      document.body.classList.toggle('keyboard-open', visible);
      document.documentElement.style.setProperty('--tinytale-keyboard-inset', `${height}px`);
      (window as Window & { __tinytaleLastKeyboardState__?: KeyboardState }).__tinytaleLastKeyboardState__ = {
        visible,
        height,
      };
      window.dispatchEvent(new CustomEvent('tinytale:keyboard-state', { detail: { visible, height } }));

      if (!visible) return;

      const activeElement = document.activeElement;
      if (isKeyboardFocusableElement(activeElement)) {
        window.setTimeout(() => {
          scrollKeyboardTargetIntoView(activeElement);
        }, 90);
      }
    });
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    resetKeyboardVisualState();

    const pendingTimers = new Set<number>();

    const queueScroll = (target: HTMLElement, delays: number[]) => {
      delays.forEach((delay) => {
        const timer = window.setTimeout(() => {
          pendingTimers.delete(timer);
          scrollKeyboardTargetIntoView(target);
        }, delay);
        pendingTimers.add(timer);
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!isKeyboardFocusableElement(event.target)) return;
      queueScroll(event.target, [40, 220]);
    };

    const handleKeyboardState = (event: Event) => {
      const detail = (event as CustomEvent<{ visible?: boolean }>).detail;
      if (!detail?.visible) return;

      const activeElement = document.activeElement;
      if (isKeyboardFocusableElement(activeElement)) {
        queueScroll(activeElement, [80, 260]);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('tinytale:keyboard-state', handleKeyboardState as EventListener);

    return () => {
      pendingTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('tinytale:keyboard-state', handleKeyboardState as EventListener);
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.removeProperty('--tinytale-keyboard-inset');
      window.__tinytaleLastKeyboardState__ = {
        visible: false,
        height: 0,
      };
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    void dismissActiveKeyboard();
    resetKeyboardVisualState();
  }, [isMobile, pathname]);

  useEffect(() => {
    if (!isApp) return;

    const normalizedPath = removeLocalePrefix(pathname || '/') || '/';

    return observeBackButton((canGoBack) => {
      void triggerHaptic('light');

      if (typeof window === 'undefined') return;

      if (normalizedPath === '/') {
        const now = Date.now();
        if (now - lastBackTapRef.current < 1800) {
          void exitNativeApp();
          return;
        }

        lastBackTapRef.current = now;
        toast(text.backAgain, 'info');
        return;
      }

      const shouldGoBack = canGoBack || window.history.length > 1;
      if (shouldGoBack) {
        window.history.back();
        return;
      }

      window.location.assign(localizePath('/', locale));
    });
  }, [isApp, locale, pathname, text.backAgain, toast]);

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
