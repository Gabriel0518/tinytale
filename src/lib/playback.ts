import { API_URL } from '@/lib/api';
import type { StreamPlaybackInfo } from '@/types';

function joinOriginAndPath(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function forceHttpsForPublicHost(url: string): string {
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:') {
      const host = parsed.hostname.toLowerCase();
      const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (!isLocalhost) {
        parsed.protocol = 'https:';
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function resolvePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  fallbackUrl?: string
): string | undefined {
  let source = fallbackUrl;
  if (streamInfo?.playbackPath) {
    source = joinOriginAndPath(API_URL, streamInfo.playbackPath);
  } else if (streamInfo?.playbackUrl) {
    source = streamInfo.playbackUrl;
  }

  if (!source) return source;
  return forceHttpsForPublicHost(source);
}
