const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7002';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(options: FetchOptions = {}): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    return headers;
  }

  async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(options),
      ...options,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async post<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(options),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async put<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(options),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  }

  async delete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options),
      ...options,
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
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  register: (email: string, password: string, nickname: string) =>
    api.post('/api/auth/register', { email, password, nickname }),

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

  addHistory: (token: string, dramaId: string, episodeId: string) =>
    api.post('/api/user/history', { dramaId, episodeId }, { token }),
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

// Coins API
export const coinsApi = {
  getBalance: (token: string) =>
    api.get('/api/coins/balance', { token }),

  unlock: (token: string, episodeId: string) =>
    api.post('/api/coins/unlock', { episodeId }, { token }),

  getPackages: () =>
    api.get('/api/coins/packages'),

  recharge: (token: string, packageId: string) =>
    api.post('/api/coins/recharge', { packageId }, { token }),

  createOrder: (token: string, packageId: string, paymentMethod: string) =>
    api.post('/api/coins/create-order', { packageId, paymentMethod }, { token }),

  redeem: (token: string, code: string) =>
    api.post('/api/coins/redeem', { code }, { token }),
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
    api.get('/api/subscriptions/plans'),

  subscribe: (token: string, planId: string) =>
    api.post('/api/subscriptions/subscribe', { planId }, { token }),

  getStatus: (token: string) =>
    api.get('/api/subscriptions/status', { token }),
};

// Contact / Help Center API
export const contactApi = {
  submitInquiry: (data: { name: string; email: string; subject: string; message: string; type?: string }) =>
    api.post('/api/v1/contact/inquiry', data),
};
