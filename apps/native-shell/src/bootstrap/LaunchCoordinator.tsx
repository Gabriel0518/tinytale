import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { bootstrapRuntime } from './bootstrap-runtime';
import { bootstrapSession } from './bootstrap-session';

type LaunchState = 'booting' | 'ready';

const MIN_BRAND_DURATION_MS = 680;

export function LaunchCoordinator({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LaunchState>('booting');
  const [snapshot, setSnapshot] = useState<{
    token: string | null;
    hasUser: boolean;
    hasRuntime: boolean;
  }>({
    token: null,
    hasUser: false,
    hasRuntime: false,
  });

  useEffect(() => {
    let mounted = true;

    const startedAt = performance.now();

    async function bootstrap() {
      const [session, runtime] = await Promise.all([bootstrapSession(), bootstrapRuntime()]);
      const elapsed = performance.now() - startedAt;
      const waitMs = Math.max(0, MIN_BRAND_DURATION_MS - elapsed);

      window.setTimeout(() => {
        if (!mounted) return;
        setSnapshot({
          token: session.token,
          hasUser: Boolean(session.user),
          hasRuntime: Boolean(runtime.runtimeSettings),
        });
        setState('ready');
      }, waitMs);
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const launchCopy = useMemo(
    () => ({
      headline: state === 'booting' ? 'Preparing your local shell' : 'Shell ready',
      detail:
        state === 'booting'
          ? 'Restoring session, runtime settings, and first-route shell.'
          : snapshot.hasUser
            ? 'Session restored. Remote hydration can continue in the background.'
            : 'Guest shell restored. Remote hydration can continue in the background.',
    }),
    [snapshot.hasUser, state]
  );

  return (
    <>
      <div className={`launch-overlay ${state === 'ready' ? 'launch-overlay-hidden' : ''}`} aria-hidden={state === 'ready'}>
        <div className="launch-panel">
          <div className="launch-badge">T</div>
          <p className="launch-kicker">ANDROID-FIRST NATIVE STARTUP</p>
          <h1 className="launch-headline">{launchCopy.headline}</h1>
          <p className="launch-detail">{launchCopy.detail}</p>
          <div className="launch-progress">
            <span className="launch-progress-bar" />
          </div>
          <div className="launch-footnote">
            <span>{snapshot.token ? 'session-found' : 'guest-mode'}</span>
            <span>{snapshot.hasRuntime ? 'runtime-restored' : 'runtime-defaults'}</span>
          </div>
        </div>
      </div>
      <div className={`launch-content ${state === 'ready' ? 'launch-content-ready' : ''}`}>{children}</div>
    </>
  );
}
