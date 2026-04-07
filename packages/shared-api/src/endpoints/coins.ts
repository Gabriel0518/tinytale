import type { ApiClient } from '../client/api-client';

export function createCoinsApi(client: ApiClient) {
  return {
    getBalance: (token: string) => client.get('/api/coins/balance', { token }),
    getTransactions: (token: string, params?: { page?: number; limit?: number }) => {
      const query = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, value]) => value !== undefined && value !== null)
              .map(([key, value]) => [key, String(value)])
          ).toString()
        : '';
      return client.get(`/api/coins/transactions${query ? `?${query}` : ''}`, { token });
    },
    getPackages: () => client.get('/api/payment/packages'),
    redeem: (token: string, code: string) => client.post('/api/coins/redeem', { code }, { token }),
  };
}
