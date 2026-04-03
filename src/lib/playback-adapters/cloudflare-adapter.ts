import type { StreamPlaybackInfo } from '@/types';
import { resolvePlaybackSource } from '@/lib/playback';
import type { NormalizedPlaybackSource } from '@/lib/playback-adapters/types';

export function createCloudflarePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  _fallbackUrl?: string
): NormalizedPlaybackSource {
  const fallbackSubtitleTrack =
    streamInfo?.subtitles?.length
      ? []
      : streamInfo?.subtitleUrl
        ? [
            {
              language: 'en',
              label: 'English',
              src: streamInfo.subtitleUrl,
            },
          ]
        : [];

  // CRITICAL: Only use streamInfo-provided URLs, never fallback to unsigned feed URLs
  // Feed URLs are raw episode.videoUrl which lack required signed tokens
  const playbackUrl = resolvePlaybackSource(streamInfo, undefined);

  return {
    platform: 'cloudflare',
    streamVideoId: streamInfo?.videoUid,
    playbackUrl,
    rawVideoUrl: streamInfo?.videoUrl,
    signedToken: streamInfo?.signedToken,
    subtitles: streamInfo?.subtitles?.length ? streamInfo.subtitles : fallbackSubtitleTrack,
    qualityOptions: streamInfo?.qualityOptions || [],
    audioOptions: [
      {
        id: 'default',
        label: 'Original',
        isDefault: true,
      },
    ],
  };
}
