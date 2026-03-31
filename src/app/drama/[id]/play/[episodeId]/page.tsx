"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { coinsApi, dramasApi, episodesApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode, EpisodeAccessResult } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import MobilePlayer from "@/components/player/MobilePlayer";
import SimplePlayer from "@/components/player/SimplePlayer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { usePlatform } from "@/hooks/usePlatform";
import { useLocale } from "@/hooks/useLocale";
import { resolvePlaybackSource } from "@/lib/playback";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { formatDuration } from "@/lib/utils";
import { usePlaybackSession } from "@/components/mobile/PlaybackSession";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { resolveSafeImageUrl } from "@/lib/safe-image";
import {
  prefetchEpisodeStream,
  preloadImageAsset,
  readPrefetchedStream,
} from "@/lib/playback-prefetch";

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

  const dramaId = params.id as string;
  const episodeId = params.episodeId as string;
  const initialSeekTime = Math.max(
    0,
    Number(searchParams.get("start") || searchParams.get("t") || 0) || 0
  );

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamPlaybackInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [showEpisodeSheet, setShowEpisodeSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlockingEpisode, setUnlockingEpisode] = useState(false);
  const [unlockedEpisodeIds, setUnlockedEpisodeIds] = useState<Set<string>>(new Set());
  const [episodeAccessMap, setEpisodeAccessMap] = useState<Record<string, EpisodeAccessResult>>({});
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState<number | null>(null);
  const lastProgressReportAtRef = useRef<number>(0);

  // 加载短剧和剧集信息
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 加载短剧信息
        const dramaResponse = await dramasApi.getById(dramaId) as any;
        const dramaPayload = dramaResponse?.data ?? dramaResponse;
        const dramaData = dramaPayload?.drama ?? dramaPayload;
        const episodeList: Episode[] = dramaPayload?.episodes || dramaData?.episodes || [];
        setDrama(dramaData);
        setEpisodes(episodeList);

        // 查找当前剧集
        const episode = episodeList.find((ep: Episode) => ep._id === episodeId);
        if (!episode) {
          toast(t.episodeNotFound, "error");
          router.push(localizePath(`/drama/${dramaId}`, locale));
          return;
        }
        setCurrentEpisode(episode);

        if (!episode.isFree) {
          if (!token) {
            setStreamInfo(null);
            return;
          }

          try {
            const accessRes = await episodesApi.checkAccess(episode._id, token);
            const access = (accessRes as any)?.data ?? accessRes;
            setEpisodeAccessMap((prev) => ({
              ...prev,
              [episode._id]: access as EpisodeAccessResult,
            }));

            if (!(access as EpisodeAccessResult)?.hasAccess) {
              setStreamInfo(null);
              return;
            }
          } catch {
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
        }

        // 获取播放流信息
        const cachedStream = readPrefetchedStream(episodeId, token);
        if (cachedStream) {
          setStreamInfo(cachedStream);
        }

        const stream = await prefetchEpisodeStream(episodeId, token);
        setStreamInfo(stream);
      } catch (error: any) {
        console.error("Failed to load episode:", error);
        toast(error.message || t.failedToLoad, "error");
      } finally {
        setLoading(false);
      }
    };

    if (dramaId && episodeId) {
      loadData();
    }
  }, [dramaId, episodeId, token, router, toast, locale, t.episodeNotFound, t.failedToLoad]);

  useEffect(() => {
    if (!token || episodes.length === 0) {
      setUnlockedEpisodeIds(new Set());
      return;
    }
    let cancelled = false;
    userApi.getUnlockedEpisodes(token, dramaId)
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
  }, [token, dramaId, episodes.length]);

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

  const playbackQueue = episodes.map((episode) => ({
    dramaId,
    episodeId: episode._id,
    episodeTitle: episode.title,
    episodeNumber: episode.episodeNumber,
    poster: episode.thumbnail || drama?.cover,
    duration: episode.duration,
  }));
  const playbackQueueIndex = currentEpisode
    ? playbackQueue.findIndex((episode) => episode.episodeId === currentEpisode._id)
    : -1;

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

  // 播放结束 - 自动播放下一集
  const handleEnded = () => {
    const currentIndex = episodes.findIndex((ep) => ep._id === episodeId);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      setNextEpisodeCountdown(5);
      return;
    }
    setNextEpisodeCountdown(null);
  };

  // 播放错误处理
  const handleError = (error: string) => {
    console.error("Playback error:", error);
    toast(t.playbackError, "error");
  };

  const handlePlay = () => {
    setNextEpisodeCountdown(null);
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
      dramaId,
      episodeId: currentEpisode._id,
      dramaTitle: drama.title,
      episodeTitle: currentEpisode.title,
      episodeNumber: currentEpisode.episodeNumber,
      poster: currentEpisode.thumbnail || drama.cover,
      currentTime: initialSeekTime,
      duration: currentEpisode.duration,
      isPlaying: true,
      updatedAt: Date.now(),
      queue: playbackQueue,
      currentIndex: playbackQueueIndex,
    });
  }, [canAccessCurrentEpisode, currentEpisode, drama, dramaId, initialSeekTime, playbackQueue, playbackQueueIndex, startSession]);

  const currentEpisodeIndex = currentEpisode
    ? episodes.findIndex((episode) => episode._id === currentEpisode._id)
    : -1;
  const hasPreviousEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1;
  const nextEpisode = hasNextEpisode ? episodes[currentEpisodeIndex + 1] : null;

  useEffect(() => {
    if (!nextEpisode) return;

    router.prefetch(localizePath(`/drama/${dramaId}/play/${nextEpisode._id}`, locale));
    preloadImageAsset(nextEpisode.thumbnail || drama?.cover);

    const canWarmNextStream = Boolean(
      nextEpisode.isFree ||
      unlockedEpisodeIds.has(nextEpisode._id) ||
      episodeAccessMap[nextEpisode._id]?.hasAccess
    );

    if (!canWarmNextStream) return;
    void prefetchEpisodeStream(nextEpisode._id, token).catch(() => {});
  }, [
    nextEpisode,
    router,
    locale,
    dramaId,
    drama?.cover,
    token,
    unlockedEpisodeIds,
    episodeAccessMap,
  ]);

  const goToEpisode = useCallback((targetEpisode: Episode) => {
    setNextEpisodeCountdown(null);
    router.push(localizePath(`/drama/${dramaId}/play/${targetEpisode._id}`, locale));
  }, [dramaId, locale, router]);

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

  useEffect(() => {
    setNextEpisodeCountdown(null);
  }, [episodeId]);

  useEffect(() => {
    if (nextEpisodeCountdown === null) return;
    if (!hasNextEpisode) {
      setNextEpisodeCountdown(null);
      return;
    }
    if (nextEpisodeCountdown <= 0) {
      handleNextEpisode();
      return;
    }

    const timeoutId = setTimeout(() => {
      setNextEpisodeCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [handleNextEpisode, hasNextEpisode, nextEpisodeCountdown]);

  const videoUrl = streamInfo && currentEpisode
    ? (() => {
        const source = resolvePlaybackSource(streamInfo, currentEpisode.videoUrl) || currentEpisode.videoUrl;
        if (!source || !source.includes('.m3u8')) return source;
        try {
          const parsed = new URL(source);
          parsed.searchParams.set('quality', selectedQuality);
          return parsed.toString();
        } catch {
          return source;
        }
      })()
    : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-400">{t.loadingVideo}</p>
        </div>
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{t.failedLoadVideo}</p>
          <Link
            href={localizePath(`/drama/${dramaId}`, locale)}
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
      <div className={isMobile ? "fixed inset-0 z-50 overflow-hidden bg-black" : "min-h-screen bg-[#0f0f17]"}>
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
            <Link
              href={localizePath(`/drama/${dramaId}`, locale)}
              className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur-md"
            >
              <span aria-hidden="true">←</span>
              <span>{t.backToDrama}</span>
            </Link>
            <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold text-white/75 backdrop-blur-md">
              {currentEpisodeStatus}
            </div>
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

  if (!streamInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{t.failedLoadVideo}</p>
          <Link
            href={localizePath(`/drama/${dramaId}`, locale)}
            className="text-indigo-500 hover:text-indigo-400"
          >
            {t.backToDrama}
          </Link>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <MobilePlayer
          videoUrl={videoUrl}
          poster={currentEpisode.thumbnail || drama?.cover}
          autoplay
          initialSeekTime={initialSeekTime}
          title={currentEpisode.title}
          subtitle={`${t.episode} ${currentEpisode.episodeNumber} • ${formatDuration(currentEpisode.duration)}`}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          onNextEpisode={hasNextEpisode ? handleNextEpisode : undefined}
          onPreviousEpisode={hasPreviousEpisode ? handlePreviousEpisode : undefined}
          hasNextEpisode={hasNextEpisode}
          hasPreviousEpisode={hasPreviousEpisode}
          labels={{
            pictureInPicture: t.pip,
            pictureInPictureExit: t.pipReturn,
            playbackSpeed: t.playbackSpeed,
            tapToPause: t.tapToPause,
            tapToPlay: t.tapToPlay,
            holdForSpeed: t.holdForSpeed,
            nextEpisode: t.nextEpisodeHint,
            previousEpisode: t.previousEpisodeHint,
            speedBoost: (rate) => `${rate}x`,
          }}
          className="h-[100dvh] w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link
            href={localizePath(`/drama/${dramaId}`, locale)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur-md"
          >
            <span aria-hidden="true">←</span>
            <span>{t.backToDrama}</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowEpisodeSheet((prev) => !prev)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur-md"
          >
            <span>{showEpisodeSheet ? t.hideEpisodes : t.showEpisodes}</span>
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[55] bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-12">
          <div className="pointer-events-auto flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">{drama?.title}</p>
              <p className="mt-1 text-sm font-semibold text-white">{currentEpisode.title}</p>
              <p className="mt-1 text-xs text-white/65">{t.swipeHint}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md">
                {selectedQuality}
              </div>
              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold text-white/75 backdrop-blur-md">
                {currentEpisodeStatus}
              </div>
            </div>
          </div>
        </div>
        {nextEpisodeCountdown !== null && hasNextEpisode ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[58] px-4">
            <div className="pointer-events-auto rounded-3xl border border-white/15 bg-black/58 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t.nextEpisodeHint}</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {nextEpisode ? `${t.episode} ${nextEpisode.episodeNumber}` : t.nextEpisodeHint} · {nextEpisodeCountdown}s
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNextEpisodeCountdown(null)}
                  className="rounded-2xl border border-white/14 bg-white/8 px-3 py-2 text-sm font-medium text-white/85"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNextEpisodeCountdown(null);
                    handleNextEpisode();
                  }}
                  className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <MobileBottomSheet
          open={showEpisodeSheet}
          onClose={() => setShowEpisodeSheet(false)}
          contentClassName="max-h-[58dvh]"
        >
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{t.episodeQueue}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{currentEpisode.title}</h2>
                <p className="mt-1 text-xs text-white/45">{t.episode} {currentEpisode.episodeNumber} · {currentEpisodeStatus}</p>
              </div>
              {qualityOptions.length > 0 ? (
                <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  <span>{t.quality}</span>
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
                </label>
              ) : null}
            </div>

            <div className="grid max-h-[40dvh] gap-2 overflow-y-auto pr-1">
              {episodes.map((episode) => {
                const access = episodeAccessMap[episode._id];
                const isUnlocked = unlockedEpisodeIds.has(episode._id);
                const isCurrentEpisode = episode._id === episodeId;
                const unlockPrice = getEpisodeEffectiveUnlockPrice(episode, access);
                const statusLabel = episode.isFree
                  ? t.free
                  : isUnlocked
                    ? t.unlocked
                    : access?.reason === "vip_monthly_free_available"
                      ? `${t.vip} ${t.free}`
                      : `${unlockPrice} ${t.coins}`;
                const statusClass = episode.isFree || isUnlocked
                  ? 'bg-green-500/15 text-green-300'
                  : access?.reason === "vip_monthly_free_available"
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'bg-amber-500/15 text-amber-300';

                return (
                  <button
                    key={episode._id}
                    type="button"
                    onClick={() => {
                      setShowEpisodeSheet(false);
                      goToEpisode(episode);
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isCurrentEpisode
                        ? 'border-red-500/60 bg-red-500/10'
                        : 'border-white/8 bg-white/4 hover:bg-white/8'
                    }`}
                  >
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-900">
                      <Image
                        src={episode.thumbnail || drama?.cover || '/placeholder-cover.svg'}
                        alt={episode.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={Boolean((episode.thumbnail || drama?.cover)?.startsWith('blob:'))}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {isCurrentEpisode ? (
                        <div className="absolute left-2 top-2 rounded-full bg-red-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {t.showEpisodes}
                        </div>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {t.episode} {episode.episodeNumber}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-white/65">{episode.title}</p>
                      <p className="mt-1 text-[11px] text-white/40">{formatDuration(episode.duration)}</p>
                    </div>
                    <div className="shrink-0">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </MobileBottomSheet>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      {/* 视频播放器 */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          <SimplePlayer
            videoUrl={videoUrl}
            poster={currentEpisode.thumbnail || drama?.cover}
            autoplay={true}
            initialSeekTime={initialSeekTime}
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
            href={localizePath(`/drama/${dramaId}`, locale)}
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
              <Link
                key={episode._id}
                href={localizePath(`/drama/${dramaId}/play/${episode._id}`, locale)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  episode._id === episodeId
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
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
