import type { ApiClient } from '../client/api-client';

export function createSubscriptionApi(client: ApiClient) {
  return {
    getPlans: () => client.get('/api/payment/vip/plans'),
    getStatus: (token: string) => client.get('/api/payment/vip/status', { token }),
  };
}
