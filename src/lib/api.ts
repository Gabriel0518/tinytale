import type { EpisodeAccessResult, IpGeoData, StreamPlaybackInfo } from '@/types';
import type {
  CreatorApplicationDraft,
  CreatorAudienceAnalytics,
  CreatorContractOverview,
  CreatorDashboardOverview,
  CreatorDramaAnalytics,
  CreatorDramaEpisodesResponse,
  CreatorDramaListResponse,
  CreatorEpisodeItem,
  CreatorEpisodePreviewPayload,
  CreatorNotificationListResponse,
  CreatorOverviewAnalytics,
  CreatorRevenueAnalytics,
  CreatorSettlementBankAccount,
  CreatorSettlementDetail,
  CreatorSettlementOverview,
  CreatorSettlementTaxInfo,
  CreatorTicket,
  CreatorTicketCategory,
  CreatorTicketPriority,
} from '@/types/creator';
import { serializeCreatorApplicationDraft } from '@/lib/creator';
import type { CountryCatalogItem } from '@/lib/countries';
import { detectClientLocale } from '@/lib/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://api.tinytale.top' : 'http://localhost:7002');

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
  '/api/hero-banners',
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

type CreatorAutoSplitResponseData = {
  jobId?: string;
  status?: 'processing' | 'completed' | 'failed';
  failureMessage?: string;
  totalClips: number;
  totalRequestedClips?: number;
  episodes: Array<{
    episodeId: string;
    episodeNumber: number;
    title: string;
    streamVideoId: string;
    duration: number;
    cover: string;
  }>;
  subtitleSplit?: {
    enabled: boolean;
    language: string;
    processedEpisodes: number;
    skippedEpisodes: number;
    errors: Array<{ episodeNumber?: number; message: string }>;
  };
  sourceCleanup?: {
    state: string;
    sourceVideoUid: string;
    reason: string;
  };
  errors?: Array<{ episodeNumber: number; error: string; code?: string }>;
};

