import type { AuthApiContract, AuthSuccessPayload } from '@auth';
import { createAuthBindings } from '@auth';
import { createApiClient, createAuthApi } from '@api';
import type { User } from '@domain';
import { nativeShellFetch } from '../lib/native-fetch';
import { nativeSessionStore } from '../lib/native-session-store';
import { getNativeShellApiBaseUrl } from '../lib/runtime-config';

function normalizeAuthUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const typed = raw as Record<string, unknown>;
  return {
    ...(typed as unknown as User),
    _id: String(typed._id || typed.id || ''),
  };
}

const authApiClient = createApiClient(
  () => ({
    baseUrl: getNativeShellApiBaseUrl(),
    locale: 'en',
    platform: 'native-shell',
  }),
  nativeShellFetch
);

const authEndpoints = createAuthApi(authApiClient);

const nativeAuthApi: AuthApiContract<User> = {
  async login(email, password, turnstileToken) {
    return (await authEndpoints.login(email, password, turnstileToken)) as AuthSuccessPayload<User>;
  },
  async register(email, password, nickname, referredBy) {
    return (await authEndpoints.register(email, password, nickname, referredBy)) as AuthSuccessPayload<User>;
  },
  async googleLogin(credential) {
    return (await authEndpoints.googleLogin(credential)) as AuthSuccessPayload<User>;
  },
  async facebookLogin(accessToken) {
    return (await authEndpoints.facebookLogin(accessToken)) as AuthSuccessPayload<User>;
  },
  async getMe(token) {
    const response = (await authEndpoints.getMe(token)) as {
      success: boolean;
      data?: unknown;
      error?: { message?: string };
    };

    return {
      ...response,
      data: normalizeAuthUser(response.data) ?? undefined,
    };
  },
};

const authBindings = createAuthBindings<User>({
  authApi: nativeAuthApi,
  sessionStore: nativeSessionStore,
});

export const NativeAuthProvider = authBindings.AuthProvider;
export const useNativeAuth = authBindings.useAuth;
