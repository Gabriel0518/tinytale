"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type Ref, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileCheck2,
  Film,
  PlayCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  CloudflarePlayer,
  PlayerRoot,
  type CloudflarePlayerHandle,
  usePlayerContext,
} from "@/components/player";
import ControlBar from "@/components/player/Controls/ControlBar";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";
import type {
  CreatorAdminContentReviewDetail,
  CreatorEpisodePreviewPayload,
} from "@/types/creator";
import {
  formatAdminDate,
  getCreatorContentReviewStatusMeta,
  getCreatorLifecycleMeta,
  getCreatorSlaStatusMeta,
  getMockContentReview,
} from "../../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type Decision = "approved" | "request_changes" | "rejected";
type CoverVariant = "portrait" | "landscape";
type ReviewEpisode = CreatorAdminContentReviewDetail["episodesCatalog"][number];
type ActivePreviewEpisode = ReviewEpisode & CreatorEpisodePreviewPayload;
type EpisodeDecision = "approved" | "rejected";

function canPreviewEpisode(episode: ReviewEpisode | ActivePreviewEpisode | null | undefined) {
  return Boolean(
    episode && (episode.hasVideo || episode.streamVideoId || (episode as ActivePreviewEpisode).playbackUrl || (episode as ActivePreviewEpisode).videoUrl),
  );
}

function formatEpisodeRuntime(seconds: number) {
  if (!seconds) return "Runtime pending";
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  if (!minutes) return `${rounded}s runtime`;
  if (!remainingSeconds) return `${minutes}m runtime`;
  return `${minutes}m ${remainingSeconds}s runtime`;
}

function formatEpisodePrice(episode: ReviewEpisode | ActivePreviewEpisode) {
  if (episode.isFree || !episode.unlockPrice) return "Free";
  return `${Math.round(episode.unlockPrice)} coins`;
}

function formatEpisodeSubtitleCount(episode: ReviewEpisode | ActivePreviewEpisode) {
  const previewSubtitles = "subtitles" in episode ? episode.subtitles?.length || 0 : 0;
  const subtitleCount = Math.max(0, episode.subtitleTracks?.length || previewSubtitles || 0);
  if (!subtitleCount) return "No subtitles";
  return `${subtitleCount} subtitle track${subtitleCount === 1 ? "" : "s"}`;
}

function resolvePreviewDefaultSubtitle(
  episode: ActivePreviewEpisode,
): string | null {
  const explicitDefault = episode.subtitleTracks?.find(
    (track) => track.isDefault && track.fileUrl && String(track.status || "").toLowerCase() === "ready",
  );
  if (explicitDefault?.language) {
    return explicitDefault.language;
  }
  return episode.subtitles?.[0]?.language || null;
}

