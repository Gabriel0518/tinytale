import { Preferences } from '@capacitor/preferences';
import type { User } from '@domain';
import { createBrowserSessionStore } from '@storage';

const TOKEN_KEY = 'tinytale.native.token';
const USER_KEY = 'tinytale.native.user';

function normalizeAuthUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const typed = raw as Record<string, unknown>;
  return {
    ...(typed as unknown as User),
    _id: String(typed._id || typed.id || ''),
  };
}

const browserMirrorStore = createBrowserSessionStore<User>({
  tokenKey: TOKEN_KEY,
  userKey: USER_KEY,
  normalizeUser: normalizeAuthUser,
});

async function readNativePreference(key: string) {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

async function writeNativePreference(key: string, value: string) {
  try {
    await Preferences.set({ key, value });
  } catch {
    // Ignore native preference write failures and keep browser mirror alive.
  }
}

async function removeNativePreference(key: string) {
  try {
    await Preferences.remove({ key });
  } catch {
    // Ignore native preference remove failures.
  }
}

export const nativeSessionStore = {
  getToken() {
    return browserMirrorStore.getToken();
  },
  setToken(token: string) {
    browserMirrorStore.setToken(token);
    void writeNativePreference(TOKEN_KEY, token);
  },
  clearToken() {
    browserMirrorStore.clearToken();
    void removeNativePreference(TOKEN_KEY);
  },
  getUser() {
    return browserMirrorStore.getUser();
  },
  setUser(user: User) {
    browserMirrorStore.setUser(user);
    void writeNativePreference(USER_KEY, JSON.stringify(user));
  },
  clearUser() {
    browserMirrorStore.clearUser();
    void removeNativePreference(USER_KEY);
  },
};

export async function hydrateNativeSessionStore() {
  const [nativeToken, nativeUserRaw] = await Promise.all([
    readNativePreference(TOKEN_KEY),
    readNativePreference(USER_KEY),
  ]);

  if (nativeToken && nativeToken !== browserMirrorStore.getToken()) {
    browserMirrorStore.setToken(nativeToken);
  }

  if (nativeUserRaw) {
    try {
      const parsed = JSON.parse(nativeUserRaw) as unknown;
      const normalizedUser = normalizeAuthUser(parsed);
      if (normalizedUser) {
        browserMirrorStore.setUser(normalizedUser);
      }
    } catch {
      browserMirrorStore.clearUser();
    }
  }

  return {
    token: browserMirrorStore.getToken(),
    user: browserMirrorStore.getUser(),
  };
}
