"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clapperboard,
  Clock3,
  ExternalLink,
  FileVideo2,
  GripVertical,
  ImagePlus,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import * as tus from "tus-js-client";
import { useAuth } from "@/lib/authContext";
import { API_URL, categoriesApi, creatorApi } from "@/lib/api";
import { useCountryCatalog } from "@/hooks/useCountryCatalog";
import { localizePath } from "@/lib/i18n";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";
import { useLocale } from "@/hooks/useLocale";
import { CloudflarePlayer, PlayerRoot, usePlayerContext, type CloudflarePlayerHandle } from "@/components/player";
import { ControlBar } from "@/components/player/Controls";
import type { SubtitleTrack } from "@/types";
import type { CreatorEpisodeItem } from "@/types/creator";
import type { CreatorEpisodePreviewPayload } from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

interface CreatorEpisodeUploadWorkspaceProps {
  initialDramaId?: string;
}

type UploadMode = "bulk" | "individual";
type UploadStep = 1 | 2 | 3;

type UploadState = {
  videoProgress: number;
  videoError: string;
  videoStatusText: string;
  uploading: boolean;
};

type EpisodeStatusUi = {
  text: string;
  className: string;
};

type BulkQueueStatus = "queued" | "uploading" | "processing" | "done" | "failed" | "cancelled";
type SourceSubtitleFormat = "srt" | "vtt";

interface BulkQueueItem {
  id: string;
  file: File;
  episodeId?: string;
  status: BulkQueueStatus;
  progress: number;
  error: string;
}

interface SourceUploadState {
  videoUid: string;
  fileName: string;
  progress: number;
  ready: boolean;
  uploading: boolean;
  statusText: string;
  error: string;
}

function makeAutoVideoFilename(): string {
  const now = new Date();
  const timestamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(16).slice(2, 8);
  return `video_${timestamp}_${random}.mp4`;
}

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const TUS_RECOVERABLE_STATUS = new Set([408, 409, 425, 429]);

function getPreferredTusChunkSize(fileSize: number): number {
  if (typeof window === "undefined") return 20 * MB;
  const effectiveType = (navigator as any)?.connection?.effectiveType as string | undefined;
  const isSlowNetwork = effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
  if (isSlowNetwork) return 8 * MB;
  if (fileSize >= 2 * GB) return 32 * MB;
  if (fileSize >= 512 * MB) return 20 * MB;
  return 8 * MB;
}

function getTusRetryDelays(): number[] {
  if (typeof window === "undefined") return [0, 1000, 3000, 7000, 15000, 30000];
  const effectiveType = (navigator as any)?.connection?.effectiveType as string | undefined;
  const isSlowNetwork = effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
  return isSlowNetwork
    ? [0, 2000, 5000, 10000, 20000, 40000]
    : [0, 1000, 3000, 7000, 15000, 30000];
}

function shouldRetryTusUpload(error: any, retryAttempt: number, options: any): boolean {
  const status = error?.originalResponse?.getStatus?.();
  if (typeof status === "number" && status >= 400 && status < 500 && !TUS_RECOVERABLE_STATUS.has(status)) {
    return false;
  }
  return retryAttempt < (options.retryDelays?.length || 0);
}

function getTusErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  try {
    return String(error);
  } catch {
    return fallback;
  }
}

function shouldAttachCreatorAuthHeader(requestUrl: string): boolean {
  try {
    const url = new URL(requestUrl, typeof window !== "undefined" ? window.location.origin : API_URL);
    const api = new URL(API_URL);
    return url.origin === api.origin && url.pathname.startsWith("/api/creator/upload/video");
  } catch {
    return requestUrl.startsWith("/api/creator/upload/video");
  }
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(1024)));
  const value = size / 1024 ** index;
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function mapEpisodeStatus(status?: string): { text: string; className: string } {
  if (status === "Published") return { text: "Published", className: "bg-[#dcfce7] text-[#15803d]" };
  if (status === "Processing") return { text: "Processing", className: "bg-[#fef3c7] text-[#b45309]" };
  if (status === "Failed") return { text: "Failed", className: "bg-[#fee2e2] text-[#b91c1c]" };
  return { text: "Draft", className: "bg-[#f1f5f9] text-[#475569]" };
}

function mapSubtitleTranslationStatus(episode: CreatorEpisodeItem): EpisodeStatusUi | null {
  const translation = episode.subtitleTranslation;
  if (!translation) {
    if ((episode.subtitleTracks?.length || 0) > 1) {
      return {
        text: `${episode.subtitleTracks?.length || 0} subtitle languages ready`,
        className: "bg-[#dcfce7] text-[#166534]",
      };
    }
    return null;
  }

  if (translation.status === "completed") {
    return {
      text: `${translation.completedCount || episode.subtitleTracks?.length || 0}/${translation.totalCount || episode.subtitleTracks?.length || 0} subtitle languages ready`,
      className: "bg-[#dcfce7] text-[#166534]",
    };
  }
  if (translation.status === "failed") {
    return {
      text: `Subtitle translation failed${translation.errorMessage ? `: ${translation.errorMessage}` : ""}`,
      className: "bg-[#fff7ed] text-[#c2410c]",
    };
  }
  return {
    text: `Auto-translating subtitles ${translation.completedCount}/${translation.totalCount}`,
    className: "bg-[#dbeafe] text-[#1d4ed8]",
  };
}

function getReadySubtitleTracks(episode: CreatorEpisodeItem) {
  return (episode.subtitleTracks || []).filter((track) => track.fileUrl && String(track.status || "").toLowerCase() === "ready");
}

function formatSubtitleTranslationLabel(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "Translation completed";
  if (normalized === "failed") return "Translation failed";
  if (normalized === "processing") return "Translation in progress";
  if (normalized === "pending") return "Translation queued";
  return normalized || "Translation status";
}

function isEpisodeVideoProcessing(episode: CreatorEpisodeItem, statusUi?: EpisodeStatusUi): boolean {
  if (statusUi && String(statusUi.text || "").toLowerCase().includes("slicing")) return true;
  const normalized = String(episode.status || "").toLowerCase();
  return normalized === "processing";
}

function mapEpisodeSubtitleUi(episode: CreatorEpisodeItem, options?: { videoProcessing?: boolean }): EpisodeStatusUi | null {
  const readyTracks = getReadySubtitleTracks(episode);
  const translation = episode.subtitleTranslation;
  const videoProcessing = Boolean(options?.videoProcessing);

  if (videoProcessing) {
    if (translation && translation.status !== "failed") {
      if (translation.status === "completed") {
        return {
          text: `${translation.completedCount || readyTracks.length}/${translation.totalCount || readyTracks.length} subtitle files prepared`,
          className: "bg-[#fef3c7] text-[#b45309]",
        };
      }
      return {
        text: `Preparing subtitles ${translation.completedCount}/${translation.totalCount}`,
        className: "bg-[#fef3c7] text-[#b45309]",
      };
    }

    if (readyTracks.length > 0 || episode.subtitleUrl) {
      return {
        text: `${Math.max(readyTracks.length, episode.subtitleUrl ? 1 : 0)} subtitle file${Math.max(readyTracks.length, episode.subtitleUrl ? 1 : 0) > 1 ? "s" : ""} prepared`,
        className: "bg-[#fef3c7] text-[#b45309]",
      };
    }

    return null;
  }

  return mapSubtitleTranslationStatus(episode) || (episode.subtitleUrl
    ? {
        text: `Subtitle Ready · ${String(episode.subtitleLanguage || "en").toUpperCase()}`,
        className: "bg-[#f0fdf4] text-[#16a34a]",
      }
    : null);
}

function mapBulkStatus(status: BulkQueueStatus): { label: string; className: string } {
  if (status === "done") return { label: "Done", className: "bg-[#dcfce7] text-[#166534]" };
  if (status === "uploading") return { label: "Uploading", className: "bg-[#dbeafe] text-[#1d4ed8]" };
  if (status === "processing") return { label: "Processing", className: "bg-[#fef3c7] text-[#b45309]" };
  if (status === "failed") return { label: "Failed", className: "bg-[#fee2e2] text-[#b91c1c]" };
  if (status === "cancelled") return { label: "Cancelled", className: "bg-[#e2e8f0] text-[#475569]" };
  return { label: "Queued", className: "bg-[#f1f5f9] text-[#475569]" };
}

function computeProgress(episodes: CreatorEpisodeItem[]): number {
  if (episodes.length === 0) return 0;
  const totalTasks = episodes.length * 3;
  const doneTasks = episodes.reduce((sum, episode) => {
    let done = sum;
    if (episode.thumbnail) done += 1;
    if (episode.streamVideoId || episode.videoUrl) done += 1;
    if (episode.subtitleUrl) done += 1;
    return done;
  }, 0);
  return Math.round((doneTasks / totalTasks) * 100);
}

function formatSourceCleanupSummary(
  t: ReturnType<typeof useCreatorI18n>["t"],
  sourceCleanup?: {
  total: number;
  pending: number;
  deleted: number;
  failed: number;
}): string {
  if (!sourceCleanup || sourceCleanup.total <= 0) return "";
  if (sourceCleanup.deleted >= sourceCleanup.total) return t("Source cleanup completed");
  if (sourceCleanup.failed > 0) return t("Source cleanup failed: __ARG_0__", sourceCleanup.failed);
  if (sourceCleanup.pending > 0) return t("Source cleanup pending: __ARG_0__", sourceCleanup.pending);
  return "";
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

interface VideoUploadHooks {
  onProgress?: (percent: number, text: string) => void;
  onProcessing?: () => void;
  onFailed?: (message: string) => void;
  onDone?: () => void;
}

const SUBTITLE_LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "hi", label: "Hindi" },
  { code: "id", label: "Indonesian" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
] as const;

type SubtitleLanguageCode = (typeof SUBTITLE_LANGUAGE_OPTIONS)[number]["code"];

type DramaFormState = {
  title: string;
  description: string;
  cover: string;
  horizontalCover: string;
  categories: string[];
  language: string;
  regions: string[];
};

const EMPTY_DRAMA_FORM: DramaFormState = {
  title: "",
  description: "",
  cover: "",
  horizontalCover: "",
  categories: [],
  language: "en",
  regions: [],
};

function isMeaningfulCover(url?: string): boolean {
  if (!url) return false;
  const normalized = String(url).trim();
  return Boolean(normalized) && !normalized.includes("placehold.co");
}

function normalizeDramaForm(raw: any, fallbackLanguage: string): DramaFormState {
  const normalizedCategories = Array.isArray(raw?.categories)
    ? raw.categories.map((item: unknown) => String(item || "").trim()).filter(Boolean)
    : [];
  const normalizedRegions = Array.isArray(raw?.regions)
    ? raw.regions.map((item: unknown) => String(item || "").trim()).filter(Boolean)
    : String(raw?.country || "").trim()
      ? [String(raw.country).trim()]
      : [];

  return {
    title: String(raw?.title || "").trim(),
    description: String(raw?.description || "").trim(),
    cover: isMeaningfulCover(raw?.cover) ? String(raw.cover) : "",
    horizontalCover: isMeaningfulCover(raw?.horizontalCover) ? String(raw.horizontalCover) : "",
    categories: normalizedCategories.slice(0, 1),
    language: String(raw?.language || fallbackLanguage || "en").trim().toLowerCase() || "en",
    regions: Array.from(new Set(normalizedRegions)),
  };
}

