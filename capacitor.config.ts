import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const serverUrl = process.env.CAP_SERVER_URL?.trim();
const isAndroidSync = process.argv.some((arg) => arg.toLowerCase() === 'android');

function normalizeServerUrl(value: string): string {
  try {
    const url = new URL(value);

    // Android emulator cannot reach the host machine via 127.0.0.1/localhost.
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
  appId: 'top.tinytale.app',
  appName: 'TinyTale',
  webDir: '.next',
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
    StatusBar: {
      style: 'dark',
      backgroundColor: '#141414',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: true,
      },
      logLevel: 1,
    },
  },
};

export default config;
