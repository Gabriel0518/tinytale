import type { StreamPlaybackInfo } from '@/types';
import { resolvePlaybackSource } from '@/lib/playback';
import type { NormalizedPlaybackSource } from '@/lib/playback-adapters/types';

export function createCloudflarePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  fallbackUrl?: string
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

  // Only pass in already-vetted fallback URLs from the caller. These are
  // either signed API playback URLs or tokenized Cloudflare manifests.
  const playbackUrl = resolvePlaybackSource(streamInfo, fallbackUrl);

  return {
    platform: 'cloudflare',
    streamVideoId: streamInfo?.videoUid,
    playbackUrl,
    rawVideoUrl: streamInfo?.videoUrl || fallbackUrl,
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
