import type { ApiResponse } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createProfileApi(client: ApiClient) {
  return {
    update: (token: string, data: { nickname?: string; avatar?: string }) =>
      client.put<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/api/user/profile', data, { token }),
    changePassword: (token: string, oldPassword: string, newPassword: string) =>
      client.put<ApiResponse<Record<string, unknown>> | Record<string, unknown>>(
        '/api/user/password',
        { oldPassword, newPassword },
        { token }
      ),
    getPurchases: (token: string, params?: { page?: number; type?: string }) => {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      return client.get<ApiResponse<unknown[]> | unknown[]>(`/api/user/purchases${query ? `?${query}` : ''}`, { token });
    },
  };
}
