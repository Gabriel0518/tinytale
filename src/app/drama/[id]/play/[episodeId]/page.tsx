"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { coinsApi, dramasApi, episodesApi, playFeedApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { deepPrefetchVideoSegments, getPreloadQueue } from "@/lib/playback-prefetch-enhanced";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode, EpisodeAccessResult, FeedPlayableItem, FeedWindowState } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import SimplePlayer from "@/components/player/SimplePlayer";
import PlayerMobileExperience from "@/components/player/mobile/PlayerMobileExperience";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { usePlatform } from "@/hooks/usePlatform";
import { useLocale } from "@/hooks/useLocale";
import { resolvePlaybackSource } from "@/lib/playback";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";
import { createCloudflarePlaybackSource } from "@/lib/playback-adapters";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { formatDuration } from "@/lib/utils";
import { usePlaybackSession } from "@/components/mobile/PlaybackSession";
import { resolveSafeImageUrl } from "@/lib/safe-image";
import {
  prefetchEpisodeStream,
  preloadImageAsset,
  readPrefetchedStream,
  warmPlaybackManifest,
} from "@/lib/playback-prefetch";
import { readSavedPlaybackProgress } from "@/lib/playback-progress-cache";
import { readPlayFeedSession, type PlayFeedMode, writePlayFeedSession } from "@/lib/play-feed-session";
import {
  RUNTIME_SETTINGS_EVENT,
  readPlaybackRuntimeSettings,
  updatePlaybackRuntimeSettings,
} from "@/lib/runtime-settings";

const PLAY_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    episodeNotFound: "Episode not found",
    failedToLoad: "Failed to load episode",
    playbackError: "Video playback error",
    loadingVideo: "Loading video...",
    failedLoadVideo: "Failed to load video",
    backToDrama: "Back to",
    episode: "Episode",
    episodes: "Episodes",
    episodeQueue: "Episode Queue",
    showEpisodes: "Episodes",
    hideEpisodes: "Hide",
    quality: "Quality",
    swipeHint: "Swipe up or down to switch episodes",
    coins: "coins",
    unlocked: "Unlocked",
    free: "FREE",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "Return",
    tapToPause: "Tap to pause",
    tapToPlay: "Tap to play",
    holdForSpeed: "Hold for 2x speed",
    playbackSpeed: "Playback Speed",
    nextEpisodeHint: "Next Episode",
    previousEpisodeHint: "Previous Episode",
    unlockToWatch: "Unlock to watch",
    unlockThisEpisode: "Unlock this episode",
    watchWithVip: "Watch with VIP",
    getCoins: "Get Coins",
    signInUnlock: "Sign in to unlock this episode",
    unlockSuccess: "Episode unlocked!",
    unlockFail: "Failed to unlock episode",
    paywallHint: "Choose VIP or coins to continue watching this locked episode." },
  zh: {
    episodeNotFound: "未找到该剧集",
    failedToLoad: "加载剧集失败",
    playbackError: "视频播放错误",
    loadingVideo: "视频加载中...",
    failedLoadVideo: "视频加载失败",
    backToDrama: "返回",
    episode: "第",
    episodes: "剧集列表",
    episodeQueue: "剧集列表",
    showEpisodes: "剧集",
    hideEpisodes: "收起",
    quality: "清晰度",
    swipeHint: "上滑下一集，下滑上一集",
    coins: "金币",
    unlocked: "已解锁",
    free: "免费",
    vip: "VIP",
    pip: "小窗",
    pipReturn: "返回",
    tapToPause: "点击暂停",
    tapToPlay: "点击播放",
    holdForSpeed: "长按 2 倍速",
    playbackSpeed: "播放速度",
    nextEpisodeHint: "下一集",
    previousEpisodeHint: "上一集",
    unlockToWatch: "解锁后观看",
    unlockThisEpisode: "解锁本集",
    watchWithVip: "开通 VIP 观看",
    getCoins: "去充值",
    signInUnlock: "登录后解锁本集",
    unlockSuccess: "剧集解锁成功！",
    unlockFail: "解锁剧集失败",
    paywallHint: "可通过开通 VIP 或充值金币继续观看本集。" },
  ja: {
    episodeNotFound: "エピソードが見つかりません",
    failedToLoad: "読み込みに失敗しました",
    playbackError: "動画再生エラー",
    loadingVideo: "動画を読み込み中...",
    failedLoadVideo: "動画を読み込めませんでした",
    backToDrama: "戻る",
    episode: "エピソード",
    episodes: "エピソード一覧",
    episodeQueue: "エピソード一覧",
    showEpisodes: "エピソード",
    hideEpisodes: "閉じる",
    quality: "画質",
    swipeHint: "上下スワイプでエピソード切替",
    coins: "コイン",
    unlocked: "解放済み",
    free: "無料",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "戻る",
    tapToPause: "タップで一時停止",
    tapToPlay: "タップで再生",
    holdForSpeed: "長押しで2倍速",
    playbackSpeed: "再生速度",
    nextEpisodeHint: "次のエピソード",
    previousEpisodeHint: "前のエピソード",
    unlockToWatch: "解放して視聴",
    unlockThisEpisode: "この話を解放",
    watchWithVip: "VIPで視聴",
    getCoins: "コインを追加",
    signInUnlock: "ログインして解放",
    unlockSuccess: "エピソードを解放しました！",
    unlockFail: "エピソードを解放できませんでした",
    paywallHint: "VIPまたはコインでこのロック済みエピソードを視聴できます。" },
  es: {
    episodeNotFound: "Episodio no encontrado",
    failedToLoad: "No se pudo cargar el episodio",
    playbackError: "Error de reproducción de video",
    loadingVideo: "Cargando video...",
    failedLoadVideo: "No se pudo cargar el video",
    backToDrama: "Volver a",
    episode: "Episodio",
    episodes: "Episodios",
    episodeQueue: "Lista de episodios",
    showEpisodes: "Episodios",
    hideEpisodes: "Ocultar",
    quality: "Calidad",
    swipeHint: "Desliza arriba o abajo para cambiar",
    coins: "monedas",
    unlocked: "Desbloqueado",
    free: "GRATIS",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "Volver",
    tapToPause: "Toca para pausar",
    tapToPlay: "Toca para reproducir",
    holdForSpeed: "Mantén para 2x",
    playbackSpeed: "Velocidad",
    nextEpisodeHint: "Siguiente episodio",
    previousEpisodeHint: "Episodio anterior",
    unlockToWatch: "Desbloquea para ver",
    unlockThisEpisode: "Desbloquear episodio",
    watchWithVip: "Ver con VIP",
    getCoins: "Recargar monedas",
    signInUnlock: "Inicia sesión para desbloquear",
    unlockSuccess: "¡Episodio desbloqueado!",
    unlockFail: "No se pudo desbloquear el episodio",
    paywallHint: "Activa VIP o usa monedas para seguir viendo este episodio bloqueado." },
  pt: {
    episodeNotFound: "Episódio não encontrado",
    failedToLoad: "Falha ao carregar episódio",
    playbackError: "Erro de reprodução de vídeo",
    loadingVideo: "Carregando vídeo...",
    failedLoadVideo: "Falha ao carregar vídeo",
    backToDrama: "Voltar para",
    episode: "Episódio",
    episodes: "Episódios",
    episodeQueue: "Lista de episódios",
    showEpisodes: "Episódios",
    hideEpisodes: "Ocultar",
    quality: "Qualidade",
    swipeHint: "Deslize para cima ou para baixo para trocar",
    coins: "moedas",
    unlocked: "Desbloqueado",
    free: "GRÁTIS",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "Voltar",
    tapToPause: "Toque para pausar",
    tapToPlay: "Toque para reproduzir",
    holdForSpeed: "Segure para 2x",
    playbackSpeed: "Velocidade",
    nextEpisodeHint: "Próximo episódio",
    previousEpisodeHint: "Episódio anterior",
    unlockToWatch: "Desbloqueie para assistir",
    unlockThisEpisode: "Desbloquear episódio",
    watchWithVip: "Assistir com VIP",
    getCoins: "Recarregar moedas",
    signInUnlock: "Faça login para desbloquear",
    unlockSuccess: "Episódio desbloqueado!",
    unlockFail: "Falha ao desbloquear episódio",
    paywallHint: "Ative o VIP ou use moedas para continuar neste episódio bloqueado." },
  hi: {
    episodeNotFound: "एपिसोड नहीं मिला",
    failedToLoad: "एपिसोड लोड नहीं हो पाया",
    playbackError: "वीडियो प्लेबैक त्रुटि",
    loadingVideo: "वीडियो लोड हो रहा है...",
    failedLoadVideo: "वीडियो लोड नहीं हुआ",
    backToDrama: "वापस जाएँ",
    episode: "एपिसोड",
    episodes: "एपिसोड सूची",
    episodeQueue: "एपिसोड सूची",
    showEpisodes: "एपिसोड",
    hideEpisodes: "छिपाएँ",
    quality: "क्वालिटी",
    swipeHint: "ऊपर या नीचे स्वाइप करके बदलें",
    coins: "कॉइन्स",
    unlocked: "अनलॉक",
    free: "फ्री",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "वापस",
    tapToPause: "पॉज़ करने के लिए टैप करें",
    tapToPlay: "चलाने के लिए टैप करें",
    holdForSpeed: "2x के लिए दबाए रखें",
    playbackSpeed: "प्लेबैक स्पीड",
    nextEpisodeHint: "अगला एपिसोड",
    previousEpisodeHint: "पिछला एपिसोड",
    unlockToWatch: "देखने के लिए अनलॉक करें",
    unlockThisEpisode: "यह एपिसोड अनलॉक करें",
    watchWithVip: "VIP के साथ देखें",
    getCoins: "कॉइन्स लें",
    signInUnlock: "अनलॉक करने के लिए लॉगिन करें",
    unlockSuccess: "एपिसोड अनलॉक हो गया!",
    unlockFail: "एपिसोड अनलॉक नहीं हुआ",
    paywallHint: "इस लॉक्ड एपिसोड को जारी रखने के लिए VIP या कॉइन्स चुनें।" },
  id: {
    episodeNotFound: "Episode tidak ditemukan",
    failedToLoad: "Gagal memuat episode",
    playbackError: "Kesalahan pemutaran video",
    loadingVideo: "Memuat video...",
    failedLoadVideo: "Gagal memuat video",
    backToDrama: "Kembali ke",
    episode: "Episode",
    episodes: "Daftar episode",
    episodeQueue: "Daftar episode",
    showEpisodes: "Episode",
    hideEpisodes: "Tutup",
    quality: "Kualitas",
    swipeHint: "Geser atas atau bawah untuk pindah episode",
    coins: "koin",
    unlocked: "Terbuka",
    free: "GRATIS",
    vip: "VIP",
    pip: "PiP",
    pipReturn: "Kembali",
    tapToPause: "Ketuk untuk jeda",
    tapToPlay: "Ketuk untuk putar",
    holdForSpeed: "Tahan untuk 2x",
    playbackSpeed: "Kecepatan",
    nextEpisodeHint: "Episode berikutnya",
    previousEpisodeHint: "Episode sebelumnya",
    unlockToWatch: "Buka untuk menonton",
    unlockThisEpisode: "Buka episode ini",
    watchWithVip: "Tonton dengan VIP",
    getCoins: "Isi ulang koin",
    signInUnlock: "Masuk untuk membuka episode ini",
    unlockSuccess: "Episode berhasil dibuka!",
    unlockFail: "Gagal membuka episode",
    paywallHint: "Pilih VIP atau koin untuk melanjutkan episode yang terkunci ini." } };

