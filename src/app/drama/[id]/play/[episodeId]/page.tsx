"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dramasApi, episodesApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode } from "@/types";
import type { StreamPlaybackInfo } from "@/types";
import SimplePlayer from "@/components/player/SimplePlayer";

export default function PlayEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
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
        const dramaData = await dramasApi.getById(dramaId);
        setDrama(dramaData);
        setEpisodes(dramaData.episodes || []);

        // 查找当前剧集
        const episode = dramaData.episodes?.find((ep: Episode) => ep._id === episodeId);
        if (!episode) {
          toast("Episode not found", "error");
          router.push(`/drama/${dramaId}`);
          return;
        }
        setCurrentEpisode(episode);

        // 获取播放流信息
        if (token) {
          const stream = await episodesApi.getStream(episodeId, token);
          setStreamInfo(stream);
        }
      } catch (error: any) {
        console.error("Failed to load episode:", error);
        toast(error.message || "Failed to load episode", "error");
      } finally {
        setLoading(false);
      }
    };

    if (dramaId && episodeId) {
      loadData();
    }
  }, [dramaId, episodeId, token, router, toast]);

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
      router.push(`/drama/${dramaId}/play/${nextEpisode._id}`);
    }
  };

  // 播放错误处理
  const handleError = (error: string) => {
    console.error("Playback error:", error);
    toast("Video playback error", "error");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!currentEpisode || !streamInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f17]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Failed to load video</p>
          <Link
            href={`/drama/${dramaId}`}
            className="text-indigo-500 hover:text-indigo-400"
          >
            Back to drama
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
            href={`/drama/${dramaId}`}
            className="text-indigo-500 hover:text-indigo-400 mb-4 inline-block"
          >
            ← Back to {drama?.title}
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {currentEpisode.title}
          </h1>
          <p className="text-gray-400">
            Episode {currentEpisode.episodeNumber} • {Math.floor(currentEpisode.duration / 60)}:{String(currentEpisode.duration % 60).padStart(2, '0')}
          </p>
        </div>

        {/* 剧集列表 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Episodes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {episodes.map((episode) => (
              <Link
                key={episode._id}
                href={`/drama/${dramaId}/play/${episode._id}`}
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
                      Ep {episode.episodeNumber}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-[#13131d]">
                  <p className="text-sm text-gray-300 truncate">{episode.title}</p>
                  {!episode.isFree && (
                    <span className="text-xs text-yellow-500">
                      {episode.unlockPrice} coins
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
