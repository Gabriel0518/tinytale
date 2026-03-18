"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clapperboard,
  Clock3,
  FileVideo2,
  GripVertical,
  ImagePlus,
  PauseCircle,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import * as tus from "tus-js-client";
import { useAuth } from "@/lib/authContext";
import { API_URL, creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorEpisodeItem } from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

interface CreatorEpisodeUploadWorkspaceProps {
  initialDramaId?: string;
}

type UploadMode = "bulk" | "individual";

type UploadState = {
  videoProgress: number;
  videoError: string;
  videoStatusText: string;
  uploading: boolean;
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

export default function CreatorEpisodeUploadWorkspace({ initialDramaId }: CreatorEpisodeUploadWorkspaceProps) {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();

  const [dramaId, setDramaId] = useState(initialDramaId || "");
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
  const [autoSliceDurationMinutes, setAutoSliceDurationMinutes] = useState(2);
  const [autoSliceRunning, setAutoSliceRunning] = useState(false);

  const aliveRef = useRef(true);
  const activeTusUploadsRef = useRef<Record<string, tus.Upload>>({});
  const activeVideoUidRef = useRef<Record<string, string>>({});
  const pollingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const bulkCancelRequestedRef = useRef(false);

  const progress = useMemo(() => computeProgress(episodes), [episodes]);

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
    if (!token) return;

    let cancelled = false;
    async function bootstrap() {
      try {
        const targetDramaId = initialDramaId || (await ensureDraftDrama());
        if (cancelled) return;
        await loadEpisodes(targetDramaId);
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
  }, [token, initialDramaId, ensureDraftDrama, loadEpisodes, t]);

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

  const refreshEpisodes = useCallback(async () => {
    if (!dramaId) return;
    await loadEpisodes(dramaId);
  }, [dramaId, loadEpisodes]);

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
            headers: {
              Authorization: `Bearer ${token}`,
            },
            metadata: {
              name: autoGeneratedName,
              filetype: file.type || "video/mp4",
              maxDurationSeconds: "10800",
            },
            onShouldRetry: shouldRetryTusUpload,
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
        const uploaded = await creatorApi.uploadSubtitleFile(token, file);
        await patchEpisode(episode._id, {
          subtitleUrl: uploaded.data.url,
          subtitleLanguage: "en",
          subtitleFileName: file.name,
        });
        await refreshEpisodes();
      } catch (err: any) {
      setError(err?.message || t("Failed to upload subtitle"));
      }
    },
    [token, dramaId, patchEpisode, refreshEpisodes, t]
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
            metadata: {
              name: autoGeneratedName,
              filetype: file.type || "video/mp4",
              maxDurationSeconds: "10800",
            },
            onShouldRetry: shouldRetryTusUpload,
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

    setError("");
    setBulkSummary("");
    setAutoSliceRunning(true);

    try {
      const targetDramaId = await ensureDraftDrama();
      const splitRes = await creatorApi.autoSplitEpisodes(token, {
        sourceVideoUid: sourceUpload.videoUid,
        episodeDuration: Math.max(1, Math.round(autoSliceDurationMinutes * 60)),
        dramaId: targetDramaId,
        ...(sourceSubtitle
          ? {
              sourceSubtitleUrl: sourceSubtitle.url,
              sourceSubtitleFormat: sourceSubtitle.format,
              subtitleLanguage: "en",
            }
          : {}),
      });

      const createdEpisodes = splitRes.data?.episodes || [];
      await loadEpisodes(targetDramaId);
      const initialCleanupReason = splitRes.data?.sourceCleanup?.reason ? ` (${splitRes.data.sourceCleanup.reason})` : "";

      const uidToEpisodeId = new Map(
        createdEpisodes
          .filter((episode) => episode.streamVideoId && episode.episodeId)
          .map((episode) => [episode.streamVideoId, episode.episodeId])
      );
      const uids = Array.from(uidToEpisodeId.keys());

      if (!uids.length) {
        setBulkSummary(t("Auto-slice completed, but no clip uid was returned"));
        return;
      }

      const handledReady = new Set<string>();
      const handledFailed = new Set<string>();

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
              ...(clip.thumbnail ? { thumbnail: clip.thumbnail } : {}),
            });
          } else if (failedClips.some((failed) => failed.uid === clip.uid) && !handledFailed.has(clip.uid)) {
            handledFailed.add(clip.uid);
            await patchEpisode(episodeId, { status: "Failed" });
          }
        }

        if (clipStatus.data?.allReady) {
          await refreshEpisodes();
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
      const targetDramaId = await ensureDraftDrama();
      await creatorApi.updateDrama(token, targetDramaId, { updatedAt: new Date().toISOString() });
      await refreshEpisodes();
    } catch (err: any) {
      setError(err?.message || t("Failed to save draft"));
    } finally {
      setBusy(false);
    }
  }, [token, ensureDraftDrama, refreshEpisodes, t]);

  const nextStep = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const targetDramaId = await ensureDraftDrama();
      await creatorApi.submitDramaForReview(token, targetDramaId);
      router.push(localizePath("/creator/dramas", locale));
    } catch (err: any) {
      setError(err?.message || t("Failed to move to next step"));
    } finally {
      setBusy(false);
    }
  }, [token, ensureDraftDrama, router, locale, t]);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-[#e2e8f0]" />
      </div>
    );
  }

  const canRunBulk = bulkQueue.some((item) => item.status === "queued" || item.status === "failed" || item.status === "cancelled");

  return (
    <div className="-mx-4 -mt-6 md:-mx-6 lg:-mx-8 lg:-mt-8">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-3.5 md:px-7">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-[#64748b]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-bold text-[#475569]">1</span>
            <span className="font-medium">{t("Basic Info")}</span>
          </div>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <div className="flex items-center gap-2 text-[#0f172a]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1876f2] text-xs font-bold text-white">2</span>
            <span className="font-bold">{t("Episode Upload")}</span>
          </div>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <div className="flex items-center gap-2 text-[#64748b]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-bold text-[#475569]">3</span>
            <span className="font-medium">{t("Review & Monetization")}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-7 pt-6 md:px-7">
        <div className="border-b border-[#e2e8f0]">
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

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-[#0f172a] md:text-[34px]">{t("Upload Episodes")}</h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {uploadMode === "bulk"
                ? t("Upload one or more MP4 source files, then prepare episodes for creator review submission.")
                : t("Upload episodes individually with custom covers and subtitles before submitting the drama for review.")}
            </p>
          </div>
          <div className="w-[180px]">
            <p className="text-right text-[13px] font-medium text-[#0f172a]">{t("Progress: __ARG_0__%", progress)}</p>
            <div className="mt-1 h-2 rounded-full bg-[#e2e8f0]">
              <div className="h-2 rounded-full bg-[#1876f2]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">{error}</div>
        ) : null}

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
                  <span>{sourceSubtitle ? t("Subtitle: __ARG_0__", sourceSubtitle.fileName) : t("Upload Source Subtitle (Optional)")}</span>
                </label>

                <button
                  type="button"
                  onClick={runAutoSlice}
                  disabled={!sourceUpload.ready || autoSliceRunning}
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
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {episodes.map((episode) => {
              const statusUi = mapEpisodeStatus(episode.status);
              const state = uploadState[episode._id];
              return (
                <article
                  key={episode._id}
                  className={`rounded-[20px] border bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                    episode.streamVideoId ? "border-[rgba(24,118,242,0.35)]" : "border-[#e2e8f0]"
                  }`}
                >
                  <label className="relative block cursor-pointer overflow-hidden rounded-[16px] border-2 border-dashed border-[#cbd5e1] bg-[#f1f5f9]">
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
                    {episode.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={episode.thumbnail} alt={episode.title} className="h-[220px] w-full object-cover" />
                    ) : (
                      <div className="flex h-[220px] flex-col items-center justify-center text-[#64748b]">
                        <ImagePlus className="h-6 w-6" />
                        <span className="mt-2 text-xs font-medium">{t("Upload Cover")}</span>
                      </div>
                    )}
                  </label>

                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="text-[22px] font-black leading-none tracking-[-0.03em] text-[#1e293b] md:text-[24px]">{t("Episode __ARG_0__", episode.episodeNumber)}</h3>
                    <button
                      type="button"
                      onClick={() => removeEpisode(episode._id)}
                      className="rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]"
                      aria-label={t("Delete episode __ARG_0__", episode.episodeNumber)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold leading-4 ${statusUi.className}`}>{t(statusUi.text)}</div>

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

                  {episode.subtitleUrl ? (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("Subtitle Ready")}
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
            <Link
              href={localizePath("/creator/dramas", locale)}
              className="rounded-[16px] border border-[#cbd5e1] px-5 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc]"
            >
              {t("Previous Step")}
            </Link>
            <button
              type="button"
              onClick={nextStep}
              disabled={busy || episodes.length === 0}
              className="rounded-[16px] bg-[#1876f2] px-8 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("Submit for Review")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