function getEpisodeEffectiveUnlockPrice(episode: Episode, access?: EpisodeAccessResult): number {
  if (typeof access?.unlockPrice === "number" && Number.isFinite(access.unlockPrice)) {
    return access.unlockPrice;
  }
  return episode.unlockPrice;
}

function dedupeFeedItems(items: FeedPlayableItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.episodeId || seen.has(item.episodeId)) return false;
    seen.add(item.episodeId);
    return true;
  });
}

function buildFeedItemFromEpisode(drama: Drama | null, episode: Episode, order: number): FeedPlayableItem {
  const durationMs = Math.max(1, Number(episode.duration || 0) * 1000);

  return {
    itemId: `${episode._id}:fallback`,
    dramaId: drama?._id || String(episode.dramaId),
    episodeId: episode._id,
    chunkId: `${episode._id}:0-${durationMs}`,
    streamVideoId: episode.streamVideoId,
    playbackUrl: episode.videoUrl,
    poster: episode.thumbnail || drama?.cover,
    dramaTitle: drama?.title || episode.title,
    episodeTitle: episode.title,
    description: episode.description || drama?.description,
    durationMs,
    startMs: 0,
    endMs: durationMs,
    order,
    isFree: episode.isFree,
    hasSubtitles: Boolean(episode.subtitles?.length || episode.subtitleUrl),
    hasMultipleAudioTracks: false,
    preloadPriority: order === 0 ? "high" : order === 1 ? "medium" : "low",
    seekable: episode.isFree,
    chunkType: "virtual",
  };
}

function buildFallbackFeedWindow(
  drama: Drama | null,
  episodes: Episode[],
  currentEpisode: Episode,
): FeedWindowState {
  const currentIndex = episodes.findIndex((episode) => episode._id === currentEpisode._id);
  const previousEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisodes = currentIndex >= 0 ? episodes.slice(currentIndex + 1, currentIndex + 4) : [];
  const currentItem = buildFeedItemFromEpisode(drama, currentEpisode, 0);
  const previousItem = previousEpisode ? buildFeedItemFromEpisode(drama, previousEpisode, 0) : null;
  const nextItems = nextEpisodes.map((episode, index) => buildFeedItemFromEpisode(drama, episode, index + 1));

  return {
    current: currentItem,
    previous: previousItem,
    next: nextItems,
    cursor: null,
    loadingStates: {
      current: "loaded",
      next: nextItems.map(() => "loaded"),
    },
    canSwitchNext: nextItems.length > 0,
    canSwitchPrev: Boolean(previousItem),
  };
}

function buildProvisionalDramaFromFeedItem(item: FeedPlayableItem): Drama {
  return {
    _id: item.dramaId,
    creatorId: null,
    title: item.dramaTitle,
    cover: item.poster || "",
    description: item.description || "",
    categories: [],
    actors: [],
    rating: 0,
    isCompleted: false,
  };
}

