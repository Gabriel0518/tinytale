'use client';

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import type { SubtitleTrack } from '@/types';
import 'video.js/dist/video-js.css';

interface CloudflarePlayerProps {
  streamVideoId?: string;
  videoUrl?: string;
  signedToken?: string;
  poster?: string;
  autoplay?: boolean;
  subtitles?: SubtitleTrack[];
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export interface CloudflarePlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getPlayer: () => ReturnType<typeof import('video.js').default> | null;
}

const CF_STREAM_SUBDOMAIN = process.env.NEXT_PUBLIC_CF_STREAM_SUBDOMAIN || 'mock-subdomain';

function buildHlsUrl(videoId: string, token?: string): string {
  const base = `https://customer-${CF_STREAM_SUBDOMAIN}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  return token ? `${base}?token=${token}` : base;
}

const CloudflarePlayer = forwardRef<CloudflarePlayerHandle, CloudflarePlayerProps>(
  function CloudflarePlayer(
    {
      streamVideoId,
      videoUrl,
      signedToken,
      poster,
      autoplay = false,
      subtitles = [],
      onTimeUpdate,
      onEnded,
      onError,
      onReady,
      onPlay,
      onPause,
      className,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<ReturnType<typeof import('video.js').default> | null>(null);
    const callbacksRef = useRef({
      onTimeUpdate,
      onEnded,
      onError,
      onReady,
      onPlay,
      onPause,
    });

    // Keep callbacks ref in sync without re-initialising the player
    useEffect(() => {
      callbacksRef.current = { onTimeUpdate, onEnded, onError, onReady, onPlay, onPause };
    }, [onTimeUpdate, onEnded, onError, onReady, onPlay, onPause]);

    // Expose imperative methods to parent via ref
    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      seek: (time: number) => playerRef.current?.currentTime(time),
      setVolume: (vol: number) => playerRef.current?.volume(vol),
      setMuted: (muted: boolean) => playerRef.current?.muted(muted),
      setPlaybackRate: (rate: number) => playerRef.current?.playbackRate(rate),
      getPlayer: () => playerRef.current,
    }));

    // Resolve the video source — prefer backend-provided videoUrl (has correct subdomain)
    const getSource = useCallback(() => {
      if (videoUrl) {
        const isHls = videoUrl.includes('.m3u8');
        return { src: videoUrl, type: isHls ? 'application/x-mpegURL' as const : 'video/mp4' as const };
      }
      if (streamVideoId) {
        return {
          src: buildHlsUrl(streamVideoId, signedToken),
          type: 'application/x-mpegURL' as const,
        };
      }
      return null;
    }, [streamVideoId, signedToken, videoUrl]);

    // Initialise Video.js player
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const source = getSource();
      if (!source || !videoRef.current) return;

      let disposed = false;

      const initPlayer = async () => {
        const videojs = (await import('video.js')).default;

        if (disposed || !videoRef.current) return;

        // Create a fresh video element inside the container div
        const videoElement = document.createElement('video-js');
        videoElement.classList.add('video-js', 'vjs-big-play-centered');
        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
          controls: false,
          fluid: true,
          responsive: true,
          preload: 'auto',
          autoplay,
          poster: poster || undefined,
          sources: [source],
        });

        playerRef.current = player;

        // Wire up events
        player.on('timeupdate', () => {
          const t = player.currentTime() ?? 0;
          const d = player.duration() ?? 0;
          callbacksRef.current.onTimeUpdate?.(t, d);
        });

        player.on('ended', () => callbacksRef.current.onEnded?.());

        player.on('error', () => {
          const err = player.error();
          callbacksRef.current.onError?.(err?.message ?? 'Unknown playback error');
        });

        player.on('loadedmetadata', () => callbacksRef.current.onReady?.());
        player.on('play', () => callbacksRef.current.onPlay?.());
        player.on('pause', () => callbacksRef.current.onPause?.());

        // Add subtitle tracks
        subtitles.forEach((track) => {
          player.addRemoteTextTrack(
            {
              kind: 'subtitles',
              srclang: track.language,
              label: track.label,
              src: track.src,
            },
            false,
          );
        });
      };

      initPlayer();

      // Cleanup on unmount or source change
      return () => {
        disposed = true;
        const player = playerRef.current;
        if (player && !player.isDisposed()) {
          player.dispose();
          playerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSource, autoplay, poster]);

    return (
      <div
        data-vjs-player
        ref={videoRef}
        className={className}
      />
    );
  },
);

CloudflarePlayer.displayName = 'CloudflarePlayer';

export default CloudflarePlayer;
