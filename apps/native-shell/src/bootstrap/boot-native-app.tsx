import { useEffect } from 'react';
import { App } from '../app/App';
import { applyInitialDeepLink } from '../router/deep-links';

export function BootNativeApp() {
  useEffect(() => {
    applyInitialDeepLink();
  }, []);

  return <App />;
}
