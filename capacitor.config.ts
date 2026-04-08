import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const PROD_WEB_URL = 'https://tinytale.top';

const config: CapacitorConfig = {
  appId: 'top.tinytale.app',
  appName: 'TinyTale',
  webDir: '.next',
  server: {
    url: PROD_WEB_URL,
    cleartext: false,
    allowNavigation: ['*'],
  },
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