function AdminEpisodePreviewPlayerInner({ episode }: { episode: ActivePreviewEpisode }) {
  const { state, actions, playerRef, isFullscreen, toggleFullscreen } = usePlayerContext();
  const subtitleTracks = useMemo(
    () => (episode.subtitles || []),
    [episode.subtitles],
  );
  const qualityOptions = useMemo(
    () => getQualityMenuOptions(true, episode.qualityOptions?.length ? episode.qualityOptions : ["auto"]),
    [episode.qualityOptions],
  );
  const [activeSubtitleLanguage, setActiveSubtitleLanguage] = useState<string | null>(() =>
    resolvePreviewDefaultSubtitle(episode),
  );

  useEffect(() => {
    actions.setLoading(true);
    actions.setCurrentTime(0);
    actions.setDuration(Number(episode.durationSeconds || 0));
    actions.setPlaying(false);
    actions.setError(null);
  }, [actions, episode.durationSeconds, episode.id]);

  useEffect(() => {
    const defaultSubtitle = resolvePreviewDefaultSubtitle(episode);
    setActiveSubtitleLanguage((current) => {
      if (current && subtitleTracks.some((track) => track.language === current)) {
        return current;
      }
      return defaultSubtitle;
    });
  }, [episode, subtitleTracks]);

  useEffect(() => {
    const defaultQuality = resolveDefaultQuality(qualityOptions);
    const isCurrentEnabled = qualityOptions.some(
      (option) => option.value === state.quality && !option.disabled,
    );

    if (!isCurrentEnabled) {
      actions.setQuality(defaultQuality);
    }
  }, [actions, qualityOptions, state.quality]);

  const handlePlayPause = useCallback(() => {
    if (state.isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [playerRef, state.isPlaying]);

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seek(time);
    actions.setCurrentTime(time);
  }, [actions, playerRef]);

  const handleVolumeChange = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
    actions.setVolume(volume);
  }, [actions, playerRef]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !state.isMuted;
    playerRef.current?.setMuted(nextMuted);
    actions.toggleMute();
  }, [actions, playerRef, state.isMuted]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    actions.setPlaybackRate(rate);
  }, [actions, playerRef]);

  return (
    <>
      <CloudflarePlayer
        ref={playerRef as Ref<CloudflarePlayerHandle>}
        streamVideoId={episode.streamVideoId || undefined}
        signedToken={episode.signedToken || undefined}
        videoUrl={episode.playbackUrl || episode.videoUrl || undefined}
        activeSubtitleLanguage={activeSubtitleLanguage}
        poster={episode.thumbnail || undefined}
        subtitles={subtitleTracks}
        quality={state.quality}
        autoplay
        showNativeBigPlayButton={false}
        onTimeUpdate={(time, duration) => {
          actions.setCurrentTime(time);
          actions.setDuration(duration);
        }}
        onPlay={() => actions.setPlaying(true)}
        onPause={() => actions.setPlaying(false)}
        onReady={() => actions.setLoading(false)}
        onError={(message) => actions.setError(message)}
        className="h-full w-full"
      />
      <ControlBar
        playerState={state}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onPlaybackRateChange={handlePlaybackRateChange}
        onQualityChange={actions.setQuality}
        showCenterPlayButton={false}
        subtitleTracks={subtitleTracks}
        activeSubtitleLanguage={activeSubtitleLanguage}
        onSubtitleChange={setActiveSubtitleLanguage}
        onToggleFullscreen={toggleFullscreen}
        qualityOptions={qualityOptions}
        isFullscreen={isFullscreen}
        title={`Ep ${episode.episodeNumber} - ${episode.title}`}
      />
    </>
  );
}

function AdminEpisodePreviewPlayer({ episode }: { episode: ActivePreviewEpisode }) {
  return (
    <PlayerRoot className="h-full w-full">
      <AdminEpisodePreviewPlayerInner episode={episode} />
    </PlayerRoot>
  );
}

