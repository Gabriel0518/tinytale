"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { dramasApi, reviewsApi, userApi, coinsApi, episodesApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode, Review, StreamPlaybackInfo } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { DramaCard } from "@/components/features/DramaCard";
import { formatDuration } from "@/lib/utils";
import { CloudflarePlayer, PlayerRoot, usePlayerContext } from "@/components/player";
import type { CloudflarePlayerHandle } from "@/components/player";
import { ControlBar } from "@/components/player/Controls";

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" aria-label={interactive ? undefined : `Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            className={`h-5 w-5 ${(hover || rating) >= star ? "text-yellow-400" : "text-gray-600"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** Inner player component that consumes PlayerRoot context */
function PlayerInner({
  playerRef,
  streamInfo,
  activeEpisode,
  drama,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  playerRef: React.RefObject<CloudflarePlayerHandle | null>;
  streamInfo: StreamPlaybackInfo | null;
  activeEpisode: Episode | null;
  drama: Drama;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const { state, actions, isFullscreen, toggleFullscreen } = usePlayerContext();

  const handlePlayPause = useCallback(() => {
    if (state.isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [state.isPlaying, playerRef]);

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seek(time);
    actions.setCurrentTime(time);
  }, [playerRef, actions]);

  const handleVolumeChange = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
    actions.setVolume(volume);
  }, [playerRef, actions]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    playerRef.current?.setMuted(newMuted);
    actions.toggleMute();
  }, [state.isMuted, playerRef, actions]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    actions.setPlaybackRate(rate);
  }, [playerRef, actions]);

  const handleQualityChange = useCallback((quality: string) => {
    actions.setQuality(quality);
  }, [actions]);

  // Determine video source: prefer stream, fallback to direct URL
  const videoUrl = activeEpisode?.videoUrl || undefined;

  return (
    <>
      <CloudflarePlayer
        ref={playerRef as React.Ref<CloudflarePlayerHandle>}
        streamVideoId={streamInfo?.videoUid}
        signedToken={streamInfo?.signedToken}
        videoUrl={videoUrl}
        poster={activeEpisode?.thumbnail || drama.cover}
        subtitles={streamInfo?.subtitles}
        onEnded={onNext}
        onTimeUpdate={(time, duration) => {
          actions.setCurrentTime(time);
          actions.setDuration(duration);
        }}
        onPlay={() => actions.setPlaying(true)}
        onPause={() => actions.setPlaying(false)}
        onReady={() => actions.setLoading(false)}
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
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        isFullscreen={isFullscreen}
        title={activeEpisode ? `Ep ${activeEpisode.episodeNumber} - ${activeEpisode.title}` : undefined}
      />
    </>
  );
}

function DramaDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const dramaId = params.id as string;
  const playerRef = useRef<CloudflarePlayerHandle>(null) as React.RefObject<CloudflarePlayerHandle>;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamPlaybackInfo | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [relatedDramas, setRelatedDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [unlockingAll, setUnlockingAll] = useState(false);
  const [unlockedEpisodeIds, setUnlockedEpisodeIds] = useState<Set<string>>(new Set());

  // Fetch drama data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dramaRes, reviewsRes, relatedRes] = await Promise.all([
          dramasApi.getById(dramaId),
          reviewsApi.getByDrama(dramaId),
          dramasApi.getRelated(dramaId),
        ]);

        const dramaData = dramaRes.data?.drama || null;
        const episodesData: Episode[] = dramaRes.data?.episodes || [];
        setDrama(dramaData);
        setEpisodes(episodesData);
        setReviews(reviewsRes.data?.reviews || []);
        setReviewTotal(reviewsRes.data?.total || 0);
        setRelatedDramas(relatedRes.data || []);

        // Set active episode from URL param or first free episode
        const epParam = searchParams.get("ep");
        const targetEp = epParam
          ? episodesData.find((e) => e._id === epParam)
          : episodesData.find((e) => e.isFree) || episodesData[0];
        if (targetEp) setActiveEpisode(targetEp);
      } catch (error) {
        console.error("Failed to fetch drama:", error);
        toast("Failed to load drama details", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dramaId, searchParams]);

  // Initialize favorite state from API on mount (P1-17)
  useEffect(() => {
    if (!token) return;
    const checkFavorite = async () => {
      try {
        const res = await userApi.getFavorites(token);
        const favorites = res.data || [];
        const found = favorites.some((d: Drama) => d._id === dramaId);
        setIsFavorited(found);
      } catch {
        // silently ignore — non-critical
      }
    };
    checkFavorite();
  }, [token, dramaId]);

  // Fetch unlocked episodes for this drama
  useEffect(() => {
    if (!token || episodes.length === 0) return;
    const fetchUnlocked = async () => {
      try {
        const res = await userApi.getUnlockedEpisodes(token, dramaId);
        const ids: string[] = res.data || [];
        setUnlockedEpisodeIds(new Set(ids));
      } catch {
        // silently ignore
      }
    };
    fetchUnlocked();
  }, [token, dramaId, episodes.length]);

  // Fetch stream info when active episode changes
  useEffect(() => {
    if (!activeEpisode) {
      setStreamInfo(null);
      return;
    }
    // Only fetch stream for free/unlocked episodes
    if (!activeEpisode.isFree && !unlockedEpisodeIds.has(activeEpisode._id)) {
      setStreamInfo(null);
      return;
    }
    let cancelled = false;
    episodesApi.getStream(activeEpisode._id, token || undefined)
      .then((res: any) => {
        if (!cancelled) setStreamInfo(res.data ?? res);
      })
      .catch(() => {
        if (!cancelled) setStreamInfo(null);
      });
    return () => { cancelled = true; };
  }, [activeEpisode?._id, activeEpisode?.isFree, token, unlockedEpisodeIds]);

  const handleEpisodeClick = useCallback(async (episode: Episode) => {
    if (!episode.isFree && !unlockedEpisodeIds.has(episode._id)) {
      // Auth check for unlock (P1-18)
      if (!token) {
        toast("Please sign in to unlock episodes", "info");
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const confirmed = window.confirm(
        `This episode requires ${episode.unlockPrice} coins to unlock. Unlock now?`
      );
      if (!confirmed) return;
      // Call unlock API (P1-19)
      try {
        const res = await coinsApi.unlock(token, episode._id);
        const unlockData = res?.data || res;
        toast("Episode unlocked!", "success");
        await refreshUser();
        setUnlockedEpisodeIds(prev => new Set(prev).add(episode._id));
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : "Failed to unlock episode", "error");
        return;
      }
    }
    setActiveEpisode(episode);
  }, [token, toast, router, user, refreshUser, unlockedEpisodeIds]);

  // Unlock all paid episodes
  const lockedEpisodes = episodes.filter(ep => !ep.isFree && ep.unlockPrice > 0 && !unlockedEpisodeIds.has(ep._id));
  const totalUnlockCost = lockedEpisodes.reduce((sum, ep) => sum + ep.unlockPrice, 0);

  const handleUnlockAll = useCallback(async () => {
    if (!token) {
      toast("Please sign in to unlock episodes", "info");
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (lockedEpisodes.length === 0) {
      toast("All episodes are already unlocked!", "info");
      return;
    }

    const confirmed = window.confirm(
      `Unlock all ${lockedEpisodes.length} paid episodes for ${totalUnlockCost} coins?`
    );
    if (!confirmed) return;

    setUnlockingAll(true);
    try {
      const res = await coinsApi.unlockAll(token, dramaId);
      const data = res?.data || res;
      toast(`${data.unlockedCount} episodes unlocked!`, "success");
      await refreshUser();
      // Mark all paid episodes as unlocked
      setUnlockedEpisodeIds(prev => {
        const next = new Set(prev);
        episodes.filter(ep => !ep.isFree).forEach(ep => next.add(ep._id));
        return next;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to unlock episodes";
      if (message.includes("Insufficient")) {
        toast("Insufficient coins. Please recharge first.", "error");
      } else if (message.includes("already unlocked")) {
        toast("All episodes are already unlocked!", "info");
        // Mark all as unlocked since server says so
        setUnlockedEpisodeIds(prev => {
          const next = new Set(prev);
          episodes.filter(ep => !ep.isFree).forEach(ep => next.add(ep._id));
          return next;
        });
      } else {
        toast(message, "error");
      }
    } finally {
      setUnlockingAll(false);
    }
  }, [token, dramaId, lockedEpisodes.length, totalUnlockCost, toast, router, refreshUser]);

  // Fix favorite toggle logic (P0-05) + auth check (P1-18)
  const toggleFavorite = async () => {
    if (!token) {
      toast("Please sign in to add favorites", "info");
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      if (isFavorited) {
        await userApi.removeFavorite(token, dramaId);
        setIsFavorited(false);
        toast("Removed from My List", "success");
      } else {
        await userApi.addFavorite(token, dramaId);
        setIsFavorited(true);
        toast("Added to My List", "success");
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to update favorites", "error");
    }
  };

  // Auth check for review (P1-18) + toast errors (P1-22)
  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewContent.trim()) return;
    if (!token) {
      toast("Please sign in to write a review", "info");
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const res = await reviewsApi.add(token, dramaId, reviewRating, reviewContent);
      if (res.data) {
        setReviews((prev) => [res.data, ...prev]);
        setReviewTotal((prev) => prev + 1);
      }
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent("");
      toast("Review submitted!", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to submit review", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Drama not found</div>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const primaryCategory = drama.categories?.[0] || "Drama";

  // Determine episode index for prev/next navigation
  const activeEpisodeIndex = episodes.findIndex((e) => e._id === activeEpisode?._id);
  const hasPrevious = activeEpisodeIndex > 0;
  const hasNext = activeEpisodeIndex >= 0 && activeEpisodeIndex < episodes.length - 1;

  const handlePreviousEpisode = () => {
    if (hasPrevious) handleEpisodeClick(episodes[activeEpisodeIndex - 1]);
  };

  const handleNextEpisode = () => {
    if (hasNext) handleEpisodeClick(episodes[activeEpisodeIndex + 1]);
  };

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />

      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href={`/category?category=${primaryCategory}`} className="hover:text-white transition">{primaryCategory}</Link>
            <span>/</span>
            <span className="text-white truncate max-w-[200px]">{drama.title}</span>
          </nav>
        </div>

        {/* Player + Episodes Sidebar */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Video Player */}
            <div className="flex-1 min-w-0">
              <PlayerRoot className="aspect-video bg-black rounded-lg overflow-hidden">
                <PlayerInner
                  playerRef={playerRef}
                  streamInfo={streamInfo}
                  activeEpisode={activeEpisode}
                  drama={drama}
                  onPrevious={hasPrevious ? handlePreviousEpisode : undefined}
                  onNext={hasNext ? handleNextEpisode : undefined}
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                />
              </PlayerRoot>
            </div>

            {/* Episodes Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="rounded-lg bg-[#1a1a1a] p-4 lg:h-[calc(56.25vw*0.5625)] lg:max-h-[480px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Episodes</h3>
                  <span className="text-xs text-gray-400">Updated to Ep {episodes.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {episodes.map((ep) => (
                    <button
                      key={ep._id}
                      onClick={() => handleEpisodeClick(ep)}
                      className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition ${
                        activeEpisode?._id === ep._id
                          ? "bg-red-600/20 border border-red-600/50"
                          : "bg-[#222] hover:bg-[#2a2a2a]"
                      }`}
                    >
                      <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-800">
                        <img
                          src={ep.thumbnail || drama.cover}
                          alt={ep.title}
                          className="h-full w-full object-cover"
                        />
                        {activeEpisode?._id === ep._id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          Ep {ep.episodeNumber}: {ep.title}
                        </p>
                        <p className="text-xs text-gray-400">{formatDuration(ep.duration)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {ep.isFree ? (
                          <span className="rounded bg-green-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">FREE</span>
                        ) : unlockedEpisodeIds.has(ep._id) ? (
                          <span className="rounded bg-green-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white flex items-center gap-0.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            Unlocked
                          </span>
                        ) : ep.unlockPrice > 0 ? (
                          <span className="rounded bg-yellow-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">{ep.unlockPrice} coins</span>
                        ) : (
                          <span className="rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">VIP</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {lockedEpisodes.length > 0 ? (
                  <button
                    onClick={handleUnlockAll}
                    disabled={unlockingAll}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 py-2.5 text-sm font-medium text-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {unlockingAll ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Unlock All ({totalUnlockCost} coins)
                      </>
                    )}
                  </button>
                ) : episodes.some(ep => !ep.isFree && unlockedEpisodeIds.has(ep._id)) ? (
                  <div className="mt-3 w-full rounded-lg bg-green-600/20 border border-green-600/30 py-2.5 text-sm font-medium text-green-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    All Episodes Unlocked
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Drama Info */}
        <div className="mx-auto max-w-7xl px-4 mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{drama.title}</h1>
            {drama.isFeatured && (
              <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wide">Trending</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1" aria-label={`Rating: ${drama.rating?.toFixed(1)} out of 5 stars`}>
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {drama.rating?.toFixed(1)}
            </span>
            {drama.year && <span>{drama.year}</span>}
            <span>{drama.categories?.join(" · ")}</span>
            <span>{drama.totalEpisodes || episodes.length} Episodes</span>
            {drama.isCompleted && <span className="text-green-400">Completed</span>}
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{drama.description}</p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {drama.categories?.map((cat) => (
              <Link
                key={cat}
                href={`/category?category=${cat}`}
                className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 transition hover:bg-gray-700 hover:text-white"
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={toggleFavorite}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                isFavorited ? "bg-red-600 text-white" : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              <svg className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isFavorited ? "In My List" : "+ My List"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).then(
                  () => toast("Link copied to clipboard!", "success"),
                  () => toast("Failed to copy link", "error")
                );
              }}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Cast Section */}
        {drama.actors && drama.actors.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 mt-10">
            <h2 className="text-xl font-semibold text-white mb-4">Cast</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
              {drama.actors.map((actor, i) => (
                <div key={actor} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={`https://picsum.photos/seed/actor${dramaId}${i}/200/200`}
                      alt={actor}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-white text-center whitespace-nowrap">{actor}</p>
                  <p className="text-xs text-gray-400">{i === 0 ? "Lead" : "Supporting"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mx-auto max-w-7xl px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Reviews {reviewTotal > 0 && <span className="text-gray-400 text-base font-normal">({reviewTotal})</span>}
            </h2>
            <button
              onClick={() => {
                if (!token) {
                  toast("Please sign in to write a review", "info");
                  router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 rounded-lg bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-300">Your Rating:</span>
                <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Share your thoughts about this drama..."
                className="w-full rounded-lg bg-[#222] p-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-red-600 resize-none"
                rows={3}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewContent(""); }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || !reviewContent.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </div>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No reviews yet. Be the first to review!</div>
          ) : (
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <div key={review._id} className="rounded-lg bg-[#1a1a1a] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {review.userName?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{review.userName}</span>
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-500">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">{review.content}</p>
                      {review.likes !== undefined && review.likes > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {review.likes} likes
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full rounded-lg bg-[#1a1a1a] py-3 text-sm text-gray-400 transition hover:text-white hover:bg-[#222]"
                >
                  {showAllReviews ? "Show Less" : `Show More Reviews (${reviews.length - 3} more)`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* More Like This */}
        {relatedDramas.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 mt-10 pb-12">
            <h2 className="text-xl font-semibold text-white mb-4">More Like This</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {relatedDramas.map((d) => (
                <DramaCard
                  key={d._id}
                  drama={d}
                  onClick={() => router.push(`/drama/${d._id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function DramaDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <DramaDetailContent />
    </Suspense>
  );
}
