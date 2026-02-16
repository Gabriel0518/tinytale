const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7003';

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
export const adminApi = {
  getStats: (token: string) =>
    api.get('/api/admin/stats', { token }),

  getStatsCharts: (token: string, period?: string) =>
    api.get(`/api/admin/stats/charts${period ? `?period=${period}` : ''}`, { token }),

  // Dramas
  getDramas: (token: string, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/admin/dramas${query ? `?${query}` : ''}`, { token });
  },

  createDrama: (token: string, data: any) =>
    api.post('/api/admin/dramas', data, { token }),

  updateDrama: (token: string, id: string, data: any) =>
    api.put(`/api/admin/dramas/${id}`, data, { token }),

  deleteDrama: (token: string, id: string) =>
    api.delete(`/api/admin/dramas/${id}`, { token }),

  // Episodes
  getEpisodes: (token: string, dramaId?: string) =>
    api.get(`/api/admin/episodes${dramaId ? `?dramaId=${dramaId}` : ''}`, { token }),

  createEpisode: (token: string, data: any) =>
    api.post('/api/admin/episodes', data, { token }),

  updateEpisode: (token: string, id: string, data: any) =>
    api.put(`/api/admin/episodes/${id}`, data, { token }),

  deleteEpisode: (token: string, id: string) =>
    api.delete(`/api/admin/episodes/${id}`, { token }),

  // Users
  getUsers: (token: string, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/admin/users${query ? `?${query}` : ''}`, { token });
  },

  updateUser: (token: string, id: string, data: any) =>
    api.put(`/api/admin/users/${id}`, data, { token }),

  // Categories
  getCategories: (token: string) =>
    api.get('/api/admin/categories', { token }),

  createCategory: (token: string, data: any) =>
    api.post('/api/admin/categories', data, { token }),

  updateCategory: (token: string, id: string, data: any) =>
    api.put(`/api/admin/categories/${id}`, data, { token }),

  deleteCategory: (token: string, id: string) =>
    api.delete(`/api/admin/categories/${id}`, { token }),

  // Featured
  getFeatured: (token: string, type?: string) =>
    api.get(`/api/admin/featured${type ? `?type=${type}` : ''}`, { token }),

  createFeatured: (token: string, data: any) =>
    api.post('/api/admin/featured', data, { token }),

  deleteFeatured: (token: string, id: string) =>
    api.delete(`/api/admin/featured/${id}`, { token }),

  // Transactions
  getTransactions: (token: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/admin/transactions${query ? `?${query}` : ''}`, { token });
  },

  // Comments
  getComments: (token: string, params?: { dramaId?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/admin/comments${query ? `?${query}` : ''}`, { token });
  },

  approveComment: (token: string, id: string) =>
    api.post(`/api/admin/comments/${id}/approve`, {}, { token }),

  rejectComment: (token: string, id: string) =>
    api.post(`/api/admin/comments/${id}/reject`, {}, { token }),

  deleteComment: (token: string, id: string) =>
    api.delete(`/api/admin/comments/${id}`, { token }),
};
