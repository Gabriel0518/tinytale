import type { ApiResponse } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createSettingsApi(client: ApiClient) {
  return {
    getSettings: (token: string) => client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/api/user/settings', { token }),
    updateSettings: (token: string, data: Record<string, unknown>) =>
      client.put<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/api/user/settings', data, { token }),
    registerPushDevice: (
      token: string,
      data: { deviceToken: string; platform?: string; lastRegisteredAt?: string; appVersion?: string }
    ) =>
      client.post<ApiResponse<Record<string, unknown>> | Record<string, unknown>>(
        '/api/user/notifications/push/register',
        data,
        { token }
      ),
    unregisterPushDevice: (token: string, data: { deviceToken: string }) =>
      client.post<ApiResponse<Record<string, unknown>> | Record<string, unknown>>(
        '/api/user/notifications/push/unregister',
        data,
        { token }
      ),
    sendTestPush: (
      token: string,
      data?: { title?: string; body?: string; path?: string; route?: string; url?: string }
    ) =>
      client.post<ApiResponse<Record<string, unknown>> | Record<string, unknown>>(
        '/api/user/notifications/push/test',
        data || {},
        { token }
      ),
  };
}
