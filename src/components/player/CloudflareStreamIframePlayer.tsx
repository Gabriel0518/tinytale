'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

declare global {
  interface Window {
    Stream?: (target: HTMLIFrameElement | string) => CloudflareStreamPlayerApi;
  }
}

type CloudflareStreamPlayerApi = {
  play?: () => Promise<void> | void;
  pause?: () => Promise<void> | void;
  currentTime?: number;
  duration?: number;
  muted?: boolean;
  playbackRate?: number;
  addEventListener?: (eventName: string, listener: (event?: any) => void) => void;
  removeEventListener?: (eventName: string, listener: (event?: any) => void) => void;
};

interface CloudflareStreamIframePlayerProps {
  streamVideoId?: string;
  videoUrl?: string;
  signedToken?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  initialSeekTime?: number;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export interface CloudflareStreamIframePlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getDuration: () => number;
  enterPictureInPicture: () => Promise<void>;
  exitPictureInPicture: () => Promise<void>;
  isPictureInPictureActive: () => boolean;
  isPictureInPictureSupported: () => boolean;
}

const CF_STREAM_SDK_URL = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
const CF_STREAM_SUBDOMAIN = process.env.NEXT_PUBLIC_CF_STREAM_SUBDOMAIN || '';

function logIframeDebug(message: string) {
  console.log(`[CloudflareIframe] ${message}`);
}

function normalizeCloudflareOrigin(videoUrl?: string): string | null {
  const raw = String(videoUrl || '').trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes('cloudflarestream.com')) {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function buildIframeBaseUrl(streamVideoId?: string, videoUrl?: string, signedToken?: string): string | null {
  const origin = normalizeCloudflareOrigin(videoUrl)
    || (CF_STREAM_SUBDOMAIN ? `https://${CF_STREAM_SUBDOMAIN}.cloudflarestream.com` : null);

  if (!origin) return null;

  const pathKey = String(signedToken || streamVideoId || '').trim();
  if (!pathKey) return null;

  return `${origin}/${pathKey}/iframe`;
}

function buildIframeSrc(
  streamVideoId?: string,
  videoUrl?: string,
  signedToken?: string,
  autoplay?: boolean,
  muted?: boolean,
  poster?: string,
): string | null {
  const baseUrl = buildIframeBaseUrl(streamVideoId, videoUrl, signedToken);
  if (!baseUrl) return null;

  const parsed = new URL(baseUrl);
  parsed.searchParams.set('controls', 'false');
  parsed.searchParams.set('preload', 'auto');
  if (autoplay) {
    parsed.searchParams.set('autoplay', 'true');
  }
  if (muted) {
    parsed.searchParams.set('muted', 'true');
  }
  if (poster) {
    parsed.searchParams.set('poster', poster);
  }

  return parsed.toString();
}

function loadCloudflareSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (typeof window.Stream === 'function') {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${CF_STREAM_SDK_URL}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      if (typeof window.Stream === 'function') {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Cloudflare Stream SDK')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CF_STREAM_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cloudflare Stream SDK'));
    document.head.appendChild(script);
  });
}

const CloudflareStreamIframePlayer = forwardRef<
  CloudflareStreamIframePlayerHandle,
  CloudflareStreamIframePlayerProps
