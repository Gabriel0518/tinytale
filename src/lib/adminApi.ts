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

  async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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

  async post<T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
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

  async put<T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
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

  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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

// Admin Dashboard API
const ADMIN_TOKEN = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || 'demo-token' : 'demo-token';

export const adminApi = {
  getStats: (token = ADMIN_TOKEN) =>
    api.get('/api/admin/stats', { token }),

  getStatsCharts: (token = ADMIN_TOKEN, period?: string) =>
    api.get(`/api/admin/stats/charts${period ? `?period=${period}` : ''}`, { token }),

  // Dramas
  getDramas: (params?: { search?: string; status?: string; page?: number; limit?: number }, token = ADMIN_TOKEN) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/dramas${query ? `?${query}` : ''}`, { token });
  },

  getDrama: (id: string, token = ADMIN_TOKEN) =>
    api.get(`/api/admin/dramas/${id}`, { token }),

  createDrama: (data: any, token = ADMIN_TOKEN) =>
    api.post('/api/admin/dramas', data, { token }),

  updateDrama: (id: string, data: any, token = ADMIN_TOKEN) =>
    api.put(`/api/admin/dramas/${id}`, data, { token }),

  deleteDrama: (id: string, token = ADMIN_TOKEN) =>
    api.delete(`/api/admin/dramas/${id}`, { token }),

  // Episodes
  getEpisodes: (dramaId?: string, token = ADMIN_TOKEN) =>
    api.get(`/api/admin/episodes${dramaId ? `?dramaId=${dramaId}` : ''}`, { token }),

  createEpisode: (data: any, token = ADMIN_TOKEN) =>
    api.post('/api/admin/episodes', data, { token }),

  updateEpisode: (id: string, data: any, token = ADMIN_TOKEN) =>
    api.put(`/api/admin/episodes/${id}`, data, { token }),

  deleteEpisode: (id: string, token = ADMIN_TOKEN) =>
    api.delete(`/api/admin/episodes/${id}`, { token }),

  // Users
  getUsers: (params?: { search?: string; status?: string; page?: number; limit?: number }, token = ADMIN_TOKEN) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users${query ? `?${query}` : ''}`, { token });
  },

  getUser: (id: string, token = ADMIN_TOKEN) =>
    api.get(`/api/admin/users/${id}`, { token }),

  updateUser: (id: string, data: any, token = ADMIN_TOKEN) =>
    api.put(`/api/admin/users/${id}`, data, { token }),

  // Categories
  getCategories: (token = ADMIN_TOKEN) =>
    api.get('/api/admin/categories', { token }),

  createCategory: (data: any, token = ADMIN_TOKEN) =>
    api.post('/api/admin/categories', data, { token }),

  updateCategory: (id: string, data: any, token = ADMIN_TOKEN) =>
    api.put(`/api/admin/categories/${id}`, data, { token }),

  deleteCategory: (id: string, token = ADMIN_TOKEN) =>
    api.delete(`/api/admin/categories/${id}`, { token }),

  // Featured
  getFeatured: (type?: string, token = ADMIN_TOKEN) =>
    api.get(`/api/admin/featured${type ? `?type=${type}` : ''}`, { token }),

  createFeatured: (data: any, token = ADMIN_TOKEN) =>
    api.post('/api/admin/featured', data, { token }),

  deleteFeatured: (id: string, token = ADMIN_TOKEN) =>
    api.delete(`/api/admin/featured/${id}`, { token }),

  // Transactions / Orders
  getTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }, token = ADMIN_TOKEN) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/transactions${query ? `?${query}` : ''}`, { token });
  },

  // Comments
  getComments: (params?: { dramaId?: string; status?: string; page?: number; limit?: number }, token = ADMIN_TOKEN) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/comments${query ? `?${query}` : ''}`, { token });
  },

  approveComment: (id: string, token = ADMIN_TOKEN) =>
    api.post(`/api/admin/comments/${id}/approve`, {}, { token }),

  rejectComment: (id: string, token = ADMIN_TOKEN) =>
    api.post(`/api/admin/comments/${id}/reject`, {}, { token }),

  deleteComment: (id: string, token = ADMIN_TOKEN) =>
    api.delete(`/api/admin/comments/${id}`, { token }),
};
