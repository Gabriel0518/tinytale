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
  quality?: string;
  controls?: boolean;
  showNativeBigPlayButton?: boolean;
  activeSubtitleLanguage?: string | null;
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
  seekBy: (deltaSeconds: number) => void;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setSubtitleTrack: (language: string | null) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackRate: () => number;
  enterPictureInPicture: () => Promise<void>;
  exitPictureInPicture: () => Promise<void>;
  isPictureInPictureActive: () => boolean;
  isPictureInPictureSupported: () => boolean;
  getPlayer: () => ReturnType<typeof import('video.js').default> | null;
}

const CF_STREAM_SUBDOMAIN = process.env.NEXT_PUBLIC_CF_STREAM_SUBDOMAIN || '';

type TextTrackListWithEvents = TextTrackList & {
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
};

function normalizeLanguageCode(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function buildHlsUrl(videoId: string, token?: string): string {
  const base = `https://${CF_STREAM_SUBDOMAIN}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  return token ? `${base}?token=${token}` : base;
}

function applyQualityParam(url: string, quality?: string): string {
  if (!url.includes('.m3u8')) return url;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:') {
      const hostname = parsed.hostname.toLowerCase();
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      if (!isLocalhost) {
        parsed.protocol = 'https:';
      }
    }
    parsed.searchParams.set('quality', quality || 'auto');
    return parsed.toString();
  } catch {
    return url;
  }
}

function canUseNativeHls(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const vendor = navigator.vendor || '';
  const isAppleDevice = /iPad|iPhone|iPod|Mac/i.test(`${platform} ${userAgent}`);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|SamsungBrowser|Android/i.test(userAgent) && /Apple/i.test(vendor);

  if (!isAppleDevice || !isSafari) {
    return false;
  }

  const probe = document.createElement('video');
  return Boolean(
    probe.canPlayType('application/vnd.apple.mpegurl') ||
    probe.canPlayType('application/x-mpegURL')
  );
}

const CloudflarePlayer = forwardRef<CloudflarePlayerHandle, CloudflarePlayerProps>(
  function CloudflarePlayer(
    {
      streamVideoId,
      videoUrl,
      signedToken,
      quality = 'auto',
      controls = false,
      showNativeBigPlayButton = false,
      activeSubtitleLanguage = null,
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
    const baseSourceRef = useRef<{ src: string; type: 'application/x-mpegURL' | 'video/mp4' } | null>(null);
    const appliedSourceRef = useRef<string | null>(null);
    const activeSubtitleRef = useRef<string | null>(activeSubtitleLanguage);
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
    const applySubtitleSelection = useCallback((language: string | null) => {
      const player = playerRef.current;
      if (!player || player.isDisposed()) return;

      const textTracks = player.textTracks();
      const target = normalizeLanguageCode(language);
      const targetBase = target.split('-')[0];
      for (let i = 0; i < textTracks.length; i += 1) {
        const track = (textTracks as unknown as Record<number, TextTrack | undefined>)[i];
        if (!track) continue;
        const kind = String(track.kind || '').toLowerCase();
        if (kind && kind !== 'subtitles' && kind !== 'captions') {
          continue;
        }
        const trackLanguage = normalizeLanguageCode(
          track.language || (track as unknown as { srclang?: string }).srclang || ''
        );
        const trackBase = trackLanguage.split('-')[0];
        const shouldShow = Boolean(
          target &&
          (trackLanguage === target || (trackBase && targetBase && trackBase === targetBase))
        );
        try {
          track.mode = shouldShow ? 'showing' : 'disabled';
        } catch {
          // Some browsers throw on mode changes for not-yet-ready tracks; ignore and retry on track events.
        }
      }
    }, []);

    const syncRemoteSubtitleTracks = useCallback((tracks: SubtitleTrack[]) => {
      const player = playerRef.current;
      if (!player || player.isDisposed()) return;

      try {
        const remoteTracks = player.remoteTextTracks?.();
        if (remoteTracks && typeof player.removeRemoteTextTrack === 'function') {
          for (let i = remoteTracks.length - 1; i >= 0; i -= 1) {
            const track = (remoteTracks as unknown as Record<number, TextTrack | undefined>)[i];
            const kind = String(track?.kind || '').toLowerCase();
            if (kind === 'subtitles' || kind === 'captions') {
              player.removeRemoteTextTrack(track as TextTrack);
            }
          }
        }

        tracks.forEach((track) => {
          const language = normalizeLanguageCode(track.language);
          if (!track?.src || !language) return;
          const remoteTrack = player.addRemoteTextTrack(
            {
              kind: 'subtitles',
              srclang: language,
              label: track.label || language.toUpperCase(),
              src: track.src,
              default: language === normalizeLanguageCode(activeSubtitleRef.current),
            },
            false,
          );

          const textTrack = (
            remoteTrack as
              | { track?: TextTrack | null }
              | TextTrack
              | null
              | undefined
          );

          if (textTrack && 'track' in textTrack && textTrack.track) {
            try {
              textTrack.track.mode =
                language === normalizeLanguageCode(activeSubtitleRef.current)
                  ? 'showing'
                  : 'disabled';
            } catch {
              // Ignore mode sync failures for not-yet-ready tracks.
            }
          }
        });
      } catch {
        // Ignore track sync errors to avoid breaking playback.
      }

      applySubtitleSelection(activeSubtitleRef.current);
    }, [applySubtitleSelection]);

    const getVideoElement = useCallback(() => {
      const player = playerRef.current;
      if (!player || player.isDisposed()) return null;
      const element = player.el();
      if (!element) return null;
      return element.querySelector('video');
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      seek: (time: number) => playerRef.current?.currentTime(time),
      seekBy: (deltaSeconds: number) => {
        const player = playerRef.current;
        if (!player || player.isDisposed()) return;
        const currentTime = player.currentTime() ?? 0;
        player.currentTime(Math.max(0, currentTime + deltaSeconds));
      },
      setVolume: (vol: number) => playerRef.current?.volume(vol),
      setMuted: (muted: boolean) => playerRef.current?.muted(muted),
      setPlaybackRate: (rate: number) => playerRef.current?.playbackRate(rate),
      setSubtitleTrack: (language: string | null) => applySubtitleSelection(language),
      getCurrentTime: () => {
        const player = playerRef.current;
        if (!player || player.isDisposed()) return 0;
        return player.currentTime() ?? 0;
      },
      getDuration: () => {
        const player = playerRef.current;
        if (!player || player.isDisposed()) return 0;
        return player.duration() ?? 0;
      },
      getPlaybackRate: () => {
        const player = playerRef.current;
        if (!player || player.isDisposed()) return 1;
        return player.playbackRate() ?? 1;
      },
      enterPictureInPicture: async () => {
        const video = getVideoElement();
        if (!video || typeof video.requestPictureInPicture !== 'function') return;
        await video.requestPictureInPicture();
      },
      exitPictureInPicture: async () => {
        if (typeof document === 'undefined' || !document.pictureInPictureElement) return;
        await document.exitPictureInPicture();
      },
      isPictureInPictureActive: () => {
        const video = getVideoElement();
        if (!video || typeof document === 'undefined') return false;
        return document.pictureInPictureElement === video;
      },
      isPictureInPictureSupported: () => {
        const video = getVideoElement();
        if (!video || typeof document === 'undefined') return false;
        return Boolean(document.pictureInPictureEnabled && typeof video.requestPictureInPicture === 'function');
      },
      getPlayer: () => playerRef.current,
    }), [applySubtitleSelection, getVideoElement]);

    // Resolve base source (without quality param).
    // Priority: backend-provided videoUrl (already contains correct subdomain and path)
    // > locally built HLS URL (only if subdomain env var is configured)
    const getBaseSource = useCallback(() => {
      // Backend-provided videoUrl is the authoritative source (signed, correct domain)
      if (videoUrl) {
        const isHls = videoUrl.includes('.m3u8');
        return {
          src: videoUrl,
          type: isHls ? 'application/x-mpegURL' as const : 'video/mp4' as const,
        };
      }
      // Only build locally if we have a real subdomain configured (not the mock fallback)
      if (streamVideoId && CF_STREAM_SUBDOMAIN && CF_STREAM_SUBDOMAIN !== 'mock-subdomain') {
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

      const baseSource = getBaseSource();
      if (!baseSource || !videoRef.current) return;
      baseSourceRef.current = baseSource;
      const source = baseSource.type === 'application/x-mpegURL'
        ? { ...baseSource, src: applyQualityParam(baseSource.src, quality) }
        : baseSource;
      appliedSourceRef.current = source.src;

      let disposed = false;
      let detachTextTrackListener: (() => void) | null = null;

      const initPlayer = async () => {
        const videojs = (await import('video.js')).default;

        if (disposed || !videoRef.current) return;
        const useNativeHls = source.type === 'application/x-mpegURL' && canUseNativeHls();

        // Create a fresh video element inside the container div
        const videoElement = document.createElement('video-js');
        videoElement.classList.add('video-js');
        if (showNativeBigPlayButton) {
          videoElement.classList.add('vjs-big-play-centered');
        }
        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
          controls,
          bigPlayButton: showNativeBigPlayButton,
          fill: true,
          preload: 'auto',
          autoplay,
          crossorigin: 'anonymous',
          playsinline: true,
          html5: {
            nativeAudioTracks: useNativeHls,
            nativeTextTracks: useNativeHls,
            nativeVideoTracks: useNativeHls,
            vhs: {
              overrideNative: !useNativeHls,
              // 平衡优化：快速启动 + 适度缓冲
              maxBufferLength: 20,              // 最大缓冲 20 秒（平衡首帧速度和流畅度）
              maxBufferSize: 30 * 1000 * 1000,  // 30MB 缓冲区
              maxBufferHole: 0.5,               // 允许 0.5s 缓冲空洞
              // 快速启动优化
              fastQualityChange: true,          // 快速切换画质
              smoothQualityChange: true,        // 平滑画质切换
            },
          },
          poster: poster || undefined,
          sources: [source],
        });

        playerRef.current = player;
        const textTracks = player.textTracks();
        const syncSubtitleTracksOnReady = () => syncRemoteSubtitleTracks(subtitles);
        const syncSubtitleSelection = () => applySubtitleSelection(activeSubtitleRef.current);

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
        player.on('loadedmetadata', syncSubtitleTracksOnReady);
        player.on('loadedmetadata', syncSubtitleSelection);
        player.on('loadeddata', syncSubtitleTracksOnReady);
        player.on('loadeddata', syncSubtitleSelection);
        player.on('play', () => callbacksRef.current.onPlay?.());
        player.on('pause', () => callbacksRef.current.onPause?.());

        syncRemoteSubtitleTracks(subtitles);

        const trackList = textTracks as unknown as TextTrackListWithEvents;
        if (typeof trackList.addEventListener === 'function') {
          const handleTrackAdded: EventListener = () => {
            syncSubtitleSelection();
          };
          trackList.addEventListener('addtrack', handleTrackAdded);
          if (typeof trackList.removeEventListener === 'function') {
            detachTextTrackListener = () => {
              trackList.removeEventListener?.('addtrack', handleTrackAdded);
            };
          }
        }
        syncSubtitleSelection();
      };

      initPlayer();

      // Cleanup on unmount or source change
      return () => {
        disposed = true;
        detachTextTrackListener?.();
        const player = playerRef.current;
        if (player && !player.isDisposed()) {
          try {
            const videoElement = getVideoElement();
            if (videoElement) {
              try {
                videoElement.pause();
              } catch {
                // Ignore pause failures during teardown.
              }
              try {
                if (typeof document !== 'undefined' && document.pictureInPictureElement === videoElement) {
                  void document.exitPictureInPicture();
                }
              } catch {
                // Ignore PiP cleanup failures.
              }
              try {
                videoElement.removeAttribute('src');
                videoElement.load();
              } catch {
                // Ignore native element src cleanup failures.
              }
            }
            player.pause();
          } catch {
            // Ignore player pause failures during teardown.
          }
          player.dispose();
          playerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getBaseSource, autoplay, poster, subtitles, applySubtitleSelection, syncRemoteSubtitleTracks, controls, showNativeBigPlayButton]);

    // Switch HLS quality without rebuilding the player instance.
    useEffect(() => {
      const player = playerRef.current;
      const baseSource = baseSourceRef.current;
      if (!player || player.isDisposed() || !baseSource || baseSource.type !== 'application/x-mpegURL') {
        return;
      }

      const nextSrc = applyQualityParam(baseSource.src, quality);
      if (appliedSourceRef.current === nextSrc) {
        return;
      }

      const currentTime = player.currentTime() ?? 0;
      const wasPaused = player.paused();
      const wasEnded = player.ended();

      appliedSourceRef.current = nextSrc;
      player.src({ src: nextSrc, type: 'application/x-mpegURL' });
      player.one('loadedmetadata', () => {
        if (!player || player.isDisposed()) return;

        const duration = player.duration() ?? 0;
        if (currentTime > 0) {
          const targetTime = duration > 0
            ? Math.max(0, Math.min(currentTime, Math.max(0, duration - 0.2)))
            : currentTime;
          player.currentTime(targetTime);
        }

        if (!wasPaused && !wasEnded) {
          const playbackPromise = player.play();
          if (playbackPromise && typeof (playbackPromise as Promise<void>).catch === 'function') {
            (playbackPromise as Promise<void>).catch(() => undefined);
          }
        }
      });
    }, [quality]);

    useEffect(() => {
      activeSubtitleRef.current = activeSubtitleLanguage;
      applySubtitleSelection(activeSubtitleLanguage);
    }, [activeSubtitleLanguage, applySubtitleSelection]);

    useEffect(() => {
      syncRemoteSubtitleTracks(subtitles);
    }, [subtitles, syncRemoteSubtitleTracks]);

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
