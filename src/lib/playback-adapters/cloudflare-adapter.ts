import type { StreamPlaybackInfo } from '@/types';
import { resolvePlaybackAssetUrl, resolvePlaybackSource } from '@/lib/playback';
import type { NormalizedPlaybackSource } from '@/lib/playback-adapters/types';

export function createCloudflarePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  fallbackUrl?: string
): NormalizedPlaybackSource {
  const normalizedSubtitleTracks = (streamInfo?.subtitles || []).flatMap((track) => {
    const resolvedSrc = resolvePlaybackAssetUrl(track?.src);
    if (!resolvedSrc) return [];
    return [{
      ...track,
      src: resolvedSrc,
    }];
  });

  const fallbackSubtitleTrack =
    normalizedSubtitleTracks.length
      ? []
      : streamInfo?.subtitleUrl
        ? [
            {
              language: 'en',
              label: 'English',
              src: resolvePlaybackAssetUrl(streamInfo.subtitleUrl) || streamInfo.subtitleUrl,
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
    subtitles: normalizedSubtitleTracks.length ? normalizedSubtitleTracks : fallbackSubtitleTrack,
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
