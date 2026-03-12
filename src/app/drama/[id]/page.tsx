"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense} from "react";
import { useParams, useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { dramasApi, reviewsApi, userApi, coinsApi, episodesApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { Drama, Episode, EpisodeAccessResult, Review, StreamPlaybackInfo } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { DramaCard } from "@/components/features/DramaCard";
import { formatDuration, resolveDramaMode } from "@/lib/utils";
import { CloudflarePlayer, PlayerRoot, usePlayerContext } from "@/components/player";
import type { CloudflarePlayerHandle } from "@/components/player";
import { ControlBar } from "@/components/player/Controls";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolvePlaybackSource } from "@/lib/playback";
import { getQualityMenuOptions, resolveDefaultQuality } from "@/lib/playerQuality";

const DRAMA_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: {
    loading: "Loading...",
    dramaNotFound: "Drama not found",
    failedLoadDrama: "Failed to load drama details",
    signInUnlock: "Please sign in to unlock episodes",
    signInFavorite: "Please sign in to add favorites",
    signInReview: "Please sign in to write a review",
    unlockSuccess: "Episode unlocked!",
    unlockFail: "Failed to unlock episode",
    unlockAllNone: "All episodes are already unlocked!",
    unlockAllFail: "Failed to unlock episodes",
    unlockAllSuccessSuffix: "episodes unlocked!",
    insufficientCoins: "Insufficient coins. Please recharge first.",
    removedFromList: "Removed from My List",
    addedToList: "Added to My List",
    updateFavoriteFail: "Failed to update favorites",
    reviewSubmitted: "Review submitted!",
    reviewFail: "Failed to submit review",
    home: "Home",
    episodes: "Episodes",
    updatedToEp: "Updated to Ep",
    free: "FREE",
    unlocked: "Unlocked",
    coins: "coins",
    vip: "VIP",
    unlockAll: "Unlock All",
    allUnlocked: "All Episodes Unlocked",
    trending: "Trending",
    episodesCount: "Episodes",
    completed: "Completed",
    inMyList: "In My List",
    myList: "My List",
    linkCopied: "Link copied to clipboard!",
    copyFail: "Failed to copy link",
    share: "Share",
    cast: "Cast",
    lead: "Lead",
    supporting: "Supporting",
    reviews: "Reviews",
    writeReview: "Write a Review",
    yourRating: "Your Rating:",
    reviewPlaceholder: "Share your thoughts about this drama...",
    cancel: "Cancel",
    submitReview: "Submit Review",
    noReviews: "No reviews yet. Be the first to review!",
    likes: "likes",
    showLess: "Show Less",
    showMoreReviews: "Show More Reviews",
    moreLikeThis: "More Like This" },
  zh: {
    loading: "加载中...",
    dramaNotFound: "未找到短剧",
    failedLoadDrama: "短剧详情加载失败",
    signInUnlock: "请先登录后解锁剧集",
    signInFavorite: "请先登录后收藏",
    signInReview: "请先登录后评论",
    unlockSuccess: "剧集解锁成功！",
    unlockFail: "解锁剧集失败",
    unlockAllNone: "所有剧集已解锁！",
    unlockAllFail: "批量解锁失败",
    unlockAllSuccessSuffix: "集已解锁！",
    insufficientCoins: "金币不足，请先充值。",
    removedFromList: "已取消收藏",
    addedToList: "已加入收藏",
    updateFavoriteFail: "更新收藏失败",
    reviewSubmitted: "评论已提交！",
    reviewFail: "评论提交失败",
    home: "首页",
    episodes: "剧集",
    updatedToEp: "已更新至第",
    free: "免费",
    unlocked: "已解锁",
    coins: "金币",
    vip: "VIP",
    unlockAll: "全部解锁",
    allUnlocked: "全部剧集已解锁",
    trending: "热门",
    episodesCount: "集",
    completed: "已完结",
    inMyList: "已收藏",
    myList: "我的收藏",
    linkCopied: "链接已复制到剪贴板！",
    copyFail: "复制链接失败",
    share: "分享",
    cast: "演员",
    lead: "主演",
    supporting: "配角",
    reviews: "评论",
    writeReview: "写评论",
    yourRating: "你的评分：",
    reviewPlaceholder: "分享你对这部短剧的看法...",
    cancel: "取消",
    submitReview: "提交评论",
    noReviews: "还没有评论，来发表第一条吧！",
    likes: "点赞",
    showLess: "收起",
    showMoreReviews: "查看更多评论",
    moreLikeThis: "你可能也喜欢" },
  ja: { loading: "読み込み中...", dramaNotFound: "作品が見つかりません", failedLoadDrama: "読み込みに失敗しました", signInUnlock: "解放するにはログインしてください", signInFavorite: "マイリスト追加にはログインしてください", signInReview: "レビュー投稿にはログインしてください", unlockSuccess: "解放しました！", unlockFail: "解放に失敗しました", unlockAllNone: "すべて解放済みです", unlockAllFail: "一括解放に失敗しました", unlockAllSuccessSuffix: "話を解放しました", insufficientCoins: "コイン不足です。", removedFromList: "マイリストから削除しました", addedToList: "マイリストに追加しました", updateFavoriteFail: "更新に失敗しました", reviewSubmitted: "レビューを投稿しました", reviewFail: "レビュー投稿に失敗しました", home: "ホーム", episodes: "エピソード", updatedToEp: "更新", free: "無料", unlocked: "解放済み", coins: "コイン", vip: "VIP", unlockAll: "一括解放", allUnlocked: "全エピソード解放済み", trending: "トレンド", episodesCount: "話", completed: "完結", inMyList: "マイリスト済み", myList: "マイリスト", linkCopied: "リンクをコピーしました", copyFail: "コピーに失敗しました", share: "共有", cast: "キャスト", lead: "主演", supporting: "助演", reviews: "レビュー", writeReview: "レビューを書く", yourRating: "あなたの評価:", reviewPlaceholder: "この作品の感想を共有してください...", cancel: "キャンセル", submitReview: "投稿", noReviews: "まだレビューがありません", likes: "いいね", showLess: "閉じる", showMoreReviews: "レビューをもっと見る", moreLikeThis: "おすすめ作品" },
  es: { loading: "Cargando...", dramaNotFound: "Drama no encontrado", failedLoadDrama: "No se pudieron cargar los detalles", signInUnlock: "Inicia sesión para desbloquear episodios", signInFavorite: "Inicia sesión para guardar favoritos", signInReview: "Inicia sesión para escribir reseñas", unlockSuccess: "¡Episodio desbloqueado!", unlockFail: "No se pudo desbloquear", unlockAllNone: "¡Todos los episodios ya están desbloqueados!", unlockAllFail: "Error al desbloquear episodios", unlockAllSuccessSuffix: "episodios desbloqueados", insufficientCoins: "Monedas insuficientes", removedFromList: "Eliminado de Mi lista", addedToList: "Añadido a Mi lista", updateFavoriteFail: "No se pudo actualizar favoritos", reviewSubmitted: "¡Reseña enviada!", reviewFail: "No se pudo enviar la reseña", home: "Inicio", episodes: "Episodios", updatedToEp: "Actualizado al Ep", free: "GRATIS", unlocked: "Desbloqueado", coins: "monedas", vip: "VIP", unlockAll: "Desbloquear todo", allUnlocked: "Todos los episodios desbloqueados", trending: "Tendencia", episodesCount: "Episodios", completed: "Completado", inMyList: "En Mi lista", myList: "Mi lista", linkCopied: "¡Enlace copiado!", copyFail: "No se pudo copiar el enlace", share: "Compartir", cast: "Reparto", lead: "Principal", supporting: "Secundario", reviews: "Reseñas", writeReview: "Escribir reseña", yourRating: "Tu puntuación:", reviewPlaceholder: "Comparte tu opinión sobre este drama...", cancel: "Cancelar", submitReview: "Enviar reseña", noReviews: "Aún no hay reseñas", likes: "me gusta", showLess: "Mostrar menos", showMoreReviews: "Mostrar más reseñas", moreLikeThis: "Más como esto" },
  pt: { loading: "Carregando...", dramaNotFound: "Drama não encontrado", failedLoadDrama: "Falha ao carregar detalhes", signInUnlock: "Faça login para desbloquear episódios", signInFavorite: "Faça login para adicionar favoritos", signInReview: "Faça login para escrever avaliação", unlockSuccess: "Episódio desbloqueado!", unlockFail: "Falha ao desbloquear episódio", unlockAllNone: "Todos os episódios já estão desbloqueados!", unlockAllFail: "Falha ao desbloquear episódios", unlockAllSuccessSuffix: "episódios desbloqueados", insufficientCoins: "Moedas insuficientes", removedFromList: "Removido da Minha Lista", addedToList: "Adicionado à Minha Lista", updateFavoriteFail: "Falha ao atualizar favoritos", reviewSubmitted: "Avaliação enviada!", reviewFail: "Falha ao enviar avaliação", home: "Início", episodes: "Episódios", updatedToEp: "Atualizado até Ep", free: "GRÁTIS", unlocked: "Desbloqueado", coins: "moedas", vip: "VIP", unlockAll: "Desbloquear tudo", allUnlocked: "Todos episódios desbloqueados", trending: "Em alta", episodesCount: "Episódios", completed: "Concluído", inMyList: "Na Minha Lista", myList: "Minha Lista", linkCopied: "Link copiado!", copyFail: "Falha ao copiar link", share: "Compartilhar", cast: "Elenco", lead: "Principal", supporting: "Coadjuvante", reviews: "Avaliações", writeReview: "Escrever avaliação", yourRating: "Sua nota:", reviewPlaceholder: "Compartilhe sua opinião sobre este drama...", cancel: "Cancelar", submitReview: "Enviar avaliação", noReviews: "Ainda sem avaliações", likes: "curtidas", showLess: "Mostrar menos", showMoreReviews: "Mostrar mais avaliações", moreLikeThis: "Mais como este" },
  hi: { loading: "लोड हो रहा है...", dramaNotFound: "ड्रामा नहीं मिला", failedLoadDrama: "ड्रामा विवरण लोड नहीं हुआ", signInUnlock: "एपिसोड अनलॉक करने के लिए लॉगिन करें", signInFavorite: "फेवरेट जोड़ने के लिए लॉगिन करें", signInReview: "रिव्यू लिखने के लिए लॉगिन करें", unlockSuccess: "एपिसोड अनलॉक हो गया!", unlockFail: "एपिसोड अनलॉक नहीं हुआ", unlockAllNone: "सभी एपिसोड पहले से अनलॉक हैं", unlockAllFail: "एपिसोड अनलॉक नहीं हो पाए", unlockAllSuccessSuffix: "एपिसोड अनलॉक हुए", insufficientCoins: "कॉइन्स अपर्याप्त हैं", removedFromList: "मेरी सूची से हटाया गया", addedToList: "मेरी सूची में जोड़ा गया", updateFavoriteFail: "फेवरेट अपडेट नहीं हुआ", reviewSubmitted: "रिव्यू जमा हो गया!", reviewFail: "रिव्यू जमा नहीं हुआ", home: "होम", episodes: "एपिसोड", updatedToEp: "अपडेटेड एप", free: "फ्री", unlocked: "अनलॉक", coins: "कॉइन्स", vip: "VIP", unlockAll: "सभी अनलॉक करें", allUnlocked: "सभी एपिसोड अनलॉक हैं", trending: "ट्रेंडिंग", episodesCount: "एपिसोड", completed: "पूर्ण", inMyList: "मेरी सूची में", myList: "मेरी सूची", linkCopied: "लिंक कॉपी हो गया!", copyFail: "लिंक कॉपी नहीं हुआ", share: "शेयर", cast: "कास्ट", lead: "मुख्य", supporting: "सहायक", reviews: "रिव्यू", writeReview: "रिव्यू लिखें", yourRating: "आपकी रेटिंग:", reviewPlaceholder: "इस ड्रामा पर अपनी राय लिखें...", cancel: "रद्द करें", submitReview: "रिव्यू सबमिट करें", noReviews: "अभी कोई रिव्यू नहीं है", likes: "लाइक्स", showLess: "कम दिखाएँ", showMoreReviews: "और रिव्यू दिखाएँ", moreLikeThis: "इसी तरह के और" },
  id: { loading: "Memuat...", dramaNotFound: "Drama tidak ditemukan", failedLoadDrama: "Gagal memuat detail drama", signInUnlock: "Masuk untuk membuka episode", signInFavorite: "Masuk untuk menambah favorit", signInReview: "Masuk untuk menulis ulasan", unlockSuccess: "Episode berhasil dibuka!", unlockFail: "Gagal membuka episode", unlockAllNone: "Semua episode sudah terbuka!", unlockAllFail: "Gagal membuka semua episode", unlockAllSuccessSuffix: "episode dibuka", insufficientCoins: "Koin tidak cukup", removedFromList: "Dihapus dari Daftar Saya", addedToList: "Ditambahkan ke Daftar Saya", updateFavoriteFail: "Gagal memperbarui favorit", reviewSubmitted: "Ulasan berhasil dikirim!", reviewFail: "Gagal mengirim ulasan", home: "Beranda", episodes: "Episode", updatedToEp: "Update sampai Ep", free: "GRATIS", unlocked: "Terbuka", coins: "koin", vip: "VIP", unlockAll: "Buka semua", allUnlocked: "Semua episode terbuka", trending: "Trending", episodesCount: "Episode", completed: "Selesai", inMyList: "Di Daftar Saya", myList: "Daftar Saya", linkCopied: "Tautan disalin!", copyFail: "Gagal menyalin tautan", share: "Bagikan", cast: "Pemeran", lead: "Utama", supporting: "Pendukung", reviews: "Ulasan", writeReview: "Tulis ulasan", yourRating: "Nilai Anda:", reviewPlaceholder: "Bagikan pendapatmu tentang drama ini...", cancel: "Batal", submitReview: "Kirim ulasan", noReviews: "Belum ada ulasan", likes: "suka", showLess: "Tampilkan lebih sedikit", showMoreReviews: "Tampilkan lebih banyak ulasan", moreLikeThis: "Mirip dengan ini" } };

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
  onPlaybackProgress,
  onPrevious,
  onNext,
  isVip,
  hasPrevious,
  hasNext }: {
  playerRef: React.RefObject<CloudflarePlayerHandle | null>;
  streamInfo: StreamPlaybackInfo | null;
  activeEpisode: Episode | null;
  drama: Drama;
  onPlaybackProgress?: (time: number, duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isVip: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const { state, actions, isFullscreen, toggleFullscreen } = usePlayerContext();
  const qualityMenuOptions = useMemo(() => getQualityMenuOptions(isVip), [isVip]);
  const [activeSubtitleLanguage, setActiveSubtitleLanguage] = useState<string | null>(null);

  useEffect(() => {
    const defaultQuality = resolveDefaultQuality(qualityMenuOptions);
    const isCurrentEnabled = qualityMenuOptions.some(
      (option) => option.value === state.quality && !option.disabled
    );
    if (!isCurrentEnabled) {
      actions.setQuality(defaultQuality);
    }
  }, [qualityMenuOptions, state.quality, actions]);

  useEffect(() => {
    const tracks = streamInfo?.subtitles || [];
    if (tracks.length === 0) {
      setActiveSubtitleLanguage(null);
      return;
    }
    setActiveSubtitleLanguage((prev) => {
      if (prev && tracks.some((track) => track.language === prev)) {
        return prev;
      }
      return tracks[0].language;
    });
  }, [streamInfo?.subtitles]);

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
  const handleSubtitleChange = useCallback((language: string | null) => {
    setActiveSubtitleLanguage(language);
  }, []);

  // Determine video source: prefer stream, fallback to direct URL
  const videoUrl = activeEpisode?.videoUrl || undefined;
  const playbackSource = resolvePlaybackSource(streamInfo, videoUrl);

  return (
    <>
      <CloudflarePlayer
        ref={playerRef as React.Ref<CloudflarePlayerHandle>}
        streamVideoId={streamInfo?.videoUid}
        signedToken={streamInfo?.signedToken}
        videoUrl={playbackSource}
        quality={state.quality}
        activeSubtitleLanguage={activeSubtitleLanguage}
        poster={activeEpisode?.thumbnail || drama.cover}
        subtitles={streamInfo?.subtitles}
        onEnded={onNext}
        onTimeUpdate={(time, duration) => {
          actions.setCurrentTime(time);
          actions.setDuration(duration);
          onPlaybackProgress?.(time, duration);
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
        subtitleTracks={streamInfo?.subtitles}
        activeSubtitleLanguage={activeSubtitleLanguage}
        onSubtitleChange={handleSubtitleChange}
        onToggleFullscreen={toggleFullscreen}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        qualityOptions={qualityMenuOptions}
        isFullscreen={isFullscreen}
        title={activeEpisode ? `Ep ${activeEpisode.episodeNumber} - ${activeEpisode.title}` : undefined}
      />
    </>
  );
}

function getEpisodeEffectiveUnlockPrice(episode: Episode, access?: EpisodeAccessResult): number {
  if (typeof access?.unlockPrice === "number" && Number.isFinite(access.unlockPrice)) {
    return access.unlockPrice;
  }
  return episode.unlockPrice;
}

function DramaDetailContent() {
  const locale = useLocale();
  const t = DRAMA_TEXT[locale] || DRAMA_TEXT.en;
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const dramaId = params.id as string;
  const playerRef = useRef<CloudflarePlayerHandle>(null) as React.RefObject<CloudflarePlayerHandle>;
  const lastProgressReportAtRef = useRef<number>(0);

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
  const [episodeAccessMap, setEpisodeAccessMap] = useState<Record<string, EpisodeAccessResult>>({});
  const unlockedEpisodeIdsKey = useMemo(
    () => Array.from(unlockedEpisodeIds).sort().join(","),
    [unlockedEpisodeIds]
  );

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
        toast(t.failedLoadDrama, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dramaId, searchParams, t.failedLoadDrama]);

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

  // Fetch effective access/price for locked episodes (VIP free quota / VIP discount)
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
      for (const [episodeId, access] of entries) {
        nextMap[episodeId] = access;
      }
      setEpisodeAccessMap(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, episodes, unlockedEpisodeIdsKey]);

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
        toast(t.signInUnlock, "info");
        router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      const access = episodeAccessMap[episode._id];
      const effectivePrice = getEpisodeEffectiveUnlockPrice(episode, access);
      let confirmMessage = `${t.unlockAll}: ${effectivePrice} ${t.coins}?`;
      if (access?.reason === "vip_monthly_free_available") {
        confirmMessage = `${t.unlockAll}: 0 ${t.coins}? (${t.vip} ${t.free})`;
      } else if (
        access?.reason === "vip_discount" &&
        typeof access.originalUnlockPrice === "number" &&
        access.originalUnlockPrice > effectivePrice
      ) {
        confirmMessage = `${t.unlockAll}: ${effectivePrice} ${t.coins}? (${t.vip} ${access.originalUnlockPrice} -> ${effectivePrice})`;
      }
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
      // Call unlock API (P1-19)
      try {
        const res = await coinsApi.unlock(token, episode._id);
        const unlockData = res?.data || res;
        toast(t.unlockSuccess, "success");
        await refreshUser();
        if ((unlockData?.unlockedCount || 1) > 1) {
          setUnlockedEpisodeIds((prev) => {
            const next = new Set(prev);
            episodes.filter((ep) => !ep.isFree).forEach((ep) => next.add(ep._id));
            return next;
          });
        } else {
          setUnlockedEpisodeIds((prev) => new Set(prev).add(episode._id));
        }
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : t.unlockFail, "error");
        return;
      }
    }
    setActiveEpisode(episode);
  }, [token, toast, router, refreshUser, episodes, unlockedEpisodeIds, episodeAccessMap, t.signInUnlock, t.unlockAll, t.coins, t.vip, t.free, t.unlockSuccess, t.unlockFail]);

  // Unlock all paid episodes
  const lockedEpisodes = episodes.filter(ep => !ep.isFree && !unlockedEpisodeIds.has(ep._id));
  const totalUnlockCost = lockedEpisodes.reduce(
    (sum, ep) => sum + getEpisodeEffectiveUnlockPrice(ep, episodeAccessMap[ep._id]),
    0
  );
  const originalTotalUnlockCost = lockedEpisodes.reduce((sum, ep) => sum + ep.unlockPrice, 0);
  const unlockAllDiscountCoins = Math.max(originalTotalUnlockCost - totalUnlockCost, 0);

  const handleUnlockAll = useCallback(async () => {
    if (!token) {
      toast(t.signInUnlock, "info");
      router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (lockedEpisodes.length === 0) {
      toast(t.unlockAllNone, "info");
      return;
    }

    let confirmMessage = `${t.unlockAll}: ${lockedEpisodes.length} ${t.episodes} (${totalUnlockCost} ${t.coins})?`;
    if (unlockAllDiscountCoins > 0) {
      confirmMessage += `\n${t.vip}: -${unlockAllDiscountCoins} ${t.coins}`;
    }
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setUnlockingAll(true);
    try {
      const res = await coinsApi.unlockAll(token, dramaId);
      const data = res?.data || res;
      toast(`${data.unlockedCount} ${t.unlockAllSuccessSuffix}`, "success");
      await refreshUser();
      // Mark all paid episodes as unlocked
      setUnlockedEpisodeIds(prev => {
        const next = new Set(prev);
        episodes.filter(ep => !ep.isFree).forEach(ep => next.add(ep._id));
        return next;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.unlockAllFail;
      if (message.includes("Insufficient")) {
        toast(t.insufficientCoins, "error");
      } else if (message.includes("already unlocked")) {
        toast(t.unlockAllNone, "info");
        // Mark all as unlocked since server says so
        setUnlockedEpisodeIds(prev => {
          const next = new Set(prev);
          episodes.filter(ep => !ep.isFree).forEach(ep => next.add(ep._id));
          return next;
        });
      } else {
        toast(message || t.unlockAllFail, "error");
      }
    } finally {
      setUnlockingAll(false);
    }
  }, [token, dramaId, lockedEpisodes.length, totalUnlockCost, unlockAllDiscountCoins, toast, router, refreshUser, t.signInUnlock, t.unlockAllNone, t.unlockAll, t.episodes, t.coins, t.vip, t.unlockAllSuccessSuffix, t.insufficientCoins, t.unlockAllFail]);

  // Fix favorite toggle logic (P0-05) + auth check (P1-18)
  const toggleFavorite = async () => {
    if (!token) {
      toast(t.signInFavorite, "info");
      router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    try {
      if (isFavorited) {
        await userApi.removeFavorite(token, dramaId);
        setIsFavorited(false);
        toast(t.removedFromList, "success");
      } else {
        await userApi.addFavorite(token, dramaId);
        setIsFavorited(true);
        toast(t.addedToList, "success");
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : t.updateFavoriteFail, "error");
    }
  };

  // Auth check for review (P1-18) + toast errors (P1-22)
  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewContent.trim()) return;
    if (!token) {
      toast(t.signInReview, "info");
      router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
      toast(t.reviewSubmitted, "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : t.reviewFail, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">{t.loading}</div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">{t.dramaNotFound}</div>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const primaryCategory = drama.categories?.[0] || '';

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
  const isVip = user?.role === 'admin' || user?.vipStatus === 'active';

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />

      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400">
            <Link href={localizePath('/', locale)} className="hover:text-white transition">{t.home}</Link>
            <span>/</span>
            {primaryCategory ? (
              <Link href={localizePath(`/category?category=${encodeURIComponent(primaryCategory)}`, locale)} className="hover:text-white transition">{primaryCategory}</Link>
            ) : (
              <span className="text-gray-500">{t.episodes}</span>
            )}
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
                onPlaybackProgress={(time, duration) => {
                    if (!token || !activeEpisode?._id) return;
                    if (!duration || duration <= 0) return;
                    const now = Date.now();
                    if (now - lastProgressReportAtRef.current < 5000) return;
                    lastProgressReportAtRef.current = now;
                    episodesApi.reportProgress(activeEpisode._id, token, time, duration).catch(() => {});
                  }}
                onPrevious={hasPrevious ? handlePreviousEpisode : undefined}
                onNext={hasNext ? handleNextEpisode : undefined}
                isVip={isVip}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
              />
              </PlayerRoot>
            </div>

            {/* Episodes Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="rounded-lg bg-[#1a1a1a] p-4 lg:h-[calc(56.25vw*0.5625)] lg:max-h-[480px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{t.episodes}</h3>
                  <span className="text-xs text-gray-400">{t.updatedToEp} {episodes.length}</span>
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
                          {t.episodes} {ep.episodeNumber}: {ep.title}
                        </p>
                        <p className="text-xs text-gray-400">{formatDuration(ep.duration)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {ep.isFree ? (
                          <span className="rounded bg-green-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">{t.free}</span>
                        ) : unlockedEpisodeIds.has(ep._id) ? (
                          <span className="rounded bg-green-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white flex items-center gap-0.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            {t.unlocked}
                          </span>
                        ) : episodeAccessMap[ep._id]?.reason === "vip_monthly_free_available" ? (
                          <span className="rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">{t.vip} {t.free}</span>
                        ) : getEpisodeEffectiveUnlockPrice(ep, episodeAccessMap[ep._id]) > 0 ? (
                          <span className="rounded bg-yellow-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {getEpisodeEffectiveUnlockPrice(ep, episodeAccessMap[ep._id])} {t.coins}
                          </span>
                        ) : (
                          <span className="rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">{t.vip}</span>
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
                        {unlockAllDiscountCoins > 0
                          ? `${t.unlockAll} (${originalTotalUnlockCost} -> ${totalUnlockCost} ${t.coins})`
                          : `${t.unlockAll} (${totalUnlockCost} ${t.coins})`}
                      </>
                    )}
                  </button>
                ) : episodes.some(ep => !ep.isFree && unlockedEpisodeIds.has(ep._id)) ? (
                  <div className="mt-3 w-full rounded-lg bg-green-600/20 border border-green-600/30 py-2.5 text-sm font-medium text-green-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.allUnlocked}
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
              <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wide">{t.trending}</span>
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
            <span>{drama.totalEpisodes || episodes.length} {t.episodesCount}</span>
            {resolveDramaMode(drama) === "completed" && <span className="text-green-400">{t.completed}</span>}
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{drama.description}</p>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {drama.categories?.map((cat) => (
              <Link
                key={cat}
                href={localizePath(`/category?category=${encodeURIComponent(cat)}`, locale)}
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
              {isFavorited ? t.inMyList : `+ ${t.myList}`}
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).then(
                  () => toast(t.linkCopied, "success"),
                  () => toast(t.copyFail, "error")
                );
              }}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {t.share}
            </button>
          </div>
        </div>

        {/* Cast Section */}
        {drama.actors && drama.actors.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 mt-10">
            <h2 className="text-xl font-semibold text-white mb-4">{t.cast}</h2>
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
                  <p className="text-xs text-gray-400">{i === 0 ? t.lead : t.supporting}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mx-auto max-w-7xl px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {t.reviews} {reviewTotal > 0 && <span className="text-gray-400 text-base font-normal">({reviewTotal})</span>}
            </h2>
            <button
              onClick={() => {
                if (!token) {
                  toast(t.signInReview, "info");
                  router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              {t.writeReview}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 rounded-lg bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-300">{t.yourRating}</span>
                <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder={t.reviewPlaceholder}
                className="w-full rounded-lg bg-[#222] p-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-red-600 resize-none"
                rows={3}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewContent(""); }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || !reviewContent.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.submitReview}
                </button>
              </div>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-gray-400">{t.noReviews}</div>
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
                          {review.likes} {t.likes}
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
                  {showAllReviews ? t.showLess : `${t.showMoreReviews} (${reviews.length - 3})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* More Like This */}
        {relatedDramas.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 mt-10 pb-12">
            <h2 className="text-xl font-semibold text-white mb-4">{t.moreLikeThis}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {relatedDramas.map((d) => (
                <DramaCard
                  key={d._id}
                  drama={d}
                  onClick={() => router.push(localizePath(`/drama/${d._id}`, locale))}
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
        <div className="text-white">{DRAMA_TEXT.en.loading}</div>
      </div>
    }>
      <DramaDetailContent />
    </Suspense>
  );
}
