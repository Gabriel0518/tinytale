import type { ApiResponse, Drama } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createUserApi(client: ApiClient) {
  return {
    getFavorites: (token: string) => client.get<ApiResponse<Drama[]> | Drama[]>('/api/user/favorites', { token }),
    addFavorite: (token: string, dramaId: string) =>
      client.post<ApiResponse<{ dramaId: string; favorited: boolean }> | { success: boolean }>(
        '/api/user/favorites',
        { dramaId },
        { token }
      ),
    removeFavorite: (token: string, dramaId: string) =>
      client.delete<ApiResponse<{ dramaId: string; favorited: boolean }> | { success: boolean }>(
        `/api/user/favorites/${dramaId}`,
        { token }
      ),
    getHistory: (token: string) => client.get<ApiResponse<unknown[]> | unknown[]>('/api/user/history', { token }),
    deleteHistory: (token: string) => client.delete<ApiResponse<{ cleared: boolean }> | { success: boolean }>('/api/user/history', { token }),
    deleteHistoryEntry: (token: string, historyId: string) =>
      client.delete<ApiResponse<{ id: string; deleted: boolean }> | { success: boolean }>(`/api/user/history/${historyId}`, { token }),
    getNotifications: (token: string) => client.get<ApiResponse<unknown[]> | unknown[]>('/api/user/notifications', { token }),
    markNotificationRead: (token: string, notificationId: string) =>
      client.put<ApiResponse<{ id: string; read: boolean }> | { success: boolean }>(
        `/api/user/notifications/${notificationId}/read`,
        {},
        { token }
      ),
    markAllNotificationsRead: (token: string) =>
      client.put<ApiResponse<{ updated: boolean }> | { success: boolean }>(
        '/api/user/notifications/read-all',
        {},
        { token }
      ),
  };
}
