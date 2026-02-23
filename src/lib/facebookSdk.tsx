'use client';

import { useEffect, useCallback } from 'react';

const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || '1826379214690255';

declare global {
  interface Window {
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: FBLoginResponse) => void, params?: { scope: string }) => void;
      getLoginStatus: (callback: (response: FBLoginResponse) => void) => void;
    };
    fbAsyncInit: () => void;
  }
}

interface FBLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
  };
}

let fbSdkLoaded = false;
let fbSdkReady = false;
const readyCallbacks: (() => void)[] = [];

function loadFacebookSdk() {
  if (fbSdkLoaded) return;
  fbSdkLoaded = true;

  window.fbAsyncInit = function () {
    window.FB.init({
      appId: FB_APP_ID,
      cookie: true,
      xfbml: true,
      version: 'v21.0',
    });
    fbSdkReady = true;
    readyCallbacks.forEach(cb => cb());
    readyCallbacks.length = 0;
  };

  const script = document.createElement('script');
  script.id = 'facebook-jssdk';
  script.src = 'https://connect.facebook.net/en_US/sdk.js';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}

function onFbReady(callback: () => void) {
  if (fbSdkReady) {
    callback();
  } else {
    readyCallbacks.push(callback);
  }
}

export function useFacebookLogin(onSuccess: (accessToken: string) => void, onError?: (error: string) => void) {
  useEffect(() => {
    if (FB_APP_ID) {
      loadFacebookSdk();
    }
  }, []);

  const login = useCallback(() => {
    if (!FB_APP_ID) {
      onError?.('Facebook App ID is not configured');
      return;
    }

    onFbReady(() => {
      window.FB.login(
        (response: FBLoginResponse) => {
          if (response.status === 'connected' && response.authResponse) {
            onSuccess(response.authResponse.accessToken);
          } else {
            onError?.('Facebook login was cancelled or failed.');
          }
        },
        { scope: 'public_profile,email' }
      );
    });
  }, [onSuccess, onError]);

  return login;
}
