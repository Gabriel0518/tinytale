const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://api.tinytale.top' : 'http://localhost:7002');

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(options: FetchOptions = {}): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    return {
      ...headers,
      ...normalizeHeaders(options.headers),
    };
  }

  async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

  async post<T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
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

  async put<T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
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

  async patch<T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> {
    const { token, ...requestOptions } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
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

  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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

  getDramaTranslations: (id: string, token = getAdminToken()) =>
    api.get(`/api/dramas/${id}/translations`, { token }),

  saveDramaTranslation: (
    id: string,
    language: string,
    data: {
      title: string;
      description?: string;
      seoTitle?: string;
      seoDescription?: string;
      status?: 'auto' | 'reviewed' | 'published';
      translator?: string;
      qualityScore?: number;
    },
    token = getAdminToken()
  ) =>
    api.put(`/api/dramas/${id}/translations/${language}`, data, { token }),

  autoTranslateDrama: (
    id: string,
    targetLanguage: string,
    token = getAdminToken()
  ) =>
    api.post(`/api/dramas/${id}/translations/auto`, { targetLanguage }, { token }),

  deleteDramaTranslation: (id: string, language: string, token = getAdminToken()) =>
    api.delete(`/api/dramas/${id}/translations/${language}`, { token }),

  // Episodes
  getEpisodes: (dramaId?: string, token = getAdminToken()) =>
    api.get(`/api/admin/episodes${dramaId ? `?dramaId=${dramaId}` : ''}`, { token }),

  createEpisode: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/episodes', data, { token }),

  updateEpisode: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/episodes/${id}`, data, { token }),

  deleteEpisode: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/episodes/${id}`, { token }),

  autoSplit: (
    data: {
      sourceVideoUid: string;
      episodeDuration: number;
      dramaId: string;
      uploadSessionId?: string;
      dramaTitle?: string;
      sourceSubtitleUrl?: string;
      sourceSubtitleFormat?: 'srt' | 'vtt';
      subtitleLanguage?: string;
    },
    token = getAdminToken()
  ) =>
    api.post('/api/admin/upload/auto-split', data, { token }),

  getClipStatus: (uids: string[], token = getAdminToken()) =>
    api.get(`/api/admin/upload/clip-status?uids=${uids.join(',')}`, { token }),

  cleanupUploadSession: (uploadSessionId: string, token = getAdminToken()) =>
    api.post('/api/admin/upload/video/cleanup', { uploadSessionId }, { token }),

  uploadSubtitleFile: async (file: File, token = getAdminToken()) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_URL}/api/admin/upload/subtitle`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Subtitle upload failed');
    }
    return data;
  },

  getEpisodeSubtitles: (episodeId: string, token = getAdminToken()) =>
    api.get(`/api/admin/episodes/${episodeId}/subtitles`, { token }),

  createEpisodeSubtitle: (
    episodeId: string,
    payload: {
      language: string;
      fileUrl: string;
      format?: 'srt' | 'vtt';
      label?: string;
      source?: 'upload' | 'ai_generated';
      isDefault?: boolean;
    },
    token = getAdminToken()
  ) => api.post(`/api/admin/episodes/${episodeId}/subtitles`, payload, { token }),

  updateEpisodeSubtitle: (
    episodeId: string,
    subtitleId: string,
    payload: {
      language?: string;
      fileUrl?: string;
      format?: 'srt' | 'vtt';
      label?: string;
      source?: 'upload' | 'ai_generated';
      status?: 'pending' | 'processing' | 'ready' | 'failed';
      isDefault?: boolean;
    },
    token = getAdminToken()
  ) => api.put(`/api/admin/episodes/${episodeId}/subtitles/${subtitleId}`, payload, { token }),

  deleteEpisodeSubtitle: (episodeId: string, subtitleId: string, token = getAdminToken()) =>
    api.delete(`/api/admin/episodes/${episodeId}/subtitles/${subtitleId}`, { token }),

  translateEpisodeSubtitle: (
    episodeId: string,
    subtitleId: string,
    targetLanguages?: string[],
    token = getAdminToken()
  ) => api.post(`/api/admin/episodes/${episodeId}/subtitles/${subtitleId}/translate`, { targetLanguages }, { token }),

  getSubtitleTranslationTask: (taskId: string, token = getAdminToken()) =>
    api.get(`/api/admin/subtitle-translation/tasks/${taskId}`, { token }),

  retryFailedEpisodeSubtitle: (
    episodeId: string,
    subtitleId: string,
    token = getAdminToken()
  ) => api.post(`/api/admin/episodes/${episodeId}/subtitles/${subtitleId}/retry-failed`, {}, { token }),

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

  // Playlists
  getPlaylists: (token = getAdminToken()) =>
    api.get('/api/admin/playlists', { token }),

  createPlaylist: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/playlists', data, { token }),

  updatePlaylist: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/playlists/${id}`, data, { token }),

  deletePlaylist: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/playlists/${id}`, { token }),

  // Banners
  getBanners: (token = getAdminToken()) =>
    api.get('/api/admin/banners', { token }),

  createBanner: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/banners', data, { token }),

  updateBanner: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/banners/${id}`, data, { token }),

  deleteBanner: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/banners/${id}`, { token }),

  // Hero Banners
  getHeroBanners: (token = getAdminToken()) =>
    api.get('/api/admin/hero-banners', { token }),

  createHeroBanner: (data: any, token = getAdminToken()) =>
    api.post('/api/admin/hero-banners', data, { token }),

  updateHeroBanner: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/hero-banners/${id}`, data, { token }),

  deleteHeroBanner: (id: string, token = getAdminToken()) =>
    api.delete(`/api/admin/hero-banners/${id}`, { token }),

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

  resetAdminPassword: (id: string, password: string, sendEmail = false, token = getAdminToken()) =>
    api.post(`/api/admin/settings/admins/${id}/reset-password`, { password, sendEmail }, { token }),

  // Settings - System Settings
  getSettings: (category?: string, token = getAdminToken()) =>
    api.get(`/api/admin/settings/settings${category ? `?category=${category}` : ''}`, { token }),

  saveSettings: (settings: Array<{ key: string; value: any; category?: string }>, token = getAdminToken()) =>
    api.put('/api/admin/settings/settings', { settings }, { token }),

  // Settings - Cloudflare Resource Cleanup
  scanResourceCleanup: (
    payload: {
      targets?: Array<'stream' | 'r2'>;
      retentionHours?: number;
      maxDeleteCount?: number;
      prefixes?: string[];
    },
    token = getAdminToken()
  ) => api.post('/api/admin/settings/resource-cleanup/scan', payload, { token }),

  executeResourceCleanup: (
    payload: {
      targets?: Array<'stream' | 'r2'>;
      retentionHours?: number;
      maxDeleteCount?: number;
      prefixes?: string[];
    },
    token = getAdminToken()
  ) => api.post('/api/admin/settings/resource-cleanup/execute', payload, { token }),

  getLastResourceCleanupReport: (token = getAdminToken()) =>
    api.get('/api/admin/settings/resource-cleanup/last-report', { token }),

  getLanguageRegionLibrary: (force = false, token = getAdminToken()) =>
    api.get(`/api/i18n/region-library${force ? '?force=1' : ''}`, { token }),

  // Settings - Country Catalog
  getCountryCatalog: (
    params?: { q?: string; tier?: number | ''; enabled?: 'true' | 'false' | ''; page?: number; limit?: number },
    token = getAdminToken()
  ) => {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : '';
    return api.get(`/api/admin/settings/countries${query ? `?${query}` : ''}`, { token });
  },

  updateCountryCatalogItem: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/settings/countries/${id}`, data, { token }),

  setCountryCatalogEnabled: (id: string, enabled: boolean, token = getAdminToken()) =>
    api.patch(`/api/admin/settings/countries/${id}/enabled`, { enabled }, { token }),

  importCountryCatalog: (rows: any[], mode: 'upsert' | 'replace' = 'upsert', token = getAdminToken()) =>
    api.post('/api/admin/settings/countries/import', { rows, mode }, { token }),

  exportCountryCatalog: async (format: 'tsv' | 'csv' | 'json' = 'tsv', token = getAdminToken()) => {
    const response = await fetch(`${API_URL}/api/admin/settings/countries/export?format=${format}`, {
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
    const matched = contentDisposition.match(/filename="?([^"]+)"?/i);
    const filename = matched?.[1] || `country-catalog.${format}`;
    return { blob, filename };
  },

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

  // Creator management
  getCreatorAdminDashboard: (token = getAdminToken()) =>
    api.get('/api/admin/creators/dashboard', { token }),

  getCreatorApplications: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/applications${query ? `?${query}` : ''}`, { token });
  },

  getCreatorApplication: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/applications/${id}`, { token }),

  reviewCreatorApplication: (id: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/applications/${id}/review`, data, { token }),

  getCreators: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creators${query ? `?${query}` : ''}`, { token });
  },

  getCreator: (id: string, token = getAdminToken()) =>
    api.get(`/api/admin/creators/${id}`, { token }),

  updateCreator: (id: string, data: any, token = getAdminToken()) =>
    api.put(`/api/admin/creators/${id}`, data, { token }),

  getCreatorContentReviews: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/content-reviews${query ? `?${query}` : ''}`, { token });
  },

  getCreatorContentReview: (dramaId: string, token = getAdminToken()) =>
    api.get(`/api/admin/content-reviews/${dramaId}`, { token }),

  reviewCreatorContent: (dramaId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/content-reviews/${dramaId}/review`, data, { token }),

  getCreatorDmcaCases: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/dmca${query ? `?${query}` : ''}`, { token });
  },

  reviewCreatorDmcaCase: (creatorId: string, caseId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/dmca/${creatorId}/cases/${caseId}/review`, data, { token }),

  getCreatorBankAccounts: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creator-bank-accounts${query ? `?${query}` : ''}`, { token });
  },

  reviewCreatorBankAccount: (creatorId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/creator-bank-accounts/${creatorId}/review`, data, { token }),

  getCreatorSettlements: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creator-settlements${query ? `?${query}` : ''}`, { token });
  },

  reviewCreatorSettlement: (creatorId: string, statementId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/creator-settlements/${creatorId}/${statementId}/review`, data, { token }),

  getCreatorPayoutRequests: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creator-payout-requests${query ? `?${query}` : ''}`, { token });
  },

  reviewCreatorPayoutRequest: (creatorId: string, statementId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/creator-payout-requests/${creatorId}/${statementId}/review`, data, { token }),

  getCreatorRevenueOverview: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creator-revenue${query ? `?${query}` : ''}`, { token });
  },

  getCreatorTickets: (params?: Record<string, any>, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return api.get(`/api/admin/creator-tickets${query ? `?${query}` : ''}`, { token });
  },

  getCreatorTicket: (ticketId: string, token = getAdminToken()) =>
    api.get(`/api/admin/creator-tickets/${ticketId}`, { token }),

  replyCreatorTicket: (ticketId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/creator-tickets/${ticketId}/reply`, data, { token }),

  updateCreatorTicketStatus: (ticketId: string, data: any, token = getAdminToken()) =>
    api.post(`/api/admin/creator-tickets/${ticketId}/status`, data, { token }),

  getCreatorPolicies: (token = getAdminToken()) =>
    api.get('/api/admin/creator-policies', { token }),

  updateCreatorPolicies: (data: any, token = getAdminToken()) =>
    api.put('/api/admin/creator-policies', data, { token }),

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

  getRolloutReadiness: (windowDays = 7, token = getAdminToken()) =>
    api.get(`/api/admin/rollout/readiness?windowDays=${windowDays}`, { token }),

  getRolloutTrends: (days = 90, token = getAdminToken()) =>
    api.get(`/api/admin/rollout/trends?days=${days}`, { token }),

  captureRolloutSnapshot: (windowDays = 7, token = getAdminToken()) =>
    api.post('/api/admin/rollout/snapshots/capture', { windowDays }, { token }),

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

  getUserLoginLogs: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/login-logs${query ? `?${query}` : ''}`, { token });
  },

  getUserOperationLogs: (userId: string, params?: { page?: number; limit?: number }, token = getAdminToken()) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return api.get(`/api/admin/users/${userId}/operation-logs${query ? `?${query}` : ''}`, { token });
  },
};
