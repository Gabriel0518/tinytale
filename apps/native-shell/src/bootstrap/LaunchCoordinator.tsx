import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { bootstrapRuntime } from './bootstrap-runtime';
import { bootstrapSession } from './bootstrap-session';

type LaunchState = 'booting' | 'ready';

const MIN_BRAND_DURATION_MS = 3000;

export function LaunchCoordinator({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LaunchState>('booting');
  const nativeSplashDismissedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const startedAt = performance.now();

    async function bootstrap() {
      const [session, runtime] = await Promise.all([bootstrapSession(), bootstrapRuntime()]);
      const elapsed = performance.now() - startedAt;
      const waitMs = Math.max(0, MIN_BRAND_DURATION_MS - elapsed);

      window.setTimeout(() => {
        if (!mounted) return;
        setState('ready');
      }, waitMs);
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || nativeSplashDismissedRef.current) {
      return undefined;
    }

    let cancelled = false;

    const hideNativeSplashAfterFirstPaint = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (cancelled || nativeSplashDismissedRef.current) return;

      nativeSplashDismissedRef.current = true;

      try {
        await SplashScreen.hide({ fadeOutDuration: 180 });
      } catch {
        // Ignore hide failures and let the native shell continue booting.
      }
    };

    void hideNativeSplashAfterFirstPaint();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const staticLaunchScreen = document.getElementById('native-launch-screen');
    if (!staticLaunchScreen) return undefined;

    if (state !== 'ready') {
      staticLaunchScreen.classList.remove('native-launch-screen-hidden');
      return undefined;
    }

    staticLaunchScreen.classList.add('native-launch-screen-hidden');
    const removeTimeout = window.setTimeout(() => {
      staticLaunchScreen.remove();
    }, 260);

    return () => {
      window.clearTimeout(removeTimeout);
    };
  }, [state]);

  return (
    <>
      <div className={`launch-overlay ${state === 'ready' ? 'launch-overlay-hidden' : ''}`} aria-hidden={state === 'ready'}>
        <div className="launch-panel">
          <div className="launch-logo-wrap">
            <img className="launch-logo" src="/ui/logo-mobile.png" alt="TinyTale" />
          </div>
          <p className="launch-kicker">Premium Vertical Stories</p>
          <h1 className="launch-headline">Your next episode is almost ready.</h1>
          <p className="launch-detail">Warming up recommendations, artwork, and playback so the home feed lands fully dressed.</p>
          <div className="launch-highlight">
            <span className="launch-dot" />
            <span>Brand launch hold: 3 seconds</span>
          </div>
          <div className="launch-progress">
            <span className="launch-progress-bar" />
          </div>
          <div className="launch-footnote">
            <span>TinyTale Original</span>
            <span>North America launch shell</span>
          </div>
        </div>
      </div>
      <div className={`launch-content ${state === 'ready' ? 'launch-content-ready' : ''}`}>{children}</div>
    </>
  );
}
