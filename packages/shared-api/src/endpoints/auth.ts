import type { ApiClient } from '../client/api-client';

export function createAuthApi(client: ApiClient) {
  return {
    login: (email: string, password: string, turnstileToken?: string) =>
      client.post('/api/auth/login', { email, password, turnstileToken }),
    checkEmailAvailability: (email: string) =>
      client.get<{ success: boolean; data: { email: string; available: boolean; registered: boolean } }>(
        `/api/auth/check-email?email=${encodeURIComponent(email)}`
      ),
    register: (email: string, password: string, nickname: string, referredBy?: string) =>
      client.post('/api/auth/register', { email, password, nickname, referredBy }),
    googleLogin: (credential: string | { credential?: string; accessToken?: string; idToken?: string }) =>
      client.post('/api/auth/google', typeof credential === 'string' ? { credential } : credential),
    facebookLogin: (accessToken: string) => client.post('/api/auth/facebook', { accessToken }),
    getMe: (token: string) => client.get('/api/auth/me', { token }),
  };
}
