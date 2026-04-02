import type { SubtitleTrack } from '@/types';

export interface PlaybackAudioOption {
  id: string;
  label: string;
  language?: string;
  isDefault?: boolean;
}

export interface NormalizedPlaybackSource {
  platform: 'cloudflare' | 'generic';
  streamVideoId?: string;
  playbackUrl?: string;
  rawVideoUrl?: string;       // Direct video URL (e.g. raw CF Stream HLS), bypassing API proxy
  signedToken?: string;
  subtitles: SubtitleTrack[];
  qualityOptions: string[];
  audioOptions: PlaybackAudioOption[];
}