export default function CreatorContentReviewDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const dramaId = String(params?.dramaId || "");

  const [data, setData] = useState<CreatorAdminContentReviewDetail | null>(
    getMockContentReview(dramaId),
  );
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activePreview, setActivePreview] = useState<ActivePreviewEpisode | null>(null);
  const [activeCover, setActiveCover] = useState<CoverVariant>("portrait");
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [episodeReviewState, setEpisodeReviewState] = useState<
    Record<string, { decision: EpisodeDecision; note: string }>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorContentReview(dramaId);
        const next = response?.data?.review || response?.data || response;
        if (!cancelled && next?.dramaId) {
          setData(next);
        }
      } catch {
        if (!cancelled) setData(getMockContentReview(dramaId));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (dramaId) load();
    return () => {
      cancelled = true;
    };
  }, [dramaId]);

  const statusMeta = useMemo(
    () => getCreatorContentReviewStatusMeta(data?.status || "draft"),
    [data?.status],
  );
  const slaMeta = useMemo(
    () => getCreatorSlaStatusMeta(data?.slaStatus || "on_track"),
    [data?.slaStatus],
  );
  const creatorStatusMeta = useMemo(
    () => getCreatorLifecycleMeta(data?.creatorStatus || "under_review"),
    [data?.creatorStatus],
  );

  const previewEpisodes = useMemo(() => data?.episodesPreview || [], [data?.episodesPreview]);
  const catalogEpisodes = useMemo(() => data?.episodesCatalog || [], [data?.episodesCatalog]);
  const featuredPreview = useMemo(
    () => previewEpisodes.find((episode) => canPreviewEpisode(episode)) || previewEpisodes[0] || null,
    [previewEpisodes],
  );
  const activeEpisodeReviewState = useMemo(() => {
    if (!activePreview) return null;
    return episodeReviewState[activePreview.id] || {
      decision: activePreview.reviewStatus === "rejected" ? "rejected" : "approved",
      note: activePreview.rejectionReason || activePreview.reviewNote || "",
    };
  }, [activePreview, episodeReviewState]);

  useEffect(() => {
    if (!previewEpisodes.length) {
      setEpisodeReviewState({});
      return;
    }

    setEpisodeReviewState((current) => {
      const next: Record<string, { decision: EpisodeDecision; note: string }> = {};
      previewEpisodes.forEach((episode) => {
        next[episode.id] = current[episode.id] || {
          decision: episode.reviewStatus === "rejected" ? "rejected" : "approved",
          note: episode.rejectionReason || episode.reviewNote || "",
        };
      });
      return next;
    });
  }, [previewEpisodes]);

  const coverOptions = useMemo(
    () => [
      {
        key: "portrait" as const,
        label: "Portrait cover",
        ratio: "2:3",
        url: data?.cover || "",
        aspectClassName: "aspect-[2/3]",
      },
      {
        key: "landscape" as const,
        label: "Landscape cover",
        ratio: "16:9",
        url: data?.horizontalCover || "",
        aspectClassName: "aspect-[16/9]",
      },
    ],
    [data?.cover, data?.horizontalCover],
  );
  const activeCoverOption =
    coverOptions.find((item) => item.key === activeCover) || coverOptions[0];

  useEffect(() => {
    if (activeCover === "landscape" && !data?.horizontalCover) {
      setActiveCover("portrait");
    }
  }, [activeCover, data?.horizontalCover]);

  useEffect(() => {
    if (!activePreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activePreview]);

  useEffect(() => {
    if (!coverPreviewOpen && !activePreview) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (activePreview) {
        setActivePreview(null);
        return;
      }
      if (coverPreviewOpen) {
        setCoverPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePreview, coverPreviewOpen]);

  const handleOpenPreview = useCallback(async (episode: ReviewEpisode | null) => {
    if (!episode || !data) {
      toast("No newly added episodes are available in this review batch.", "info");
      return;
    }

    if (!canPreviewEpisode(episode)) {
      toast("This episode video is still processing and cannot be previewed yet.", "info");
      return;
    }

    setPreviewLoading(true);
    try {
      const response: any = await adminApi.getCreatorContentReviewEpisodePreview(data.dramaId, episode.id);
      const previewPayload = response?.data || response;
      const nextPreview: ActivePreviewEpisode = {
        ...episode,
        ...previewPayload,
        durationSeconds: episode.durationSeconds,
        thumbnail: previewPayload?.thumbnailUrl || episode.thumbnail,
      };

      if (!canPreviewEpisode(nextPreview)) {
        toast("This episode preview is still missing a playable video source.", "info");
        return;
      }

      setActivePreview(nextPreview);
    } catch (error: any) {
      toast(error?.message || "Failed to load episode preview.", "error");
    } finally {
      setPreviewLoading(false);
    }
  }, [data, toast]);

  const updateEpisodeDecision = useCallback((episodeId: string, nextDecision: EpisodeDecision) => {
    setEpisodeReviewState((current) => ({
      ...current,
      [episodeId]: {
        decision: nextDecision,
        note: current[episodeId]?.note || "",
      },
    }));
  }, []);

  const updateEpisodeDecisionNote = useCallback((episodeId: string, nextNote: string) => {
    setEpisodeReviewState((current) => ({
      ...current,
      [episodeId]: {
        decision: current[episodeId]?.decision || "approved",
        note: nextNote,
      },
    }));
  }, []);

  const applyDecisionToAll = useCallback(() => {
    setEpisodeReviewState((current) => {
      const next = { ...current };
      previewEpisodes.forEach((episode) => {
        next[episode.id] = {
          decision: decision === "approved" ? "approved" : "rejected",
          note: current[episode.id]?.note || "",
        };
      });
      return next;
    });
  }, [decision, previewEpisodes]);

  async function handleSubmitReview() {
    if (!data) return;
    if (!previewEpisodes.length) {
      toast("There are no pending episodes in this review batch.", "info");
      return;
    }

    const rejectedWithoutNotes = previewEpisodes
      .filter((episode) => episodeReviewState[episode.id]?.decision === "rejected")
      .filter((episode) => !(episodeReviewState[episode.id]?.note || note).trim())
      .map((episode) => episode.episodeNumber);

    if (rejectedWithoutNotes.length > 0) {
      toast(`Rejected episodes need notes: ${rejectedWithoutNotes.join(", ")}`, "info");
      return;
    }

    const episodeDecisions = previewEpisodes.map((episode) => ({
      episodeId: episode.id,
      decision: episodeReviewState[episode.id]?.decision || "approved",
      note: episodeReviewState[episode.id]?.note || "",
    }));

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorContent(data.dramaId, { decision, note, episodeDecisions });
      const refreshedResponse: any = await adminApi.getCreatorContentReview(data.dramaId);
      const refreshedReview = refreshedResponse?.data?.review || refreshedResponse?.data || refreshedResponse;
      if (refreshedReview?.dramaId) {
        setData(refreshedReview);
      }
    } catch (error: any) {
      toast(error?.message || "Failed to save the review decision.", "error");
      return;
    } finally {
      setSubmitting(false);
    }

    toast("Content review decision recorded.", "success");
    setNote("");
    setActivePreview(null);
  }

  if (loading && !data) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Loading content review...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 text-gray-200">
        <Link
          href="/admin/creators/content"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to content queue
        </Link>
        <div className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-8 text-center text-sm text-gray-400">
          Review item not found.
        </div>
      </div>
    );
  }

  const isLandscapePreview =
    (activePreview?.videoWidth || 0) > (activePreview?.videoHeight || 0)
    && (activePreview?.videoHeight || 0) > 0;

  return (
    <div className="space-y-6 text-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/creators/content"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to content queue
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {data.title}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {data.creatorName} · Submitted{" "}
            {formatAdminDate(data.submittedAt, true)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${slaMeta.className}`}
          >
            {slaMeta.label}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${creatorStatusMeta.className}`}
          >
            {creatorStatusMeta.label}
          </span>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                      Cover review
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Use the cover card to switch artwork and jump into the video review player.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPreview(featuredPreview)}
                  disabled={!featuredPreview || previewLoading}
                  className="group relative w-full overflow-hidden rounded-2xl border border-gray-700/50 bg-[#0f0f17] text-left"
                >
                  <div className={activeCoverOption.aspectClassName}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeCoverOption.url || data.cover}
                      alt={`${data.title} ${activeCoverOption.label}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setCoverPreviewOpen(true);
                      }}
                      className="inline-flex rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur transition hover:border-white/40"
                    >
                      View cover
                    </button>
                    <div className="inline-flex rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur">
                      {coverOptions.map((option) => {
                        const disabled = option.key === "landscape" && !data.horizontalCover;
                        const isActive = option.key === activeCover;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            disabled={disabled}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveCover(option.key);
                            }}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                              isActive
                                ? "bg-indigo-600 text-white"
                                : "text-gray-200 hover:bg-white/10"
                            } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                          >
                            {option.key === "portrait" ? "2:3" : "16:9"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">
                        {activeCoverOption.label}
                      </p>
                      <p className="mt-2 text-sm text-gray-200">
                        Click the cover to open the episode review player.
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                      {previewLoading ? "Loading..." : "Review video"}
                    </span>
                  </div>
                </button>

                {!data.horizontalCover ? (
                  <p className="text-xs text-amber-300">
                    Landscape cover has not been uploaded yet. The reviewer is currently seeing the portrait fallback.
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-[#0f0f17] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                      Creator
                    </p>
                    <p className="mt-3 font-medium text-white">
                      {data.creatorName}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {data.creatorEmail}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {data.creatorLevel} · {data.country}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#0f0f17] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                      Submission
                    </p>
                    <p className="mt-3 font-medium text-white">
                      {data.episodes} episodes total
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {previewEpisodes.length} newly added episode{previewEpisodes.length === 1 ? "" : "s"} in this batch
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Deadline {formatAdminDate(data.slaDeadlineAt, true)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Synopsis
                  </p>
                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    {data.description}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    {data.categories.join(" · ")} · {data.language}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        Pricing snapshot
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Review package pricing before approving publish.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {data.pricingSummary.currency}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#13131d] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        Per episode
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {data.pricingSummary.perEpisode}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#13131d] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        Free episodes
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {data.pricingSummary.freeEpisodes}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#13131d] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        Full current
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {data.pricingSummary.fullCurrentPrice}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#13131d] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        Permanent unlock
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {data.pricingSummary.permanentUnlockPrice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Five-item review checklist
                </h2>
                <p className="text-sm text-gray-400">
                  Use these checks to keep creator content decisions consistent.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {data.checklist.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.passed ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}
                    >
                      {item.passed ? "Passed" : "Attention"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <article className={panelClassName}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <Film className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Episode preview
                    </h2>
                    <p className="text-sm text-gray-400">
                      Only newly added episodes are listed here so reviewers can focus on the latest submission delta.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  {previewEpisodes.length} new
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {previewEpisodes.length ? (
                  previewEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">
                              Episode {episode.episodeNumber}: {episode.title}
                            </p>
                            {episode.isNew ? (
                              <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                                New episode
                              </span>
                            ) : null}
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                              {formatEpisodePrice(episode)}
                            </span>
                            {episode.subtitleTracks?.length ? (
                              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                                {episode.subtitleTracks.length} subtitle track{episode.subtitleTracks.length === 1 ? "" : "s"}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                            {episode.description || "No episode synopsis provided for this submission."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>{formatEpisodeRuntime(episode.durationSeconds)}</span>
                            <span>{episode.status}</span>
                            {episode.createdAt ? (
                              <span>Added {formatAdminDate(episode.createdAt, true)}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(episode)}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${
                              canPreviewEpisode(episode)
                                ? "border-gray-600 text-gray-200 hover:border-indigo-400 hover:text-white"
                                : "border-gray-800 text-gray-500"
                            }`}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            {canPreviewEpisode(episode) ? "Watch" : "Video pending"}
                          </button>
                          <span className="text-xs text-gray-500">
                            #{episode.episodeNumber.toString().padStart(2, "0")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            episodeReviewState[episode.id]?.decision === "rejected"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {episodeReviewState[episode.id]?.decision === "rejected"
                            ? "Marked for rejection"
                            : "Marked for approval"}
                        </span>
                        {episodeReviewState[episode.id]?.note ? (
                          <span className="rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300">
                            Feedback added
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(episode)}
                          className="rounded-full border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-indigo-400 hover:text-white"
                        >
                          Review this episode
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-700 bg-[#0f0f17] p-6 text-sm text-gray-400">
                    No newly added episodes were detected in this review batch yet. Reviewers can still use the metadata, checklist, and history panels before deciding.
                  </div>
                )}
              </div>
            </article>

            <article className={panelClassName}>
              <h2 className="text-lg font-semibold text-white">
                Review history
              </h2>
              <div className="mt-5 space-y-3">
                {data.reviewHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.action}</p>
                      <span className="text-xs text-gray-500">
                        {formatAdminDate(item.at, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{item.actor}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Risk summary
                </h2>
                <p className="text-sm text-gray-400">
                  Escalate to compliance when copyright evidence exists.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Creator status
                </p>
                <p className="mt-2">{creatorStatusMeta.label}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Active DMCA strikes
                </p>
                <p className="mt-2">{data.activeDmcaStrikes}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Prior rejection count
                </p>
                <p className="mt-2">{data.rejectionHistoryCount}</p>
              </div>
              {(data.rejectionReason || data.reviewNote) && (
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Latest reviewer note
                  </p>
                  <p className="mt-2 leading-6 text-gray-300">
                    {data.rejectionReason || data.reviewNote}
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">
              Submission facts
            </h2>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Drama ID</span>
                <span>{data.dramaId}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Language</span>
                <span>{data.language}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Categories</span>
                <span>{data.categories.join(", ")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Landscape cover</span>
                <span>{data.horizontalCover ? "Uploaded" : "Missing"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Review batch</span>
                <span>{previewEpisodes.length} new episodes</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Reviewed at</span>
                <span>
                  {data.reviewedAt
                    ? formatAdminDate(data.reviewedAt, true)
                    : "Not reviewed"}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={panelClassName}>
        <h2 className="text-lg font-semibold text-white">Review batch submission</h2>
        <p className="mt-1 text-sm text-gray-400">
          Use the modal to set each episode decision, then optionally bulk-apply defaults here and save the full review batch.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Batch action
            </label>
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as Decision)}
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
            >
              <option value="approved">Approve all new episodes</option>
              <option value="request_changes">Request changes for all</option>
              <option value="rejected">Reject all for rights/policy issues</option>
            </select>
            <button
              type="button"
              onClick={applyDecisionToAll}
              className="mt-3 w-full rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:border-indigo-400 hover:text-white"
            >
              Apply batch action to all pending episodes
            </button>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Global review summary
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional summary for the creator or the internal audit trail. Rejected episodes still need per-episode notes."
              className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleSubmitReview}
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save episode review"}
        </button>
      </section>

      {previewLoading ? (
        <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="rounded-2xl bg-[#13131d] px-6 py-5 text-sm font-semibold text-white shadow-2xl">
            Loading episode preview...
          </div>
        </div>
      ) : null}

      {coverPreviewOpen ? (
        <div
          className="fixed inset-0 z-[89] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setCoverPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCoverPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg backdrop-blur transition hover:border-white/40 hover:bg-black/80"
              aria-label="Close cover preview"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">
                  {activeCoverOption.label}
                </p>
                <h3 className="truncate text-base font-semibold text-white">
                  {data.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCoverPreviewOpen(false)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
            <div className="bg-[#05070d] p-5">
              <div className={`mx-auto overflow-hidden rounded-2xl border border-gray-800 bg-black ${
                activeCoverOption.key === "portrait" ? "max-w-[520px]" : "max-w-6xl"
              }`}>
                <div className={activeCoverOption.aspectClassName}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeCoverOption.url || data.cover}
                    alt={`${data.title} ${activeCoverOption.label}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activePreview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">
                  Episode player
                </p>
                <h3 className="truncate text-base font-semibold text-white">
                  Episode {activePreview.episodeNumber}: {activePreview.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {activePreview.isNew ? (
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                      New episode
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200">
                    {formatEpisodeRuntime(activePreview.durationSeconds)}
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200">
                    {activePreview.status}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    {formatEpisodePrice(activePreview)}
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                    {formatEpisodeSubtitleCount(activePreview)}
                  </span>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                    Max quality {activePreview.maxQuality || "auto"}
                  </span>
                </div>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
                  {activePreview.description || "No episode synopsis provided for this submission."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>

            <div className="grid min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex min-h-0 flex-col border-b border-gray-800 bg-[#05070d] lg:border-b-0 lg:border-r">
                <div className="p-4 lg:p-5">
                  <div
                    className={`mx-auto overflow-hidden rounded-2xl bg-black shadow-[0px_24px_60px_rgba(15,23,42,0.55)] ${
                      isLandscapePreview ? "aspect-video max-w-5xl" : "aspect-[9/16] max-w-[430px]"
                    }`}
                  >
                    <AdminEpisodePreviewPlayer episode={activePreview} />
                  </div>
                </div>

                <div className="border-t border-gray-800 bg-[#0b1020] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Review controls
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Decide whether Episode {activePreview.episodeNumber} should pass review.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        activeEpisodeReviewState?.decision === "rejected"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {activeEpisodeReviewState?.decision === "rejected" ? "Rejected" : "Approved"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateEpisodeDecision(activePreview.id, "approved")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        activeEpisodeReviewState?.decision !== "rejected"
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                          : "bg-[#131a2a] text-gray-300 hover:text-white"
                      }`}
                    >
                      Approve this episode
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEpisodeDecision(activePreview.id, "rejected")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        activeEpisodeReviewState?.decision === "rejected"
                          ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
                          : "bg-[#131a2a] text-gray-300 hover:text-white"
                      }`}
                    >
                      Reject this episode
                    </button>
                  </div>

                  {activeEpisodeReviewState?.decision === "rejected" ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Rejection feedback
                      </label>
                      <textarea
                        value={activeEpisodeReviewState?.note || ""}
                        onChange={(event) => updateEpisodeDecisionNote(activePreview.id, event.target.value)}
                        placeholder="Tell the creator why this episode did not pass review."
                        className="min-h-[104px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : null}

                  <p className="mt-4 text-xs leading-6 text-gray-500">
                    The current episode decision is staged immediately. Use “Save episode review” on the page to submit the full review batch.
                  </p>
                </div>
              </div>

              <div className="flex min-h-0 flex-col border-t border-gray-800 p-5 lg:border-l lg:border-t-0">
                <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Episode navigator
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    Click a thumbnail to switch videos. Hover to see the full episode title.
                  </p>
                </div>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2">
                  {catalogEpisodes.map((episode) => (
                    <button
                      key={episode.id}
                      type="button"
                      title={episode.title}
                      onClick={() => handleOpenPreview(episode)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        activePreview.id === episode.id
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-gray-700/50 bg-[#13131d] hover:border-gray-500"
                      }`}
                    >
                      <div className="h-[76px] w-[56px] flex-shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-[#0b0f19]">
                        {episode.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={episode.thumbnail}
                            alt={episode.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-600">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            EP {episode.episodeNumber}
                          </p>
                          {episode.isNew ? (
                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                              New
                            </span>
                          ) : null}
                          {episode.reviewStatus === "rejected" ? (
                            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300">
                              Rejected
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-400">
                          {episode.title}
                        </p>
                        <p className="mt-1 text-xs text-emerald-300">
                          {formatEpisodePrice(episode)}
                        </p>
                      </div>
                      <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
