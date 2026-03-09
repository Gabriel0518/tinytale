"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { dramasApi, episodesApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import SimplePlayer from "@/components/player/SimplePlayer";
import { detectClientLocale, localizePath, SupportedLocale } from "@/lib/i18n";

const PLAY_TEXT: Record<SupportedLocale, Record<string, string>> = {
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
};

export default function PlayEpisodePage() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = PLAY_TEXT[locale] || PLAY_TEXT.en;
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const dramaId = params.id as string;
  const episodeId = params.episodeId as string;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamPlaybackInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  const videoUrl = streamInfo.playbackUrl || currentEpisode.videoUrl;

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      {/* 视频播放器 */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          <SimplePlayer
            videoUrl={videoUrl}
            poster={currentEpisode.thumbnail || drama?.cover}
            autoplay={true}
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
                    <span className="text-xs text-yellow-500">
                      {episode.unlockPrice} {t.coins}
                    </span>
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
