import type { ApiResponse, Category } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createCategoriesApi(client: ApiClient) {
  return {
    getAll: () => client.get<ApiResponse<Category[]>>('/api/categories'),
  };
}
