"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { dramasApi, coinsApi, userApi, episodesApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import { Footer } from "@/components/features/Footer";
import { formatDuration } from "@/lib/utils";
import {
  CloudflarePlayer,
  PlayerRoot,
  usePlayerContext,
} from "@/components/player";
import { ControlBar } from "@/components/player/Controls";

/* ------------------------------------------------------------------ */
/*  Inner component that lives inside <PlayerRoot> so it can use ctx  */
/* ------------------------------------------------------------------ */
interface PlayerSectionProps {
  currentEpisode: Episode;
  drama: Drama | null;
  streamInfo: StreamPlaybackInfo | null;
  token: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onAutoNext: () => void;
  onRecordHistory: () => void;
}

function PlayerSection({
  currentEpisode,
  drama,
  streamInfo,
  token,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onAutoNext,
  onRecordHistory,
}: PlayerSectionProps) {
  const { state, actions, playerRef, isFullscreen, toggleFullscreen } =
    usePlayerContext();
  const lastProgressRef = useRef<number>(0);

  /* --- CloudflarePlayer event handlers --- */
  const handleTimeUpdate = useCallback(
    (time: number, dur: number) => {
      actions.setCurrentTime(time);
      actions.setDuration(dur);
      // Report progress every 10 seconds
      if (token && Math.floor(time) % 10 === 0 && Math.floor(time) !== lastProgressRef.current) {
        lastProgressRef.current = Math.floor(time);
        episodesApi.reportProgress(currentEpisode._id, token, time, dur).catch(() => {});
      }
    },
    [actions, token, currentEpisode._id],
  );

  const handlePlay = useCallback(() => {
    actions.setPlaying(true);
    onRecordHistory();
  }, [actions, onRecordHistory]);

  const handlePause = useCallback(() => {
    actions.setPlaying(false);
  }, [actions]);

  const handleReady = useCallback(() => {
    actions.setLoading(false);
  }, [actions]);

  /* --- ControlBar callbacks (imperative via ref) --- */
  const handlePlayPause = useCallback(() => {
    if (state.isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [state.isPlaying, playerRef]);

  const handleSeek = useCallback(
    (time: number) => {
      playerRef.current?.seek(time);
      actions.setCurrentTime(time);
    },
    [playerRef, actions],
  );

  const handleVolumeChange = useCallback(
    (vol: number) => {
      playerRef.current?.setVolume(vol);
      actions.setVolume(vol);
    },
    [playerRef, actions],
  );

  const handleToggleMute = useCallback(() => {
    const next = !state.isMuted;
    playerRef.current?.setMuted(next);
    actions.toggleMute();
  }, [state.isMuted, playerRef, actions]);

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      playerRef.current?.setPlaybackRate(rate);
      actions.setPlaybackRate(rate);
    },
    [playerRef, actions],
  );

  const handleQualityChange = useCallback(
    (quality: string) => {
      actions.setQuality(quality);
    },
    [actions],
  );

  return (
    <>
      <CloudflarePlayer
        ref={playerRef as React.Ref<import('@/components/player').CloudflarePlayerHandle>}
        streamVideoId={streamInfo?.videoUid}
        signedToken={streamInfo?.signedToken}
        videoUrl={currentEpisode.videoUrl}
        poster={currentEpisode.thumbnail || drama?.cover}
        subtitles={streamInfo?.subtitles}
        autoplay
        onTimeUpdate={handleTimeUpdate}
        onEnded={onAutoNext}
        onPlay={handlePlay}
        onPause={handlePause}
        onReady={handleReady}
        onError={(err) => actions.setError(err)}
        className="h-full w-full"
      />
      <ControlBar
        playerState={state}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onPlaybackRateChange={handlePlaybackRateChange}
        onQualityChange={handleQualityChange}
        onToggleFullscreen={toggleFullscreen}
        onPrevious={hasPrevious ? onPrevious : undefined}
        onNext={hasNext ? onNext : undefined}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        isFullscreen={isFullscreen}
        title={`${drama?.title} - Ep ${currentEpisode.episodeNumber}: ${currentEpisode.title}`}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */
export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();

  const dramaId = params.id as string;
  const episodeId = params.episodeId as string;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamPlaybackInfo | null>(null);
  const [unlockedEpisodes, setUnlockedEpisodes] = useState<string[]>([]);

  // Fetch drama + episodes data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dramaRes = await dramasApi.getById(dramaId);
        const dramaData = dramaRes.data?.drama;
        const episodesData = dramaRes.data?.episodes || [];

        setDrama(dramaData);
        setEpisodes(episodesData);

        // Find current episode (P1-24: not-found state)
        const episode = episodesData.find((ep: Episode) => ep._id === episodeId);
        if (!episode) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setCurrentEpisode(episode);

        // Check if episode is locked (P0-06: verify unlock status via API)
        if (episode && !episode.isFree) {
          if (token) {
            try {
              const unlockRes = await userApi.checkUnlocked(token, episode._id);
              setIsLocked(!unlockRes.data?.unlocked);
            } catch {
              setIsLocked(true);
            }
          } else {
            setIsLocked(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch drama:', error);
        toast("Failed to load video", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dramaId, episodeId, token]);

  // Fetch stream playback info when episode changes
  useEffect(() => {
    if (!currentEpisode || isLocked) return;
    episodesApi
      .getStream(currentEpisode._id, token || undefined)
      .then((res) => {
        // The API may return data directly or nested under .data
        const info = (res as any).data ?? res;
        setStreamInfo(info);
      })
      .catch(() => setStreamInfo(null));
  }, [currentEpisode?._id, token, isLocked]);

  // Record watch history on play (P1-28)
  const recordHistory = useCallback(() => {
    if (token && dramaId && episodeId) {
      userApi.addHistory(token, dramaId, episodeId).catch(() => {});
    }
  }, [token, dramaId, episodeId]);

  // Unlock handler
  const handleUnlock = async () => {
    if (!token || !currentEpisode) return;

    setUnlocking(true);
    try {
      const response = await coinsApi.unlock(token, currentEpisode._id);
      if (response.success || response.data?.success) {
        setIsLocked(false);
        setUnlockedEpisodes((prev) => [...prev, currentEpisode._id]);
        toast("Episode unlocked!", "success");
        if (user) {
          updateUser({ ...user, coins: (user.coins || 0) - currentEpisode.unlockPrice });
        }
      }
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Failed to unlock episode. Please check your coin balance.', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  // Episode navigation
  const handleEpisodeChange = (episode: Episode) => {
    router.push(`/drama/${dramaId}/play/${episode._id}`);
  };

  // Next/prev episode navigation (P1-27)
  const currentIndex = episodes.findIndex((ep) => ep._id === episodeId);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
  const hasPrevious = !!prevEpisode;
  const hasNext = !!nextEpisode;

  const handlePrevious = useCallback(() => {
    if (prevEpisode) handleEpisodeChange(prevEpisode);
  }, [prevEpisode]);

  const handleNext = useCallback(() => {
    if (nextEpisode) handleEpisodeChange(nextEpisode);
  }, [nextEpisode]);

  // Auto-next episode on video end
  const handleAutoNext = useCallback(() => {
    if (!episodes || !currentEpisode) return;
    const idx = episodes.findIndex((ep) => ep._id === currentEpisode._id);
    const next = episodes[idx + 1];

    if (next) {
      if (next.isFree || unlockedEpisodes.includes(next._id)) {
        router.push(`/drama/${dramaId}/play/${next._id}`);
      } else {
        toast("Next episode requires unlocking", "info");
      }
    } else {
      toast("You have finished all available episodes!", "success");
    }
  }, [episodes, currentEpisode, unlockedEpisodes, dramaId, router, toast]);

  /* --- Loading state --- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  /* --- Not-found state (P1-24) --- */
  if (notFound || !currentEpisode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <svg className="h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-white">Episode Not Found</h2>
        <p className="text-gray-400">This episode does not exist or has been removed.</p>
        <Link href={`/drama/${dramaId}`} className="mt-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">
          Back to Drama
        </Link>
      </div>
    );
  }

  /* --- Main render --- */
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between bg-black/80 px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-gray-300" aria-label="Go back">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          {prevEpisode && (
            <button
              onClick={() => handleEpisodeChange(prevEpisode)}
              className="rounded bg-gray-800 px-3 py-2 min-h-[44px] text-sm text-white hover:bg-gray-700"
              title={`Prev: Ep ${prevEpisode.episodeNumber}`}
            >
              Prev
            </button>
          )}
          {nextEpisode && (
            <button
              onClick={() => handleEpisodeChange(nextEpisode)}
              className="rounded bg-gray-800 px-3 py-2 min-h-[44px] text-sm text-white hover:bg-gray-700"
              title={`Next: Ep ${nextEpisode.episodeNumber}`}
            >
              Next
            </button>
          )}
          <button onClick={() => setShowEpisodes(!showEpisodes)} className="rounded bg-gray-800 px-3 py-2 min-h-[44px] text-sm text-white">
            Episodes
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative pt-14">
        {isLocked ? (
          <div className="flex aspect-video items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <PlayerRoot className="aspect-video bg-black">
            <PlayerSection
              currentEpisode={currentEpisode}
              drama={drama}
              streamInfo={streamInfo}
              token={token}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onAutoNext={handleAutoNext}
              onRecordHistory={recordHistory}
            />
          </PlayerRoot>
        )}
      </div>

      {/* Episodes Panel */}
      {showEpisodes && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowEpisodes(false)}
          />
          {/* Desktop: right sidebar */}
          <div className="fixed right-0 top-14 bottom-0 w-80 overflow-y-auto bg-gray-900 p-4 z-50 hidden md:block">
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
                    <Image src={ep.thumbnail || drama?.cover || ""} alt={ep.title} fill className="object-cover" />
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
                    <p className="text-xs text-gray-500">{formatDuration(ep.duration)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Mobile: bottom sheet */}
          <div className="fixed left-0 right-0 bottom-0 max-h-[60vh] overflow-y-auto bg-gray-900 rounded-t-2xl p-4 z-50 md:hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Episodes</h3>
              <button onClick={() => setShowEpisodes(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white" aria-label="Close episodes panel">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {episodes.map((ep) => (
                <button
                  key={ep._id}
                  onClick={() => handleEpisodeChange(ep)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 min-h-[44px] text-left transition ${
                    ep._id === currentEpisode?._id ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded">
                    <Image src={ep.thumbnail || drama?.cover || ""} alt={ep.title} fill className="object-cover" />
                    {!ep.isFree && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">Ep {ep.episodeNumber}</p>
                    <p className="truncate text-xs text-gray-400">{ep.title}</p>
                    <p className="text-xs text-gray-500">{formatDuration(ep.duration)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Drama Info */}
      <div className={`p-4 ${showEpisodes ? 'md:mr-80' : ''}`}>
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

      <Footer />
    </div>
  );
}
