'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import type { SubtitleTrack } from '@/types';
import type { PlaybackAudioOption } from '@/lib/playback-adapters';

function log(msg: string) {
  console.log(`[NativeHls] ${msg}`);
}

function serializeHlsErrorData(data: any): string {
  const summary = {
    type: data?.type,
    details: data?.details,
    fatal: data?.fatal,
    error: data?.error?.message || data?.error || undefined,
    fragUrl: data?.frag?.url,
    partUrl: data?.part?.url,
    contextUrl: data?.context?.url,
    responseUrl:
      data?.response?.url
      || data?.networkDetails?.responseURL
      || data?.networkDetails?.url,
    responseCode: data?.response?.code,
    responseText: data?.response?.text,
    networkType: data?.networkDetails?.constructor?.name,
  };

  try {
    return JSON.stringify(summary);
  } catch {
    return String(summary);
  }
}

function shouldForceHlsJsOnCurrentDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

interface NativeHlsPlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  initialSeekTime?: number;
  subtitles?: SubtitleTrack[];
  activeSubtitleLanguage?: string | null;
  selectedAudioId?: string;
  onAvailableAudioOptionsChange?: (options: PlaybackAudioOption[]) => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export interface NativeHlsPlayerHandle {
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

const NativeHlsPlayer = forwardRef<NativeHlsPlayerHandle, NativeHlsPlayerProps>(
  function NativeHlsPlayer(
    {
      videoUrl,
      poster,
      autoplay = false,
      muted = false,
      controls = false,
      initialSeekTime = 0,
      subtitles = [],
      activeSubtitleLanguage = null,
      selectedAudioId,
      onAvailableAudioOptionsChange,
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
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<any>(null);
    const playbackRateRef = useRef(1);
    const lastLogSecRef = useRef(-1);
    const discoveredAudioTracksRef = useRef<PlaybackAudioOption[]>([]);
    const onAvailableAudioOptionsChangeRef = useRef(onAvailableAudioOptionsChange);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onEndedRef = useRef(onEnded);
    const onErrorRef = useRef(onError);
    const onReadyRef = useRef(onReady);
    const onPlayRef = useRef(onPlay);
    const onPauseRef = useRef(onPause);
    const autoplayRef = useRef(autoplay);
    const mutedRef = useRef(muted);
    const initialSeekTimeRef = useRef(initialSeekTime);

    useEffect(() => {
      onAvailableAudioOptionsChangeRef.current = onAvailableAudioOptionsChange;
      onTimeUpdateRef.current = onTimeUpdate;
      onEndedRef.current = onEnded;
      onErrorRef.current = onError;
      onReadyRef.current = onReady;
      onPlayRef.current = onPlay;
      onPauseRef.current = onPause;
    }, [onAvailableAudioOptionsChange, onEnded, onError, onPause, onPlay, onReady, onTimeUpdate]);

    useEffect(() => {
      autoplayRef.current = autoplay;
      mutedRef.current = muted;
      initialSeekTimeRef.current = initialSeekTime;
    }, [autoplay, initialSeekTime, muted]);

    useImperativeHandle(ref, () => ({
      play: () => {
        try { void videoRef.current?.play(); } catch { /* ignore */ }
      },
      pause: () => {
        try { videoRef.current?.pause(); } catch { /* ignore */ }
      },
      seek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, time);
      },
      seekBy: (delta: number) => {
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + delta);
      },
      setMuted: (m: boolean) => {
        if (videoRef.current) videoRef.current.muted = m;
      },
      setPlaybackRate: (rate: number) => {
        playbackRateRef.current = rate;
        if (videoRef.current) videoRef.current.playbackRate = rate;
      },
      getPlaybackRate: () => playbackRateRef.current,
      getDuration: () => videoRef.current?.duration || 0,
      enterPictureInPicture: async () => {
        await videoRef.current?.requestPictureInPicture?.();
      },
      exitPictureInPicture: async () => {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
      },
      isPictureInPictureActive: () => Boolean(document.pictureInPictureElement === videoRef.current),
      isPictureInPictureSupported: () => Boolean(document.pictureInPictureEnabled && videoRef.current?.requestPictureInPicture),
    }), []);

    const syncSubtitleTrackModes = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      const target = String(activeSubtitleLanguage || '').trim().toLowerCase();
      const targetBase = target.split('-')[0];
      const textTracks = video.textTracks;

      for (let index = 0; index < textTracks.length; index += 1) {
        const track = textTracks[index];
        if (!track) continue;
        const kind = String(track.kind || '').toLowerCase();
        if (kind && kind !== 'subtitles' && kind !== 'captions') continue;

        const language = String(track.language || '').trim().toLowerCase();
        const languageBase = language.split('-')[0];
        const shouldShow = Boolean(
          target &&
          (language === target || (targetBase && languageBase && targetBase === languageBase))
        );

        try {
          track.mode = shouldShow ? 'showing' : 'disabled';
        } catch {
          // Ignore mode sync failures while tracks are still initialising.
        }
      }

      const subtitleTrackCount = Array.from(textTracks || []).filter((track) => {
        const kind = String(track?.kind || '').toLowerCase();
        return kind === 'subtitles' || kind === 'captions';
      }).length;
      log(`subtitle-sync target=${target || 'off'} trackCount=${subtitleTrackCount}`);
    }, [activeSubtitleLanguage]);

    const publishAudioOptions = useCallback((options: PlaybackAudioOption[]) => {
      discoveredAudioTracksRef.current = options;
      onAvailableAudioOptionsChangeRef.current?.(options);
    }, []);

    // Attach HLS.js or use native HLS support
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !videoUrl) return undefined;
      let disposed = false;

      log(`init url=${videoUrl.slice(0, 100)} autoplay=${autoplayRef.current} muted=${mutedRef.current}`);

      // Event listeners
      const events: Array<[string, () => void]> = [
        ['loadstart', () => log(`loadstart readyState=${video.readyState} networkState=${video.networkState}`)],
        ['loadedmetadata', () => {
          log(`loadedmetadata duration=${video.duration?.toFixed(2)} readyState=${video.readyState}`);
          if (initialSeekTimeRef.current > 0) video.currentTime = initialSeekTimeRef.current;
        }],
        ['canplay', () => {
          log(`canplay duration=${video.duration?.toFixed(2)} currentTime=${video.currentTime.toFixed(2)}`);
          onReadyRef.current?.();
        }],
        ['play', () => {
          log(`play currentTime=${video.currentTime.toFixed(2)}`);
          onPlayRef.current?.();
        }],
        ['playing', () => log(`playing currentTime=${video.currentTime.toFixed(2)}`)],
        ['pause', () => {
          log(`pause currentTime=${video.currentTime.toFixed(2)}`);
          onPauseRef.current?.();
        }],
        ['waiting', () => log(`waiting currentTime=${video.currentTime.toFixed(2)} readyState=${video.readyState}`)],
        ['stalled', () => log(`stalled networkState=${video.networkState}`)],
        ['ended', () => { log('ended'); onEndedRef.current?.(); }],
        ['error', () => {
          const e = video.error;
          const msg = e ? `MEDIA_ERR_${e.code} ${e.message || ''}` : 'unknown';
          log(`error ${msg} currentSrc=${video.currentSrc || 'n/a'}`);
          onErrorRef.current?.(msg);
        }],
        ['timeupdate', () => {
          const t = video.currentTime;
          const d = video.duration || 0;
          onTimeUpdateRef.current?.(t, d);
          const sec = Math.floor(t);
          if (sec !== lastLogSecRef.current && (sec <= 5 || sec % 10 === 0)) {
            lastLogSecRef.current = sec;
            log(`timeupdate t=${t.toFixed(2)} dur=${d.toFixed(2)} paused=${video.paused}`);
          }
        }],
      ];

      events.forEach(([name, handler]) => video.addEventListener(name, handler));

      const isHls = videoUrl.includes('.m3u8');
      const shouldUseHlsJs = isHls && (
        shouldForceHlsJsOnCurrentDevice() ||
        !(video as any).canPlayType?.('application/vnd.apple.mpegurl')
      );

      if (shouldUseHlsJs) {
        log(
          shouldForceHlsJsOnCurrentDevice()
            ? 'loading hls.js (forcing Android/WebView HLS path)'
            : 'loading hls.js (no native HLS support)'
        );
        import('hls.js').then((mod) => {
          if (disposed) return;

          const Hls = mod.default;
          if (!Hls.isSupported()) {
            if (disposed) return;
            log('hls.js NOT supported on this browser, falling back to native playback');
            publishAudioOptions([
              { id: 'default', label: 'Original', isDefault: true },
            ]);
            video.src = videoUrl;
            if (autoplayRef.current) {
              video.muted = mutedRef.current;
              void video.play().catch((err: any) => log(`autoplay rejected: ${err.message || err}`));
            }
            return;
          }

          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            renderTextTracksNatively: true,
            // Generous timeouts for proxied playback — the API proxy adds
            // round-trip latency to Cloudflare, so defaults are too tight.
            fragLoadingTimeOut: 30000,
            fragLoadingMaxRetry: 5,
            fragLoadingRetryDelay: 1000,
            fragLoadingMaxRetryTimeout: 32000,
            manifestLoadingTimeOut: 20000,
            manifestLoadingMaxRetry: 4,
            manifestLoadingRetryDelay: 1000,
            manifestLoadingMaxRetryTimeout: 32000,
            levelLoadingTimeOut: 20000,
            levelLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 1000,
            levelLoadingMaxRetryTimeout: 32000,
            // On Android WebView, limit the forward buffer to reduce decoder
            // surface pressure from concurrent video+audio SourceBuffers.
            ...(shouldForceHlsJsOnCurrentDevice() ? {
              maxBufferLength: 15,
              maxMaxBufferLength: 30,
              maxBufferSize: 30 * 1000 * 1000,
              backBufferLength: 5,
            } : {}),
          });
          if (disposed) {
            hls.destroy();
            return;
          }
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: any) => {
            log(`manifest-parsed levels=${data.levels?.length || 0}`);
            const audioTracks = Array.isArray(hls.audioTracks) ? hls.audioTracks : [];
            if (audioTracks.length > 0) {
              publishAudioOptions(audioTracks.map((track: any, index: number) => ({
                id: String(track?.id ?? index),
                label: String(track?.name || track?.lang || `Audio ${index + 1}`),
                language: String(track?.lang || '').trim() || undefined,
                isDefault: index === (typeof hls.audioTrack === 'number' ? hls.audioTrack : 0),
              })));
            } else {
              publishAudioOptions([
                { id: 'default', label: 'Original', isDefault: true },
              ]);
            }
            if (autoplayRef.current) {
              video.muted = mutedRef.current;
              void video.play().catch((err: any) => log(`autoplay rejected: ${err.message || err}`));
            }
          });

          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            const errorSummary = serializeHlsErrorData(data);
            log(`hls-error ${errorSummary}`);

            // Extra diagnostic for network errors — log the exact URL that failed
            if (data?.type === Hls.ErrorTypes.NETWORK_ERROR) {
              const failedUrl =
                data?.frag?.url
                || data?.context?.url
                || data?.networkDetails?.responseURL
                || data?.response?.url
                || 'unknown';
              const responseCode = data?.response?.code ?? data?.networkDetails?.status ?? 'n/a';
              log(`hls-network-fail url=${String(failedUrl).slice(0, 200)} status=${responseCode} detail=${data?.details}`);
            }

            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  log('fatal network error, attempting recovery...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  log('fatal media error, attempting recovery...');
                  hls.recoverMediaError();
                  break;
                default:
                  log('fatal error, destroying hls instance');
                  hls.destroy();
                  onErrorRef.current?.(`HLS fatal: ${data.details}`);
                  break;
              }
            }
          });

          // Diagnostic: track SourceBuffer health on Android to detect
          // decoder surface exhaustion (NdkImageReader stalls).
          if (shouldForceHlsJsOnCurrentDevice()) {
            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              const vBuf = video.buffered;
              const bufferedEnd = vBuf.length > 0 ? vBuf.end(vBuf.length - 1).toFixed(2) : '0';
              log(`buffer-appended buffered=${bufferedEnd} currentTime=${video.currentTime.toFixed(2)} readyState=${video.readyState}`);
            });
            hls.on(Hls.Events.FRAG_LOADED, (_e: any, d: any) => {
              log(`frag-loaded type=${d?.frag?.type} sn=${d?.frag?.sn} size=${d?.frag?.stats?.total ?? '?'}`);
            });
          }

          hls.loadSource(videoUrl);
          hls.attachMedia(video);
          log(`hls attached src=${videoUrl.slice(0, 80)}`);
        }).catch((err) => {
          if (disposed) return;
          log(`failed to import hls.js: ${err.message || err}`);
          onErrorRef.current?.('Failed to load HLS library');
        });
      } else {
        // Safari/iOS or non-HLS: use native playback
        log(`native playback src=${videoUrl.slice(0, 80)}`);
        publishAudioOptions([
          { id: 'default', label: 'Original', isDefault: true },
        ]);
        video.src = videoUrl;
        if (autoplayRef.current) {
          video.muted = mutedRef.current;
          void video.play().catch((err) => log(`autoplay rejected: ${err.message || err}`));
        }
      }

      return () => {
        disposed = true;
        events.forEach(([name, handler]) => video.removeEventListener(name, handler));
        try {
          video.pause();
        } catch {
          // Ignore cleanup pause failures.
        }
        try {
          if (document.pictureInPictureElement === video) {
            void document.exitPictureInPicture();
          }
        } catch {
          // Ignore PiP cleanup failures.
        }
        try {
          Array.from(video.textTracks || []).forEach((track) => {
            try {
              track.mode = 'disabled';
            } catch {
              // Ignore track cleanup failures.
            }
          });
        } catch {
          // Ignore text track cleanup failures.
        }
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        try {
          video.removeAttribute('src');
          // Do NOT call video.load() here — on Android WebView it can trigger
          // a spurious decoder re-init that competes for surface buffers with
          // the next hls.js attach cycle.
        } catch {
          // Ignore src cleanup failures.
        }
        lastLogSecRef.current = -1;
        discoveredAudioTracksRef.current = [];
        publishAudioOptions([]);
      };
    }, [publishAudioOptions, videoUrl]);

    // Sync muted prop
    useEffect(() => {
      if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    useEffect(() => {
      if (!subtitles.length && !activeSubtitleLanguage) return;
      syncSubtitleTrackModes();
    }, [subtitles, activeSubtitleLanguage, syncSubtitleTrackModes]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return undefined;
      if (!subtitles.length && !activeSubtitleLanguage) return undefined;

      const trackElements = Array.from(video.querySelectorAll('track'));
      if (trackElements.length === 0) {
        return undefined;
      }

      const cleanupFns = trackElements.map((trackElement) => {
        const handleLoad = () => {
          const language = trackElement.getAttribute('srclang') || 'unknown';
          log(`subtitle-track loaded lang=${language} src=${trackElement.getAttribute('src') || 'n/a'}`);
          syncSubtitleTrackModes();
        };
        const handleError = () => {
          const language = trackElement.getAttribute('srclang') || 'unknown';
          log(`subtitle-track error lang=${language} src=${trackElement.getAttribute('src') || 'n/a'}`);
        };

        trackElement.addEventListener('load', handleLoad);
        trackElement.addEventListener('error', handleError);

        return () => {
          trackElement.removeEventListener('load', handleLoad);
          trackElement.removeEventListener('error', handleError);
        };
      });

      const syncTimeoutId = window.setTimeout(() => {
        syncSubtitleTrackModes();
      }, 0);

      return () => {
        window.clearTimeout(syncTimeoutId);
        cleanupFns.forEach((cleanup) => cleanup());
      };
    }, [subtitles, activeSubtitleLanguage, syncSubtitleTrackModes]);

    useEffect(() => {
      const hls = hlsRef.current;
      if (!hls || selectedAudioId === undefined) return;

      const targetIndex = hls.audioTracks.findIndex((track: any, index: number) => {
        const candidateId = String(track?.id ?? index);
        return candidateId === selectedAudioId;
      });

      if (targetIndex >= 0 && hls.audioTrack !== targetIndex) {
        hls.audioTrack = targetIndex;
        log(`audio-track selected=${selectedAudioId} index=${targetIndex}`);
      }
    }, [selectedAudioId]);

    return (
      <div className={`h-full w-full bg-black ${className}`}>
        <video
          ref={videoRef}
          poster={poster}
          {...(!shouldForceHlsJsOnCurrentDevice() ? { crossOrigin: 'anonymous' as const } : {})}
          playsInline
          webkit-playsinline=""
          preload="auto"
          controls={controls}
          muted={muted}
          className="h-full w-full object-contain"
          style={{ objectFit: 'contain' }}
        >
          {subtitles.map((track) => (
            <track
              key={`${track.language}-${track.src}`}
              kind="subtitles"
              srcLang={track.language}
              label={track.label}
              src={track.src}
              default={Boolean(activeSubtitleLanguage && activeSubtitleLanguage === track.language)}
            />
          ))}
        </video>
      </div>
    );
  },
);

export default NativeHlsPlayer;
