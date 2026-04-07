import type { StreamPlaybackInfo } from '@domain';

function joinOriginAndPath(origin: string, path: string) {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function isLoopbackOrPrivateHostname(hostname: string) {
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

function resolveClientPlaybackUrl(url: string, apiBaseUrl?: string, clientOrigin?: string) {
  try {
    const origin = clientOrigin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const parsed = new URL(url, origin);

    if (apiBaseUrl && isLoopbackOrPrivateHostname(parsed.hostname)) {
      return joinOriginAndPath(apiBaseUrl, `${parsed.pathname}${parsed.search}`);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function forceHttpsForPublicHost(url: string, clientOrigin?: string) {
  try {
    const origin = clientOrigin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const parsed = new URL(url, origin);
    if (origin.startsWith('https://') && parsed.protocol === 'http:' && !isLoopbackOrPrivateHostname(parsed.hostname)) {
      parsed.protocol = 'https:';
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function resolvePlaybackSource(
  streamInfo?: StreamPlaybackInfo | null,
  options?: {
    fallbackUrl?: string;
    apiBaseUrl?: string;
    clientOrigin?: string;
  }
) {
  let source = options?.fallbackUrl;

  if (streamInfo?.videoUrl) {
    source = streamInfo.videoUrl;
  } else if (streamInfo?.playbackPath && options?.apiBaseUrl) {
    source = joinOriginAndPath(options.apiBaseUrl, streamInfo.playbackPath);
  } else if (streamInfo?.playbackUrl) {
    source = resolveClientPlaybackUrl(streamInfo.playbackUrl, options?.apiBaseUrl, options?.clientOrigin);
  }

  return source ? forceHttpsForPublicHost(source, options?.clientOrigin) : undefined;
}
