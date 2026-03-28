import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const serverUrl = process.env.CAP_SERVER_URL || 'http://10.0.2.2:7001';

const config: CapacitorConfig = {
  appId: 'top.tinytale.app',
  appName: 'TinyTale',
  webDir: '.next',
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#141414',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#141414',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
