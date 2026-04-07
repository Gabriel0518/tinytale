import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthApiContract, AuthSuccessPayload } from '../contracts/auth-api';
import type { AuthSessionStore } from '../contracts/session-store';

type SessionActivityAdapter = {
  markActive(): void;
  clear(): void;
};

export type AuthContextValue<TUser> = {
  user: TUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (email: string, password: string, nickname: string, referredBy?: string) => Promise<void>;
  googleLogin: (
    credential: string | { credential?: string; accessToken?: string; idToken?: string }
  ) => Promise<void>;
  facebookLogin: (accessToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: TUser) => void;
  refreshUser: () => Promise<void>;
};

function resolveAuthMessage<TUser>(response: AuthSuccessPayload<TUser>, fallbackMessage: string) {
  return response.error?.message || response.message || fallbackMessage;
}

function resolveAuthResult<TUser>(
  response: AuthSuccessPayload<TUser>,
  fallbackMessage: string
): { user: TUser; token: string } {
  const user = response.data?.user;
  const token = response.data?.token;

  if (response.success && user && token) {
    return { user, token };
  }

  throw new Error(resolveAuthMessage(response, fallbackMessage));
}

export function createAuthBindings<TUser>({
  authApi,
  sessionStore,
  sessionActivity,
}: {
  authApi: AuthApiContract<TUser>;
  sessionStore: AuthSessionStore<TUser>;
  sessionActivity?: SessionActivityAdapter;
}) {
  const AuthContext = createContext<AuthContextValue<TUser> | undefined>(undefined);

  function persistSession(user: TUser, token: string) {
    sessionStore.setToken(token);
    sessionStore.setUser(user);
    sessionActivity?.markActive();
  }

  function clearSession() {
    sessionStore.clearToken();
    sessionStore.clearUser();
    sessionActivity?.clear();
  }

  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
      const currentToken = token || sessionStore.getToken();
      if (!currentToken) return;

      try {
        const response = await authApi.getMe(currentToken);
        if (response.success && response.data) {
          setUser(response.data);
          sessionStore.setUser(response.data);
        }
      } catch {
        // Keep stale local session if background refresh fails.
      }
    }, [token]);

    useEffect(() => {
      const storedToken = sessionStore.getToken();
      const storedUser = sessionStore.getUser();

      if (!storedToken) {
        clearSession();
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(storedUser);
      sessionActivity?.markActive();

      authApi
        .getMe(storedToken)
        .then((response) => {
          if (response.success && response.data) {
            setUser(response.data);
            sessionStore.setUser(response.data);
          }
        })
        .catch(() => {
          // Keep cached state.
        })
        .finally(() => {
          setLoading(false);
        });
    }, []);

    const value = useMemo<AuthContextValue<TUser>>(
      () => ({
        user,
        token,
        loading,
        login: async (email, password, turnstileToken) => {
          const response = await authApi.login(email, password, turnstileToken);
          const result = resolveAuthResult(response, 'Login failed');
          setUser(result.user);
          setToken(result.token);
          persistSession(result.user, result.token);
        },
        register: async (email, password, nickname, referredBy) => {
          const response = await authApi.register(email, password, nickname, referredBy);
          const result = resolveAuthResult(response, 'Registration failed');
          setUser(result.user);
          setToken(result.token);
          persistSession(result.user, result.token);
        },
        googleLogin: async (credential) => {
          const response = await authApi.googleLogin(credential);
          const result = resolveAuthResult(response, 'Google login failed');
          setUser(result.user);
          setToken(result.token);
          persistSession(result.user, result.token);
        },
        facebookLogin: async (accessToken) => {
          const response = await authApi.facebookLogin(accessToken);
          const result = resolveAuthResult(response, 'Facebook login failed');
          setUser(result.user);
          setToken(result.token);
          persistSession(result.user, result.token);
        },
        logout: () => {
          setUser(null);
          setToken(null);
          clearSession();
        },
        updateUser: (nextUser) => {
          setUser(nextUser);
          sessionStore.setUser(nextUser);
        },
        refreshUser,
      }),
      [loading, refreshUser, token, user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }

  return {
    AuthProvider,
    useAuth,
  };
}