function buildProvisionalEpisodeFromFeedItem(item: FeedPlayableItem): Episode {
  return {
    _id: item.episodeId,
    dramaId: item.dramaId,
    title: item.episodeTitle,
    description: item.description,
    episodeNumber: Math.max(1, item.order + 1),
    videoUrl: item.playbackUrl || "",
    thumbnail: item.poster || "",
    duration: Math.max(1, Math.round(item.durationMs / 1000)),
    isFree: item.isFree,
    unlockPrice: 0,
    streamVideoId: item.streamVideoId,
    subtitles: [],
  };
}

function buildProvisionalStreamFromFeedItem(item: FeedPlayableItem): StreamPlaybackInfo {
  return {
    videoUid: item.streamVideoId || "",
    videoUrl: item.playbackUrl,
    playbackUrl: item.playbackUrl,
    streamVideoId: item.streamVideoId,
    thumbnailUrl: item.poster,
    duration: Math.max(1, Math.round(item.durationMs / 1000)),
    subtitles: [],
  };
}

function canUseImmediatePlaybackSource(url?: string | null) {
  if (!url) return false;
  return (
    url.includes('/api/episodes/') ||
    url.includes('playbackToken=') ||
    url.includes('/manifest/video.m3u8?token=')
  );
}

function readSeededPlaybackState(
  dramaId: string,
  episodeId: string,
  token?: string | null,
) {
  if (typeof window === "undefined") return null;

  const persisted = readPlayFeedSession();
  const matchingWindow = Object.values(persisted?.windows ?? {}).find((window) => (
    Boolean(window?.current?.episodeId === episodeId && window?.current?.dramaId === dramaId)
  ));
  const currentItem = matchingWindow?.current;

  if (!currentItem) return null;

  const prefetchedStream =
    readPrefetchedStream(episodeId, token) ||
    readPrefetchedStream(episodeId);

  const provisionalStream =
    !prefetchedStream && canUseImmediatePlaybackSource(currentItem.playbackUrl)
      ? buildProvisionalStreamFromFeedItem(currentItem)
      : null;

  return {
    drama: buildProvisionalDramaFromFeedItem(currentItem),
    currentEpisode: buildProvisionalEpisodeFromFeedItem(currentItem),
    streamInfo: prefetchedStream || provisionalStream,
  };
}

function buildPlayerRoute(
  dramaId: string,
  episodeId: string,
  locale: SupportedLocale,
  source: "feed" | "drama",
  startSeconds?: number,
) {
  const url = new URL(
    localizePath(`/drama/${dramaId}/play/${episodeId}`, locale),
    "https://tinytale.local",
  );
  url.searchParams.set("source", source);

  if (typeof startSeconds === "number" && Number.isFinite(startSeconds) && startSeconds > 0) {
    url.searchParams.set("t", String(Math.floor(startSeconds)));
  }

  return `${url.pathname}${url.search}`;
}

function buildLoadedFeedWindow(window: FeedWindowState): FeedWindowState {
  return {
    ...window,
    loadingStates: {
      current: "loaded",
      next: window.next.map(() => "loaded"),
    },
  };
}

function getFeedItemResumeTime(item: FeedPlayableItem | null | undefined) {
  if (!item) return 0;
  return readSavedPlaybackProgress({
    streamVideoId: item.streamVideoId,
    videoUrl: item.playbackUrl,
  });
}

function replacePlaybackUrl(path: string) {
  if (typeof window === "undefined") return;
  window.history.replaceState(window.history.state, "", path);
}

