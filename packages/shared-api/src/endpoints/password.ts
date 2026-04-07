import type { ApiClient } from '../client/api-client';

export function createPasswordApi(client: ApiClient) {
  return {
    sendResetCode: (email: string) => client.post('/api/auth/reset-password', { email }),
    verifyCode: (email: string, code: string) => client.post('/api/auth/verify-code', { email, code }),
    resetPassword: (email: string, code: string, newPassword: string) =>
      client.post('/api/auth/reset-password/confirm', { email, code, newPassword }),
  };
}
