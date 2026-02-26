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
function getAdminToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token') || '';
  }
  return '';
}

export const adminApi = {
  getStats: (token = getAdminToken()) =>
    api.get('/api/admin/stats', { token }),

  getStatsCharts: (token = getAdminToken(), period?: string) =>
    api.get(`/api/admin/stats/charts${period ? `?period=${period}` : ''}`, { token }),

  // Dramas
  getDramas: (params?: { search?: string; status?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/dramas${query ? `?${query}` : ''}`, { token });
  },

  getDrama: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/dramas/${id}`, { token }),

  createDrama: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/dramas', data, { token }),

  updateDrama: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/dramas/${id}`, data, { token }),

  deleteDrama: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/dramas/${id}`, { token }),

  // Episodes
  getEpisodes: (dramaId?: string, token = getAdminToken()) =>
    api.get(`/api/admin/episodes${dramaId ? `?dramaId=${dramaId}` : ''}`, { token }),

  createEpisode: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/episodes', data, { token }),

  updateEpisode: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/episodes/${id}`, data, { token }),

  deleteEpisode: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/episodes/${id}`, { token }),

  autoSplit: (data: { sourceVideoUid: string; episodeDuration: number; dramaId: string }, token = getAdminToken()) =>
    api.post('/api/admin/upload/auto-split', data, { token }),

  getClipStatus: (uids: string[], token = getAdminToken()) =>
    api.get(`/api/admin/upload/clip-status?uids=${uids.join(',')}`, { token }),

  // Users
  getUsers: (params?: { search?: string; status?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users${query ? `?${query}` : ''}`, { token });
  },

  getUser: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/users/${id}`, { token }),

  updateUser: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/users/${id}`, data, { token }),

  // Categories
  getCategories: (token = getAdminToken()) =>
    api.get('/api/admin/categories', { token }),

  createCategory: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/categories', data, { token }),

  updateCategory: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/categories/${id}`, data, { token }),

  deleteCategory: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/categories/${id}`, { token }),

  // Featured
  getFeatured: (type?: string, token = getAdminToken()) =>
    api.get(`/api/admin/featured${type ? `?type=${type}` : ''}`, { token }),

  createFeatured: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/featured', data, { token }),

  updateFeatured: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/featured/${id}`, data, { token }),

  deleteFeatured: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/featured/${id}`, { token }),

  // Transactions / Orders
  getTransactions: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/transactions${query ? `?${query}` : ''}`, { token });
  },

  refundOrder: (id: string, data: { refundAmount: number; coinHandling: string; reason: string; details: string }, token = getAdminToken()) =>
    api.post(`/api/admin/transactions/${id}/refund`, data, { token }),

  // Comments
  getComments: (params?: { dramaId?: string; status?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/comments${query ? `?${query}` : ''}`, { token });
  },

  approveComment: (id: string, token = getAdminToken()) =>
    api.post(`/api/admin/comments/${id}/approve`, {}, { token }),

  rejectComment: (id: string, token = getAdminToken()) =>
    api.post(`/api/admin/comments/${id}/reject`, {}, { token }),

  deleteComment: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/comments/${id}`, { token }),

  // Settings - Roles
  getRoles: (token = getAdminToken()) =>
    api.get('/api/admin/settings/roles', { token }),

  createRole: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/settings/roles', data, { token }),

  updateRole: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/settings/roles/${id}`, data, { token }),

  deleteRole: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/settings/roles/${id}`, { token }),

  // Settings - Admins
  getAdmins: (params?: { search?: string; roleId?: string; status?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return api.get(`/api/admin/settings/admins${query ? `?${query}` : ''}`, { token });
  },

  createAdmin: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/settings/admins', data, { token }),

  updateAdmin: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/settings/admins/${id}`, data, { token }),

  deleteAdmin: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/settings/admins/${id}`, { token }),

  resetAdminPassword: (id: string, password: string, token = getAdminToken()) =>
    api.post(`/api/admin/settings/admins/${id}/reset-password`, { password }, { token }),

  // Settings - System Settings
  getSettings: (category?: string, token = getAdminToken()) =>
    api.get(`/api/admin/settings/settings${category ? `?category=${category}` : ''}`, { token }),

  saveSettings: (settings: Array<{ key: string; value: any; category?: string }>, token = getAdminToken()) =>
    api.put('/api/admin/settings/settings', { settings }, { token }),

  // Settings - VIP Plans
  getVipPlans: (token = getAdminToken()) =>
    api.get('/api/admin/settings/vip-plans', { token }),

  createVipPlan: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/settings/vip-plans', data, { token }),

  updateVipPlan: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/settings/vip-plans/${id}`, data, { token }),

  deleteVipPlan: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/settings/vip-plans/${id}`, { token }),

  // Settings - Logs
  getLogs: (params?: { page?: number; limit?: number; adminId?: string; action?: string; targetType?: string; search?: string; dateFrom?: string; dateTo?: string }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return api.get(`/api/admin/settings/logs${query ? `?${query}` : ''}`, { token });
  },

  // Single Transaction
  getTransaction: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/transactions/${id}`, { token }),

  // Promoter management
  getPromoters: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/promoter/admin/list${query ? `?${query}` : ''}`, { token });
  },

  getPromoter: (id: string, token = getAdminToken()) =>
    api.get(`/api/promoter/admin/${id}`, { token }),

  updatePromoter: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/promoter/admin/${id}`, data, { token }),

  reviewPromoter: (id: string, data: any, token = getAdminToken()) =>
    api.post(`/api/promoter/admin/${id}/review`, data, { token }),

  // Withdrawal management
  getWithdrawals: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/promoter/admin/withdrawals${query ? `?${query}` : ''}`, { token });
  },

  reviewWithdrawal: (id: string, data: any, token = getAdminToken()) =>
    api.post(`/api/promoter/admin/withdrawals/${id}/review`, data, { token }),

  confirmWithdrawalPayment: (id: string, data: any, token = getAdminToken()) =>
    api.post(`/api/promoter/admin/withdrawals/${id}/confirm-payment`, data, { token }),

  // Rankings
  getRankings: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/rankings${query ? `?${query}` : ''}`, { token });
  },

  createRanking: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/rankings', data, { token }),

  updateRanking: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/rankings/${id}`, data, { token }),

  deleteRanking: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/rankings/${id}`, { token }),

  reorderRankings: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/rankings/reorder', data, { token }),

  // Activities (checkin, tasks, campaigns)
  getCheckinConfig: (token = getAdminToken()) =>
    api.get('/api/admin/activities/checkin', { token }),

  updateCheckinConfig: (data: any, token = getAdminToken()) =>
    api.put('/api/admin/activities/checkin', data, { token }),

  getTasksConfig: (token = getAdminToken()) =>
    api.get('/api/admin/activities/tasks', { token }),

  updateTasksConfig: (data: any, token = getAdminToken()) =>
    api.put('/api/admin/activities/tasks', data, { token }),

  getCampaigns: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/activities/campaigns${query ? `?${query}` : ''}`, { token });
  },

  createCampaign: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/activities/campaigns', data, { token }),

  updateCampaign: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/activities/campaigns/${id}`, data, { token }),

  deleteCampaign: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/activities/campaigns/${id}`, { token }),

  // Bulk comment operations
  bulkApproveComments: (ids: string[], token = getAdminToken()) =>
    api.post('/api/admin/comments/bulk/approve', { ids }, { token }),

  bulkRejectComments: (ids: string[], token = getAdminToken()) =>
    api.post('/api/admin/comments/bulk/reject', { ids }, { token }),

  // Coin consumption records
  getCoinRecords: (params?: { search?: string; dramaId?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/coin-records${query ? `?${query}` : ''}`, { token });
  },

  // Finance overview
  getFinanceOverview: (token = getAdminToken()) =>
    api.get('/api/admin/finance/overview', { token }),

  // VIP Subscriptions
  getSubscriptions: (params?: { status?: string; search?: string; page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/subscriptions${query ? `?${query}` : ''}`, { token });
  },

  getSubscription: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/subscriptions/${id}`, { token }),

  cancelSubscription: (id: string, token = getAdminToken()) =>
    api.post(`/api/admin/subscriptions/${id}/cancel`, {}, { token }),

  // User detail tab data
  getUserTransactions: (userId: string, params?: { page?: number; limit?: number; type?: string }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/users/${userId}/transactions${query ? `?${query}` : ''}`, { token });
  },

  getUserConsumption: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/consumption${query ? `?${query}` : ''}`, { token });
  },

  getUserPlayback: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/playback${query ? `?${query}` : ''}`, { token });
  },

  getUserWatchlist: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/watchlist${query ? `?${query}` : ''}`, { token });
  },

  getUserComments: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/comments${query ? `?${query}` : ''}`, { token });
  },

  getUserOperationLogs: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/operation-logs${query ? `?${query}` : ''}`, { token });
  },
};
