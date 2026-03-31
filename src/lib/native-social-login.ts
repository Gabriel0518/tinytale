'use client';

import { isNativeApp } from '@/lib/capacitor-bridge';

const FALLBACK_GOOGLE_CLIENT_ID =
  '941933807449-n4e458mjvuuv7o871mr20qchj6gcdap2.apps.googleusercontent.com';
const FALLBACK_FACEBOOK_APP_ID = '1826379214690255';

const FACEBOOK_PERMISSIONS = ['email', 'public_profile'];

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || FALLBACK_GOOGLE_CLIENT_ID;
const facebookAppId =
  process.env.NEXT_PUBLIC_FB_APP_ID?.trim() || FALLBACK_FACEBOOK_APP_ID;
const facebookClientToken = process.env.NEXT_PUBLIC_FB_CLIENT_TOKEN?.trim() || '';

let initializePromise: Promise<void> | null = null;

async function loadSocialLoginPlugin() {
  const mod = await import('@capgo/capacitor-social-login');
  return { SocialLogin: mod.SocialLogin };
}

export function isNativeGoogleLoginAvailable() {
  return Boolean(googleClientId);
}

export function isNativeFacebookLoginAvailable() {
  return Boolean(facebookAppId && facebookClientToken);
}

export async function initializeNativeSocialLogin() {
  if (!isNativeApp()) return;
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    const { SocialLogin } = await loadSocialLoginPlugin();
    const options: Record<string, unknown> = {
      google: {
        webClientId: googleClientId,
        mode: 'online',
      },
    };

    if (isNativeFacebookLoginAvailable()) {
      options.facebook = {
        appId: facebookAppId,
        clientToken: facebookClientToken,
      };
    }

    await SocialLogin.initialize(options);
  })();

  try {
    await initializePromise;
  } catch (error) {
    initializePromise = null;
    throw error;
  }
}

export async function loginWithNativeGoogle() {
  if (!isNativeGoogleLoginAvailable()) {
    throw new Error('Google mobile login is not configured.');
  }

  await initializeNativeSocialLogin();
  const { SocialLogin } = await loadSocialLoginPlugin();
  const response = await SocialLogin.login({
    provider: 'google',
    options: {
      filterByAuthorizedAccounts: false,
      idTokenOnly: true,
    },
  });

  if (response.result.responseType !== 'online') {
    throw new Error('Google mobile login returned offline-only data.');
  }

  return {
    accessToken: response.result.accessToken?.token || '',
    idToken: response.result.idToken || '',
  };
}

export async function loginWithNativeFacebook() {
  if (!isNativeFacebookLoginAvailable()) {
    throw new Error('Facebook mobile login is not configured. Missing Facebook client token.');
  }

  await initializeNativeSocialLogin();
  const { SocialLogin } = await loadSocialLoginPlugin();
  const response = await SocialLogin.login({
    provider: 'facebook',
    options: {
      permissions: FACEBOOK_PERMISSIONS,
    },
  });

  const accessToken = response.result.accessToken?.token || '';
  if (!accessToken) {
    throw new Error('Facebook mobile login did not return an access token.');
  }

  return {
    accessToken,
    idToken: response.result.idToken || '',
  };
}
