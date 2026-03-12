import type { EpisodeAccessResult, IpGeoData, StreamPlaybackInfo } from '@/types';
import { detectClientLocale } from '@/lib/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7002';

// Cloudflare Turnstile site key (get from Cloudflare Dashboard)
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export { API_URL, TURNSTILE_SITE_KEY };

interface FetchOptions extends RequestInit {
  token?: string;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const entries: Record<string, string> = {};
    headers.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function getClientLanguageHint(): string | null {
  if (typeof window === 'undefined') return null;
  return detectClientLocale(window.location.pathname);
}

const LANGUAGE_QUERY_ENDPOINT_PREFIXES = [
  '/api/dramas',
  '/api/categories',
  '/api/featured',
  '/api/playlists',
  '/api/banners',
];

function appendLanguageQuery(endpoint: string, language: string | null): string {
  if (!language) return endpoint;
  if (!LANGUAGE_QUERY_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix))) return endpoint;
  if (endpoint.includes('lang=')) return endpoint;
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}lang=${encodeURIComponent(language)}`;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(options: FetchOptions = {}): HeadersInit {
    const language = getClientLanguageHint();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(language ? { 'x-user-lang': language } : {}),
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    return {
      ...headers,
      ...normalizeHeaders(options.headers),
    };
  }

  async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${appendLanguageQuery(endpoint, getClientLanguageHint())}`, {
      method: 'GET',
      ...requestOptions,
      headers: this.getHeaders({ ...requestOptions, token }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async post<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      ...requestOptions,
      headers: this.getHeaders({ ...requestOptions, token }),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async put<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      ...requestOptions,
      headers: this.getHeaders({ ...requestOptions, token }),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async delete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      ...requestOptions,
      headers: this.getHeaders({ ...requestOptions, token }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string, turnstileToken?: string) =>
    api.post('/api/auth/login', { email, password, turnstileToken }),

  register: (email: string, password: string, nickname: string, referredBy?: string) =>
    api.post('/api/auth/register', { email, password, nickname, referredBy }),

  googleLogin: (credential: string) =>
    api.post('/api/auth/google', { credential }),

  facebookLogin: (accessToken: string) =>
    api.post('/api/auth/facebook', { accessToken }),

  getMe: (token: string) =>
    api.get('/api/auth/me', { token }),
};

// Dramas API
export const dramasApi = {
  getAll: (params?: { category?: string; sort?: string; page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/dramas${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    api.get(`/api/dramas/${id}`),

  getFeatured: () =>
    api.get('/api/featured'),

  getRankings: (type?: string) =>
    api.get(`/api/featured/rankings${type ? `?type=${type}` : ''}`),

  getTrending: () =>
    api.get('/api/featured/trending'),

  getPlaylists: () =>
    api.get('/api/playlists'),

  getBanners: () =>
    api.get('/api/banners'),

  getRelated: (id: string) =>
    api.get(`/api/dramas/${id}/related`),
};

// Episodes API
export const episodesApi = {
  // Get stream playback info (HLS URL + signed token)
  getStream: (episodeId: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return api.get<StreamPlaybackInfo>(`/api/episodes/${episodeId}/stream`, { headers });
  },

  // Check access permission for an episode
  checkAccess: (episodeId: string, token: string) =>
    api.get<EpisodeAccessResult>(`/api/episodes/${episodeId}/access`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Report playback progress
  reportProgress: (episodeId: string, token: string, currentTime: number, duration: number) =>
    api.post<void>(`/api/episodes/${episodeId}/progress`, {
      currentTime,
      duration,
      completed: currentTime >= duration * 0.9,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/api/categories'),
};

// User API
export const userApi = {
  getFavorites: (token: string) =>
    api.get('/api/user/favorites', { token }),

  addFavorite: (token: string, dramaId: string) =>
    api.post('/api/user/favorites', { dramaId }, { token }),

  removeFavorite: (token: string, dramaId: string) =>
    api.delete(`/api/user/favorites/${dramaId}`, { token }),

  getHistory: (token: string) =>
    api.get('/api/user/history', { token }),

  getContinueWatching: (token: string, limit = 24) =>
    api.get(`/api/user/history/continue?limit=${limit}`, { token }),

  addHistory: (token: string, dramaId: string, episodeId: string) =>
    api.post('/api/user/history', { dramaId, episodeId }, { token }),

  deleteHistory: (token: string) =>
    api.delete('/api/user/history', { token }),

  deleteHistoryEntry: (token: string, id: string) =>
    api.delete(`/api/user/history/${id}`, { token }),

  checkUnlocked: (token: string, episodeId: string) =>
    api.get(`/api/user/episodes/${episodeId}/unlocked`, { token }),

  getUnlockedEpisodes: (token: string, dramaId: string) =>
    api.get(`/api/user/dramas/${dramaId}/unlocked-episodes`, { token }),

  getNotifications: (token: string) =>
    api.get('/api/user/notifications', { token }),

  markNotificationRead: (token: string, id: string) =>
    api.put(`/api/user/notifications/${id}/read`, {}, { token }),

  markAllNotificationsRead: (token: string) =>
    api.put('/api/user/notifications/read-all', {}, { token }),
};

// Comments API
export const commentsApi = {
  getByDrama: (dramaId: string, episodeId?: string) => {
    const params = new URLSearchParams({ dramaId });
    if (episodeId) params.append('episodeId', episodeId);
    return api.get(`/api/comments?${params.toString()}`);
  },

  add: (token: string, dramaId: string, episodeId: string, content: string) =>
    api.post('/api/comments', { dramaId, episodeId, content }, { token }),

  like: (token: string, commentId: string) =>
    api.post(`/api/comments/${commentId}/like`, {}, { token }),
};

// Reviews API
export const reviewsApi = {
  getByDrama: (dramaId: string) =>
    api.get(`/api/dramas/${dramaId}/reviews`),

  add: (token: string, dramaId: string, rating: number, content: string) =>
    api.post(`/api/dramas/${dramaId}/reviews`, { rating, content }, { token }),
};

// Coins API
export const coinsApi = {
  getBalance: (token: string) =>
    api.get('/api/coins/balance', { token }),

  unlock: (token: string, episodeId: string) =>
    api.post('/api/coins/unlock', { episodeId }, { token }),

  unlockAll: (token: string, dramaId: string) =>
    api.post('/api/coins/unlock-all', { dramaId }, { token }),

  getTransactions: (token: string, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return api.get(`/api/coins/transactions${query ? `?${query}` : ''}`, { token });
  },

  getPackages: () =>
    api.get('/api/payment/packages'),

  recharge: (token: string, packageId: string) =>
    api.post('/api/coins/recharge', { amount: packageId }, { token }),

  createOrder: (token: string, packageId: string, paymentMethod: string) =>
    api.post<{ success: boolean; data: { checkoutUrl: string; sessionId: string; transactionId: string } }>('/api/payment/create-order', { packageId, paymentMethod }, { token }),

  verifySession: (token: string, sessionId: string) =>
    api.get('/api/payment/verify-session/' + sessionId, { token }),

  redeem: (token: string, code: string) =>
    api.post('/api/coins/redeem', { code }, { token }),
};

// Verification Code API
export const verificationApi = {
  sendVerificationCode: (email: string, purpose: 'register' | 'reset-password' | 'login' | 'email-change') =>
    api.post('/api/verification/send', { email, purpose }),

  verifyCode: (email: string, code: string, purpose: string) =>
    api.post('/api/verification/verify', { email, code, purpose }),
};

// Password Reset API
export const passwordApi = {
  sendResetCode: (email: string) =>
    api.post('/api/auth/reset-password', { email }),

  verifyCode: (email: string, code: string) =>
    api.post('/api/auth/verify-code', { email, code }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/api/auth/reset-password/confirm', { email, code, newPassword }),
};

// User Profile API
export const profileApi = {
  update: (token: string, data: { nickname?: string; avatar?: string }) =>
    api.put('/api/user/profile', data, { token }),

  changePassword: (token: string, oldPassword: string, newPassword: string) =>
    api.put('/api/user/password', { oldPassword, newPassword }, { token }),

  getPurchases: (token: string, params?: { page?: number; type?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/user/purchases${query ? `?${query}` : ''}`, { token });
  },

  deleteAccount: (token: string) =>
    api.delete('/api/user/account', { token }),
};

// Settings API
export const settingsApi = {
  getSettings: (token: string) =>
    api.get('/api/user/settings', { token }),

  updateSettings: (token: string, data: any) =>
    api.put('/api/user/settings', data, { token }),

  getSecurity: (token: string) =>
    api.get('/api/user/security', { token }),

  removeSession: (token: string, sessionId: string) =>
    api.delete(`/api/user/sessions/${sessionId}`, { token }),

  logoutAll: (token: string) =>
    api.post('/api/user/sessions/logout-all', {}, { token }),
};

// Subscription API
export const subscriptionApi = {
  getPlans: () =>
    api.get('/api/payment/vip/plans'),

  subscribe: (token: string, planId: string, paymentMethod?: string) =>
    api.post<{ success: boolean; data: { checkoutUrl: string; sessionId: string; transactionId: string } }>('/api/payment/vip/subscribe', { planId, paymentMethod }, { token }),

  getStatus: (token: string) =>
    api.get('/api/payment/vip/status', { token }),
};

// Contact / Help Center API
export const contactApi = {
  submitInquiry: (data: { name: string; email: string; subject: string; message: string; type?: string }) =>
    api.post('/api/contact/inquiry', data),
};

// Geolocation API
export const geoApi = {
  getMyGeo: () =>
    api.get<{ success: boolean; data: IpGeoData | null }>('/api/geo/me'),
};

// Promoter / Affiliate API
export const promoterApi = {
  apply: (token: string, data: { fullName: string; businessEmail: string; country: string; promotionChannels: string; paymentMethod?: any }) =>
    api.post('/api/promoter/apply', data, { token }),

  getProfile: (token: string) =>
    api.get('/api/promoter/profile', { token }),

  getDashboard: (token: string) =>
    api.get('/api/promoter/dashboard', { token }),

  getCommissions: (token: string, params?: { page?: number; limit?: number; status?: string; search?: string; startDate?: string; endDate?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return api.get(`/api/promoter/commissions${query ? `?${query}` : ''}`, { token });
  },

  exportCommissions: (token: string, params?: { status?: string; startDate?: string; endDate?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return `${API_URL}/api/promoter/commissions/export${query ? `?${query}` : ''}`;
  },

  getCreatives: (token: string, params?: { dramaId?: string; type?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return api.get(`/api/promoter/creatives${query ? `?${query}` : ''}`, { token });
  },

  getPaymentMethods: (token: string) =>
    api.get('/api/promoter/payment-methods', { token }),

  addPaymentMethod: (token: string, data: any) =>
    api.post('/api/promoter/payment-methods', data, { token }),

  updatePaymentMethod: (token: string, id: string, data: any) =>
    api.put(`/api/promoter/payment-methods/${id}`, data, { token }),

  deletePaymentMethod: (token: string, id: string) =>
    api.delete(`/api/promoter/payment-methods/${id}`, { token }),

  setDefaultPaymentMethod: (token: string, id: string) =>
    api.put(`/api/promoter/payment-methods/${id}/default`, {}, { token }),

  withdraw: (token: string, data: { amount: number; paymentMethodId?: string }) =>
    api.post('/api/promoter/withdraw', data, { token }),

  getWithdrawals: (token: string, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return api.get(`/api/promoter/withdrawals${query ? `?${query}` : ''}`, { token });
  },

  getReferralLink: (token: string) =>
    api.get('/api/promoter/referral-link', { token }),

  trackClick: (referralCode: string) =>
    api.post('/api/promoter/track-click', { referralCode }),

  getNotifications: (token: string) =>
    api.get('/api/promoter/notifications', { token }),

  getSettings: () =>
    api.get('/api/promoter/settings'),
};

// Combined API export for convenience
export const apiCombined = {
  ...authApi,
  ...dramasApi,
  ...episodesApi,
  ...categoriesApi,
  ...userApi,
  ...commentsApi,
  ...reviewsApi,
  ...coinsApi,
  ...verificationApi,
  ...passwordApi,
  ...profileApi,
  ...settingsApi,
  ...subscriptionApi,
  ...contactApi,
  ...geoApi,
  ...promoterApi,
  register: authApi.register,
  sendVerificationCode: verificationApi.sendVerificationCode,
  verifyCode: verificationApi.verifyCode,
};
