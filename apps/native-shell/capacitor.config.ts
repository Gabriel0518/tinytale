import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL?.trim();
const isAndroidSync = process.argv.some((arg) => arg.toLowerCase() === 'android');

function normalizeServerUrl(value: string): string {
  try {
    const url = new URL(value);
    if (isAndroidSync && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
      url.hostname = '10.0.2.2';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return value;
  }
}

const resolvedServerUrl = serverUrl ? normalizeServerUrl(serverUrl) : undefined;

const config: CapacitorConfig = {
  appId: 'top.tinytale.shell',
  appName: 'TinyTale Shell',
  webDir: 'dist',
  ...(resolvedServerUrl
    ? {
        server: {
          url: resolvedServerUrl,
          cleartext: resolvedServerUrl.startsWith('http://'),
          allowNavigation: ['*'],
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#141414',
      showSpinner: false,
    },
  },
};

export default config;
