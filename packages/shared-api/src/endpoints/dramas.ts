import type {
  ApiResponse,
  Drama,
  HomepageBanner,
  HomepageFeaturedBuckets,
  HomepageHeroBanner,
  HomepagePlaylist,
} from '@domain';
import type { ApiClient } from '../client/api-client';

export function createDramasApi(client: ApiClient) {
  return {
    getAll: (params?: {
      category?: string;
      sort?: string;
      page?: number;
      limit?: number;
      search?: string;
    }) => {
      const query = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, value]) => value !== undefined && value !== null && value !== '')
              .map(([key, value]) => [key, String(value)])
          ).toString()
        : '';

      return client.get<ApiResponse<Drama[]>>(`/api/dramas${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => client.get<ApiResponse<Drama>>(`/api/dramas/${id}`),
    getFeatured: () => client.get<ApiResponse<HomepageFeaturedBuckets>>('/api/featured'),
    getRankings: (type = 'views') => client.get<ApiResponse<Drama[]>>(`/api/featured/rankings?type=${encodeURIComponent(type)}`),
    getTrending: () => client.get<ApiResponse<Drama[]>>('/api/featured/trending'),
    getPlaylists: () => client.get<ApiResponse<HomepagePlaylist[]>>('/api/playlists'),
    getBanners: () => client.get<ApiResponse<HomepageBanner[]>>('/api/banners'),
    getHeroBanners: () => client.get<ApiResponse<HomepageHeroBanner[]>>('/api/hero-banners'),
    getRelated: (id: string) => client.get<ApiResponse<Drama[]>>(`/api/dramas/${id}/related`),
  };
}
