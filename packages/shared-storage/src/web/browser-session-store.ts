import type { SessionStore } from '../contracts/session-store';
import { createBrowserKeyValueStore, readJsonValue, writeJsonValue } from './browser-kv-store';

type BrowserSessionStoreOptions<TUser> = {
  tokenKey?: string;
  userKey?: string;
  normalizeUser: (value: unknown) => TUser | null;
};

export function createBrowserSessionStore<TUser>({
  tokenKey = 'token',
  userKey = 'user',
  normalizeUser,
}: BrowserSessionStoreOptions<TUser>): SessionStore<TUser> {
  const store = createBrowserKeyValueStore('localStorage');

  return {
    getToken() {
      return store.getItem(tokenKey);
    },
    setToken(token) {
      store.setItem(tokenKey, token);
    },
    clearToken() {
      store.removeItem(tokenKey);
    },
    getUser() {
      return readJsonValue(store, userKey, normalizeUser);
    },
    setUser(user) {
      writeJsonValue(store, userKey, user);
    },
    clearUser() {
      store.removeItem(userKey);
    },
  };
}