>(function CloudflareStreamIframePlayer(
  {
    streamVideoId,
    videoUrl,
    signedToken,
    poster,
    autoplay = false,
    muted = false,
    initialSeekTime = 0,
    onTimeUpdate,
    onEnded,
    onError,
    onReady,
    onPlay,
    onPause,
    className = '',
  },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<CloudflareStreamPlayerApi | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const playbackRateRef = useRef(1);
  const [sdkReady, setSdkReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeSrc = useMemo(
    () => buildIframeSrc(streamVideoId, videoUrl, signedToken, autoplay, muted, poster),
    [autoplay, muted, poster, signedToken, streamVideoId, videoUrl],
  );

  useImperativeHandle(ref, () => ({
    play: () => {
      try {
        void playerRef.current?.play?.();
      } catch {
        // Ignore imperative playback errors and let the embedded player recover.
      }
    },
    pause: () => {
      try {
        void playerRef.current?.pause?.();
      } catch {
        // Ignore pause failures from the embedded player.
      }
    },
    seek: (time: number) => {
      if (!playerRef.current) return;
      playerRef.current.currentTime = Math.max(0, time);
      currentTimeRef.current = Math.max(0, time);
    },
    seekBy: (deltaSeconds: number) => {
      if (!playerRef.current) return;
      const nextTime = Math.max(0, currentTimeRef.current + deltaSeconds);
      playerRef.current.currentTime = nextTime;
      currentTimeRef.current = nextTime;
    },
    setMuted: (nextMuted: boolean) => {
      if (!playerRef.current) return;
      playerRef.current.muted = nextMuted;
    },
    setPlaybackRate: (rate: number) => {
      if (!playerRef.current) return;
      playbackRateRef.current = rate;
      playerRef.current.playbackRate = rate;
    },
    getPlaybackRate: () => playbackRateRef.current,
    getDuration: () => durationRef.current,
    enterPictureInPicture: async () => undefined,
    exitPictureInPicture: async () => undefined,
    isPictureInPictureActive: () => false,
    isPictureInPictureSupported: () => false,
  }), []);

  useEffect(() => {
    let cancelled = false;

    void loadCloudflareSdk()
      .then(() => {
        if (!cancelled) {
          setSdkReady(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load Cloudflare Stream SDK';
        logIframeDebug(message);
        onError?.(message);
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [iframeSrc]);

  useEffect(() => {
    if (!sdkReady || !iframeLoaded || !iframeRef.current || typeof window.Stream !== 'function') {
      return undefined;
    }

    const player = window.Stream(iframeRef.current);
    playerRef.current = player;
    logIframeDebug(`attach autoplay=${autoplay} muted=${muted} src=${iframeSrc || 'n/a'}`);

    const attachListener = (eventName: string, listener: (event?: any) => void) => {
      player.addEventListener?.(eventName, listener);
      return () => player.removeEventListener?.(eventName, listener);
    };

    const lastTimeupdateLogRef = { value: -1 };

    const cleanups = [
      attachListener('loadedmetadata', () => {
        durationRef.current = Number(player.duration || durationRef.current || 0);
        if (initialSeekTime > 0) {
          player.currentTime = initialSeekTime;
          currentTimeRef.current = initialSeekTime;
        }
        playbackRateRef.current = Number(player.playbackRate || playbackRateRef.current || 1);
        logIframeDebug(`loadedmetadata duration=${durationRef.current.toFixed(2)}`);
        onReady?.();
      }),
      attachListener('timeupdate', () => {
        currentTimeRef.current = Number(player.currentTime || 0);
        durationRef.current = Number(player.duration || durationRef.current || 0);
        onTimeUpdate?.(currentTimeRef.current, durationRef.current);
        const sec = Math.floor(currentTimeRef.current);
        if (sec !== lastTimeupdateLogRef.value && (sec <= 5 || sec % 10 === 0)) {
          lastTimeupdateLogRef.value = sec;
          logIframeDebug(`timeupdate t=${currentTimeRef.current.toFixed(2)} dur=${durationRef.current.toFixed(2)}`);
        }
      }),
      attachListener('playing', () => {
        logIframeDebug(`playing current=${Number(player.currentTime || 0).toFixed(2)}`);
      }),
      attachListener('waiting', () => {
        logIframeDebug(`waiting current=${Number(player.currentTime || 0).toFixed(2)}`);
      }),
      attachListener('stalled', () => {
        logIframeDebug(`stalled current=${Number(player.currentTime || 0).toFixed(2)}`);
      }),
      attachListener('play', () => {
        logIframeDebug(`play current=${Number(player.currentTime || 0).toFixed(2)}`);
        onPlay?.();
      }),
      attachListener('pause', () => {
        logIframeDebug(`pause current=${Number(player.currentTime || 0).toFixed(2)}`);
        onPause?.();
      }),
      attachListener('ended', () => {
        logIframeDebug('ended');
        onEnded?.();
      }),
      attachListener('error', (event?: any) => {
        const message = typeof event?.message === 'string' && event.message.trim()
          ? event.message
          : 'Cloudflare iframe playback error';
        logIframeDebug(`error ${message}`);
        onError?.(message);
      }),
    ];

    if (autoplay) {
      try {
        void player.play?.();
      } catch {
        // Let the player settle and rely on the first user gesture as fallback.
      }
    }

    return () => {
      cleanups.forEach((dispose) => dispose());
      if (playerRef.current === player) {
        playerRef.current = null;
      }
    };
  }, [autoplay, iframeLoaded, iframeSrc, initialSeekTime, muted, onEnded, onError, onPause, onPlay, onReady, onTimeUpdate, sdkReady]);

  if (!iframeSrc) {
    return <div className={`h-full w-full bg-black ${className}`} />;
  }

  return (
    <div className={`h-full w-full bg-black ${className}`}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="Cloudflare Stream Player"
        className="h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
});

export default CloudflareStreamIframePlayer;
