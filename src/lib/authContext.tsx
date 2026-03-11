'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from './api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (email: string, password: string, nickname: string, referredBy?: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  facebookLogin: (accessToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_COOKIE_NAME = 'tt_session';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setSessionCookie();

      // Refresh user data from server to get latest state (e.g. VIP status changes)
      authApi.getMe(storedToken).then(res => {
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      }).catch(() => {
        // Silently fail - use cached data
      });
    } else {
      clearSessionCookie();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    const response = await authApi.login(email, password, turnstileToken);
    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setSessionCookie();
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, nickname: string, referredBy?: string) => {
    const response = await authApi.register(email, password, nickname, referredBy);
    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setSessionCookie();
    } else {
      throw new Error(response.error?.message || 'Registration failed');
    }
  };

  const googleLogin = async (credential: string) => {
    const response = await authApi.googleLogin(credential);
    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setSessionCookie();
    } else {
      throw new Error(response.error?.message || 'Google login failed');
    }
  };

  const facebookLogin = async (accessToken: string) => {
    const response = await authApi.facebookLogin(accessToken);
    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setSessionCookie();
    } else {
      throw new Error(response.error?.message || 'Facebook login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearSessionCookie();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await authApi.getMe(currentToken);
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      // Silently fail
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, facebookLogin, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
