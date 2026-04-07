import type { ApiResponse, Review } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createReviewsApi(client: ApiClient) {
  return {
    getByDrama: (dramaId: string) => client.get<ApiResponse<Review[]> | Review[]>(`/api/dramas/${dramaId}/reviews`),
    add: (dramaId: string, token: string, rating: number, content: string) =>
      client.post<ApiResponse<Review> | Review>(`/api/dramas/${dramaId}/reviews`, { rating, content }, { token }),
  };
}
