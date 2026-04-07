'use client';

import type { AuthApiContract, AuthSuccessPayload } from '@auth';
import { createAuthBindings } from '@auth';
import type { User } from '@domain';
import { createBrowserSessionStore } from '@storage';
import { authApi } from './api';

const SESSION_COOKIE_NAME = 'tt_session';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function normalizeAuthUser(raw: any): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const normalized = {
    ...raw,
    _id: String(raw._id || raw.id || ''),
  };
  return normalized as User;
}

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  const isHttps = window.location.protocol === 'https:';
  const hostname = window.location.hostname.toLowerCase();
  const domain =
    hostname === 'tinytale.top' || hostname === 'www.tinytale.top' || hostname.endsWith('.tinytale.top')
      ? ' Domain=.tinytale.top;'
      : '';
  const secure = isHttps ? ' Secure;' : '';
  document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax;${secure}${domain}`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  const isHttps = window.location.protocol === 'https:';
  const hostname = window.location.hostname.toLowerCase();
  const domain =
    hostname === 'tinytale.top' || hostname === 'www.tinytale.top' || hostname.endsWith('.tinytale.top')
      ? ' Domain=.tinytale.top;'
      : '';
  const secure = isHttps ? ' Secure;' : '';
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax;${secure}${domain}`;
}

const sessionStore = createBrowserSessionStore<User>({
  normalizeUser: normalizeAuthUser,
});

const webAuthApi: AuthApiContract<User> = {
  async login(email, password, turnstileToken) {
    return (await authApi.login(email, password, turnstileToken)) as AuthSuccessPayload<User>;
  },
  async register(email, password, nickname, referredBy) {
    return (await authApi.register(email, password, nickname, referredBy)) as AuthSuccessPayload<User>;
  },
  async googleLogin(credential) {
    return (await authApi.googleLogin(credential)) as AuthSuccessPayload<User>;
  },
  async facebookLogin(accessToken) {
    return (await authApi.facebookLogin(accessToken)) as AuthSuccessPayload<User>;
  },
  async getMe(token) {
    const response = (await authApi.getMe(token)) as { success: boolean; data?: unknown; error?: { message?: string } };
    return {
      ...response,
      data: normalizeAuthUser(response.data) ?? undefined,
    };
  },
};

const authBindings = createAuthBindings<User>({
  authApi: webAuthApi,
  sessionStore,
  sessionActivity: {
    markActive: setSessionCookie,
    clear: clearSessionCookie,
  },
});

export const AuthProvider = authBindings.AuthProvider;
export const useAuth = authBindings.useAuth;
