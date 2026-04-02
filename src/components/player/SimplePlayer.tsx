'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  type ComponentType,
} from 'react';

function logPlayerDebug(message: string) {
  console.log(`[SimplePlayer] ${message}`);
}

function formatMediaError(error: MediaError | null | undefined): string {
  if (!error) return 'none';
  const codeMap: Record<number, string> = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  };
  return `${codeMap[error.code] || `MEDIA_ERR_${error.code}`} ${error.message || ''}`.trim();
}

interface SimplePlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  forceHls?: boolean;
  initialSeekTime?: number;
  mediaSession?: {
    title: string;
    artist?: string;
    album?: string;
    artwork?: Array<{ src: string; sizes?: string; type?: string }>;
  };
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onEnterPictureInPicture?: () => void;
  onLeavePictureInPicture?: () => void;
  className?: string;
}

export interface SimplePlayerHandle {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  enterPictureInPicture: () => Promise<void>;
  exitPictureInPicture: () => Promise<void>;
  isPictureInPictureActive: () => boolean;
  isPictureInPictureSupported: () => boolean;
}

const SimplePlayer = forwardRef<SimplePlayerHandle, SimplePlayerProps>(function SimplePlayer({
  videoUrl,
  poster,
  autoplay = false,
  muted: mutedProp = false,
  controls = true,
  forceHls = false,
  initialSeekTime = 0,
  mediaSession,
  onTimeUpdate,
  onEnded,
  onError,
  onReady,
  onPlay,
  onPause,
  onNextTrack,
  onPreviousTrack,
  onEnterPictureInPicture,
  onLeavePictureInPicture,
  className = '',
}, ref) {
  const playerRef = useRef<any>(null);
  const lastUrlRef = useRef<string>(videoUrl);
  const resumeTimeRef = useRef<number>(0);
  const resumePlayingRef = useRef<boolean>(autoplay);
  const autoplayRetryTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const initialSeekRef = useRef<number>(Math.max(0, Number(initialSeekTime) || 0));
  const hasAppliedInitialSeekRef = useRef<boolean>(false);
  const debugVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastLoggedProgressSecondRef = useRef<number>(-1);
  const [ReactPlayer, setReactPlayer] = useState<ComponentType<any> | null>(null);
  const [playing, setPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(mutedProp);
  const [currentTime, setCurrentTime] = useState(initialSeekTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Load ReactPlayer on the client side without next/dynamic, which breaks ref forwarding.
  useEffect(() => {
    import('react-player').then((mod) => {
      setReactPlayer(() => mod.default);
    });
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    togglePlay: () => setPlaying((prev) => !prev),
    seek: (time: number) => {
      playerRef.current?.seekTo?.(time, 'seconds');
    },
    seekBy: (deltaSeconds: number) => {
      const currentTime = playerRef.current?.getCurrentTime?.() || 0;
      playerRef.current?.seekTo?.(Math.max(0, currentTime + deltaSeconds), 'seconds');
    },
    setVolume: (nextVolume: number) => setVolume(nextVolume),
    setMuted: (nextMuted: boolean) => setMuted(nextMuted),
    setPlaybackRate: (rate: number) => setPlaybackRate(rate),
    getPlaybackRate: () => playbackRate,
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() || 0,
    getDuration: () => playerRef.current?.getDuration?.() || duration,
    isPlaying: () => playing,
    enterPictureInPicture: async () => {
      const player = playerRef.current as HTMLVideoElement | null;
      if (!player || typeof player.requestPictureInPicture !== 'function') return;
      await player.requestPictureInPicture();
    },
    exitPictureInPicture: async () => {
      if (typeof document === 'undefined' || typeof document.exitPictureInPicture !== 'function') return;
      if (!document.pictureInPictureElement) return;
      await document.exitPictureInPicture();
    },
    isPictureInPictureActive: () => {
      if (typeof document === 'undefined') return false;
      const player = playerRef.current as HTMLVideoElement | null;
      return Boolean(player && document.pictureInPictureElement === player);
    },
    isPictureInPictureSupported: () => {
      if (typeof document === 'undefined') return false;
      const player = playerRef.current as HTMLVideoElement | null;
      return Boolean(document.pictureInPictureEnabled && player?.requestPictureInPicture);
    },
  }), [duration, playbackRate, playing]);

  const clearAutoplayRetries = useCallback(() => {
    autoplayRetryTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    autoplayRetryTimeoutsRef.current = [];
  }, []);

  const attemptAutoplay = useCallback(() => {
    const internalPlayer = playerRef.current?.getInternalPlayer?.();
    if (!internalPlayer || typeof internalPlayer.play !== 'function') return;

    try {
      const maybePromise = internalPlayer.play();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => undefined);
      }
    } catch {
      // Ignore autoplay rejections; we'll retry a few times after readiness.
    }
  }, []);

  // 定期上报播放进度
  useEffect(() => {
    if (playing && duration > 0) {
      const interval = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime() || 0;
        onTimeUpdate?.(currentTime, duration);
      }, 5000); // 每5秒上报一次

      return () => clearInterval(interval);
    }
  }, [playing, duration, onTimeUpdate]);

  useEffect(() => () => {
    clearAutoplayRetries();
  }, [clearAutoplayRetries]);

  // Re-attach debug event listeners when ReactPlayer finishes loading.
  // Without ReactPlayer in the deps, the effect runs before the player mounts
  // and playerRef.current is null, so no native video events get captured.
  useEffect(() => {
    if (!ReactPlayer) return undefined;

    const internalPlayer = playerRef.current?.getInternalPlayer?.();
    const video = internalPlayer instanceof HTMLVideoElement ? internalPlayer : null;

    if (!video) {
      logPlayerDebug(`debug-attach skipped: internalPlayer=${typeof internalPlayer} ref=${Boolean(playerRef.current)} url=${videoUrl?.slice(0, 80) || 'empty'}`);
      return undefined;
    }

    if (debugVideoRef.current === video) {
      return undefined;
    }

    debugVideoRef.current = video;
    const logEvent = (eventName: string) => {
      logPlayerDebug(
        `${eventName} readyState=${video.readyState} networkState=${video.networkState} currentTime=${video.currentTime.toFixed(2)} paused=${video.paused} ended=${video.ended} error=${formatMediaError(video.error)} src=${video.currentSrc || video.src || 'n/a'}`
      );
    };

    const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'pause', 'waiting', 'stalled', 'suspend', 'ended', 'error'] as const;
    const listeners = new Map<string, () => void>();
    events.forEach((eventName) => {
      const listener = () => logEvent(eventName);
      listeners.set(eventName, listener);
      video.addEventListener(eventName, listener);
    });
    logEvent('attach');

    return () => {
      listeners.forEach((listener, eventName) => {
        video.removeEventListener(eventName, listener);
      });
      if (debugVideoRef.current === video) {
        debugVideoRef.current = null;
      }
    };
  }, [ReactPlayer, videoUrl, playing]);

  const handleProgress = (state: any) => {
    setCurrentTime(state.playedSeconds || 0);
    if (duration > 0) {
      onTimeUpdate?.(state.playedSeconds, duration);
    }
    const progressSecond = Math.floor(state.playedSeconds || 0);
    if (progressSecond !== lastLoggedProgressSecondRef.current && (progressSecond <= 5 || progressSecond % 5 === 0)) {
      lastLoggedProgressSecondRef.current = progressSecond;
      logPlayerDebug(`progress current=${(state.playedSeconds || 0).toFixed(2)} loaded=${(state.loaded || 0).toFixed(3)} duration=${duration.toFixed(2)} playing=${playing}`);
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleReady = () => {
    logPlayerDebug(`ready ref=${Boolean(playerRef.current)} internalPlayer=${typeof playerRef.current?.getInternalPlayer?.()}`);
    const shouldUseResumeTime = resumeTimeRef.current > 0;
    const seekTarget = shouldUseResumeTime
      ? resumeTimeRef.current
      : (!hasAppliedInitialSeekRef.current ? initialSeekRef.current : 0);
    if (seekTarget > 0) {
      playerRef.current?.seekTo(seekTarget, 'seconds');
    }
    if (shouldUseResumeTime) {
      resumeTimeRef.current = 0;
    }
    hasAppliedInitialSeekRef.current = true;
    if (resumePlayingRef.current) {
      setPlaying(true);
    }
    if (autoplay) {
      clearAutoplayRetries();
      attemptAutoplay();
      autoplayRetryTimeoutsRef.current = [300, 900, 1800].map((delay) =>
        setTimeout(() => {
          attemptAutoplay();
        }, delay)
      );
    }
    logPlayerDebug(`ready autoplay=${autoplay} muted=${muted} forceHls=${forceHls} initialSeek=${initialSeekRef.current}`);
    onReady?.();
  };

  const handlePlay = () => {
    clearAutoplayRetries();
    setPlaying(true);
    logPlayerDebug(`handlePlay current=${(playerRef.current?.getCurrentTime?.() || 0).toFixed(2)}`);
    onPlay?.();
  };

  const handlePause = () => {
    setPlaying(false);
    logPlayerDebug(`handlePause current=${(playerRef.current?.getCurrentTime?.() || 0).toFixed(2)}`);
    onPause?.();
  };

  const handleEnded = () => {
    setPlaying(false);
    logPlayerDebug('handleEnded');
    onEnded?.();
  };

  const handleError = (error: any) => {
    logPlayerDebug(`handleError ${error?.message || error?.toString?.() || 'unknown error'}`);
    onError?.(error?.message || 'Video playback error');
  };

  // Keep playback position when switching quality (URL changes with query params).
  useEffect(() => {
    if (lastUrlRef.current === videoUrl) return;
    resumeTimeRef.current = playerRef.current?.getCurrentTime?.() || 0;
    resumePlayingRef.current = playing;
    lastUrlRef.current = videoUrl;
  }, [videoUrl, playing]);

  useEffect(() => {
    hasAppliedInitialSeekRef.current = false;
    initialSeekRef.current = Math.max(0, Number(initialSeekTime) || 0);
    setCurrentTime(Math.max(0, Number(initialSeekTime) || 0));
  }, [videoUrl, initialSeekTime]);

  useEffect(() => {
    setMuted(mutedProp);
  }, [mutedProp]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const mediaSessionInstance = navigator.mediaSession;

    if (mediaSession && typeof MediaMetadata !== 'undefined') {
      mediaSessionInstance.metadata = new MediaMetadata({
        title: mediaSession.title,
        artist: mediaSession.artist,
        album: mediaSession.album,
        artwork: mediaSession.artwork,
      });
    }

    mediaSessionInstance.playbackState = playing ? 'playing' : 'paused';

    const setActionHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        mediaSessionInstance.setActionHandler(action, handler);
      } catch {
        // Unsupported actions vary across Android Chrome / WebView versions.
      }
    };

    setActionHandler('play', () => setPlaying(true));
    setActionHandler('pause', () => setPlaying(false));
    setActionHandler('seekbackward', () => {
      const currentTime = playerRef.current?.getCurrentTime?.() || 0;
      playerRef.current?.seekTo?.(Math.max(0, currentTime - 10), 'seconds');
    });
    setActionHandler('seekforward', () => {
      const currentTime = playerRef.current?.getCurrentTime?.() || 0;
      playerRef.current?.seekTo?.(currentTime + 10, 'seconds');
    });
    setActionHandler('previoustrack', onPreviousTrack || null);
    setActionHandler('nexttrack', onNextTrack || null);

    return () => {
      setActionHandler('play', null);
      setActionHandler('pause', null);
      setActionHandler('seekbackward', null);
      setActionHandler('seekforward', null);
      setActionHandler('previoustrack', null);
      setActionHandler('nexttrack', null);
    };
  }, [mediaSession, onNextTrack, onPreviousTrack, playing]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (duration <= 0) return;
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate,
        position: playerRef.current?.getCurrentTime?.() || 0,
      });
    } catch {
      // Ignore invalid position states while the stream is still resolving duration.
    }
  }, [currentTime, duration, playbackRate]);

  if (!ReactPlayer) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <p className="text-white text-sm">Loading player...</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        playbackRate={playbackRate}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        controls={controls}
        light={autoplay ? false : poster}
        playsInline={true}
        disablePictureInPicture={false}
        config={{
          file: {
            forceHLS: forceHls,
            attributes: {
              playsInline: true,
              autoPlay: autoplay,
              muted,
              preload: 'auto',
            },
          },
        }}
        onReady={handleReady}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnterPictureInPicture={onEnterPictureInPicture}
        onLeavePictureInPicture={onLeavePictureInPicture}
      />
    </div>
  );
});

export default SimplePlayer;
