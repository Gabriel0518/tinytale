"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dramasApi, coinsApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { Drama, Episode } from "@/types";

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const dramaId = params.id as string;
  const episodeId = params.episodeId as string;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dramaRes = await dramasApi.getById(dramaId);
        const dramaData = dramaRes.data?.drama;
        const episodesData = dramaRes.data?.episodes || [];

        setDrama(dramaData);
        setEpisodes(episodesData);

        // Find current episode
        const episode = episodesData.find((ep: Episode) => ep._id === episodeId) || episodesData[0];
        setCurrentEpisode(episode);

        // Check if episode is locked
        if (episode && !episode.isFree) {
          if (token) {
            // TODO: Check if user has unlocked this episode
            setIsLocked(true);
          } else {
            setIsLocked(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch drama:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dramaId, episodeId, token]);

  const handleUnlock = async () => {
    if (!token || !currentEpisode) return;

    setUnlocking(true);
    try {
      const response = await coinsApi.unlock(token, currentEpisode._id);
      if (response.success) {
        setIsLocked(false);
        // Update user coins
        if (user) {
          updateUser({ ...user, coins: (user.coins || 0) - currentEpisode.unlockPrice });
        }
      }
    } catch (error) {
      console.error('Failed to unlock:', error);
      alert('Failed to unlock episode. Please check your coin balance.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleEpisodeChange = (episode: Episode) => {
    router.push(`/drama/${dramaId}/play/${episode._id}`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (isLocked) return;
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
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between bg-black/80 px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-white hover:text-gray-300">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-none">{drama?.title}</h1>
            <p className="text-xs text-gray-400">
              Episode {currentEpisode?.episodeNumber}: {currentEpisode?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowEpisodes(!showEpisodes)} className="rounded bg-gray-800 px-3 py-1 text-sm text-white">
            Episodes
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative pt-14">
        {isLocked ? (
          <div className="flex aspect-video items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-white">Premium Episode</h2>
              <p className="mt-2 text-gray-400">Unlock this episode for {currentEpisode?.unlockPrice} coins</p>
              {user ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-400">Your balance: {user.coins || 0} coins</p>
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking || (user.coins || 0) < (currentEpisode?.unlockPrice || 0)}
                    className="rounded bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {unlocking ? 'Unlocking...' : `Unlock for ${currentEpisode?.unlockPrice} Coins`}
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="mt-4 inline-block rounded bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700">
                  Sign In to Unlock
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div
            className="relative aspect-video bg-black"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={currentEpisode?.videoUrl}
              className="h-full w-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />

            {/* Play Button Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={togglePlay} className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Controls */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="h-1 w-full cursor-pointer appearance-none rounded bg-gray-600 accent-red-600"
                />

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="text-white hover:text-gray-300">
                      {isPlaying ? (
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button onClick={toggleMute} className="text-white hover:text-gray-300">
                      {isMuted ? (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>

                    <span className="text-sm text-white">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={changePlaybackSpeed} className="text-sm text-white hover:text-gray-300">
                      {playbackSpeed}x
                    </button>
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Episodes Sidebar */}
      {showEpisodes && (
        <div className="fixed right-0 top-14 bottom-0 w-80 overflow-y-auto bg-gray-900 p-4">
          <h3 className="mb-4 text-lg font-semibold text-white">Episodes</h3>
          <div className="space-y-2">
            {episodes.map((ep) => (
              <button
                key={ep._id}
                onClick={() => handleEpisodeChange(ep)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                  ep._id === currentEpisode?._id ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                  <img src={ep.thumbnail || drama?.cover} alt={ep.title} className="h-full w-full object-cover" />
                  {!ep.isFree && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    Ep {ep.episodeNumber}
                  </p>
                  <p className="truncate text-xs text-gray-400">{ep.title}</p>
                  <p className="text-xs text-gray-500">{ep.duration} min</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drama Info */}
      <div className={`p-4 ${showEpisodes ? 'mr-80' : ''}`}>
        <h2 className="text-xl font-bold text-white">{drama?.title}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {drama?.categories?.map((cat) => (
            <span key={cat} className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
              {cat}
            </span>
          ))}
        </div>
        <p className="mt-4 text-gray-400">{drama?.description}</p>
      </div>
    </div>
  );
}
