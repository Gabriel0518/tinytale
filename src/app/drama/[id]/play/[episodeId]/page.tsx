"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { mockDramas } from "@/lib/mockData";
import type { Episode } from "@/types";

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const drama = mockDramas.find((d) => d.id === params.id) || mockDramas[0];
  const episode = drama.episodes.find((e) => e.id === params.episodeId) || drama.episodes[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLocked, setIsLocked] = useState(!episode.isFree);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const playEpisode = (ep: Episode) => {
    if (ep.isFree) {
      router.push(`/drama/${drama.id}/play/${ep.id}`);
    } else {
      setShowEpisodes(false);
      setIsLocked(true);
    }
  };

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const currentEpisodeIndex = drama.episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentEpisodeIndex > 0 ? drama.episodes[currentEpisodeIndex - 1] : null;
  const nextEpisode = currentEpisodeIndex < drama.episodes.length - 1 ? drama.episodes[currentEpisodeIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <header
        className={`absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-sm font-medium text-white md:text-base">{drama.title}</h1>
          <p className="text-xs text-gray-400">Episode {episode.episodeNumber}</p>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </header>

      {/* Video Area */}
      <div
        className="relative flex-1 flex items-center justify-center bg-black"
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
      >
        {isLocked ? (
          /* Locked Overlay */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden">
              <Image
                src={`https://picsum.photos/seed/locked/400/600`}
                alt="Locked"
                fill
                className="object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  <p className="mt-4 text-lg font-medium text-white">Episode Locked</p>
                  <p className="mt-2 text-gray-400">Unlock for {episode.unlockPrice} coins</p>
                  <button className="mt-6 rounded-lg bg-accent-primary px-8 py-3 font-medium text-white transition hover:bg-red-700">
                    Unlock Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Video Player Placeholder */
          <div className="aspect-[9/16] w-full max-w-md bg-gray-900">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              poster={`https://picsum.photos/seed/${episode.id}/400/600`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={episode.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} type="video/mp4" />
            </video>
          </div>
        )}

        {/* Center Play Button */}
        {!isPlaying && !isLocked && (
          <button className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:scale-110">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black to-transparent px-4 py-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs text-white">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="relative h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-600"
            style={{
              background: `linear-gradient(to right, #E50914 ${(currentTime / (duration || 1)) * 100}%, #666 ${(currentTime / (duration || 1)) * 100}%)`,
            }}
          />
          <span className="text-xs text-white">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white">
              {isPlaying ? (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button onClick={toggleMute} className="text-white">
              {isMuted ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => changeSpeed(playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.25)}
                className="rounded bg-gray-700 px-2 py-1 text-xs font-medium text-white"
              >
                {playbackSpeed}x
              </button>
            </div>

            {/* Episodes */}
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-1 text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-sm">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Episode Drawer */}
      {showEpisodes && (
        <div className="absolute right-0 top-0 bottom-0 z-30 w-80 bg-bg-secondary overflow-y-auto">
          <div className="flex items-center justify-between border-b border-bg-elevated p-4">
            <h3 className="font-semibold text-white">Episodes</h3>
            <button onClick={() => setShowEpisodes(false)} className="text-gray-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-2">
            {drama.episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => playEpisode(ep)}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                  ep.id === episode.id ? "bg-accent-primary" : "hover:bg-bg-elevated"
                }`}
              >
                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                  <Image
                    src={`https://picsum.photos/seed/ep${ep.id}/100/150`}
                    alt={ep.title}
                    fill
                    className="object-cover"
                  />
                  {!ep.isFree && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${ep.id === episode.id ? "text-white" : "text-text-secondary"}`}>
                    Episode {ep.episodeNumber}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {ep.isFree ? "Free" : `${ep.unlockPrice} coins`}
                  </p>
                </div>
                {ep.id === episode.id && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="absolute bottom-24 left-4 right-4 z-10 flex justify-between">
        {prevEpisode && prevEpisode.isFree && (
          <button
            onClick={() => playEpisode(prevEpisode)}
            className="flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
        )}
        {nextEpisode && nextEpisode.isFree && (
          <button
            onClick={() => playEpisode(nextEpisode)}
            className="ml-auto flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