function extractCategoryOptions(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String(item.name || item.title || item.slug || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function getWorkflowProgress(step: UploadStep): number {
  if (step === 1) return 33;
  if (step === 2) return 66;
  return 100;
}

type CoverField = "cover" | "horizontalCover";

function CreatorRegionPicker({
  title,
  description,
  options,
  value,
  onChange,
  globalLabel,
  placeholder,
}: {
  title: string;
  description?: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (next: string[]) => void;
  globalLabel: string;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword) || option.value.toLowerCase().includes(keyword));
  }, [options, search]);

  const toggleRegion = useCallback((region: string) => {
    if (value.includes(region)) {
      onChange(value.filter((item) => item !== region));
      return;
    }
    onChange([...value, region]);
  }, [onChange, value]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{title}</span>
          {description ? <p className="mt-1 text-xs leading-5 text-[#64748b]">{description}</p> : null}
        </div>
        {value.length === 0 && description ? (
          <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-bold text-[#1d4ed8]">{globalLabel}</span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-3 flex min-h-[56px] w-full items-center justify-between rounded-[20px] border border-[#cbd5e1] bg-white px-5 py-3.5 text-left text-sm text-[#0f172a] transition hover:border-[#94a3b8]"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {value.length === 0 ? (
            <span className="text-sm text-[#94a3b8]">{placeholder}</span>
          ) : (
            value.map((region) => {
              const matched = options.find((option) => option.value === region);
              return (
                <span
                  key={region}
                  className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]"
                >
                  {matched?.label || region}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRegion(region);
                    }}
                    className="text-[#1d4ed8]/70 transition hover:text-[#1d4ed8]"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronsUpDown className="ml-3 h-4 w-4 shrink-0 text-[#94a3b8]" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[18px] border border-[#dbe1ea] bg-white shadow-[0px_24px_48px_rgba(15,23,42,0.14)]">
          <div className="border-b border-[#e2e8f0] p-3">
            <div className="flex items-center gap-2 rounded-[16px] border border-[#dbe1ea] bg-[#f8fafc] px-3 py-2.5">
              <Search className="h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search regions"
                className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className={`mb-2 flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-sm ${
                value.length === 0 ? "bg-[#eff6ff] font-semibold text-[#1d4ed8]" : "text-[#475569] hover:bg-[#f8fafc]"
              }`}
            >
              <span>{globalLabel}</span>
              {value.length === 0 ? <Check className="h-4 w-4" /> : null}
            </button>

            {filteredOptions.map((option) => {
              const checked = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleRegion(option.value)}
                  className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-sm transition ${
                    checked ? "bg-[#eff6ff] font-semibold text-[#1d4ed8]" : "text-[#334155] hover:bg-[#f8fafc]"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {checked ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-[#94a3b8]">No matching regions</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PreviewEpisodeState = CreatorEpisodePreviewPayload & {
  title: string;
  episodeNumber: number;
};

function resolvePreviewDefaultSubtitle(tracks: SubtitleTrack[]): string | null {
  if (tracks.length === 0) return null;
  return tracks[0]?.language || null;
}

function CreatorPreviewPlayerInner({ episode }: { episode: PreviewEpisodeState }) {
  const { state, actions, playerRef, isFullscreen, toggleFullscreen } = usePlayerContext();
  const subtitleTracks = useMemo(
    () => (episode.subtitles || []) as SubtitleTrack[],
    [episode.subtitles]
  );
  const qualityOptions = useMemo(
    () => getQualityMenuOptions(true, episode.qualityOptions),
    [episode.qualityOptions]
  );
  const [activeSubtitleLanguage, setActiveSubtitleLanguage] = useState<string | null>(() =>
    resolvePreviewDefaultSubtitle(subtitleTracks)
  );

  useEffect(() => {
    actions.setLoading(true);
    actions.setCurrentTime(0);
    actions.setDuration(Number(episode.duration || 0));
    actions.setPlaying(false);
    actions.setError(null);
  }, [actions, episode.duration, episode.episodeId]);

  useEffect(() => {
    const defaultSubtitle = resolvePreviewDefaultSubtitle(subtitleTracks);
    setActiveSubtitleLanguage((prev) => {
      if (prev && subtitleTracks.some((track) => track.language === prev)) {
        return prev;
      }
      return defaultSubtitle;
    });
  }, [subtitleTracks]);

  useEffect(() => {
    const defaultQuality = resolveDefaultQuality(qualityOptions);
    const isCurrentEnabled = qualityOptions.some(
      (option) => option.value === state.quality && !option.disabled
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
        videoUrl={episode.playbackUrl || episode.videoUrl || undefined}
        quality={state.quality}
        activeSubtitleLanguage={activeSubtitleLanguage}
        poster={episode.thumbnailUrl || undefined}
        autoplay
        subtitles={subtitleTracks}
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

function CreatorPreviewPlayer({ episode }: { episode: PreviewEpisodeState }) {
  return (
    <PlayerRoot className="h-full w-full">
      <CreatorPreviewPlayerInner episode={episode} />
    </PlayerRoot>
  );
}

export default function CreatorEpisodeUploadWorkspace({ initialDramaId }: CreatorEpisodeUploadWorkspaceProps) {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const { options: countryOptions } = useCountryCatalog(locale);

  const [dramaId, setDramaId] = useState(initialDramaId || "");
  const [currentStep, setCurrentStep] = useState<UploadStep>(initialDramaId ? 2 : 1);
  const [dramaForm, setDramaForm] = useState<DramaFormState>({
    ...EMPTY_DRAMA_FORM,
    language: locale || "en",
  });
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [pricingTemplate, setPricingTemplate] = useState(30);
  const [coverUploadingField, setCoverUploadingField] = useState<CoverField | "">("");
  const [activeCoverField, setActiveCoverField] = useState<CoverField>("cover");
  const [episodes, setEpisodes] = useState<CreatorEpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadMode, setUploadMode] = useState<UploadMode>("individual");
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});
  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkSummary, setBulkSummary] = useState("");
  const [sourceUpload, setSourceUpload] = useState<SourceUploadState>({
    videoUid: "",
    fileName: "",
    progress: 0,
    ready: false,
    uploading: false,
    statusText: "",
    error: "",
  });
  const [sourceSubtitle, setSourceSubtitle] = useState<{ url: string; format: SourceSubtitleFormat; fileName: string } | null>(null);
  const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState<SubtitleLanguageCode>(() => {
    const matched = SUBTITLE_LANGUAGE_OPTIONS.find((item) => item.code === locale);
    return matched?.code || "en";
  });
  const [autoSliceDurationMinutes, setAutoSliceDurationMinutes] = useState(2);
  const [autoSliceRunning, setAutoSliceRunning] = useState(false);
  const [autoSliceStatusMap, setAutoSliceStatusMap] = useState<Record<string, EpisodeStatusUi>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEpisode, setPreviewEpisode] = useState<PreviewEpisodeState | null>(null);

  const aliveRef = useRef(true);
  const activeTusUploadsRef = useRef<Record<string, tus.Upload>>({});
  const activeVideoUidRef = useRef<Record<string, string>>({});
  const pollingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const bulkCancelRequestedRef = useRef(false);
  const individualGridRef = useRef<HTMLDivElement | null>(null);

  const progress = useMemo(() => computeProgress(episodes), [episodes]);
  const coverUploading = coverUploadingField !== "";
  const categorySelectOptions = useMemo(
    () => Array.from(new Set([...categoryOptions, ...dramaForm.categories])).filter(Boolean),
    [categoryOptions, dramaForm.categories]
  );
  const selectedCategory = dramaForm.categories[0] || "";
  const releaseScopeLabel = dramaForm.regions.length === 0
    ? t("Global release")
    : dramaForm.regions.length <= 3
      ? dramaForm.regions.join(", ")
      : t("__ARG_0__ regions selected", dramaForm.regions.length);
  const coverCompletionCount = [dramaForm.cover, dramaForm.horizontalCover].filter((item) => isMeaningfulCover(item)).length;
  const coverFieldConfig: Record<CoverField, {
    shortLabel: string;
    aspectLabel: string;
    value: string;
    aspectClassName: string;
    alt: string;
  }> = {
    cover: {
      shortLabel: t("Portrait"),
      aspectLabel: "2:3",
      value: dramaForm.cover,
      aspectClassName: "aspect-[2/3]",
      alt: dramaForm.title || t("Drama portrait cover"),
    },
    horizontalCover: {
      shortLabel: t("Landscape"),
      aspectLabel: "16:9",
      value: dramaForm.horizontalCover,
      aspectClassName: "aspect-[16/9]",
      alt: dramaForm.title || t("Drama landscape cover"),
    },
  };
  const activeCoverConfig = coverFieldConfig[activeCoverField];
  const activeCoverRecommendedSize = activeCoverField === "cover" ? "1080×1920" : "1920×1080";
  const previewCover = dramaForm.cover || dramaForm.horizontalCover;
  const basicInfoCompleted = Boolean(
    dramaForm.title.trim()
    && dramaForm.description.trim()
    && isMeaningfulCover(dramaForm.cover)
    && isMeaningfulCover(dramaForm.horizontalCover)
    && selectedCategory
    && dramaForm.language.trim()
  );

  const updateEpisodeUploadState = useCallback((episodeId: string, patch: Partial<UploadState>) => {
    setUploadState((prev) => ({
      ...prev,
      [episodeId]: {
        videoProgress: prev[episodeId]?.videoProgress || 0,
        videoError: prev[episodeId]?.videoError || "",
        videoStatusText: prev[episodeId]?.videoStatusText || "",
        uploading: prev[episodeId]?.uploading || false,
        ...patch,
      },
    }));
  }, []);

  const clearPollingTimer = useCallback((episodeId: string) => {
    const timer = pollingTimerRef.current[episodeId];
    if (timer) {
      clearTimeout(timer);
      delete pollingTimerRef.current[episodeId];
    }
  }, []);

  const waitPollingDelay = useCallback((episodeId: string, ms: number) => {
    return new Promise<void>((resolve) => {
      clearPollingTimer(episodeId);
      const timer = setTimeout(() => {
        delete pollingTimerRef.current[episodeId];
        resolve();
      }, ms);
      pollingTimerRef.current[episodeId] = timer;
    });
  }, [clearPollingTimer]);

  const loadEpisodes = useCallback(
    async (targetDramaId: string) => {
      if (!token || !targetDramaId) return;
      setLoading(true);
      setError("");
      try {
        const response = await creatorApi.getDramaEpisodes(token, targetDramaId);
        setEpisodes(response.data?.episodes || []);
      } catch (err: any) {
        setError(err?.message || t("Failed to load episodes"));
      } finally {
        setLoading(false);
      }
    },
    [t, token]
  );

  const loadDrama = useCallback(
    async (targetDramaId: string) => {
      if (!token || !targetDramaId) return null;
      const response = await creatorApi.getDramaById(token, targetDramaId);
      const nextDrama = response.data || {};
      setDramaForm(normalizeDramaForm(nextDrama, locale || "en"));
      return nextDrama;
    },
    [locale, token]
  );

  const ensureDraftDrama = useCallback(async (): Promise<string> => {
    if (!token) throw new Error(t("Missing token"));
    if (dramaId) return dramaId;

    const created = await creatorApi.createDrama(token, {
      title: t("Untitled Story"),
      description: "",
      categories: [],
    });
    const createdId = String(created.data?._id || "");
    if (!createdId) throw new Error(t("Failed to create drama draft"));

    setDramaId(createdId);
    return createdId;
  }, [dramaId, t, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategoryOptions() {
      try {
        const response = await categoriesApi.getAll();
        if (!cancelled) {
          setCategoryOptions(extractCategoryOptions(response?.data));
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      }
    }

    loadCategoryOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function bootstrap() {
      try {
        const targetDramaId = initialDramaId || (await ensureDraftDrama());
        if (cancelled) return;
        await Promise.all([loadDrama(targetDramaId), loadEpisodes(targetDramaId)]);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || t("Failed to initialize workspace"));
        setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token, initialDramaId, ensureDraftDrama, loadDrama, loadEpisodes, t]);

  useEffect(() => {
    const uploadRef = activeTusUploadsRef;
    const timerRef = pollingTimerRef;
    return () => {
      aliveRef.current = false;
      Object.values(uploadRef.current).forEach((upload) => {
        upload.abort(true);
      });
      uploadRef.current = {};

      Object.keys(timerRef.current).forEach((episodeId) => {
        const timer = timerRef.current[episodeId];
        if (timer) {
          clearTimeout(timer);
          delete timerRef.current[episodeId];
        }
      });
    };
  }, []);

  useEffect(() => {
    setAutoSliceStatusMap((prev) => {
      const next: Record<string, EpisodeStatusUi> = {};
      const ids = new Set(episodes.map((episode) => episode._id));
      Object.entries(prev).forEach(([episodeId, value]) => {
        if (ids.has(episodeId)) next[episodeId] = value;
      });
      return next;
    });
  }, [episodes]);

  useEffect(() => {
    if (!previewEpisode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewEpisode]);

  const refreshEpisodes = useCallback(async () => {
    if (!dramaId) return;
    await loadEpisodes(dramaId);
  }, [dramaId, loadEpisodes]);

  useEffect(() => {
    if (!initialDramaId) return;
    if (!basicInfoCompleted) {
      setCurrentStep(1);
      return;
    }
    setCurrentStep((prev) => (prev === 1 ? 2 : prev));
  }, [basicInfoCompleted, initialDramaId]);

  const updateDramaFormField = useCallback(<K extends keyof DramaFormState,>(field: K, value: DramaFormState[K]) => {
    setDramaForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const selectDramaCategory = useCallback((value: string) => {
    const normalized = value.trim();
    setDramaForm((prev) => ({
      ...prev,
      categories: normalized ? [normalized] : [],
    }));
  }, []);

  const validateBasicInfo = useCallback(() => {
    if (!dramaForm.title.trim()) return t("Title is required");
    if (!dramaForm.description.trim()) return t("Description is required");
    if (!isMeaningfulCover(dramaForm.cover)) return t("Vertical cover is required");
    if (!isMeaningfulCover(dramaForm.horizontalCover)) return t("Horizontal cover is required");
    if (dramaForm.categories.length === 0) return t("Select one category");
    if (!dramaForm.language.trim()) return t("Primary language is required");
    return "";
  }, [dramaForm, t]);

  const persistDramaForm = useCallback(
    async (targetDramaId?: string) => {
      if (!token) throw new Error(t("Missing token"));
      const resolvedDramaId = targetDramaId || (await ensureDraftDrama());
      const payload = {
        title: dramaForm.title.trim() || t("Untitled Story"),
        description: dramaForm.description.trim(),
        cover: dramaForm.cover.trim() || "",
        horizontalCover: dramaForm.horizontalCover.trim() || "",
        categories: dramaForm.categories.slice(0, 1),
        language: dramaForm.language.trim() || "en",
        country: dramaForm.regions.length === 1 ? dramaForm.regions[0] : "",
        regions: dramaForm.regions,
      };
      await creatorApi.updateDrama(token, resolvedDramaId, payload);
      return resolvedDramaId;
    },
    [dramaForm, ensureDraftDrama, t, token]
  );

  const uploadDramaCover = useCallback(
    async (file: File, field: CoverField) => {
      if (!token) return;
      setCoverUploadingField(field);
      setError("");
      try {
        const uploaded = await creatorApi.uploadImageFile(token, file);
        setDramaForm((prev) => ({
          ...prev,
          [field]: uploaded.data.url,
        }));
      } catch (err: any) {
        setError(err?.message || t("Failed to upload cover"));
      } finally {
        setCoverUploadingField("");
      }
    },
    [t, token]
  );

  const persistEpisodePricing = useCallback(async (targetDramaId?: string) => {
    const resolvedDramaId = targetDramaId || dramaId;
    if (!token || !resolvedDramaId || episodes.length === 0) return;
    await Promise.all(
      episodes.map((episode) =>
        creatorApi.updateDramaEpisode(token, resolvedDramaId, episode._id, {
          isFree: episode.isFree,
          unlockPrice: episode.isFree ? 0 : Math.max(0, Number(episode.unlockPrice) || 0),
        })
      )
    );
  }, [dramaId, episodes, token]);

  const applyRecommendedPricing = useCallback(() => {
    setEpisodes((prev) =>
      prev.map((episode) => ({
        ...episode,
        isFree: episode.episodeNumber === 1,
        unlockPrice: episode.episodeNumber === 1 ? 0 : Math.max(1, pricingTemplate || 30),
      }))
    );
  }, [pricingTemplate]);

  const applyPriceToLockedEpisodes = useCallback(() => {
    const nextPrice = Math.max(1, pricingTemplate || 0);
    setEpisodes((prev) =>
      prev.map((episode) => ({
        ...episode,
        unlockPrice: episode.isFree ? 0 : nextPrice,
      }))
    );
  }, [pricingTemplate]);

  const updateEpisodePricing = useCallback((episodeId: string, patch: Partial<Pick<CreatorEpisodeItem, "isFree" | "unlockPrice">>) => {
    setEpisodes((prev) =>
      prev.map((episode) => {
        if (episode._id !== episodeId) return episode;
        const nextIsFree = patch.isFree !== undefined ? patch.isFree : episode.isFree;
        const nextUnlockPrice = nextIsFree ? 0 : Math.max(1, Number(patch.unlockPrice ?? episode.unlockPrice) || 30);
        return {
          ...episode,
          isFree: nextIsFree,
          unlockPrice: nextUnlockPrice,
        };
      })
    );
  }, []);

  const goToEpisodeUploadStep = useCallback(async () => {
    const validationError = validateBasicInfo();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const targetDramaId = await persistDramaForm();
      if (targetDramaId !== dramaId) {
        setDramaId(targetDramaId);
      }
      setCurrentStep(2);
    } catch (err: any) {
      setError(err?.message || t("Failed to save basic info"));
    } finally {
      setBusy(false);
    }
  }, [dramaId, persistDramaForm, t, validateBasicInfo]);

  const goToPaymentSettingsStep = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const targetDramaId = await persistDramaForm();
      if (targetDramaId !== dramaId) {
        setDramaId(targetDramaId);
      }
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.message || t("Failed to move to payment settings"));
    } finally {
      setBusy(false);
    }
  }, [dramaId, persistDramaForm, t]);

  const addEpisode = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const targetDramaId = await ensureDraftDrama();
      await creatorApi.createDramaEpisode(token, targetDramaId, { count: 1 });
      await loadEpisodes(targetDramaId);
    } catch (err: any) {
      setError(err?.message || t("Failed to create episode"));
    } finally {
      setBusy(false);
    }
  }, [token, ensureDraftDrama, loadEpisodes, t]);

  const removeEpisode = useCallback(
    async (episodeId: string) => {
      if (!token || !dramaId) return;
      setBusy(true);
      setError("");
      try {
        await creatorApi.deleteDramaEpisode(token, dramaId, episodeId);
        await refreshEpisodes();
      } catch (err: any) {
        setError(err?.message || t("Failed to delete episode"));
      } finally {
        setBusy(false);
      }
    },
    [token, dramaId, refreshEpisodes, t]
  );

  const patchEpisode = useCallback(
    async (episodeId: string, payload: Record<string, any>) => {
      if (!token || !dramaId) return;
      await creatorApi.updateDramaEpisode(token, dramaId, episodeId, payload);
    },
    [token, dramaId]
  );

  const pollVideoStatus = useCallback(
    async (episode: CreatorEpisodeItem, uid: string): Promise<boolean> => {
      if (!token || !dramaId) return false;

      for (let attempt = 0; attempt < 25; attempt += 1) {
        if (!aliveRef.current) return false;
        const response = await creatorApi.getVideoUploadStatus(token, uid);
        const data = response.data;

        if (data?.readyToStream) {
          await patchEpisode(episode._id, {
            status: "Published",
            duration: Number(data.duration || episode.duration || 0),
            thumbnail: data.thumbnail || episode.thumbnail || "",
            videoWidth: Number(data.videoWidth || 0),
            videoHeight: Number(data.videoHeight || 0),
          });
          updateEpisodeUploadState(episode._id, {
            videoProgress: 100,
            videoError: "",
            videoStatusText: t("Video ready"),
            uploading: false,
          });
          await refreshEpisodes();
          return true;
        }

        if (data?.errorReasonCode || data?.errorReasonText || attempt === 24) {
          await patchEpisode(episode._id, { status: "Failed" });
          updateEpisodeUploadState(episode._id, {
            videoError: data?.errorReasonText || t("Video processing failed"),
            videoStatusText: "",
            uploading: false,
          });
          await refreshEpisodes();
          return false;
        }

        await waitPollingDelay(episode._id, 5000);
      }

      return false;
    },
    [token, dramaId, patchEpisode, refreshEpisodes, t, updateEpisodeUploadState, waitPollingDelay]
  );

  const startEpisodeVideoUpload = useCallback(
    async (episode: CreatorEpisodeItem, file: File, hooks?: VideoUploadHooks): Promise<boolean> => {
      if (!token || !dramaId) return false;

      const currentUpload = activeTusUploadsRef.current[episode._id];
      if (currentUpload) {
        currentUpload.abort(true);
        delete activeTusUploadsRef.current[episode._id];
      }

      const previousStreamId = String(episode.streamVideoId || "").trim();
      if (previousStreamId) {
        creatorApi.deleteUploadedVideo(token, previousStreamId).catch(() => undefined);
      }

      const autoGeneratedName = makeAutoVideoFilename();
      updateEpisodeUploadState(episode._id, {
        videoProgress: 0,
        videoError: "",
        videoStatusText: t("Preparing upload..."),
        uploading: true,
      });

      try {
        let videoUid = "";
        let syncedVideoUid = false;

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `${API_URL}/api/creator/upload/video`,
            chunkSize: getPreferredTusChunkSize(file.size),
            retryDelays: getTusRetryDelays(),
            removeFingerprintOnSuccess: true,
            metadata: {
              name: autoGeneratedName,
              filetype: file.type || "video/mp4",
              maxDurationSeconds: "10800",
            },
            onShouldRetry: shouldRetryTusUpload,
            onBeforeRequest: (req) => {
              if (shouldAttachCreatorAuthHeader(req.getURL())) {
                req.setHeader("Authorization", `Bearer ${token}`);
              }
            },
            onAfterResponse: async (_req, res) => {
              const maybeVideoUid = String(res.getHeader("stream-media-id") || "").trim();
              if (!maybeVideoUid || syncedVideoUid) return;
              videoUid = maybeVideoUid;
              syncedVideoUid = true;
              activeVideoUidRef.current[episode._id] = maybeVideoUid;
              await patchEpisode(episode._id, {
                streamVideoId: maybeVideoUid,
                videoFileName: file.name,
                status: "Processing",
              });
            },
            onProgress: (uploaded, total) => {
              const percent = Math.min(100, Math.round((uploaded / total) * 100));
              const text = percent >= 100 ? t("Processing in cloud...") : t("Uploading __ARG_0__%", percent);
              updateEpisodeUploadState(episode._id, {
                videoProgress: percent,
                videoError: "",
                videoStatusText: text,
                uploading: true,
              });
              hooks?.onProgress?.(percent, text);
            },
            onError: (err) => {
              if (videoUid) {
                creatorApi.deleteUploadedVideo(token, videoUid).catch(() => undefined);
              }
              patchEpisode(episode._id, { status: "Failed" }).catch(() => undefined);
              const message = getTusErrorMessage(err, t("Upload failed"));
              updateEpisodeUploadState(episode._id, {
                videoError: message,
                videoStatusText: "",
                uploading: false,
              });
              hooks?.onFailed?.(message);
              reject(err || new Error(message));
            },
            onSuccess: () => {
              updateEpisodeUploadState(episode._id, {
                videoProgress: 100,
                videoError: "",
                videoStatusText: t("Processing in cloud..."),
                uploading: false,
              });
              hooks?.onProcessing?.();
              resolve();
            },
          });

          activeTusUploadsRef.current[episode._id] = upload;
          upload.start();
        });

        delete activeTusUploadsRef.current[episode._id];

        if (!videoUid) {
          throw new Error(t("Video upload failed: no stream id returned"));
        }

        const ready = await pollVideoStatus(episode, videoUid);
        if (ready) {
          hooks?.onDone?.();
        } else {
          hooks?.onFailed?.(t("Video processing failed"));
        }

        delete activeVideoUidRef.current[episode._id];
        return ready;
      } catch (err: any) {
        const message = getTusErrorMessage(err, t("Video upload failed"));
        updateEpisodeUploadState(episode._id, {
          videoError: message,
          videoStatusText: "",
          uploading: false,
        });
        hooks?.onFailed?.(message);
        return false;
      } finally {
        delete activeTusUploadsRef.current[episode._id];
      }
    },
    [token, dramaId, patchEpisode, pollVideoStatus, t, updateEpisodeUploadState]
  );

  const cancelEpisodeUpload = useCallback(
    async (episodeId: string) => {
      if (!token) return;
      clearPollingTimer(episodeId);

      const upload = activeTusUploadsRef.current[episodeId];
      if (upload) {
        upload.abort(true);
        delete activeTusUploadsRef.current[episodeId];
      }

      const videoUid = activeVideoUidRef.current[episodeId];
      if (videoUid) {
        creatorApi.deleteUploadedVideo(token, videoUid).catch(() => undefined);
        delete activeVideoUidRef.current[episodeId];
      }

      updateEpisodeUploadState(episodeId, {
        videoStatusText: t("Upload cancelled"),
        videoError: "",
        uploading: false,
      });
    },
    [token, clearPollingTimer, t, updateEpisodeUploadState]
  );

  const retryVideoStatusCheck = useCallback(
    async (episode: CreatorEpisodeItem) => {
      if (!episode.streamVideoId) {
        setError(t("No uploaded video found to retry status check"));
        return;
      }
      updateEpisodeUploadState(episode._id, {
        videoStatusText: t("Retrying cloud status check..."),
        videoError: "",
      });
      await pollVideoStatus(episode, episode.streamVideoId);
    },
    [pollVideoStatus, t, updateEpisodeUploadState]
  );

  const uploadVideo = useCallback(
    async (episode: CreatorEpisodeItem, file: File) => {
      if (!token || !dramaId) return;
      await startEpisodeVideoUpload(episode, file);
    },
    [token, dramaId, startEpisodeVideoUpload]
  );

  const uploadCover = useCallback(
    async (episode: CreatorEpisodeItem, file: File) => {
      if (!token || !dramaId) return;
      try {
        const uploaded = await creatorApi.uploadImageFile(token, file);
        await patchEpisode(episode._id, {
          thumbnail: uploaded.data.url,
        });
        await refreshEpisodes();
      } catch (err: any) {
      setError(err?.message || t("Failed to upload cover"));
      }
    },
    [token, dramaId, patchEpisode, refreshEpisodes, t]
  );

  const uploadSubtitle = useCallback(
    async (episode: CreatorEpisodeItem, file: File) => {
      if (!token || !dramaId) return;
      try {
        await creatorApi.uploadEpisodeSubtitle(token, dramaId, episode._id, {
          file,
          language: selectedSubtitleLanguage,
        });
        await refreshEpisodes();
      } catch (err: any) {
        setError(err?.message || t("Failed to upload subtitle"));
      }
    },
    [token, dramaId, refreshEpisodes, selectedSubtitleLanguage, t]
  );

  const uploadAutoSliceSourceVideo = useCallback(
    async (file: File) => {
      if (!token) return;
      const previousUid = sourceUpload.videoUid;
      if (previousUid) {
        creatorApi.deleteUploadedVideo(token, previousUid).catch(() => undefined);
      }

      setSourceUpload({
        videoUid: "",
        fileName: file.name,
        progress: 0,
        ready: false,
        uploading: true,
        statusText: t("Preparing source upload..."),
        error: "",
      });

      try {
        const autoGeneratedName = makeAutoVideoFilename();
        let videoUid = "";

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `${API_URL}/api/creator/upload/video`,
            chunkSize: getPreferredTusChunkSize(file.size),
            retryDelays: getTusRetryDelays(),
            removeFingerprintOnSuccess: true,
            metadata: {
              name: autoGeneratedName,
              filetype: file.type || "video/mp4",
              maxDurationSeconds: "10800",
            },
            onShouldRetry: shouldRetryTusUpload,
            onBeforeRequest: (req) => {
              if (shouldAttachCreatorAuthHeader(req.getURL())) {
                req.setHeader("Authorization", `Bearer ${token}`);
              }
            },
            onAfterResponse: (_req, res) => {
              const maybeVideoUid = String(res.getHeader("stream-media-id") || "").trim();
              if (!maybeVideoUid) return;
              videoUid = maybeVideoUid;
              setSourceUpload((prev) => ({
                ...prev,
                videoUid: maybeVideoUid,
              }));
            },
            onProgress: (uploaded, total) => {
              const percent = Math.min(100, Math.round((uploaded / total) * 100));
              setSourceUpload((prev) => ({
                ...prev,
                videoUid: videoUid || prev.videoUid,
                progress: percent,
                statusText: percent >= 100 ? t("Processing source video...") : t("Uploading source __ARG_0__%", percent),
                error: "",
              }));
            },
            onError: (err) => {
              reject(err || new Error(t("Source upload failed")));
            },
            onSuccess: () => resolve(),
          });
          upload.start();
        });

        if (!videoUid) {
          throw new Error(t("Source upload failed: no stream id returned"));
        }

        let ready = false;
        for (let attempt = 0; attempt < 24; attempt += 1) {
          const status = await creatorApi.getVideoUploadStatus(token, videoUid);
          const errorReasonCode = String(status.data?.errorReasonCode || "");
          const errorReasonText = String(status.data?.errorReasonText || "");
          if (errorReasonCode || errorReasonText) {
            throw new Error(errorReasonText || errorReasonCode || t("Source video processing failed"));
          }
          if (status.data?.readyToStream && Number(status.data?.duration || 0) > 0) {
            ready = true;
            break;
          }
          await wait(5000);
        }

        if (!ready) {
          throw new Error(t("Source video is still processing. Please retry in a moment."));
        }

        setSourceUpload((prev) => ({
          ...prev,
          videoUid,
          progress: 100,
          ready: true,
          uploading: false,
          statusText: t("Source video ready for auto-slice"),
          error: "",
        }));
      } catch (err: any) {
        const message = getTusErrorMessage(err, t("Source upload failed"));
        setSourceUpload((prev) => ({
          ...prev,
          uploading: false,
          ready: false,
          statusText: "",
          error: message,
        }));
      }
    },
    [sourceUpload.videoUid, t, token]
  );

  const uploadAutoSliceSubtitle = useCallback(
    async (file: File) => {
      if (!token) return;
      try {
        const uploaded = await creatorApi.uploadSubtitleFile(token, file);
        setSourceSubtitle({
          url: uploaded.data.url,
          format: uploaded.data.format,
          fileName: file.name,
        });
      } catch (err: any) {
        setError(err?.message || t("Failed to upload source subtitle"));
      }
    },
    [t, token]
  );

  const runAutoSlice = useCallback(async () => {
    if (!token) return;
    if (!sourceUpload.videoUid || !sourceUpload.ready) {
      setError(t("Please upload a source video and wait until it is ready"));
      return;
    }
    if (!sourceSubtitle) {
      setError(t("Source subtitle is required before auto-slice"));
      return;
    }

    setError("");
    setBulkSummary("");
    setAutoSliceRunning(true);
    setAutoSliceStatusMap({});

    try {
      const targetDramaId = await ensureDraftDrama();
      const splitRes = await creatorApi.autoSplitEpisodes(token, {
        sourceVideoUid: sourceUpload.videoUid,
        episodeDuration: Math.max(1, Math.round(autoSliceDurationMinutes * 60)),
        dramaId: targetDramaId,
        sourceSubtitleUrl: sourceSubtitle.url,
        sourceSubtitleFormat: sourceSubtitle.format,
        subtitleLanguage: selectedSubtitleLanguage,
      });

      let splitData = splitRes.data;
      if (splitData?.jobId) {
        const autoSplitJobId = splitData.jobId;
        const requestedClips = splitData.totalRequestedClips || 0;
        setBulkSummary(
          requestedClips > 0
            ? t("Auto-slice started. Preparing __ARG_0__ episode clips in the background.", requestedClips)
            : t("Auto-slice started. Preparing episode clips in the background.")
        );

        for (let attempt = 0; attempt < 120; attempt += 1) {
          const jobRes = await creatorApi.getAutoSplitJobStatus(token, autoSplitJobId);
          splitData = jobRes.data;

          if (splitData.status === "completed" || splitData.status === "failed") {
            break;
          }

          if (attempt === 119) {
            setBulkSummary(t("Auto-slice is still preparing clips in the background. Please refresh in a moment."));
          } else {
            const createdCount = splitData.episodes?.length || 0;
            const totalCount = splitData.totalRequestedClips || requestedClips || createdCount;
            setBulkSummary(
              totalCount > 0
                ? t("Auto-slice is preparing clips: __ARG_0__/__ARG_1__ episodes created", createdCount, totalCount)
                : t("Auto-slice is preparing clips in the background.")
            );
            await wait(5000);
          }
        }
      }

      const createdEpisodes = splitData?.episodes || [];
      await loadEpisodes(targetDramaId);
      if (createdEpisodes.length > 0) {
        setUploadMode("individual");
        requestAnimationFrame(() => {
          individualGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      const initialCleanupReason = splitData?.sourceCleanup?.reason ? ` (${splitData.sourceCleanup.reason})` : "";

      const uidToEpisodeId = new Map(
        createdEpisodes
          .filter((episode) => episode.streamVideoId && episode.episodeId)
          .map((episode) => [episode.streamVideoId, episode.episodeId])
      );
      const uids = Array.from(uidToEpisodeId.keys());

      if (!uids.length) {
        if (splitData?.status === "failed" && splitData.failureMessage) {
          throw new Error(splitData.failureMessage);
        }
        setBulkSummary(t("Auto-slice completed, but no clip uid was returned"));
        return;
      }

      const handledReady = new Set<string>();
      const handledFailed = new Set<string>();
      const monitorEpisodeIds = new Set(Array.from(uidToEpisodeId.values()));

      for (let attempt = 0; attempt < 36; attempt += 1) {
        const clipStatus = await creatorApi.getClipStatus(token, uids);
        const clips = clipStatus.data?.clips || [];
        const failedClips = clips.filter((clip) => !clip.readyToStream && (clip.status === "error" || clip.errorReasonCode || clip.errorReasonText));
        const sourceCleanupText = formatSourceCleanupSummary(t, clipStatus.data?.sourceCleanup);

        for (const clip of clips) {
          const episodeId = uidToEpisodeId.get(clip.uid);
          if (!episodeId) continue;

          if (clip.readyToStream && !handledReady.has(clip.uid)) {
            handledReady.add(clip.uid);
            await patchEpisode(episodeId, {
              status: "Published",
              duration: Number(clip.duration || 0),
              videoWidth: Number(clip.videoWidth || 0),
              videoHeight: Number(clip.videoHeight || 0),
              ...(clip.thumbnail ? { thumbnail: clip.thumbnail } : {}),
            });
          } else if (failedClips.some((failed) => failed.uid === clip.uid) && !handledFailed.has(clip.uid)) {
            handledFailed.add(clip.uid);
            await patchEpisode(episodeId, { status: "Failed" });
          }
        }

        const resolvedCount = handledReady.size + handledFailed.size;
        const progressPercent = uids.length > 0 ? Math.round((resolvedCount / uids.length) * 100) : 0;
        setAutoSliceStatusMap(() => {
          const next: Record<string, EpisodeStatusUi> = {};
          monitorEpisodeIds.forEach((episodeId) => {
            if (Array.from(handledReady).some((uid) => uidToEpisodeId.get(uid) === episodeId)) {
              return;
            }
            if (Array.from(handledFailed).some((uid) => uidToEpisodeId.get(uid) === episodeId)) {
              next[episodeId] = { text: "Failed", className: "bg-[#fee2e2] text-[#b91c1c]" };
              return;
            }
            next[episodeId] = {
              text: `Slicing ${progressPercent}%`,
              className: "bg-[#fef3c7] text-[#b45309]",
            };
          });
          return next;
        });

        if (clipStatus.data?.allReady) {
          await refreshEpisodes();
          setAutoSliceStatusMap({});
          setBulkSummary(`${t("Auto-slice completed: __ARG_0__ episodes ready", handledReady.size)}${sourceCleanupText ? ` | ${sourceCleanupText}` : initialCleanupReason}`);
          if (failedClips.length > 0) {
            const reason = failedClips[0]?.errorReasonText || failedClips[0]?.errorReasonCode || t("Unknown processing error");
            setBulkSummary(
              `${t("Auto-slice partial success: __ARG_0__ ready, __ARG_1__ failed (__ARG_2__)", handledReady.size, failedClips.length, reason)}${
                sourceCleanupText ? ` | ${sourceCleanupText}` : initialCleanupReason
              }`
            );
          }
          break;
        }

        if (failedClips.length > 0 && handledReady.size + failedClips.length >= uids.length) {
          await refreshEpisodes();
          setAutoSliceStatusMap({});
          const reason = failedClips[0]?.errorReasonText || failedClips[0]?.errorReasonCode || t("Unknown processing error");
          setBulkSummary(
            `${t("Auto-slice partial success: __ARG_0__ ready, __ARG_1__ failed (__ARG_2__)", handledReady.size, failedClips.length, reason)}${
              sourceCleanupText ? ` | ${sourceCleanupText}` : initialCleanupReason
            }`
          );
          break;
        }

        if (attempt === 35) {
          setBulkSummary(
            `${t("Auto-slice started. __ARG_0__/__ARG_1__ clips ready, others still processing.", handledReady.size, uids.length)}${
              sourceCleanupText ? ` ${sourceCleanupText}` : initialCleanupReason
            }`
          );
        } else {
          await wait(5000);
        }
      }
    } catch (err: any) {
      setAutoSliceStatusMap({});
      setError(err?.message || t("Auto-slice failed"));
    } finally {
      setAutoSliceRunning(false);
    }
  }, [
    token,
    sourceUpload.videoUid,
    sourceUpload.ready,
    autoSliceDurationMinutes,
    sourceSubtitle,
    selectedSubtitleLanguage,
    ensureDraftDrama,
    loadEpisodes,
    patchEpisode,
    refreshEpisodes,
    t,
  ]);

  const updateBulkItem = useCallback((itemId: string, patch: Partial<BulkQueueItem>) => {
    setBulkQueue((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }, []);

  const selectBulkFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter((file) => {
      const mime = (file.type || "").toLowerCase();
      return mime === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    });

    if (!accepted.length) {
      setError(t("Please select MP4 files only"));
      return;
    }

    const mapped = accepted.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
      file,
      status: "queued" as BulkQueueStatus,
      progress: 0,
      error: "",
    }));

    setBulkQueue((prev) => [...prev, ...mapped]);
  }, [t]);

  const removeBulkItem = useCallback((itemId: string) => {
    if (bulkRunning) return;
    setBulkQueue((prev) => prev.filter((item) => item.id !== itemId));
  }, [bulkRunning]);

  const clearBulkQueue = useCallback(() => {
    if (bulkRunning) return;
    setBulkQueue([]);
    setBulkSummary("");
  }, [bulkRunning]);

  const openEpisodePreview = useCallback(
    async (episode: CreatorEpisodeItem) => {
      if (!token || !dramaId) return;
      if (!episode.streamVideoId && !episode.videoUrl) {
        setError(t("Upload a video before previewing the episode"));
        return;
      }

      setError("");
      setPreviewLoading(true);
      try {
        const response = await creatorApi.getDramaEpisodePreview(token, dramaId, episode._id);
        setPreviewEpisode({
          ...response.data,
          title: episode.title,
          episodeNumber: episode.episodeNumber,
        });
      } catch (err: any) {
        setError(err?.message || t("Failed to load episode preview"));
      } finally {
        setPreviewLoading(false);
      }
    },
    [token, dramaId, t]
  );

  const cancelBulkUpload = useCallback(async () => {
    bulkCancelRequestedRef.current = true;
    setBulkSummary(t("Bulk upload cancelled"));
    const activeItems = bulkQueue.filter((item) => item.status === "uploading" || item.status === "processing");
    await Promise.all(activeItems.map((item) => (item.episodeId ? cancelEpisodeUpload(item.episodeId) : Promise.resolve())));
    setBulkQueue((prev) =>
      prev.map((item) =>
        item.status === "queued" || item.status === "uploading" || item.status === "processing"
          ? { ...item, status: "cancelled", error: t("Cancelled by user") }
          : item
      )
    );
    setBulkRunning(false);
  }, [bulkQueue, cancelEpisodeUpload, t]);

  const startBulkUpload = useCallback(async () => {
    if (!token) return;

    const queued = bulkQueue.filter((item) => item.status === "queued" || item.status === "failed" || item.status === "cancelled");
    if (!queued.length) {
      setError(t("No queued files to upload"));
      return;
    }

    setError("");
    setBulkSummary("");
    setBulkRunning(true);
    bulkCancelRequestedRef.current = false;

    try {
      let doneCount = 0;
      let failedCount = 0;
      const targetDramaId = await ensureDraftDrama();
      const created = await creatorApi.bulkCreateDramaEpisodes(token, targetDramaId, {
        episodes: queued.map((_item) => ({ title: "", description: "" })),
      });

      const createdEpisodes = [...(created.data?.episodes || [])].sort((a, b) => a.episodeNumber - b.episodeNumber);
      if (createdEpisodes.length !== queued.length) {
        throw new Error(t("Bulk upload initialization mismatch, please retry"));
      }

      for (let index = 0; index < queued.length; index += 1) {
        if (bulkCancelRequestedRef.current) break;

        const queueItem = queued[index];
        const episode = createdEpisodes[index];
        if (!episode) continue;

        updateBulkItem(queueItem.id, {
          episodeId: episode._id,
          status: "uploading",
          progress: 0,
          error: "",
        });

        const uploaded = await startEpisodeVideoUpload(episode, queueItem.file, {
          onProgress: (percent) => {
            updateBulkItem(queueItem.id, {
              progress: percent,
              status: percent >= 100 ? "processing" : "uploading",
            });
          },
          onProcessing: () => {
            updateBulkItem(queueItem.id, { status: "processing", progress: 100 });
          },
          onDone: () => {
            updateBulkItem(queueItem.id, { status: "done", progress: 100, error: "" });
            doneCount += 1;
          },
          onFailed: (message) => {
            updateBulkItem(queueItem.id, {
              status: "failed",
              error: message,
            });
          },
        });

        if (!uploaded && !bulkCancelRequestedRef.current) {
          failedCount += 1;
          updateBulkItem(queueItem.id, {
            status: "failed",
            error: t("Upload or processing failed"),
          });
        }
      }

      await loadEpisodes(targetDramaId);
      if (!bulkCancelRequestedRef.current) {
        setBulkSummary(t("Bulk upload completed: __ARG_0__ done, __ARG_1__ failed", doneCount, failedCount));
      }
    } catch (err: any) {
      setError(err?.message || t("Bulk upload failed"));
    } finally {
      setBulkRunning(false);
      bulkCancelRequestedRef.current = false;
    }
  }, [token, bulkQueue, ensureDraftDrama, loadEpisodes, startEpisodeVideoUpload, t, updateBulkItem]);

  const saveDraft = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const targetDramaId = await persistDramaForm();
      if (currentStep === 3) {
        await persistEpisodePricing(targetDramaId);
      }
      await creatorApi.updateDrama(token, targetDramaId, { updatedAt: new Date().toISOString() });
      setDramaId(targetDramaId);
      await Promise.all([loadDrama(targetDramaId), loadEpisodes(targetDramaId)]);
    } catch (err: any) {
      setError(err?.message || t("Failed to save draft"));
    } finally {
      setBusy(false);
    }
  }, [currentStep, loadDrama, loadEpisodes, persistDramaForm, persistEpisodePricing, t, token]);

  const nextStep = useCallback(async () => {
    if (!token) return;
    const basicInfoError = validateBasicInfo();
    if (basicInfoError) {
      setCurrentStep(1);
      setError(basicInfoError);
      return;
    }
    if (episodes.some((episode) => !episode.streamVideoId && !episode.videoUrl)) {
      setCurrentStep(2);
      setError(t("Upload a video for every episode before submitting for review"));
      individualGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (episodes.some((episode) => !episode.subtitleUrl)) {
      setCurrentStep(2);
      setUploadMode("individual");
      setError(t("Upload subtitles for every episode before submitting for review"));
      individualGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (episodes.some((episode) => !episode.isFree && (!Number.isFinite(Number(episode.unlockPrice)) || Number(episode.unlockPrice) <= 0))) {
      setCurrentStep(3);
      setError(t("Set a valid unlock price for every paid episode"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const targetDramaId = await persistDramaForm();
      await persistEpisodePricing(targetDramaId);
      await creatorApi.submitDramaForReview(token, targetDramaId);
      router.push(localizePath("/creator/dramas", locale));
    } catch (err: any) {
      setError(err?.message || t("Failed to submit drama for review"));
    } finally {
      setBusy(false);
    }
  }, [episodes, locale, persistDramaForm, persistEpisodePricing, router, t, token, validateBasicInfo]);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-[#e2e8f0]" />
      </div>
    );
  }

  const canRunBulk = bulkQueue.some((item) => item.status === "queued" || item.status === "failed" || item.status === "cancelled");
  const workflowProgress = getWorkflowProgress(currentStep);
  const freeEpisodesCount = episodes.filter((episode) => episode.isFree).length;
  const paidEpisodesCount = Math.max(0, episodes.length - freeEpisodesCount);
  const readyEpisodesCount = episodes.filter((episode) => (episode.streamVideoId || episode.videoUrl) && episode.subtitleUrl).length;
  const stepOnePanelClassName = "rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] md:p-6";
  const stepOneTitleClassName = "text-[22px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[24px]";
  const stepOneLabelClassName = "text-[13px] font-semibold text-[#0f172a]";
  const stepOneInputClassName = "h-12 w-full rounded-2xl border border-[#d7dde8] bg-[#f8fafc] px-4 text-[15px] text-[#0f172a] outline-none transition focus:border-[#1876f2] focus:bg-white";
  const stepOneTextareaClassName = "w-full rounded-2xl border border-[#d7dde8] bg-[#f8fafc] px-4 py-3 text-[15px] text-[#0f172a] outline-none transition focus:border-[#1876f2] focus:bg-white";

  return (
    <div className="-mx-4 -mt-6 md:-mx-6 lg:-mx-8 lg:-mt-8">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-3.5 md:px-7">
        <div className="flex items-center gap-3 text-sm">
          <div className={`flex items-center gap-3 ${currentStep === 1 ? "text-[#0f172a]" : "text-[#64748b]"}`}>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                currentStep === 1 ? "bg-[#1876f2] text-white" : "bg-[#e2e8f0] text-[#64748b]"
              }`}
            >
              1
            </span>
            <div>
              <p className={currentStep === 1 ? "font-bold text-[#1876f2]" : "font-semibold text-[#64748b]"}>{t("Basic Info")}</p>
              <p className="text-xs text-[#94a3b8]">{t("Series details")}</p>
            </div>
          </div>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <div className={`flex items-center gap-3 ${currentStep === 2 ? "text-[#0f172a]" : "text-[#64748b]"}`}>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                currentStep === 2 ? "bg-[#1876f2] text-white" : "bg-[#e2e8f0] text-[#64748b]"
              }`}
            >
              2
            </span>
            <div>
              <p className={currentStep === 2 ? "font-bold text-[#1876f2]" : "font-semibold text-[#64748b]"}>{t("Episode Upload")}</p>
              <p className="text-xs text-[#94a3b8]">{t("Video assets")}</p>
            </div>
          </div>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <div className={`flex items-center gap-3 ${currentStep === 3 ? "text-[#0f172a]" : "text-[#64748b]"}`}>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                currentStep === 3 ? "bg-[#1876f2] text-white" : "bg-[#e2e8f0] text-[#64748b]"
              }`}
            >
              3
            </span>
            <div>
              <p className={currentStep === 3 ? "font-bold text-[#1876f2]" : "font-semibold text-[#64748b]"}>{t("Payment Settings")}</p>
              <p className="text-xs text-[#94a3b8]">{t("Monetization")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-7 pt-6 md:px-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-[#0f172a] md:text-[34px]">
              {t("Upload New Drama")}
            </h1>
            <p className="mt-1 max-w-4xl text-[13px] leading-6 text-[#64748b]">
              {currentStep === 1
                ? t("Set up the core metadata, cover assets, and storefront preview before moving into episode uploads.")
                : currentStep === 2
                  ? uploadMode === "bulk"
                    ? t("Upload source media, run auto-slice, and prepare each generated episode for review.")
                    : t("Manage episode-level uploads, covers, and subtitle assets before monetization.")
                  : t("Finalize pricing rules and make sure every episode is ready for creator review.")}
            </p>
          </div>

          <div className="w-[200px]">
            <p className="text-right text-[13px] font-medium text-[#0f172a]">{t("Progress: __ARG_0__%", workflowProgress)}</p>
            <div className="mt-1.5 h-2 rounded-full bg-[#e2e8f0]">
              <div className="h-2 rounded-full bg-[#1876f2]" style={{ width: `${workflowProgress}%` }} />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">{error}</div>
        ) : null}

        {currentStep === 1 ? (
          <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className={stepOnePanelClassName}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className={stepOneTitleClassName}>{t("General Information")}</h2>
                    <p className="mt-1 text-[13px] leading-6 text-[#64748b]">
                      {t("Keep metadata clean and storefront-ready. Category stays single-select, while release regions support multi-select publishing.")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Release Scope")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">{releaseScopeLabel}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <label className="block">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={stepOneLabelClassName}>{t("Drama Title")}</span>
                      <span className="text-sm text-[#94a3b8]">{dramaForm.title.length}/100</span>
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={dramaForm.title}
                      onChange={(event) => updateDramaFormField("title", event.target.value)}
                      placeholder={t("Enter drama title")}
                      className={stepOneInputClassName}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={stepOneLabelClassName}>{t("Description")}</span>
                      <span className="text-sm text-[#94a3b8]">{dramaForm.description.length}/500</span>
                    </div>
                    <textarea
                      value={dramaForm.description}
                      onChange={(event) => updateDramaFormField("description", event.target.value)}
                      placeholder={t("Briefly describe your series...")}
                      rows={5}
                      maxLength={500}
                      className={stepOneTextareaClassName}
                    />
                  </label>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <span className={stepOneLabelClassName}>{t("Category")}</span>
                      <select
                        value={selectedCategory}
                        onChange={(event) => selectDramaCategory(event.target.value)}
                        className={`mt-2 ${stepOneInputClassName}`}
                      >
                        <option value="">{t("Select a category")}</option>
                        {categorySelectOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <CreatorRegionPicker
                      title={t("Target Regions")}
                      description=""
                      options={countryOptions}
                      value={dramaForm.regions}
                      onChange={(next) => updateDramaFormField("regions", next)}
                      globalLabel={t("Global release")}
                      placeholder={t("Add region...")}
                    />
                  </div>
                </div>
              </div>

              <div className={stepOnePanelClassName}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className={stepOneTitleClassName}>{t("Cover Image")}</h2>
                    <p className="mt-1 text-[13px] leading-6 text-[#64748b]">
                      {t("Upload both portrait and landscape covers. The active tab changes the recommended asset ratio and preview rendering.")}
                    </p>
                  </div>
                  <div className="inline-flex rounded-[14px] bg-[#edf2f7] p-1">
                    {(["cover", "horizontalCover"] as CoverField[]).map((field) => {
                      const config = coverFieldConfig[field];
                      const active = activeCoverField === field;
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => setActiveCoverField(field)}
                          className={`rounded-[10px] px-4 py-2 text-[13px] font-semibold transition ${
                            active ? "bg-white text-[#0f172a] shadow-[0px_1px_2px_rgba(15,23,42,0.14)]" : "text-[#64748b]"
                          }`}
                        >
                          {config.shortLabel} ({config.aspectLabel})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="mt-5 block cursor-pointer rounded-[20px] border-2 border-dashed border-[#d4dbe6] bg-[#fbfdff] px-5 py-6 text-center transition hover:border-[#1876f2]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadDramaCover(file, activeCoverField);
                      event.currentTarget.value = "";
                    }}
                    disabled={coverUploading}
                  />

                  {activeCoverConfig.value ? (
                    <div
                      className={`mx-auto overflow-hidden rounded-[18px] border border-[#d7dde8] bg-white ${
                        activeCoverField === "cover" ? "w-full max-w-[220px]" : "w-full max-w-[420px]"
                      } ${activeCoverConfig.aspectClassName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeCoverConfig.value} alt={activeCoverConfig.alt} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto flex min-h-[240px] max-w-[620px] flex-col items-center justify-center py-8 text-[#64748b]">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1876f2]">
                        <ImagePlus className="h-6 w-6" />
                      </span>
                      <p className="mt-4 text-lg font-semibold text-[#0f172a]">
                        {coverUploading ? t("Uploading cover...") : t("Drop your image here, or browse")}
                      </p>
                      <p className="mt-2 text-[13px] text-[#64748b]">{t("Recommended size: __ARG_0__ (PNG, JPG, max 5MB)", activeCoverRecommendedSize)}</p>
                    </div>
                  )}
                </label>

                <div className="mt-4 flex items-center justify-between rounded-[14px] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[13px] text-[#475569]">{t("Both cover slots need valid uploads before the drama can move to the episode step.")}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0f172a]">{coverCompletionCount}/2</span>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className={stepOnePanelClassName}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{t("Live Preview")}</p>
                    <h3 className="mt-1 text-[18px] font-bold text-[#0f172a]">{t("Mobile storefront card")}</h3>
                  </div>
                  <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-bold text-[#1d4ed8]">{selectedCategory || t("Drama")}</span>
                </div>
                <div className="mx-auto mt-4 w-[224px] rounded-[30px] border-[7px] border-[#0f172a] bg-[#020617] p-2">
                  <div className="relative overflow-hidden rounded-[24px] bg-[#0b1220]">
                    <div className="aspect-[9/16]">
                      {previewCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewCover} alt={t("Cover preview")} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(circle_at_top,#1e3a8a_0%,#0b1220_55%,#020617_100%)]" />
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-10 text-white">
                      <div className="mb-2 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">{selectedCategory || t("Drama")}</div>
                      <p className="line-clamp-1 text-base font-bold">{dramaForm.title || t("Your Drama Title Here")}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/80">
                        {dramaForm.description || t("Your description will appear here as the viewer explores the app...")}
                      </p>
                      <button type="button" className="mt-3 w-full rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#0f172a]">
                        {t("Watch Now")}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-[12px] leading-5 text-[#64748b]">{t("This preview mirrors the mobile storefront ratio used across the creator and consumer surfaces.")}</p>
              </div>

              <div className={stepOnePanelClassName}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{t("Readiness")}</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Covers")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">{t("__ARG_0__ of 2 uploaded", coverCompletionCount)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Metadata")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                      {selectedCategory ? t("Category assigned") : t("Category pending")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Regions")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">{releaseScopeLabel}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#1876f2] px-5 py-5 text-white shadow-[0_12px_30px_rgba(24,118,242,0.22)]">
                <p className="text-[18px] font-black">{t("Quick Tip")}</p>
                <p className="mt-2 text-[13px] leading-6 text-white/90">
                  {t("High-quality cover images increase viewership and help your drama stand out in recommendation feeds.")}
                </p>
              </div>
            </aside>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <>
            <div className="mt-5 border-b border-[#e2e8f0]">
              <div className="flex items-end gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setUploadMode("bulk")}
                  className={`border-b-2 px-5 py-2.5 ${
                    uploadMode === "bulk" ? "border-[#1876f2] font-bold text-[#1876f2]" : "border-transparent font-medium text-[#64748b]"
                  }`}
                >
                  {t("Bulk Upload (Auto-Slice)")}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("individual")}
                  className={`border-b-2 px-5 py-2.5 ${
                    uploadMode === "individual"
                      ? "border-[#1876f2] font-bold text-[#1876f2]"
                      : "border-transparent font-medium text-[#64748b]"
                  }`}
                >
                  {t("Individual Upload")}
                </button>
              </div>
            </div>

            {uploadMode === "bulk" ? (
              <section className="mt-5 space-y-4">
                <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[15px] font-bold text-[#0f172a]">{t("Auto-Slice From One Source Video")}</p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {t("Upload one long MP4, set duration per episode, then split to episodes automatically.")}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]">
                      <Clapperboard className="h-3.5 w-3.5" />
                      {t("Creator Auto-Slice")}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-[16px] border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
                      <input
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadAutoSliceSourceVideo(file);
                          event.currentTarget.value = "";
                        }}
                        disabled={sourceUpload.uploading || autoSliceRunning}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0f172a]">
                          {sourceUpload.fileName || t("Upload Source Video (MP4)")}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {sourceUpload.statusText || t("Cloudflare Stream will transcode before slicing")}
                        </p>
                        {sourceUpload.error ? <p className="mt-1 text-xs text-[#b91c1c]">{sourceUpload.error}</p> : null}
                      </div>
                      <UploadCloud className="h-5 w-5 flex-shrink-0 text-[#1876f2]" />
                    </label>

                    <div className="rounded-[16px] border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
                      <label htmlFor="auto-slice-duration" className="text-xs font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                        {t("Episode Duration")}
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#64748b]" />
                        <input
                          id="auto-slice-duration"
                          type="number"
                          min={1}
                          max={60}
                          step={1}
                          value={autoSliceDurationMinutes}
                          onChange={(event) => setAutoSliceDurationMinutes(Math.max(1, Math.min(60, Number(event.target.value) || 1)))}
                          className="h-8 w-20 rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#0f172a] outline-none"
                        />
                        <span className="text-sm text-[#475569]">{t("minutes / episode")}</span>
                      </div>

                      <label htmlFor="auto-slice-subtitle-language" className="mt-4 block text-xs font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                        {t("Subtitle Language")}
                      </label>
                      <p className="mt-1 text-xs text-[#64748b]">{t("Applies to uploaded source and episode subtitle files")}</p>
                      <select
                        id="auto-slice-subtitle-language"
                        value={selectedSubtitleLanguage}
                        onChange={(event) => setSelectedSubtitleLanguage(event.target.value as SubtitleLanguageCode)}
                        className="mt-2 h-9 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#0f172a] outline-none"
                        disabled={autoSliceRunning}
                      >
                        {SUBTITLE_LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {sourceUpload.progress > 0 ? (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-[#e2e8f0]">
                        <div className="h-2 rounded-full bg-[#1876f2]" style={{ width: `${sourceUpload.progress}%` }} />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-[#cbd5e1] px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]">
                      <input
                        type="file"
                        accept=".srt,.vtt,text/vtt,application/x-subrip,text/plain"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadAutoSliceSubtitle(file);
                          event.currentTarget.value = "";
                        }}
                        disabled={autoSliceRunning}
                      />
                      <GripVertical className="h-3.5 w-3.5" />
                      <span>{sourceSubtitle ? t("Subtitle: __ARG_0__", sourceSubtitle.fileName) : t("Upload Source Subtitle (Required)")}</span>
                    </label>

                    <button
                      type="button"
                      onClick={runAutoSlice}
                      disabled={!sourceUpload.ready || !sourceSubtitle || autoSliceRunning}
                      className="inline-flex items-center gap-2 rounded-[16px] bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Clapperboard className="h-4 w-4" />
                      {autoSliceRunning ? t("Auto-Slicing...") : t("Start Auto-Slice")}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#cbd5e1] bg-white px-6 py-8 text-center transition-colors hover:bg-[#f8fafc]">
                  <input
                    type="file"
                    accept="video/mp4"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      selectBulkFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2]">
                    <UploadCloud className="h-7 w-7" />
                  </span>
                  <p className="text-[15px] font-bold text-[#0f172a]">{t("Select MP4 files for bulk upload")}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{t("Files will be mapped to new episodes in filename order.")}</p>
                </label>

                {bulkQueue.length ? (
                  <div className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white">
                    <div className="grid grid-cols-[1.6fr_120px_120px_130px_48px] items-center border-b border-[#f1f5f9] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">
                      <span>{t("File")}</span>
                      <span>{t("Size")}</span>
                      <span>{t("Progress")}</span>
                      <span>{t("Status")}</span>
                      <span />
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {bulkQueue.map((item) => {
                        const statusUi = mapBulkStatus(item.status);
                        return (
                          <div key={item.id} className="grid grid-cols-[1.6fr_120px_120px_130px_48px] items-center border-b border-[#f8fafc] px-4 py-2.5 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#0f172a]">{item.file.name}</p>
                              {item.error ? <p className="truncate text-xs text-[#b91c1c]">{item.error}</p> : null}
                            </div>
                            <span className="text-xs text-[#64748b]">{formatBytes(item.file.size)}</span>
                            <span className="text-xs font-semibold text-[#334155]">{item.progress}%</span>
                            <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ${statusUi.className}`}>{t(statusUi.label)}</span>
                            <button
                              type="button"
                              onClick={() => removeBulkItem(item.id)}
                              disabled={bulkRunning}
                              className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Remove ${item.file.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={startBulkUpload}
                    disabled={bulkRunning || autoSliceRunning || !canRunBulk}
                    className="inline-flex items-center gap-2 rounded-[16px] bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {t("Start Bulk Upload")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelBulkUpload}
                    disabled={!bulkRunning || autoSliceRunning}
                    className="inline-flex items-center gap-2 rounded-[16px] border border-[#cbd5e1] px-4 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {t("Stop")}
                  </button>
                  <button
                    type="button"
                    onClick={clearBulkQueue}
                    disabled={bulkRunning || autoSliceRunning || bulkQueue.length === 0}
                    className="inline-flex items-center gap-2 rounded-[16px] border border-[#cbd5e1] px-4 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("Clear Queue")}
                  </button>
                  {bulkSummary ? <p className="text-sm font-medium text-[#334155]">{bulkSummary}</p> : null}
                </div>
              </section>
            ) : (
              <div ref={individualGridRef} className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {episodes.map((episode) => {
                  const statusUi = autoSliceStatusMap[episode._id] || mapEpisodeStatus(episode.status);
                  const subtitleUi = mapEpisodeSubtitleUi(episode, {
                    videoProcessing: isEpisodeVideoProcessing(episode, autoSliceStatusMap[episode._id]),
                  });
                  const readySubtitleTracks = getReadySubtitleTracks(episode);
                  const translationTask = episode.subtitleTranslation;
                  const translationProgress = Math.max(0, Math.min(100, Number(translationTask?.progress || 0)));
                  const state = uploadState[episode._id];
                  return (
                    <article
                      key={episode._id}
                      className={`rounded-[20px] border bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                        episode.streamVideoId ? "border-[rgba(24,118,242,0.35)]" : "border-[#e2e8f0]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openEpisodePreview(episode)}
                        className="relative block w-full overflow-hidden rounded-[16px] border-2 border-dashed border-[#cbd5e1] bg-[#f1f5f9] text-left"
                      >
                        {episode.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={episode.thumbnail} alt={episode.title} className="h-[220px] w-full object-cover" />
                        ) : (
                          <div className="flex h-[220px] flex-col items-center justify-center text-[#64748b]">
                            <PlayCircle className="h-6 w-6" />
                            <span className="mt-2 text-xs font-medium">{t("Open Preview")}</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-white">
                          <span className="text-xs font-semibold">{t("Preview Episode")}</span>
                          <PlayCircle className="h-4 w-4" />
                        </div>
                      </button>

                      <div className="mt-4 flex items-center justify-between">
                        <h3 className="text-[22px] font-black leading-none tracking-[-0.03em] text-[#1e293b] md:text-[24px]">{t("Episode __ARG_0__", episode.episodeNumber)}</h3>
                        <div className="flex items-center gap-1">
                          <Link
                            href={localizePath(`/creator/dramas/${dramaId}/episodes/${episode._id}`, locale)}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#1876f2] hover:bg-[#eff6ff]"
                          >
                            {t("Edit Info")}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeEpisode(episode._id)}
                            className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]"
                            aria-label={t("Delete episode __ARG_0__", episode.episodeNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold leading-4 ${statusUi.className}`}>{t(statusUi.text)}</div>

                      {subtitleUi ? (
                        <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold leading-4 ${subtitleUi.className}`}>
                          {subtitleUi.text}
                        </div>
                      ) : null}

                      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#f1f5f9] px-3 py-2 text-[11px] font-bold text-[#334155]">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadCover(episode, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{episode.thumbnail ? t("Replace Cover") : t("Upload Cover")}</span>
                      </label>

                      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#f1f5f9] px-3 py-2 text-[11px] font-bold text-[#334155]">
                        <input
                          type="file"
                          accept="video/mp4"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadVideo(episode, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <FileVideo2 className="h-3.5 w-3.5" />
                        <span>{t("Upload Video")}</span>
                      </label>

                      {state?.videoStatusText ? <p className="mt-2 text-[11px] text-[#64748b]">{state.videoStatusText}</p> : null}
                      {state?.videoProgress ? (
                        <div className="mt-1 h-1.5 rounded-full bg-[#e2e8f0]">
                          <div className="h-1.5 rounded-full bg-[#1876f2]" style={{ width: `${state.videoProgress}%` }} />
                        </div>
                      ) : null}
                      {state?.videoError ? <p className="mt-1 text-[11px] text-[#b91c1c]">{state.videoError}</p> : null}

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cancelEpisodeUpload(episode._id)}
                          disabled={!state?.uploading}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          {t("Cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => retryVideoStatusCheck(episode)}
                          disabled={!episode.streamVideoId || Boolean(state?.uploading)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#2563eb] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {t("Retry status")}
                        </button>
                      </div>

                      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#f1f5f9] px-3 py-2 text-[11px] font-bold text-[#334155]">
                        <input
                          type="file"
                          accept=".srt,.vtt,text/vtt,application/x-subrip,text/plain"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadSubtitle(episode, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <GripVertical className="h-3.5 w-3.5" />
                        <span>{t("Upload Subtitle")}</span>
                      </label>

                      {readySubtitleTracks.length > 0 ? (
                        <div className="mt-3 rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Subtitle Files")}</p>
                            <span className="text-[11px] font-semibold text-[#64748b]">{readySubtitleTracks.length}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {readySubtitleTracks.slice(0, 3).map((track) => (
                              <a
                                key={track.id}
                                href={track.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8] shadow-[0px_1px_2px_rgba(15,23,42,0.06)]"
                              >
                                <span>{track.label}</span>
                                {track.isDefault ? (
                                  <span className="rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#1d4ed8]">
                                    {t("Default")}
                                  </span>
                                ) : null}
                                <span className="text-[#94a3b8]">{String(track.format || "vtt").toUpperCase()}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                            {readySubtitleTracks.length > 3 ? (
                              <button
                                type="button"
                                onClick={() => openEpisodePreview(episode)}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#475569] shadow-[0px_1px_2px_rgba(15,23,42,0.06)]"
                              >
                                {t("View All")}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : episode.subtitleUrl ? (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("Subtitle Ready")} · {String(episode.subtitleLanguage || selectedSubtitleLanguage).toUpperCase()}
                        </div>
                      ) : null}

                      {translationTask ? (
                        <div className="mt-3 rounded-[16px] border border-[#e2e8f0] bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Auto Translation")}</p>
                              <p className="mt-1 text-[13px] font-semibold text-[#0f172a]">{t(formatSubtitleTranslationLabel(translationTask.status))}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#64748b]">
                              {translationTask.completedCount}/{translationTask.totalCount}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-[#e2e8f0]">
                            <div
                              className={`h-1.5 rounded-full ${
                                translationTask.status === "failed"
                                  ? "bg-[#ef4444]"
                                  : translationTask.status === "completed"
                                    ? "bg-[#16a34a]"
                                    : "bg-[#1876f2]"
                              }`}
                              style={{ width: `${translationTask.status === "completed" ? 100 : translationProgress}%` }}
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-[#64748b]">
                            {translationTask.status === "failed"
                              ? translationTask.errorMessage || t("Translation task failed")
                              : `${translationTask.progress}% · ${translationTask.targetLanguages.length} target languages`}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}

                <button
                  type="button"
                  onClick={addEpisode}
                  disabled={busy}
                  className="flex min-h-[264px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#cbd5e1] px-6 text-[#64748b] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f5f9]">
                    <Plus className="h-6 w-6" />
                  </span>
                  <span className="text-[13px] font-bold">{t("Click to add new episode")}</span>
                </button>
              </div>
            )}
          </>
        ) : null}

        {currentStep === 3 ? (
          <section className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-5">
              <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{t("Workflow Summary")}</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-[16px] bg-[#f8fafc] px-4 py-3">
                    <span className="text-[#64748b]">{t("Episodes")}</span>
                    <span className="font-bold text-[#0f172a]">{episodes.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[16px] bg-[#f8fafc] px-4 py-3">
                    <span className="text-[#64748b]">{t("Ready for review")}</span>
                    <span className="font-bold text-[#0f172a]">{readyEpisodesCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[16px] bg-[#f8fafc] px-4 py-3">
                    <span className="text-[#64748b]">{t("Free episodes")}</span>
                    <span className="font-bold text-[#16a34a]">{freeEpisodesCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[16px] bg-[#f8fafc] px-4 py-3">
                    <span className="text-[#64748b]">{t("Paid episodes")}</span>
                    <span className="font-bold text-[#1876f2]">{paidEpisodesCount}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{t("Pricing Presets")}</p>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">
                  {t("Use a template price, then adjust individual episodes where needed. Episode 1 is usually free.")}
                </p>
                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Default unlock price")}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={pricingTemplate}
                      onChange={(event) => setPricingTemplate(Math.max(1, Number(event.target.value) || 1))}
                      className="h-11 w-28 rounded-[16px] border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#1876f2]"
                    />
                    <span className="text-sm text-[#64748b]">{t("coins")}</span>
                  </div>
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyRecommendedPricing}
                    className="rounded-[16px] bg-[#1876f2] px-4 py-2 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da]"
                  >
                    {t("Apply Episode 1 Free")}
                  </button>
                  <button
                    type="button"
                    onClick={applyPriceToLockedEpisodes}
                    className="rounded-[16px] border border-[#cbd5e1] px-4 py-2 text-sm font-bold text-[#475569] hover:bg-[#f8fafc]"
                  >
                    {t("Apply to paid episodes")}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#0f172a]">{t("Episode Pricing")}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{t("Set each episode as free or locked, then define the unlock price.")}</p>
                </div>
                <div className="rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]">
                  {t("Asset readiness: __ARG_0__%", progress)}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {episodes.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-5 py-8 text-center text-sm text-[#64748b]">
                    {t("Add and upload at least one episode before configuring pricing.")}
                  </div>
                ) : null}

                {episodes.map((episode) => (
                  <div key={episode._id} className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    {(() => {
                      const subtitleUi = mapEpisodeSubtitleUi(episode, {
                        videoProcessing: isEpisodeVideoProcessing(episode, autoSliceStatusMap[episode._id]),
                      });
                      return (
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <button
                          type="button"
                          onClick={() => openEpisodePreview(episode)}
                          className="relative h-[96px] w-[72px] flex-shrink-0 overflow-hidden rounded-[14px] border border-[#dbe4f0] bg-white"
                        >
                          {episode.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={episode.thumbnail} alt={episode.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#94a3b8]">
                              <PlayCircle className="h-5 w-5" />
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-[16px] font-bold text-[#0f172a]">{t("Episode __ARG_0__", episode.episodeNumber)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${mapEpisodeStatus(episode.status).className}`}>
                              {t(mapEpisodeStatus(episode.status).text)}
                            </span>
                            {subtitleUi ? (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${subtitleUi.className}`}>
                                {subtitleUi.text}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-bold text-[#c2410c]">
                                {t("Subtitle Missing")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 md:items-end">
                        <div className="inline-flex rounded-[16px] bg-white p-1 shadow-[inset_0_0_0_1px_rgba(203,213,225,1)]">
                          <button
                            type="button"
                            onClick={() => updateEpisodePricing(episode._id, { isFree: true })}
                            className={`rounded-[12px] px-4 py-2 text-xs font-bold ${
                              episode.isFree ? "bg-[#dcfce7] text-[#15803d]" : "text-[#64748b]"
                            }`}
                          >
                            {t("Free")}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEpisodePricing(episode._id, { isFree: false, unlockPrice: episode.unlockPrice || pricingTemplate })}
                            className={`rounded-[12px] px-4 py-2 text-xs font-bold ${
                              !episode.isFree ? "bg-[#dbeafe] text-[#1d4ed8]" : "text-[#64748b]"
                            }`}
                          >
                            {t("Paid")}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={episode.isFree ? 0 : 1}
                            step={1}
                            value={episode.isFree ? 0 : episode.unlockPrice}
                            onChange={(event) => updateEpisodePricing(episode._id, { unlockPrice: Number(event.target.value) || 0 })}
                            disabled={episode.isFree}
                            className="h-11 w-28 rounded-[16px] border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#1876f2] disabled:cursor-not-allowed disabled:bg-[#e2e8f0] disabled:text-[#94a3b8]"
                          />
                          <span className="text-sm text-[#64748b]">{t("coins")}</span>
                        </div>
                      </div>
                    </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 1 ? (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="h-12 rounded-[18px] border border-[#cbd5e1] bg-white px-6 text-[15px] font-bold text-[#0f172a] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("Save Draft")}
            </button>
            <button
              type="button"
              onClick={goToEpisodeUploadStep}
              disabled={busy || coverUploading || coverCompletionCount < 2}
              className="h-12 rounded-[18px] bg-[#1876f2] px-7 text-[15px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("Next Step")}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#e2e8f0] pt-6">
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="rounded-[16px] border border-[#cbd5e1] px-5 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("Save Draft")}
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev === 3 ? 2 : 1))}
                className="rounded-[16px] border border-[#cbd5e1] px-5 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc]"
              >
                {t("Previous Step")}
              </button>

              {currentStep === 2 ? (
                <button
                  type="button"
                  onClick={goToPaymentSettingsStep}
                  disabled={busy || episodes.length === 0}
                  className="rounded-[16px] bg-[#1876f2] px-8 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("Next Step: Payments")}
                </button>
              ) : null}

              {currentStep === 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={busy || episodes.length === 0}
                  className="rounded-[16px] bg-[#1876f2] px-8 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("Submit for Review")}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {previewLoading ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="rounded-[24px] bg-white px-6 py-5 text-sm font-semibold text-[#0f172a] shadow-2xl">
            {t("Loading episode preview...")}
          </div>
        </div>
      ) : null}

      {previewEpisode ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">{t("Episode Preview")}</p>
                <h3 className="truncate text-base font-bold text-[#0f172a]">
                  {t("Episode __ARG_0__", previewEpisode.episodeNumber)} · {previewEpisode.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEpisode(null)}
                className="rounded-[12px] border border-[#cbd5e1] px-3 py-2 text-xs font-bold text-[#475569] hover:bg-[#f8fafc]"
              >
                {t("Close")}
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-88px)] gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-h-0 items-center justify-center bg-[#0f172a] px-4 py-6">
                <div
                  className={`w-full overflow-hidden rounded-[24px] bg-black shadow-[0px_24px_48px_rgba(15,23,42,0.3)] ${
                    (previewEpisode.videoWidth || 0) > (previewEpisode.videoHeight || 0) && (previewEpisode.videoHeight || 0) > 0
                      ? "max-w-4xl aspect-video"
                      : "max-w-[430px] aspect-[9/16]"
                  }`}
                >
                  <CreatorPreviewPlayer episode={previewEpisode} />
                </div>
              </div>

              <div className="min-h-0 space-y-4 overflow-y-auto border-t border-[#e2e8f0] bg-[#f8fafc] p-5 lg:border-l lg:border-t-0">
                <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Video Layout")}</p>
                  <p className="mt-2 text-sm font-bold text-[#0f172a]">
                    {(previewEpisode.videoWidth || 0) > (previewEpisode.videoHeight || 0) && (previewEpisode.videoHeight || 0) > 0
                      ? t("Landscape")
                      : t("Portrait")}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {previewEpisode.videoWidth && previewEpisode.videoHeight
                      ? `${previewEpisode.videoWidth} × ${previewEpisode.videoHeight}`
                      : t("Preview size will follow the uploaded video aspect ratio")}
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Playback Quality")}</p>
                  <p className="mt-2 text-sm font-bold text-[#0f172a]">
                    {previewEpisode.maxQuality || t("Adaptive playback")}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {t("Use the player settings button to switch stream quality inside the preview.")}
                  </p>
                  {previewEpisode.qualityOptions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewEpisode.qualityOptions.map((option) => (
                        <span
                          key={option}
                          className="rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-bold text-[#1d4ed8]"
                        >
                          {option === "auto" ? t("Auto") : option.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Subtitles")}</p>
                  <p className="mt-2 text-sm font-bold text-[#0f172a]">{t("__ARG_0__ tracks available", previewEpisode.subtitles?.length || 0)}</p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {t("Subtitle selection is now available directly in the player controls.")}
                  </p>
                  {previewEpisode.subtitleTracks?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewEpisode.subtitleTracks
                        .filter((track) => track.fileUrl && String(track.status || "").toLowerCase() === "ready")
                        .map((track) => (
                          <a
                            key={track.id}
                            href={track.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#334155]"
                          >
                            <span>{track.label}</span>
                            {track.isDefault ? (
                              <span className="rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#1d4ed8]">
                                {t("Default")}
                              </span>
                            ) : null}
                            <span className="text-[#94a3b8]">{String(track.format || "vtt").toUpperCase()}</span>
                            <ExternalLink className="h-3 w-3 text-[#64748b]" />
                          </a>
                        ))}
                    </div>
                  ) : null}
                </div>

                {previewEpisode.subtitleTranslation ? (
                  <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Auto Translation")}</p>
                    <p className="mt-2 text-sm font-bold text-[#0f172a]">{t(formatSubtitleTranslationLabel(previewEpisode.subtitleTranslation.status))}</p>
                    <div className="mt-3 h-2 rounded-full bg-[#e2e8f0]">
                      <div
                        className={`h-2 rounded-full ${
                          previewEpisode.subtitleTranslation.status === "failed"
                            ? "bg-[#ef4444]"
                            : previewEpisode.subtitleTranslation.status === "completed"
                              ? "bg-[#16a34a]"
                              : "bg-[#1876f2]"
                        }`}
                        style={{ width: `${previewEpisode.subtitleTranslation.status === "completed" ? 100 : Math.max(0, Math.min(100, Number(previewEpisode.subtitleTranslation.progress || 0)))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#64748b]">
                      {previewEpisode.subtitleTranslation.completedCount}/{previewEpisode.subtitleTranslation.totalCount} · {previewEpisode.subtitleTranslation.progress}%
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {previewEpisode.subtitleTranslation.status === "failed"
                        ? previewEpisode.subtitleTranslation.errorMessage || t("Translation task failed")
                        : `${previewEpisode.subtitleTranslation.targetLanguages.length} target languages`}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
