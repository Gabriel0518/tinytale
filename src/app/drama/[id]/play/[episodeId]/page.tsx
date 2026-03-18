"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { dramasApi, episodesApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode, EpisodeAccessResult } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import SimplePlayer from "@/components/player/SimplePlayer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolvePlaybackSource } from "@/lib/playback";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";
import { resolveLocaleCopy } from '@/lib/locale-copy';

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
    coins: "coins",
    unlocked: "Unlocked",
    free: "FREE",
    vip: "VIP" },
  zh: {
    episodeNotFound: "未找到该剧集",
    failedToLoad: "加载剧集失败",
    playbackError: "视频播放错误",
    loadingVideo: "视频加载中...",
    failedLoadVideo: "视频加载失败",
    backToDrama: "返回",
    episode: "第",
    episodes: "剧集列表",
    coins: "金币",
    unlocked: "已解锁",
    free: "免费",
    vip: "VIP" },
  ja: {
    episodeNotFound: "エピソードが見つかりません",
    failedToLoad: "読み込みに失敗しました",
    playbackError: "動画再生エラー",
    loadingVideo: "動画を読み込み中...",
    failedLoadVideo: "動画を読み込めませんでした",
    backToDrama: "戻る",
    episode: "エピソード",
    episodes: "エピソード一覧",
    coins: "コイン",
    unlocked: "解放済み",
    free: "無料",
    vip: "VIP" },
  es: {
    episodeNotFound: "Episodio no encontrado",
    failedToLoad: "No se pudo cargar el episodio",
    playbackError: "Error de reproducción de video",
    loadingVideo: "Cargando video...",
    failedLoadVideo: "No se pudo cargar el video",
    backToDrama: "Volver a",
    episode: "Episodio",
    episodes: "Episodios",
    coins: "monedas",
    unlocked: "Desbloqueado",
    free: "GRATIS",
    vip: "VIP" },
  pt: {
    episodeNotFound: "Episódio não encontrado",
    failedToLoad: "Falha ao carregar episódio",
    playbackError: "Erro de reprodução de vídeo",
    loadingVideo: "Carregando vídeo...",
    failedLoadVideo: "Falha ao carregar vídeo",
    backToDrama: "Voltar para",
    episode: "Episódio",
    episodes: "Episódios",
    coins: "moedas",
    unlocked: "Desbloqueado",
    free: "GRÁTIS",
    vip: "VIP" },
  hi: {
    episodeNotFound: "एपिसोड नहीं मिला",
    failedToLoad: "एपिसोड लोड नहीं हो पाया",
    playbackError: "वीडियो प्लेबैक त्रुटि",
    loadingVideo: "वीडियो लोड हो रहा है...",
    failedLoadVideo: "वीडियो लोड नहीं हुआ",
    backToDrama: "वापस जाएँ",
    episode: "एपिसोड",
    episodes: "एपिसोड सूची",
    coins: "कॉइन्स",
    unlocked: "अनलॉक",
    free: "फ्री",
    vip: "VIP" },
  id: {
    episodeNotFound: "Episode tidak ditemukan",
    failedToLoad: "Gagal memuat episode",
    playbackError: "Kesalahan pemutaran video",
    loadingVideo: "Memuat video...",
    failedLoadVideo: "Gagal memuat video",
    backToDrama: "Kembali ke",
    episode: "Episode",
    episodes: "Daftar episode",
    coins: "koin",
    unlocked: "Terbuka",
    free: "GRATIS",
    vip: "VIP" } };

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
  const { user, token } = useAuth();
  const { toast } = useToast();

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
  const [loading, setLoading] = useState(true);
  const [unlockedEpisodeIds, setUnlockedEpisodeIds] = useState<Set<string>>(new Set());
  const [episodeAccessMap, setEpisodeAccessMap] = useState<Record<string, EpisodeAccessResult>>({});

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

        // 获取播放流信息
        if (token) {
          const stream = await episodesApi.getStream(episodeId, token);
          setStreamInfo((stream as any)?.data ?? (stream as StreamPlaybackInfo));
        }
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

  // 播放进度上报
  const handleTimeUpdate = (time: number, duration: number) => {
    if (token && currentEpisode) {
      episodesApi.reportProgress(currentEpisode._id, token, time, duration).catch(() => {});
    }
  };

  // 播放结束 - 自动播放下一集
  const handleEnded = () => {
    const currentIndex = episodes.findIndex((ep) => ep._id === episodeId);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];
      router.push(localizePath(`/drama/${dramaId}/play/${nextEpisode._id}`, locale));
    }
  };

  // 播放错误处理
  const handleError = (error: string) => {
    console.error("Playback error:", error);
    toast(t.playbackError, "error");
  };

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

  if (!currentEpisode || !streamInfo) {
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

  const videoUrl = (() => {
    const source = resolvePlaybackSource(streamInfo, currentEpisode.videoUrl) || currentEpisode.videoUrl;
    if (!source || !source.includes('.m3u8')) return source;
    try {
      const parsed = new URL(source);
      parsed.searchParams.set('quality', selectedQuality);
      return parsed.toString();
    } catch {
      return source;
    }
  })();

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
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
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
            {t.episode} {currentEpisode.episodeNumber} • {Math.floor(currentEpisode.duration / 60)}:{String(currentEpisode.duration % 60).padStart(2, '0')}
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
                    <img
                      src={episode.thumbnail}
                      alt={episode.title}
                      className="w-full h-full object-cover"
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