export default function PlayEpisodePage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(PLAY_TEXT, locale);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, refreshUser } = useAuth();
  const { isMobile } = usePlatform();
  const { toast } = useToast();
  const { startSession, updateSession } = usePlaybackSession();

  const routeDramaId = params.id as string;
  const routeEpisodeId = params.episodeId as string;
  const playbackSourceParam = searchParams.get("source");
  const playbackMode = playbackSourceParam === "feed" ? "feed" : "drama";
  const isFeedPlayback = playbackMode === "feed";
  const routeSeekTime = Math.max(
    0,
    Number(searchParams.get("start") || searchParams.get("t") || 0) || 0
  );
  const [activeDramaId, setActiveDramaId] = useState(routeDramaId);
  const [activeEpisodeId, setActiveEpisodeId] = useState(routeEpisodeId);
  const [activeSeekTime, setActiveSeekTime] = useState(routeSeekTime);
  const seededPlaybackState = useMemo(
    () => (isFeedPlayback ? readSeededPlaybackState(routeDramaId, routeEpisodeId, token) : null),
    [routeDramaId, routeEpisodeId, isFeedPlayback, token]
  );
  const hasSeededPlayback = Boolean(
    seededPlaybackState?.currentEpisode &&
    (!isFeedPlayback || seededPlaybackState?.streamInfo)
  );

  const [drama, setDrama] = useState<Drama | null>(seededPlaybackState?.drama || null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(seededPlaybackState?.currentEpisode || null);
  const [streamInfo, setStreamInfo] = useState<StreamPlaybackInfo | null>(seededPlaybackState?.streamInfo || null);
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [loading, setLoading] = useState(!hasSeededPlayback);
  const [unlockingEpisode, setUnlockingEpisode] = useState(false);
  const [unlockedEpisodeIds, setUnlockedEpisodeIds] = useState<Set<string>>(new Set());
  const [episodeAccessMap, setEpisodeAccessMap] = useState<Record<string, EpisodeAccessResult>>({});
  const lastProgressReportAtRef = useRef<number>(0);
  const [activeFeedMode, setActiveFeedMode] = useState<PlayFeedMode>("for-you");
  const [feedWindows, setFeedWindows] = useState<Partial<Record<PlayFeedMode, FeedWindowState>>>({});
  const [feedLoadingMode, setFeedLoadingMode] = useState<PlayFeedMode | null>(null);
  const feedWindowsRef = useRef<Partial<Record<PlayFeedMode, FeedWindowState>>>({});
  const currentEpisodeRef = useRef<Episode | null>(seededPlaybackState?.currentEpisode || null);
  const paywallTouchStartYRef = useRef<number | null>(null);
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState(
    () => readPlaybackRuntimeSettings()?.autoplayNextEpisode ?? true
  );
  const playerParentHref = useMemo(
    () => localizePath(`/drama/${activeDramaId}`, locale),
    [activeDramaId, locale]
  );

  useEffect(() => {
    setActiveDramaId(routeDramaId);
    setActiveEpisodeId(routeEpisodeId);
    setActiveSeekTime(routeSeekTime);
  }, [routeDramaId, routeEpisodeId, routeSeekTime]);

  useEffect(() => {
    if (!seededPlaybackState) return;
    setDrama(seededPlaybackState.drama);
    setCurrentEpisode(seededPlaybackState.currentEpisode);
    setStreamInfo(seededPlaybackState.streamInfo || null);
    if (seededPlaybackState.streamInfo) {
      setLoading(false);
    }
  }, [seededPlaybackState]);

  useEffect(() => {
    currentEpisodeRef.current = currentEpisode;
  }, [currentEpisode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncPlaybackSettings = () => {
      setAutoplayNextEpisode(readPlaybackRuntimeSettings()?.autoplayNextEpisode ?? true);
    };

    syncPlaybackSettings();
    window.addEventListener(RUNTIME_SETTINGS_EVENT, syncPlaybackSettings as EventListener);
    return () => {
      window.removeEventListener(RUNTIME_SETTINGS_EVENT, syncPlaybackSettings as EventListener);
    };
  }, []);

  // 加载短剧和剧集信息
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        // Only show full loading screen on initial load (no episode data yet)
        if (!currentEpisodeRef.current) {
          setLoading(true);
        }

        // 加载短剧信息
        const dramaResponse = await dramasApi.getById(activeDramaId) as any;
        const dramaPayload = dramaResponse?.data ?? dramaResponse;
        const dramaData = dramaPayload?.drama ?? dramaPayload;
        const episodeList: Episode[] = dramaPayload?.episodes || dramaData?.episodes || [];
        if (cancelled) return;
        setDrama(dramaData);
        setEpisodes(episodeList);

        // 查找当前剧集
        const episode = episodeList.find((ep: Episode) => ep._id === activeEpisodeId) || episodeList[0];
        if (!episode) {
          toast(t.episodeNotFound, "error");
          router.push(localizePath(`/drama/${activeDramaId}`, locale));
          return;
        }
        if (cancelled) return;
        setCurrentEpisode(episode);

        // 检查缓存的流信息
        const cachedStream =
          readPrefetchedStream(activeEpisodeId, token) ||
          readPrefetchedStream(activeEpisodeId);
        if (cachedStream) {
          if (!cancelled) setStreamInfo(cachedStream);
        }

        if (!episode.isFree && token) {
          // 并行执行访问检查和流获取
          const [accessResult, streamResult] = await Promise.allSettled([
            episodesApi.checkAccess(episode._id, token),
            prefetchEpisodeStream(activeEpisodeId, token),
          ]);
          if (cancelled) return;

          if (accessResult.status === 'fulfilled') {
            const access = (accessResult.value as any)?.data ?? accessResult.value;
            setEpisodeAccessMap((prev) => ({
              ...prev,
              [episode._id]: access as EpisodeAccessResult,
            }));
            if (!(access as EpisodeAccessResult)?.hasAccess) {
              setStreamInfo(null);
              return;
            }
          } else {
            setEpisodeAccessMap((prev) => ({
              ...prev,
              [episode._id]: {
                hasAccess: false,
                reason: "locked",
                unlockPrice: episode.unlockPrice,
              },
            }));
            setStreamInfo(null);
            return;
          }

          if (streamResult.status === 'fulfilled') {
            setStreamInfo(streamResult.value);
          }
        } else if (episode.isFree) {
          const stream = await prefetchEpisodeStream(activeEpisodeId, token);
          if (!cancelled) setStreamInfo(stream);
        }
      } catch (error: any) {
        console.error("Failed to load episode:", error);
        if (!cancelled) toast(error.message || t.failedToLoad, "error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (activeDramaId && activeEpisodeId) {
      loadData();
    }
    return () => {
      cancelled = true;
    };
  }, [activeDramaId, activeEpisodeId, token, router, toast, locale, t.episodeNotFound, t.failedToLoad]);

  useEffect(() => {
    if (!token || episodes.length === 0) {
      setUnlockedEpisodeIds(new Set());
      return;
    }
    let cancelled = false;
    userApi.getUnlockedEpisodes(token, activeDramaId)
      .then((res: any) => {
        if (cancelled) return;
        const ids: string[] = res?.data || [];
        setUnlockedEpisodeIds(new Set(ids));
      })
      .catch(() => {
        if (!cancelled) setUnlockedEpisodeIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [token, activeDramaId, episodes.length]);

  useEffect(() => {
    if (!token || episodes.length === 0) {
      setEpisodeAccessMap({});
      return;
    }
    const lockedPaidEpisodes = episodes.filter((ep) => !ep.isFree && !unlockedEpisodeIds.has(ep._id));
    if (lockedPaidEpisodes.length === 0) {
      setEpisodeAccessMap({});
      return;
    }

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        lockedPaidEpisodes.map(async (ep) => {
          try {
            const res = await episodesApi.checkAccess(ep._id, token);
            const access = (res as any)?.data ?? res;
            return [ep._id, access as EpisodeAccessResult] as const;
          } catch {
            return [ep._id, { hasAccess: false, reason: "locked", unlockPrice: ep.unlockPrice } as EpisodeAccessResult] as const;
          }
        })
      );

      if (cancelled) return;
      const nextMap: Record<string, EpisodeAccessResult> = {};
      for (const [id, access] of entries) {
        nextMap[id] = access;
      }
      setEpisodeAccessMap(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, episodes, unlockedEpisodeIds]);

  useEffect(() => {
    feedWindowsRef.current = feedWindows;
  }, [feedWindows]);

  const persistFeedSession = useCallback((
    nextMode: PlayFeedMode,
    nextWindows: Partial<Record<PlayFeedMode, FeedWindowState>>,
  ) => {
    feedWindowsRef.current = nextWindows;
    setActiveFeedMode(nextMode);
    setFeedWindows(nextWindows);
    writePlayFeedSession({
      activeMode: nextMode,
      windows: nextWindows,
    });
  }, []);

  useEffect(() => {
    if (!isFeedPlayback || !currentEpisode || episodes.length === 0) return;

    const persisted = readPlayFeedSession();
    const nextMode = persisted?.activeMode || "for-you";
    const nextWindows = { ...(persisted?.windows ?? {}) };
    const activeWindow = nextWindows[nextMode];

    if (!activeWindow || activeWindow.current.episodeId !== currentEpisode._id) {
      nextWindows[nextMode] = buildFallbackFeedWindow(drama, episodes, currentEpisode);
    }

    persistFeedSession(nextMode, nextWindows);
  }, [currentEpisode, drama, episodes, isFeedPlayback, persistFeedSession]);

  const fetchFeedBootstrap = useCallback(async (mode: PlayFeedMode) => {
    if (mode === "following" && !token) {
      toast(t.signInUnlock, "info");
      return null;
    }

    const existingWindow = feedWindowsRef.current[mode];
    if (existingWindow) {
      return existingWindow;
    }

    setFeedLoadingMode(mode);
    try {
      const response = await playFeedApi.getBootstrap({
        mode,
        count: 3,
        token: token ?? undefined,
      });
      const payload = (response as any)?.data ?? response;
      const window = payload?.window as FeedWindowState | undefined;
      if (!window?.current?.episodeId) {
        return null;
      }

      const nextWindows = {
        ...feedWindowsRef.current,
        [mode]: window,
      };
      persistFeedSession(activeFeedMode === mode ? mode : activeFeedMode, nextWindows);
      return window;
    } catch {
      if (mode === "following") {
        toast(t.failedToLoad, "error");
      }
      return null;
    } finally {
      setFeedLoadingMode((value) => (value === mode ? null : value));
    }
  }, [activeFeedMode, persistFeedSession, t.failedToLoad, t.signInUnlock, toast, token]);

  const fetchMoreFeedItems = useCallback(async (mode: PlayFeedMode, baseWindow?: FeedWindowState) => {
    const targetWindow = baseWindow ?? feedWindowsRef.current[mode];
    if (!targetWindow?.cursor) {
      return targetWindow ?? null;
    }

    setFeedLoadingMode(mode);
    try {
      const excludeEpisodeIds = Array.from(new Set(
        [
          targetWindow.previous?.episodeId,
          targetWindow.current.episodeId,
          ...targetWindow.next.map((item) => item.episodeId),
        ].filter(Boolean)
      )) as string[];

      const response = await playFeedApi.getNext({
        mode,
        count: 3,
        cursor: targetWindow.cursor,
        excludeEpisodeIds,
        token: token ?? undefined,
      });

      const payload = (response as any)?.data ?? response;
      const fetchedItems = Array.isArray(payload?.items) ? payload.items as FeedPlayableItem[] : [];
      const mergedNext = dedupeFeedItems([...targetWindow.next, ...fetchedItems]);
      const nextWindow: FeedWindowState = {
        ...targetWindow,
        next: mergedNext,
        loadingStates: {
          current: "loaded",
          next: mergedNext.map(() => "loaded"),
        },
        canSwitchNext: mergedNext.length > 0,
      };
      const nextWindows = {
        ...feedWindowsRef.current,
        [mode]: nextWindow,
      };
      persistFeedSession(activeFeedMode, nextWindows);
      return nextWindow;
    } catch {
      return targetWindow;
    } finally {
      setFeedLoadingMode((value) => (value === mode ? null : value));
    }
  }, [activeFeedMode, persistFeedSession, token]);

  const applyFeedItemLocally = useCallback((
    targetItem: FeedPlayableItem,
    resumeTime: number,
  ) => {
    const provisionalEpisode = buildProvisionalEpisodeFromFeedItem(targetItem);
    const prefetchedStream =
      readPrefetchedStream(targetItem.episodeId, token) ||
      readPrefetchedStream(targetItem.episodeId);

    setActiveDramaId(targetItem.dramaId);
    setActiveEpisodeId(targetItem.episodeId);
    setActiveSeekTime(resumeTime);
    setDrama(buildProvisionalDramaFromFeedItem(targetItem));
    setCurrentEpisode(provisionalEpisode);
    const provisionalStream =
      !prefetchedStream && canUseImmediatePlaybackSource(targetItem.playbackUrl)
        ? buildProvisionalStreamFromFeedItem(targetItem)
        : null;

    setStreamInfo(prefetchedStream || provisionalStream);
    setEpisodes((currentEpisodes) => (
      currentEpisodes.some((episode) => episode._id === targetItem.episodeId)
        ? currentEpisodes
        : [provisionalEpisode]
    ));
    lastProgressReportAtRef.current = 0;

    replacePlaybackUrl(
      buildPlayerRoute(targetItem.dramaId, targetItem.episodeId, locale, "feed", resumeTime),
    );
  }, [locale, token]);

  const navigateToFeedItem = useCallback((
    mode: PlayFeedMode,
    targetItem: FeedPlayableItem,
    nextWindow: FeedWindowState,
  ) => {
    const resumeTime = getFeedItemResumeTime(targetItem);
    const nextWindows = {
      ...feedWindowsRef.current,
      [mode]: nextWindow,
    };
    persistFeedSession(mode, nextWindows);
    void prefetchEpisodeStream(targetItem.episodeId, token).catch(() => {});
    void deepPrefetchVideoSegments(targetItem.playbackUrl, {
      startSeconds: resumeTime,
    });
    applyFeedItemLocally(targetItem, resumeTime);
  }, [applyFeedItemLocally, persistFeedSession, token]);

  const handleFeedModeChange = useCallback(async (mode: PlayFeedMode) => {
    const window = feedWindowsRef.current[mode] ?? await fetchFeedBootstrap(mode);
    if (!window) return;

    persistFeedSession(mode, {
      ...feedWindowsRef.current,
      [mode]: window,
    });

    if (window.current.dramaId !== activeDramaId || window.current.episodeId !== activeEpisodeId) {
      navigateToFeedItem(mode, window.current, window);
    }
  }, [activeDramaId, activeEpisodeId, fetchFeedBootstrap, navigateToFeedItem, persistFeedSession]);

  const handleFeedPreviousItem = useCallback(async () => {
    const window = feedWindowsRef.current[activeFeedMode];
    if (!window?.previous) return;

    const nextWindow: FeedWindowState = {
      ...window,
      current: window.previous,
      previous: null,
      next: dedupeFeedItems([window.current, ...window.next]),
      loadingStates: {
        current: "loaded",
        next: dedupeFeedItems([window.current, ...window.next]).map(() => "loaded"),
      },
      canSwitchNext: true,
      canSwitchPrev: false,
    };

    navigateToFeedItem(activeFeedMode, window.previous, nextWindow);
  }, [activeFeedMode, navigateToFeedItem]);

  const handleRefreshFeedPool = useCallback(async () => {
    let window = feedWindowsRef.current[activeFeedMode];
    if (!window) {
      const bootstrappedWindow = await fetchFeedBootstrap(activeFeedMode);
      if (!bootstrappedWindow) return;
      window = bootstrappedWindow;
    }

    try {
      const excludeEpisodeIds = Array.from(new Set(
        [
          window.previous?.episodeId,
          window.current.episodeId,
          ...window.next.map((item) => item.episodeId),
        ].filter(Boolean)
      )) as string[];

      const response = await playFeedApi.getNext({
        mode: activeFeedMode,
        count: 3,
        cursor: window.cursor,
        excludeEpisodeIds,
        token: token ?? undefined,
      });
      const payload = (response as any)?.data ?? response;
      const items = Array.isArray(payload?.items) ? payload.items as FeedPlayableItem[] : [];

      if (items.length > 0) {
        const [targetItem, ...remainingItems] = items;
        const refreshedWindow = buildLoadedFeedWindow({
          ...window,
          current: targetItem,
          previous: null,
          next: remainingItems,
          canSwitchNext: remainingItems.length > 0 || Boolean(window.cursor),
          canSwitchPrev: false,
        });
        navigateToFeedItem(activeFeedMode, targetItem, refreshedWindow);
        return;
      }
    } catch {
      // Fall back to already buffered items below.
    }

    if (window.next.length > 0) {
      const [targetItem, ...remainingItems] = window.next;
      const refreshedWindow = buildLoadedFeedWindow({
        ...window,
        current: targetItem,
        previous: null,
        next: remainingItems,
        canSwitchNext: remainingItems.length > 0 || Boolean(window.cursor),
        canSwitchPrev: false,
      });
      navigateToFeedItem(activeFeedMode, targetItem, refreshedWindow);
      return;
    }

    const bootstrappedWindow = await fetchFeedBootstrap(activeFeedMode);
    if (!bootstrappedWindow?.current) return;
    const refreshedWindow = buildLoadedFeedWindow({
      ...bootstrappedWindow,
      previous: null,
      canSwitchPrev: false,
    });
    navigateToFeedItem(activeFeedMode, refreshedWindow.current, refreshedWindow);
  }, [activeFeedMode, fetchFeedBootstrap, navigateToFeedItem, token]);

  const handleFeedNextItem = useCallback(async () => {
    let window = feedWindowsRef.current[activeFeedMode];
    if (!window) {
      const bootstrappedWindow = await fetchFeedBootstrap(activeFeedMode);
      if (!bootstrappedWindow) return;
      window = bootstrappedWindow;
    }

    if (window.next.length === 0 && window.cursor) {
      const hydratedWindow = await fetchMoreFeedItems(activeFeedMode, window);
      if (!hydratedWindow) return;
      window = hydratedWindow;
    }
    if (!window || window.next.length === 0) return;

    const [targetItem, ...remainingItems] = window.next;
    const nextWindow: FeedWindowState = {
      ...window,
      previous: window.current,
      current: targetItem,
      next: remainingItems,
      loadingStates: {
        current: "loaded",
        next: remainingItems.map(() => "loaded"),
      },
      canSwitchNext: remainingItems.length > 0 || Boolean(window.cursor),
      canSwitchPrev: true,
    };

    navigateToFeedItem(activeFeedMode, targetItem, nextWindow);
  }, [activeFeedMode, fetchFeedBootstrap, fetchMoreFeedItems, navigateToFeedItem]);

  const isVip = user?.role === 'admin' || user?.vipStatus === 'active';
  const qualityOptions = getQualityMenuOptions(isVip, streamInfo?.qualityOptions);
  useEffect(() => {
    const isCurrentEnabled = qualityOptions.some((option) => option.value === selectedQuality && !option.disabled);
    if (!isCurrentEnabled) {
      setSelectedQuality(resolveDefaultQuality(qualityOptions));
    }
  }, [qualityOptions, selectedQuality]);

  const currentEpisodeAccess = currentEpisode ? episodeAccessMap[currentEpisode._id] : undefined;
  const canAccessCurrentEpisode = currentEpisode
    ? currentEpisode.isFree || unlockedEpisodeIds.has(currentEpisode._id) || Boolean(currentEpisodeAccess?.hasAccess)
    : false;

  const playbackQueue = useMemo(() => (
    episodes.map((episode) => ({
      dramaId: activeDramaId,
      episodeId: episode._id,
      episodeTitle: episode.title,
      episodeNumber: episode.episodeNumber,
      poster: episode.thumbnail || drama?.cover,
      duration: episode.duration,
    }))
  ), [activeDramaId, drama?.cover, episodes]);
  const playbackQueueIndex = useMemo(() => (
    currentEpisode
      ? playbackQueue.findIndex((episode) => episode.episodeId === currentEpisode._id)
      : -1
  ), [currentEpisode, playbackQueue]);
  const currentEpisodeIndex = currentEpisode
    ? episodes.findIndex((episode) => episode._id === currentEpisode._id)
    : -1;
  const hasPreviousEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1;
  const nextEpisode = hasNextEpisode ? episodes[currentEpisodeIndex + 1] : null;
  const activeFeedWindow = feedWindows[activeFeedMode];
  const mobileHasPreviousEpisode = isMobile
    ? (isFeedPlayback ? Boolean(activeFeedWindow?.previous) : hasPreviousEpisode)
    : false;
  const mobileHasNextEpisode = isMobile
    ? (isFeedPlayback ? Boolean(activeFeedWindow?.next.length || activeFeedWindow?.cursor) : hasNextEpisode)
    : false;

  // 播放进度上报
  const handleTimeUpdate = (time: number, duration: number) => {
    if (drama && currentEpisode) {
      updateSession({
        dramaTitle: drama.title,
        episodeTitle: currentEpisode.title,
        episodeNumber: currentEpisode.episodeNumber,
        poster: currentEpisode.thumbnail || drama.cover,
        currentTime: time,
        duration,
        isPlaying: true,
        queue: playbackQueue,
        currentIndex: playbackQueueIndex,
      });
    }

    if (token && currentEpisode) {
      const now = Date.now();
      if (now - lastProgressReportAtRef.current < 5000) return;
      lastProgressReportAtRef.current = now;
      episodesApi.reportProgress(currentEpisode._id, token, time, duration).catch(() => {});
    }
  };

  const handleAutoplayNextEpisodeChange = useCallback((enabled: boolean) => {
    setAutoplayNextEpisode(enabled);
    updatePlaybackRuntimeSettings({
      autoplayNextEpisode: enabled,
    });
  }, []);

  // 播放错误处理
  const handleError = (error: string) => {
    console.error("Playback error:", error);
    toast(t.playbackError, "error");
  };

  const handlePlay = () => {
    if (!drama || !currentEpisode) return;
    updateSession({
      dramaTitle: drama.title,
      episodeTitle: currentEpisode.title,
      episodeNumber: currentEpisode.episodeNumber,
      poster: currentEpisode.thumbnail || drama.cover,
      isPlaying: true,
      queue: playbackQueue,
      currentIndex: playbackQueueIndex,
    });
  };

  const handlePause = () => {
    if (!drama || !currentEpisode) return;
    updateSession({
      dramaTitle: drama.title,
      episodeTitle: currentEpisode.title,
      episodeNumber: currentEpisode.episodeNumber,
      poster: currentEpisode.thumbnail || drama.cover,
      isPlaying: false,
      queue: playbackQueue,
      currentIndex: playbackQueueIndex,
    });
  };

  useEffect(() => {
    if (!drama || !currentEpisode || !canAccessCurrentEpisode) return;

    startSession({
      dramaId: activeDramaId,
      episodeId: currentEpisode._id,
      dramaTitle: drama.title,
      episodeTitle: currentEpisode.title,
      episodeNumber: currentEpisode.episodeNumber,
      poster: currentEpisode.thumbnail || drama.cover,
      currentTime: activeSeekTime,
      duration: currentEpisode.duration,
      isPlaying: true,
      updatedAt: Date.now(),
      queue: playbackQueue,
      currentIndex: playbackQueueIndex,
    });
  }, [activeDramaId, activeSeekTime, canAccessCurrentEpisode, currentEpisode, drama, playbackQueue, playbackQueueIndex, startSession]);

  useEffect(() => {
    if (isMobile && isFeedPlayback && activeFeedWindow) {
      const preloadQueue = getPreloadQueue();
      const currentItem = activeFeedWindow.current;
      const previousItem = activeFeedWindow.previous;
      const [nextItem, queuedItem] = activeFeedWindow.next;
      const warmItems = [currentItem, previousItem, nextItem].filter(Boolean) as FeedPlayableItem[];

      warmItems.forEach((item) => {
        router.prefetch(localizePath(`/drama/${item.dramaId}/play/${item.episodeId}`, locale));
        preloadImageAsset(item.poster);
        warmPlaybackManifest(item.playbackUrl);
        void prefetchEpisodeStream(item.episodeId, token).catch(() => {});
      });

      void deepPrefetchVideoSegments(currentItem.playbackUrl, {
        startSeconds: getFeedItemResumeTime(currentItem),
      });

      if (previousItem) {
        void deepPrefetchVideoSegments(previousItem.playbackUrl, {
          startSeconds: getFeedItemResumeTime(previousItem),
        });
      }

      if (nextItem) {
        void deepPrefetchVideoSegments(nextItem.playbackUrl, {
          startSeconds: getFeedItemResumeTime(nextItem),
        });
      }

      if (queuedItem) {
        preloadQueue.enqueue(
          queuedItem.episodeId,
          queuedItem.playbackUrl,
          queuedItem.streamVideoId,
          2,
          token,
        );
      }
      return;
    }

    if (!nextEpisode) return;

    router.prefetch(localizePath(`/drama/${activeDramaId}/play/${nextEpisode._id}`, locale));
    preloadImageAsset(nextEpisode.thumbnail || drama?.cover);

    // 桌面端：标准预取即可
    warmPlaybackManifest(nextEpisode.videoUrl);

    const canWarmNextStream = Boolean(
      nextEpisode.isFree ||
      unlockedEpisodeIds.has(nextEpisode._id) ||
      episodeAccessMap[nextEpisode._id]?.hasAccess
    );

    if (!canWarmNextStream) return;
    void prefetchEpisodeStream(nextEpisode._id, token).catch(() => {});
  }, [
    isMobile,
    isFeedPlayback,
    activeFeedWindow,
    nextEpisode,
    router,
    locale,
    activeDramaId,
    drama?.cover,
    token,
    unlockedEpisodeIds,
    episodeAccessMap,
  ]);

  const goToEpisode = useCallback(async (targetEpisode: Episode) => {
    // Update state in-place instead of router.push to avoid loading flash
    setCurrentEpisode(targetEpisode);
    setStreamInfo(null);
    lastProgressReportAtRef.current = 0;

    // Update URL without triggering re-render
    replacePlaybackUrl(
      buildPlayerRoute(activeDramaId, targetEpisode._id, locale, "drama"),
    );
    setActiveEpisodeId(targetEpisode._id);
    setActiveSeekTime(0);

    // Fetch stream info for the new episode
    try {
      const stream = await prefetchEpisodeStream(targetEpisode._id, token);
      setStreamInfo(stream);
    } catch {
      // Stream will be fetched by the main loadData effect as fallback
    }
  }, [activeDramaId, locale, token]);

  const handlePreviousEpisode = useCallback(() => {
    if (hasPreviousEpisode) {
      goToEpisode(episodes[currentEpisodeIndex - 1]);
    }
  }, [currentEpisodeIndex, episodes, goToEpisode, hasPreviousEpisode]);

  const handleNextEpisode = useCallback(() => {
    if (hasNextEpisode) {
      goToEpisode(episodes[currentEpisodeIndex + 1]);
    }
  }, [currentEpisodeIndex, episodes, goToEpisode, hasNextEpisode]);

  const findNextPlayableFeedWindow = useCallback(async () => {
    let window = feedWindowsRef.current[activeFeedMode];
    if (!window) {
      const bootstrappedWindow = await fetchFeedBootstrap(activeFeedMode);
      if (!bootstrappedWindow) return null;
      window = bootstrappedWindow;
    }

    let attempts = 0;
    while (attempts < 3) {
      const playableIndex = window.next.findIndex((item) => item.isFree);
      if (playableIndex >= 0) {
        return { window, playableIndex };
      }

      if (!window.cursor) return null;
      const hydratedWindow = await fetchMoreFeedItems(activeFeedMode, window);
      if (!hydratedWindow || hydratedWindow === window) {
        return null;
      }
      window = hydratedWindow;
      attempts += 1;
    }

    return null;
  }, [activeFeedMode, fetchFeedBootstrap, fetchMoreFeedItems]);

  const handleLockedFeedSkip = useCallback(async () => {
    const result = await findNextPlayableFeedWindow();
    if (!result) return;

    const { window, playableIndex } = result;
    const targetItem = window.next[playableIndex];
    const remainingItems = window.next.filter((_, index) => index !== playableIndex);
    const nextWindow: FeedWindowState = {
      ...window,
      previous: window.current,
      current: targetItem,
      next: remainingItems,
      loadingStates: {
        current: "loaded",
        next: remainingItems.map(() => "loaded"),
      },
      canSwitchNext: remainingItems.length > 0 || Boolean(window.cursor),
      canSwitchPrev: true,
    };

    navigateToFeedItem(activeFeedMode, targetItem, nextWindow);
  }, [activeFeedMode, findNextPlayableFeedWindow, navigateToFeedItem]);

  const handleEnded = useCallback(() => {
    if (isFeedPlayback) {
      if (!autoplayNextEpisode) return;
      const canAdvance = isMobile ? mobileHasNextEpisode : hasNextEpisode;
      if (!canAdvance) return;
      void handleFeedNextItem();
      return;
    }

    if (hasNextEpisode) {
      if (!autoplayNextEpisode) return;
      handleNextEpisode();
      return;
    }

    router.push(playerParentHref);
  }, [autoplayNextEpisode, handleFeedNextItem, handleNextEpisode, hasNextEpisode, isFeedPlayback, isMobile, mobileHasNextEpisode, playerParentHref, router]);

  const handlePaywallTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    paywallTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handlePaywallTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (paywallTouchStartYRef.current === null) return;

    const dy = event.changedTouches[0].clientY - paywallTouchStartYRef.current;
    paywallTouchStartYRef.current = null;
    if (Math.abs(dy) < 60) return;

    if (dy < 0) {
      // Swipe up → skip to next
      if (isFeedPlayback) {
        void handleLockedFeedSkip();
      } else if (hasNextEpisode) {
        handleNextEpisode();
      }
      return;
    }

    // Swipe down → go to previous
    if (isFeedPlayback) {
      void handleFeedPreviousItem();
    } else if (hasPreviousEpisode) {
      handlePreviousEpisode();
    }
  }, [handleFeedPreviousItem, handleLockedFeedSkip, handleNextEpisode, handlePreviousEpisode, hasNextEpisode, hasPreviousEpisode, isFeedPlayback]);

  const handleBackToParent = useCallback(() => {
    router.push(playerParentHref);
  }, [playerParentHref, router]);

  const fallbackPlaybackUrl = useMemo(() => {
    if (!currentEpisode) return undefined;
    // Only use episode.videoUrl if it's a signed/safe URL
    // Raw Cloudflare Stream URLs without tokens will fail with "Invalid token"
    return canUseImmediatePlaybackSource(currentEpisode.videoUrl)
      ? currentEpisode.videoUrl
      : undefined;
  }, [currentEpisode]);

  const videoUrl = useMemo(() => {
    if (!currentEpisode) return "";

    const source = resolvePlaybackSource(streamInfo, fallbackPlaybackUrl) || fallbackPlaybackUrl;
    if (!source || !source.includes('.m3u8')) return source;

    try {
      const parsed = new URL(source);
      parsed.searchParams.set('quality', selectedQuality);
      return parsed.toString();
    } catch {
      return source;
    }
  }, [currentEpisode, fallbackPlaybackUrl, selectedQuality, streamInfo]);
  const playbackSource = useMemo(
    () => {
      const baseSource = createCloudflarePlaybackSource(streamInfo, fallbackPlaybackUrl);
      return {
        ...baseSource,
        streamVideoId: streamInfo?.videoUid || currentEpisode?.streamVideoId || undefined,
        subtitles: baseSource.subtitles,
      };
    },
    [currentEpisode, fallbackPlaybackUrl, streamInfo]
  );

  // Only show loading screen on initial page load (no episode data at all)
  if (loading && !currentEpisode) {
    return <div className="fixed inset-0 bg-black" />;
  }

  if (!currentEpisode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{t.failedLoadVideo}</p>
          <Link
            href={playerParentHref}
            className="text-indigo-500 hover:text-indigo-400"
          >
            {t.backToDrama}
          </Link>
        </div>
      </div>
    );
  }

  const currentEpisodeStatus = currentEpisode.isFree
    ? t.free
    : unlockedEpisodeIds.has(currentEpisode._id)
      ? t.unlocked
      : currentEpisodeAccess?.reason === 'vip_monthly_free_available'
        ? `${t.vip} ${t.free}`
        : `${getEpisodeEffectiveUnlockPrice(currentEpisode, currentEpisodeAccess)} ${t.coins}`;

  const handleUnlockCurrentEpisode = async () => {
    if (!currentEpisode) return;

    if (!token) {
      toast(t.signInUnlock, "info");
      if (typeof window !== "undefined") {
        router.push(`${localizePath("/auth/login", locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
      return;
    }

    setUnlockingEpisode(true);
    try {
      await coinsApi.unlock(token, currentEpisode._id);
      await refreshUser();
      setUnlockedEpisodeIds((prev) => new Set(prev).add(currentEpisode._id));
      setEpisodeAccessMap((prev) => ({
        ...prev,
        [currentEpisode._id]: { hasAccess: true },
      }));
      const stream = await prefetchEpisodeStream(currentEpisode._id, token);
      setStreamInfo(stream);
      toast(t.unlockSuccess, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : t.unlockFail, "error");
    } finally {
      setUnlockingEpisode(false);
    }
  };

  if (!streamInfo && !canAccessCurrentEpisode) {
    const coverImage = resolveSafeImageUrl(currentEpisode.thumbnail || drama?.cover);

    return (
      <div
        className={isMobile ? "fixed inset-0 z-50 overflow-hidden bg-black" : "min-h-screen bg-[#0f0f17]"}
        onTouchStart={isMobile ? handlePaywallTouchStart : undefined}
        onTouchEnd={isMobile ? handlePaywallTouchEnd : undefined}
      >
        <div className="absolute inset-0">
          <Image
            src={coverImage}
            alt={currentEpisode.title}
            fill
            className="object-cover opacity-35"
            sizes="100vw"
            priority
            unoptimized={coverImage.startsWith("blob:")}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.28),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.9)_70%)]" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            {isFeedPlayback ? (
              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold text-white/75 backdrop-blur-md">
                Swipe up to skip
              </div>
            ) : (
              <Link
                href={playerParentHref}
                className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur-md"
              >
                <span aria-hidden="true">←</span>
                <span>{t.backToDrama}</span>
              </Link>
            )}
          </div>

          <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-black/55 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-red-300/80">{t.unlockToWatch}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">{currentEpisode.title}</h1>
            <p className="mt-2 text-sm text-white/70">
              {t.episode} {currentEpisode.episodeNumber} • {currentEpisodeStatus}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/62">{t.paywallHint}</p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={handleUnlockCurrentEpisode}
                disabled={unlockingEpisode}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {unlockingEpisode
                  ? `${t.unlockThisEpisode}...`
                  : `${t.unlockThisEpisode} · ${getEpisodeEffectiveUnlockPrice(currentEpisode, currentEpisodeAccess)} ${t.coins}`}
              </button>

              <Link
                href={localizePath("/user/subscription", locale)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/12 bg-white/7 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t.watchWithVip}
              </Link>

              <Link
                href={localizePath("/user/coins", locale)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15"
              >
                {t.getCoins}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <PlayerMobileExperience
        dramaId={activeDramaId}
        drama={drama}
        currentEpisode={currentEpisode}
        locale={locale}
        user={user}
        token={token}
        initialSeekTime={activeSeekTime}
        playbackSource={playbackSource}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        activeFeedMode={activeFeedMode}
        isFeedLoading={feedLoadingMode === activeFeedMode}
        canOpenFollowingFeed={Boolean(token)}
        onSelectFeedMode={handleFeedModeChange}
        onSkipCurrentFeedItem={isFeedPlayback ? handleFeedNextItem : undefined}
        autoplayNextEpisode={autoplayNextEpisode}
        onAutoplayNextEpisodeChange={handleAutoplayNextEpisodeChange}
        hasNextEpisode={mobileHasNextEpisode}
        hasPreviousEpisode={mobileHasPreviousEpisode}
        onNextEpisode={mobileHasNextEpisode ? (isFeedPlayback ? () => { void handleFeedNextItem(); } : handleNextEpisode) : undefined}
        onPreviousEpisode={mobileHasPreviousEpisode ? (isFeedPlayback ? () => { void handleFeedPreviousItem(); } : handlePreviousEpisode) : undefined}
        onRefreshFeed={isFeedPlayback ? () => { void handleRefreshFeedPool(); } : undefined}
        playbackMode={playbackMode}
        parentHref={playerParentHref}
        onBackToParent={handleBackToParent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      {/* 视频播放器 */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          <SimplePlayer
            videoUrl={videoUrl || ''}
            poster={currentEpisode.thumbnail || drama?.cover}
            autoplay={true}
            initialSeekTime={activeSeekTime}
            mediaSession={{
              title: currentEpisode.title,
              artist: drama?.title,
              album: `${t.episode} ${currentEpisode.episodeNumber}`,
              artwork: currentEpisode.thumbnail || drama?.cover
                ? [{ src: currentEpisode.thumbnail || drama?.cover || '' }]
                : undefined,
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onNextTrack={hasNextEpisode ? handleNextEpisode : undefined}
            onPreviousTrack={hasPreviousEpisode ? handlePreviousEpisode : undefined}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* 剧集信息 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={playerParentHref}
            className="text-indigo-500 hover:text-indigo-400 mb-4 inline-block"
          >
            ← {t.backToDrama} {drama?.title}
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {currentEpisode.title}
          </h1>
          <p className="text-gray-400">
            {t.episode} {currentEpisode.episodeNumber} • {formatDuration(currentEpisode.duration)}
          </p>
          {qualityOptions.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-700 bg-[#13131d] px-3 py-1.5">
              <span className="text-xs uppercase tracking-wide text-gray-400">Quality</span>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="bg-transparent text-sm text-white outline-none"
              >
                {qualityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="bg-[#13131d]"
                  >
                    {option.label}{option.badge ? ` (${option.badge})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 剧集列表 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">{t.episodes}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {episodes.map((episode) => (
              <button
                key={episode._id}
                onClick={() => goToEpisode(episode)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                  episode._id === activeEpisodeId
                    ? 'border-indigo-600'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="aspect-video bg-gray-800 relative">
                  {episode.thumbnail && (
                    <Image
                      src={episode.thumbnail}
                      alt={episode.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 16vw"
                      unoptimized={episode.thumbnail.startsWith('blob:')}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {t.episode} {episode.episodeNumber}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-[#13131d]">
                  <p className="text-sm text-gray-300 truncate">{episode.title}</p>
                  {!episode.isFree && (
                    unlockedEpisodeIds.has(episode._id) ? (
                      <span className="text-xs text-green-400">{t.unlocked}</span>
                    ) : episodeAccessMap[episode._id]?.reason === "vip_monthly_free_available" ? (
                      <span className="text-xs text-purple-400">{t.vip} {t.free}</span>
                    ) : (
                      <span className="text-xs text-yellow-500">
                        {getEpisodeEffectiveUnlockPrice(episode, episodeAccessMap[episode._id])} {t.coins}
                      </span>
                    )
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
