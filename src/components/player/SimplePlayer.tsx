'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ReactPlayer 以避免 SSR 问题
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-black"><p className="text-white">Loading player...</p></div>
}) as any;

interface SimplePlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
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
  const initialSeekRef = useRef<number>(Math.max(0, Number(initialSeekTime) || 0));
  const hasAppliedInitialSeekRef = useRef<boolean>(false);
  const [playing, setPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialSeekTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

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

  const handleProgress = (state: any) => {
    setCurrentTime(state.playedSeconds || 0);
    if (duration > 0) {
      onTimeUpdate?.(state.playedSeconds, duration);
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleReady = () => {
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
    console.log('Player ready');
    onReady?.();
  };

  const handlePlay = () => {
    setPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setPlaying(false);
    onPause?.();
  };

  const handleEnded = () => {
    setPlaying(false);
    onEnded?.();
  };

  const handleError = (error: any) => {
    console.error('Player error:', error);
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
        controls={true}
        light={autoplay ? false : poster}
        playsInline={true}
        disablePictureInPicture={false}
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
