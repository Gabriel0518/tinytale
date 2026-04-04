import { getApiBaseUrl } from '@/lib/api';
import type { StreamPlaybackInfo } from '@/types';

function joinOriginAndPath(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function isLoopbackOrPrivateHostname(hostname: string): boolean {
  const value = hostname.trim().toLowerCase();
  if (!value) return false;
  if (value === 'localhost' || value === '127.0.0.1' || value === '::1') return true;
  if (value.endsWith('.local')) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(value)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(value)) return true;

  const match = value.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
  if (!match) return false;

  const secondOctet = Number.parseInt(match[1], 10);
  return Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
}

function resolveClientPlaybackUrl(url: string): string {
  if (typeof window === 'undefined') {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (isLoopbackOrPrivateHostname(parsed.hostname)) {
      return joinOriginAndPath(getApiBaseUrl(), `${parsed.pathname}${parsed.search}`);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function forceHttpsForPublicHost(url: string): string {
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:') {
      if (!isLoopbackOrPrivateHostname(parsed.hostname)) {
        parsed.protocol = 'https:';
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function resolvePlaybackAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return forceHttpsForPublicHost(resolveClientPlaybackUrl(url));
}

export function resolvePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  fallbackUrl?: string
): string | undefined {
  let source = fallbackUrl;
  if (streamInfo?.playbackPath) {
    source = joinOriginAndPath(getApiBaseUrl(), streamInfo.playbackPath);
  } else if (streamInfo?.playbackUrl) {
    source = resolveClientPlaybackUrl(streamInfo.playbackUrl);
  }

  return resolvePlaybackAssetUrl(source);
}
