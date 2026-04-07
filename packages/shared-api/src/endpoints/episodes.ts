import type { ApiResponse, EpisodeAccessResult, StreamPlaybackInfo } from '@domain';
import type { ApiClient } from '../client/api-client';

export function createEpisodesApi(client: ApiClient) {
  return {
    getStream: (episodeId: string, token?: string) =>
      client.get<ApiResponse<StreamPlaybackInfo> | StreamPlaybackInfo>(`/api/episodes/${episodeId}/stream`, token ? { token } : undefined),
    checkAccess: (episodeId: string, token: string) =>
      client.get<ApiResponse<EpisodeAccessResult> | EpisodeAccessResult>(`/api/episodes/${episodeId}/access`, { token }),
    reportProgress: (episodeId: string, token: string, currentTime: number, duration: number) =>
      client.post<ApiResponse<{ completed: boolean }> | { success: boolean }>(
        `/api/episodes/${episodeId}/progress`,
        {
          currentTime,
          duration,
          completed: currentTime >= duration * 0.9,
        },
        { token }
      ),
  };
}
