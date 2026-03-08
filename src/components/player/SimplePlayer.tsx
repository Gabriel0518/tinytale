'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ReactPlayer 以避免 SSR 问题
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface SimplePlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export default function SimplePlayer({
  videoUrl,
  poster,
  autoplay = false,
  onTimeUpdate,
  onEnded,
  onError,
  onReady,
  onPlay,
  onPause,
  className = '',
}: SimplePlayerProps) {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);

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

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.played);
    if (duration > 0) {
      onTimeUpdate?.(state.playedSeconds, duration);
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleReady = () => {
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

  return (
    <div className={`relative bg-black ${className}`}>
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        controls={true}
        light={poster}
        playsinline={true}
        onReady={handleReady}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onProgress={handleProgress}
        onDuration={handleDuration}
      />
    </div>
  );
}