// Auth API
export const authApi = {
  login: (email: string, password: string, turnstileToken?: string) =>
    api.post('/api/auth/login', { email, password, turnstileToken }),

  checkEmailAvailability: (email: string) =>
    api.get<{ success: boolean; data: { email: string; available: boolean; registered: boolean } }>(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`
    ),

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

  getHeroBanners: () =>
    api.get('/api/hero-banners'),

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

export const countriesApi = {
  getAll: (params?: {
    q?: string;
    alpha2?: string;
    alpha3?: string;
    currencyCode?: string;
    tier?: number;
    page?: number;
    limit?: number;
    includeDisabled?: boolean;
  }) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    return api.get<{ success: boolean; data: { items: CountryCatalogItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>(
      `/api/countries${query ? `?${query}` : ''}`
    );
  },
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

// Creator API
export const creatorApi = {
  getApplicationStatus: (token: string) =>
    api.get('/api/creator/application/status', { token }),

  getApplicationDraft: (token: string) =>
    api.get('/api/creator/application/draft', { token }),

  saveApplicationDraft: (token: string, draft: CreatorApplicationDraft) =>
    api.put('/api/creator/application/draft', serializeCreatorApplicationDraft(draft), { token }),

  submitApplication: (token: string, draft: CreatorApplicationDraft) =>
    api.post('/api/creator/application/submit', serializeCreatorApplicationDraft(draft), { token }),

  uploadApplicationDocument: async (token: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_URL}/api/creator/application/document`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Application document upload failed');
    }
    return data as {
      success: boolean;
      data: { url: string; key: string; filename: string; contentType: string; size: number };
    };
  },

  deleteApplicationDocument: (token: string, url: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean; key: string } }>(
      `/api/creator/application/document?url=${encodeURIComponent(url)}`,
      { token }
    ),

  getDashboardOverview: (token: string) =>
    api.get<{ success: boolean; data: CreatorDashboardOverview }>('/api/creator/dashboard/overview', { token }),

  getDashboardTrends: (token: string) =>
    api.get('/api/creator/dashboard/trends', { token }),

  getDashboardRecentStories: (token: string, limit = 5) =>
    api.get(`/api/creator/dashboard/recent-stories?limit=${limit}`, { token }),

  getOverviewAnalytics: (token: string, range: '7d' | '30d' | '90d') =>
    api.get<{ success: boolean; data: CreatorOverviewAnalytics }>(`/api/creator/analytics/overview?range=${range}`, { token }),

  getRevenueAnalytics: (token: string, range: '7d' | '30d' | '90d') =>
    api.get<{ success: boolean; data: CreatorRevenueAnalytics }>(`/api/creator/analytics/revenue?range=${range}`, { token }),

  getAudienceAnalytics: (token: string, range: '7d' | '30d' | '90d') =>
    api.get<{ success: boolean; data: CreatorAudienceAnalytics }>(`/api/creator/analytics/audience?range=${range}`, { token }),

  getDramaAnalytics: (token: string, id: string, range: '7d' | '30d' | '90d') =>
    api.get<{ success: boolean; data: CreatorDramaAnalytics }>(`/api/creator/dramas/${id}/analytics?range=${range}`, { token }),

  getContractOverview: (token: string) =>
    api.get<{ success: boolean; data: CreatorContractOverview }>(`/api/creator/contract`, { token }),

  getSettlementOverview: (token: string) =>
    api.get<{ success: boolean; data: CreatorSettlementOverview }>(`/api/creator/settlements/overview`, { token }),

  getSettlementDetail: (token: string, id: string) =>
    api.get<{ success: boolean; data: CreatorSettlementDetail }>(`/api/creator/settlements/${id}`, { token }),

  getSettlementTaxInfo: (token: string) =>
    api.get<{ success: boolean; data: CreatorSettlementTaxInfo }>(`/api/creator/settlements/tax-info`, { token }),

  getNotifications: (token: string) =>
    api.get<{ success: boolean; data: CreatorNotificationListResponse }>(`/api/creator/notifications`, { token }),

  markNotificationRead: (token: string, id: string) =>
    api.put<{ success: boolean; data: { id: string; read: boolean } }>(`/api/creator/notifications/${id}/read`, {}, { token }),

  markAllNotificationsRead: (token: string) =>
    api.put<{ success: boolean; data: { readCount: number; unreadCount: number } }>(`/api/creator/notifications/read-all`, {}, { token }),

  updateSettlementBankAccount: (
    token: string,
    payload: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      routingNumber?: string;
      swiftCode?: string;
      bankAddress?: string;
      country: string;
      currency?: string;
    }
  ) => api.put<{ success: boolean; data: CreatorSettlementBankAccount }>(`/api/creator/settlements/bank-account`, payload, { token }),

  updateSettlementTaxInfo: (
    token: string,
    payload: {
      legalName: string;
      businessName?: string;
      taxClassification: CreatorSettlementTaxInfo["taxClassification"];
      taxIdType: CreatorSettlementTaxInfo["taxIdType"];
      taxIdNumber: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      stateOrRegion: string;
      postalCode: string;
      country: string;
      certificationName: string;
    }
  ) => api.put<{ success: boolean; data: CreatorSettlementTaxInfo }>(`/api/creator/settlements/tax-info`, payload, { token }),

  confirmSettlementStatement: (token: string, id: string) =>
    api.put<{ success: boolean; data: CreatorSettlementDetail["confirmation"] }>(`/api/creator/settlements/${id}/confirm`, {}, { token }),

  downloadSettlementPdf: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/api/creator/settlements/${id}/pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const err = await response.json();
        message = err?.error?.message || message;
      } catch {}
      throw new Error(message);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition') || '';
    const matched = contentDisposition.match(/filename=\"?([^"]+)\"?/i);
    const filename = matched?.[1] || `statement-${id}.pdf`;
    return { blob, filename };
  },

  getDramas: (
    token: string,
    params?: {
      q?: string;
      status?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    return api.get<{ success: boolean; data: CreatorDramaListResponse }>(`/api/creator/dramas${query ? `?${query}` : ''}`, { token });
  },

  getDramaById: (token: string, id: string) =>
    api.get<{ success: boolean; data: any }>(`/api/creator/dramas/${id}`, { token }),

  createDrama: (
    token: string,
    payload: {
      title?: string;
      description?: string;
      cover?: string;
      horizontalCover?: string;
      categories?: string[];
      regions?: string[];
      language?: string;
      country?: string;
    }
  ) => api.post<{ success: boolean; data: any }>('/api/creator/dramas', payload, { token }),

  updateDrama: (token: string, id: string, payload: Record<string, any>) =>
    api.put<{ success: boolean; data: any }>(`/api/creator/dramas/${id}`, payload, { token }),

  submitDramaForReview: (token: string, id: string) =>
    api.post<{ success: boolean; data: any }>(`/api/creator/dramas/${id}/submit-review`, {}, { token }),

  publishDrama: (token: string, id: string) =>
    api.post<{ success: boolean; data: any }>(`/api/creator/dramas/${id}/publish`, {}, { token }),

  archiveDrama: (token: string, id: string) =>
    api.post<{ success: boolean; data: any }>(`/api/creator/dramas/${id}/archive`, {}, { token }),

  unarchiveDrama: (token: string, id: string) =>
    api.post<{ success: boolean; data: any }>(`/api/creator/dramas/${id}/unarchive`, {}, { token }),

  getDramaEpisodes: (token: string, dramaId: string) =>
    api.get<{ success: boolean; data: CreatorDramaEpisodesResponse }>(`/api/creator/dramas/${dramaId}/episodes`, { token }),

  createDramaEpisode: (token: string, dramaId: string, payload?: { count?: number }) =>
    api.post<{ success: boolean; data: { episodes: CreatorEpisodeItem[] } }>(`/api/creator/dramas/${dramaId}/episodes`, payload || {}, { token }),

  bulkCreateDramaEpisodes: (
    token: string,
    dramaId: string,
    payload: {
      episodes: Array<{
        title?: string;
        description?: string;
        episodeNumber?: number;
        isFree?: boolean;
        unlockPrice?: number;
      }>;
    }
  ) => api.post<{ success: boolean; data: { episodes: CreatorEpisodeItem[] } }>(`/api/creator/dramas/${dramaId}/episodes/bulk`, payload, { token }),

  updateDramaEpisode: (token: string, dramaId: string, episodeId: string, payload: Record<string, any>) =>
    api.put<{ success: boolean; data: CreatorEpisodeItem }>(`/api/creator/dramas/${dramaId}/episodes/${episodeId}`, payload, { token }),

  reorderDramaEpisodes: (
    token: string,
    dramaId: string,
    orders: Array<{ episodeId: string; episodeNumber: number }>
  ) => api.put<{ success: boolean; data: { episodes: CreatorEpisodeItem[] } }>(`/api/creator/dramas/${dramaId}/episodes/reorder`, { orders }, { token }),

  deleteDramaEpisode: (token: string, dramaId: string, episodeId: string) =>
    api.delete<{ success: boolean; data: { deletedId: string } }>(`/api/creator/dramas/${dramaId}/episodes/${episodeId}`, { token }),

  requestVideoUpload: (
    token: string,
    payload: {
      filename: string;
      filesize: number;
      mimetype: string;
      autoGeneratedName: string;
      maxDurationSeconds?: number;
    }
  ) => api.post<{ success: boolean; data: { upload_url: string; video_uid: string } }>('/api/creator/upload/video', payload, { token }),

  getVideoUploadStatus: (token: string, uid: string) =>
    api.get<{
      success: boolean;
      data: {
        uid: string;
        status: string;
        duration: number;
        readyToStream: boolean;
        playback: any;
        thumbnail?: string | null;
        videoWidth?: number;
        videoHeight?: number;
        errorReasonCode?: string | null;
        errorReasonText?: string | null;
      };
    }>(`/api/creator/upload/video/${uid}`, { token }),

  autoSplitEpisodes: (
    token: string,
    payload: {
      sourceVideoUid: string;
      episodeDuration: number;
      dramaId: string;
      sourceSubtitleUrl?: string;
      sourceSubtitleFormat?: 'srt' | 'vtt';
      subtitleLanguage?: string;
    }
  ) =>
    api.post<{
      success: boolean;
      data: CreatorAutoSplitResponseData;
    }>('/api/creator/upload/auto-split', payload, { token }),

  getAutoSplitJobStatus: (token: string, jobId: string) =>
    api.get<{
      success: boolean;
      data: CreatorAutoSplitResponseData;
    }>(`/api/creator/upload/auto-split/${encodeURIComponent(jobId)}`, { token }),

  getClipStatus: (token: string, uids: string[]) =>
    api.get<{
      success: boolean;
      data: {
        clips: Array<{
          uid: string;
          status: string;
          readyToStream: boolean;
          duration: number;
          thumbnail: string | null;
          videoWidth?: number;
          videoHeight?: number;
          errorReasonCode?: string | null;
          errorReasonText?: string | null;
        }>;
        allReady: boolean;
        hasFailure: boolean;
        sourceCleanup?: {
          total: number;
          pending: number;
          deleted: number;
          failed: number;
        };
      };
    }>(`/api/creator/upload/clip-status?uids=${uids.join(',')}`, { token }),

  deleteUploadedVideo: (token: string, uid: string) =>
    api.delete<{ success: boolean }>(`/api/creator/upload/video/${uid}`, { token }),

  uploadImageFile: async (token: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_URL}/api/creator/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Image upload failed');
    }
    return data as { success: boolean; data: { url: string; key: string } };
  },

  uploadSubtitleFile: async (token: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_URL}/api/creator/upload/subtitle`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Subtitle upload failed');
    }
    return data as { success: boolean; data: { url: string; key: string; format: 'srt' | 'vtt' } };
  },

  uploadEpisodeSubtitle: async (
    token: string,
    dramaId: string,
    episodeId: string,
    payload: {
      file: File;
      language: string;
    }
  ) => {
    const form = new FormData();
    form.append('file', payload.file);
    form.append('language', payload.language);
    const response = await fetch(`${API_URL}/api/creator/dramas/${dramaId}/episodes/${episodeId}/subtitle`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Subtitle upload failed');
    }
    return data as {
      success: boolean;
      data: {
        episode: CreatorEpisodeItem;
        subtitle: NonNullable<CreatorEpisodeItem['subtitleTracks']>[number];
        translationTask: CreatorEpisodeItem['subtitleTranslation'];
      };
    };
  },

  getDramaEpisodePreview: (token: string, dramaId: string, episodeId: string) =>
    api.get<{ success: boolean; data: CreatorEpisodePreviewPayload }>(`/api/creator/dramas/${dramaId}/episodes/${episodeId}/preview`, { token }),

  uploadTicketAttachment: async (token: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_URL}/api/creator/upload/ticket-attachment`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Attachment upload failed');
    }
    return data as {
      success: boolean;
      data: { url: string; key: string; filename: string; contentType: string; size: number };
    };
  },

  getTickets: (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      keyword?: string;
    }
  ) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    return api.get<{
      success: boolean;
      data: {
        tickets: Array<
          Pick<
            CreatorTicket,
            '_id' | 'ticketNo' | 'subject' | 'category' | 'priority' | 'status' | 'lastMessageAt' | 'updatedAt'
          > & { messageCount: number; latestMessage: string }
        >;
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        statusCounts: Record<string, number>;
      };
    }>(`/api/creator/tickets${query ? `?${query}` : ''}`, { token });
  },

  createTicket: (
    token: string,
    payload: {
      subject: string;
      category: CreatorTicketCategory;
      priority: CreatorTicketPriority;
      message: string;
      attachments?: string[];
    }
  ) => api.post('/api/creator/tickets', payload, { token }),

  getTicketById: (token: string, id: string) =>
    api.get<{ success: boolean; data: CreatorTicket }>(`/api/creator/tickets/${id}`, { token }),

  replyTicket: (token: string, id: string, payload: { message: string; attachments?: string[] }) =>
    api.post(`/api/creator/tickets/${id}/messages`, payload, { token }),

  closeTicket: (token: string, id: string) =>
    api.put(`/api/creator/tickets/${id}/close`, {}, { token }),
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
  ...creatorApi,
  register: authApi.register,
  sendVerificationCode: verificationApi.sendVerificationCode,
  verifyCode: verificationApi.verifyCode,
};
