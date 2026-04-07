"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Lock, Play, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/features/Footer";
import { Navbar } from "@/components/features/Navbar";
import type {
  ContinueWatchingEntry,
  PublicCreatorProfilePayload,
} from "@/lib/api";
import { dramasApi, publicCreatorApi, userApi } from "@/lib/api";
import { copyText } from "@/lib/capacitor-bridge";
import { useAuth } from "@/lib/authContext";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { resolveSafeImageUrl } from "@/lib/safe-image";
import { resolveDramaMode } from "@/lib/utils";
import type { Drama, Episode } from "@/types";
import { useToast } from "@/components/ui/Toast";

const CREATOR_PROFILE_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    creatorProfile: "Creator Profile",
    loading: "Loading creator profile...",
    unavailable: "Creator profile is unavailable right now.",
    originalSeries: "Original Series",
    watchNow: "Watch Now",
    continueWatching: "Continue Watching",
    series: "Series",
    episodes: "Episodes",
    views: "Views",
    follow: "Follow",
    following: "Following",
    share: "Share",
    featured: "Featured Release",
    ongoing: "ONGOING",
    completed: "COMPLETED",
    upNext: "Up next",
    premium: "Premium",
    free: "Free",
    watchedSuffix: "watched",
    noEpisodes: "Episode lineup will appear after publishing.",
    backToBrowse: "Back to Browse",
    shareSuccess: "Creator profile link copied.",
    shareError: "Unable to copy profile link.",
    followSaved: "Creator saved to your local follows.",
    followRemoved: "Creator removed from your local follows.",
    dramaFallback: "Drama",
    noSeries: "No published series yet.",
  },
  zh: {
    creatorProfile: "创作者主页",
    loading: "正在加载创作者主页...",
    unavailable: "创作者主页暂时不可用。",
    originalSeries: "原创短剧",
    watchNow: "立即观看",
    continueWatching: "继续观看",
    series: "作品",
    episodes: "集数",
    views: "播放",
    follow: "关注",
    following: "已关注",
    share: "分享",
    featured: "主推作品",
    ongoing: "连载中",
    completed: "已完结",
    upNext: "下一集",
    premium: "付费",
    free: "免费",
    watchedSuffix: "已观看",
    noEpisodes: "作品发布后会显示分集列表。",
    backToBrowse: "返回浏览",
    shareSuccess: "已复制创作者主页链接。",
    shareError: "复制链接失败。",
    followSaved: "已加入本地关注列表。",
    followRemoved: "已从本地关注列表移除。",
    dramaFallback: "短剧",
    noSeries: "暂时还没有已发布作品。",
  },
  ja: {
    creatorProfile: "クリエイタープロフィール",
    loading: "プロフィールを読み込み中...",
    unavailable: "クリエイタープロフィールを表示できません。",
    originalSeries: "オリジナル作品",
    watchNow: "今すぐ見る",
    continueWatching: "続きを見る",
    series: "作品数",
    episodes: "話数",
    views: "再生数",
    follow: "フォロー",
    following: "フォロー中",
    share: "共有",
    featured: "注目作品",
    ongoing: "配信中",
    completed: "完結",
    upNext: "次の話",
    premium: "有料",
    free: "無料",
    watchedSuffix: "視聴済み",
    noEpisodes: "エピソードは公開後に表示されます。",
    backToBrowse: "閲覧へ戻る",
    shareSuccess: "プロフィールリンクをコピーしました。",
    shareError: "リンクをコピーできませんでした。",
    followSaved: "ローカルフォローに保存しました。",
    followRemoved: "ローカルフォローから削除しました。",
    dramaFallback: "ドラマ",
    noSeries: "公開済み作品はまだありません。",
  },
  es: {
    creatorProfile: "Perfil del creador",
    loading: "Cargando perfil del creador...",
    unavailable: "El perfil del creador no está disponible.",
    originalSeries: "Series originales",
    watchNow: "Ver ahora",
    continueWatching: "Seguir viendo",
    series: "Series",
    episodes: "Episodios",
    views: "Vistas",
    follow: "Seguir",
    following: "Siguiendo",
    share: "Compartir",
    featured: "Estreno destacado",
    ongoing: "EN CURSO",
    completed: "FINALIZADA",
    upNext: "Siguiente",
    premium: "Premium",
    free: "Gratis",
    watchedSuffix: "visto",
    noEpisodes: "Los episodios aparecerán después de la publicación.",
    backToBrowse: "Volver a explorar",
    shareSuccess: "Enlace copiado.",
    shareError: "No se pudo copiar el enlace.",
    followSaved: "Guardado en tus seguimientos locales.",
    followRemoved: "Eliminado de tus seguimientos locales.",
    dramaFallback: "Drama",
    noSeries: "Aún no hay series publicadas.",
  },
  pt: {
    creatorProfile: "Perfil do criador",
    loading: "Carregando perfil do criador...",
    unavailable: "O perfil do criador está indisponível.",
    originalSeries: "Séries originais",
    watchNow: "Assistir agora",
    continueWatching: "Continuar assistindo",
    series: "Séries",
    episodes: "Episódios",
    views: "Views",
    follow: "Seguir",
    following: "Seguindo",
    share: "Compartilhar",
    featured: "Lançamento em destaque",
    ongoing: "EM EXIBIÇÃO",
    completed: "CONCLUÍDA",
    upNext: "Próximo",
    premium: "Premium",
    free: "Grátis",
    watchedSuffix: "assistido",
    noEpisodes: "Os episódios aparecerão depois da publicação.",
    backToBrowse: "Voltar para explorar",
    shareSuccess: "Link copiado.",
    shareError: "Não foi possível copiar o link.",
    followSaved: "Salvo nos seus follows locais.",
    followRemoved: "Removido dos seus follows locais.",
    dramaFallback: "Drama",
    noSeries: "Ainda não há séries publicadas.",
  },
  hi: {
    creatorProfile: "क्रिएटर प्रोफाइल",
    loading: "क्रिएटर प्रोफाइल लोड हो रही है...",
    unavailable: "क्रिएटर प्रोफाइल अभी उपलब्ध नहीं है।",
    originalSeries: "ओरिजिनल सीरीज़",
    watchNow: "अभी देखें",
    continueWatching: "देखना जारी रखें",
    series: "सीरीज़",
    episodes: "एपिसोड",
    views: "व्यूज़",
    follow: "फॉलो",
    following: "फॉलो कर रहे हैं",
    share: "शेयर",
    featured: "फ़ीचर्ड रिलीज़",
    ongoing: "जारी",
    completed: "पूर्ण",
    upNext: "अगला",
    premium: "प्रीमियम",
    free: "फ्री",
    watchedSuffix: "देखा गया",
    noEpisodes: "पब्लिश होने के बाद एपिसोड दिखेंगे।",
    backToBrowse: "ब्राउज़ पर वापस जाएँ",
    shareSuccess: "प्रोफाइल लिंक कॉपी हो गया।",
    shareError: "लिंक कॉपी नहीं हो सका।",
    followSaved: "लोकल फॉलो लिस्ट में सेव किया गया।",
    followRemoved: "लोकल फॉलो लिस्ट से हटाया गया।",
    dramaFallback: "ड्रामा",
    noSeries: "अभी कोई प्रकाशित सीरीज़ नहीं है।",
  },
  id: {
    creatorProfile: "Profil kreator",
    loading: "Memuat profil kreator...",
    unavailable: "Profil kreator sedang tidak tersedia.",
    originalSeries: "Serial original",
    watchNow: "Tonton sekarang",
    continueWatching: "Lanjut menonton",
    series: "Serial",
    episodes: "Episode",
    views: "Penayangan",
    follow: "Ikuti",
    following: "Mengikuti",
    share: "Bagikan",
    featured: "Rilisan unggulan",
    ongoing: "BERJALAN",
    completed: "SELESAI",
    upNext: "Berikutnya",
    premium: "Premium",
    free: "Gratis",
    watchedSuffix: "ditonton",
    noEpisodes: "Daftar episode akan muncul setelah dipublikasikan.",
    backToBrowse: "Kembali ke jelajah",
    shareSuccess: "Tautan profil disalin.",
    shareError: "Gagal menyalin tautan profil.",
    followSaved: "Disimpan ke daftar ikuti lokal.",
    followRemoved: "Dihapus dari daftar ikuti lokal.",
    dramaFallback: "Drama",
    noSeries: "Belum ada serial yang dipublikasikan.",
  },
};

const FOLLOW_STORAGE_KEY_PREFIX = "tinytale:creator-follow:";

function extractDramaDetail(payload: unknown): Drama | null {
  const data = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const resolved = (data.data && typeof data.data === "object" ? data.data : data) as Record<string, unknown>;
  const drama = (resolved.drama && typeof resolved.drama === "object" ? resolved.drama : resolved) as Drama | null;
  return drama && typeof drama === "object" && drama._id ? drama : null;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
  }).format(Math.max(0, value || 0));
}

function formatCreatorHandle(nickname: string) {
  const normalized = nickname
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return `@${normalized || "creator"}`;
}

function buildCreatorSummary(profile: PublicCreatorProfilePayload["creator"]) {
  const bio = profile.bio.trim();
  if (bio) return bio;

  const tags = [profile.genreFocus, profile.primaryLanguage]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `#${item.replace(/\s+/g, "")}`);

  return tags.length
    ? `Creating vertical drama stories with a focus on ${tags.join(" ")}`
    : "Explore the creator's latest original vertical dramas and featured releases.";
}

function getEpisodeWindow(episodes: Episode[], activeEpisodeId: string | null) {
  if (episodes.length <= 4) return episodes;
  const activeIndex = activeEpisodeId
    ? episodes.findIndex((episode) => episode._id === activeEpisodeId)
    : -1;

  const startIndex = activeIndex >= 0
    ? Math.max(0, Math.min(activeIndex, episodes.length - 4))
    : 0;

  return episodes.slice(startIndex, startIndex + 4);
}

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { isMobile } = usePlatform();
  const { token } = useAuth();
  const { toast } = useToast();
  const creatorId = String(params?.id || "");
  const t = resolveLocaleCopy(CREATOR_PROFILE_TEXT, locale);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicCreatorProfilePayload | null>(null);
  const [featuredDramaDetail, setFeaturedDramaDetail] = useState<Drama | null>(null);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !creatorId) return;
    setIsFollowing(window.localStorage.getItem(`${FOLLOW_STORAGE_KEY_PREFIX}${creatorId}`) === "1");
  }, [creatorId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const creatorResponse = await publicCreatorApi.getProfile(creatorId);
        const nextProfile = creatorResponse.data;
        const featuredDrama = nextProfile.featuredDrama || nextProfile.dramas[0] || null;

        const [featuredDramaResponse, continueResponse] = await Promise.all([
          featuredDrama ? dramasApi.getById(featuredDrama._id).catch(() => null) : Promise.resolve(null),
          token ? userApi.getContinueWatching(token, 24).catch(() => null) : Promise.resolve(null),
        ]);

        const creatorDramaIds = new Set(nextProfile.dramas.map((item) => item._id));
        const nextContinue = (continueResponse?.data || []).filter((item) => creatorDramaIds.has(item.dramaId));

        if (!cancelled) {
          setProfile(nextProfile);
          setFeaturedDramaDetail(extractDramaDetail(featuredDramaResponse) || featuredDrama);
          setContinueWatching(nextContinue);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t.unavailable);
          setProfile(null);
          setFeaturedDramaDetail(null);
          setContinueWatching([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (creatorId) {
      void loadProfile();
    } else {
      setLoading(false);
      setError(t.unavailable);
    }

    return () => {
      cancelled = true;
    };
  }, [creatorId, t.unavailable, token]);

  const featuredDrama = featuredDramaDetail || profile?.featuredDrama || profile?.dramas[0] || null;
  const creator = profile?.creator || null;
  const creatorSummary = creator ? buildCreatorSummary(creator) : "";
  const creatorHandle = creator ? formatCreatorHandle(creator.nickname) : "@creator";
  const creatorAvatar = resolveSafeImageUrl(creator?.avatar || featuredDrama?.cover);

  const featuredEpisodes = useMemo(() => {
    const episodes = Array.isArray(featuredDramaDetail?.episodes)
      ? [...featuredDramaDetail.episodes]
      : [];
    return episodes.sort((left, right) => left.episodeNumber - right.episodeNumber);
  }, [featuredDramaDetail?.episodes]);

  const featuredContinueItem = useMemo(() => {
    if (!featuredDrama) return null;
    return continueWatching.find((item) => item.dramaId === featuredDrama._id) || null;
  }, [continueWatching, featuredDrama]);

  const episodeWindow = useMemo(
    () => getEpisodeWindow(featuredEpisodes, featuredContinueItem?.episodeId || null),
    [featuredContinueItem?.episodeId, featuredEpisodes]
  );

  const galleryDramas = useMemo(() => {
    if (!profile?.dramas.length) return [];
    const filtered = profile.dramas.filter((item) => item._id !== featuredDrama?._id);
    const selected = filtered.length > 0 ? filtered : profile.dramas.slice(0, 3);
    return selected.slice(0, isMobile ? 3 : 6);
  }, [featuredDrama?._id, isMobile, profile?.dramas]);

  const handleToggleFollow = () => {
    const nextValue = !isFollowing;
    setIsFollowing(nextValue);

    if (typeof window !== "undefined") {
      const storageKey = `${FOLLOW_STORAGE_KEY_PREFIX}${creatorId}`;
      if (nextValue) {
        window.localStorage.setItem(storageKey, "1");
      } else {
        window.localStorage.removeItem(storageKey);
      }
    }

    toast(nextValue ? t.followSaved : t.followRemoved, "success");
  };

  const handleShare = async () => {
    try {
      if (typeof window === "undefined") return;
      await copyText(window.location.href);
      toast(t.shareSuccess, "success");
    } catch {
      toast(t.shareError, "error");
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1115] text-white">
      <Navbar forceBackButton mobileTitle={t.creatorProfile} />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        {loading ? (
          <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center rounded-[28px] border border-white/8 bg-[#15181e]/72 px-6 text-center text-sm text-white/68 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
            {t.loading}
          </div>
        ) : error || !profile || !creator ? (
          <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center rounded-[28px] border border-white/8 bg-[#15181e]/72 px-6 text-center shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
            <p className="text-base font-semibold text-white">{t.unavailable}</p>
            <p className="mt-2 text-sm text-white/58">{error || t.noSeries}</p>
            <Link
              href={localizePath("/browse", locale)}
              className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#ff3b5c] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,59,92,0.28)]"
            >
              {t.backToBrowse}
            </Link>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col lg:max-w-none">
            <section className="rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,59,92,0.14),rgba(255,59,92,0)_32%),linear-gradient(180deg,rgba(21,24,30,0.96),rgba(15,17,21,0.98))] px-4 pb-6 pt-2 shadow-[0_18px_60px_rgba(0,0,0,0.32)] ring-1 ring-white/6 sm:px-6 lg:px-10 lg:pb-10">
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={handleShare}
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/76 transition hover:bg-white/10"
                  aria-label={t.share}
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <div className="relative mt-2">
                  <div className="h-28 w-28 rounded-full border-[3px] border-[#ff3b5c] p-1 shadow-[0_0_24px_rgba(255,59,92,0.32)]">
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-[#1a1d23]">
                      <Image
                        src={creatorAvatar}
                        alt={creator.nickname}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-0 rounded-full bg-[#ffd84d] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#121316] shadow-lg">
                    Pro
                  </div>
                </div>

                <h1 className="mt-4 text-[1.75rem] font-black tracking-[-0.03em] text-white">
                  {creatorHandle}
                </h1>
                <p className="mt-3 max-w-[28rem] text-sm leading-6 text-white/66">
                  {creatorSummary}
                </p>

                <div className="mt-6 flex items-center justify-center gap-6 sm:gap-8">
                  <div className="min-w-[64px] text-center">
                    <div className="text-lg font-bold text-white">{profile.stats.publishedSeries}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                      {t.series}
                    </div>
                  </div>
                  <div className="h-9 w-px bg-white/10" />
                  <div className="min-w-[64px] text-center">
                    <div className="text-lg font-bold text-white">{profile.stats.totalEpisodes}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                      {t.episodes}
                    </div>
                  </div>
                  <div className="h-9 w-px bg-white/10" />
                  <div className="min-w-[64px] text-center">
                    <div className="text-lg font-bold text-white">{formatCompactNumber(profile.stats.totalViews)}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                      {t.views}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex w-full max-w-sm items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#ff3b5c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,59,92,0.32)] transition active:scale-[0.98]"
                  >
                    {isFollowing ? <Check className="h-4 w-4" /> : null}
                    <span>{isFollowing ? t.following : t.follow}</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between px-1">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-white">{t.originalSeries}</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/36">{t.featured}</span>
              </div>

              {featuredDrama ? (
                <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#15181e] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                  <div className="relative h-[290px] overflow-hidden sm:h-[340px]">
                    <Image
                      src={resolveSafeImageUrl(featuredDrama.cover)}
                      alt={featuredDrama.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.05),rgba(15,17,21,0.2)_24%,rgba(15,17,21,0.86)_100%)]" />

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded bg-[#ff3b5c]/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                          {resolveDramaMode(featuredDrama) === "completed" ? t.completed : t.ongoing}
                        </span>
                        <span className="rounded bg-black/35 px-2 py-1 text-[10px] font-bold text-white/86 backdrop-blur-md">
                          {featuredDrama.rating ? featuredDrama.rating.toFixed(1) : "4.8"}
                        </span>
                      </div>

                      <h3 className="text-[1.7rem] font-black leading-tight tracking-[-0.03em] text-white">
                        {featuredDrama.title}
                      </h3>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/70">
                          <span>{formatCompactNumber(Number(featuredDrama.viewCount || 0))} {t.views}</span>
                          <span>{featuredDrama.totalEpisodes || featuredEpisodes.length || 0} {t.episodes}</span>
                        </div>

                        <Link
                          href={localizePath(`/drama/${featuredDrama._id}`, locale)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition active:scale-[0.96]"
                          aria-label={t.watchNow}
                        >
                          <Play className="h-5 w-5 fill-current" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1d23]/86 px-5 py-5 backdrop-blur-xl sm:px-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/42">
                        {t.continueWatching}
                      </span>
                      <span className="text-xs font-bold text-[#ff5a77]">
                        {featuredContinueItem?.episode
                          ? `Episode ${featuredContinueItem.episode.episodeNumber}`
                          : `${featuredDrama.totalEpisodes || featuredEpisodes.length || 0} ${t.episodes}`}
                      </span>
                    </div>

                    {episodeWindow.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-1">
                        {episodeWindow.map((episode, index) => {
                          const progress = featuredContinueItem?.episodeId === episode._id
                            ? Math.max(0, Math.min(100, Number(featuredContinueItem.progress || 0)))
                            : 0;
                          const isActive = featuredContinueItem?.episodeId === episode._id;
                          const isPremium = !episode.isFree;

                          let metaText = isActive
                            ? `${progress}% ${t.watchedSuffix}`
                            : index === 1 && featuredContinueItem
                              ? t.upNext
                              : isPremium
                                ? t.premium
                                : t.free;

                          if (!featuredContinueItem && index === 0) {
                            metaText = t.watchNow;
                          }

                          return (
                            <Link
                              key={episode._id}
                              href={localizePath(`/drama/${featuredDrama._id}/play/${episode._id}`, locale)}
                              className="w-28 shrink-0"
                            >
                              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-[16px] border border-white/10 bg-[#111318]">
                                <Image
                                  src={resolveSafeImageUrl(episode.thumbnail || featuredDrama.cover)}
                                  alt={episode.title}
                                  fill
                                  className={`object-cover ${isPremium && !isActive ? "grayscale" : ""}`}
                                  sizes="112px"
                                />
                                <div className={`absolute inset-0 ${isActive ? "bg-black/28" : "bg-black/38"}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-[#ff3b5c] text-white" : "bg-black/50 text-white/75"}`}>
                                    {isPremium && !isActive ? (
                                      <Lock className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4 fill-current" />
                                    )}
                                  </div>
                                </div>
                                {isActive ? (
                                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/16">
                                    <div className="h-full bg-[#ff3b5c]" style={{ width: `${progress}%` }} />
                                  </div>
                                ) : null}
                              </div>
                              <p className="truncate text-[11px] font-bold text-white">
                                {`EP ${episode.episodeNumber}: ${episode.title}`}
                              </p>
                              <p className="mt-1 text-[10px] text-white/48">{metaText}</p>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/52">
                        {t.noEpisodes}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-[#15181e] px-5 py-8 text-center text-sm text-white/56">
                  {t.noSeries}
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                {galleryDramas.map((drama) => (
                  <Link
                    key={drama._id}
                    href={localizePath(`/drama/${drama._id}`, locale)}
                    className="group"
                  >
                    <div className="relative mb-2 aspect-[10/14] overflow-hidden rounded-[16px] border border-white/8 bg-[#15181e]">
                      <Image
                        src={resolveSafeImageUrl(drama.cover)}
                        alt={drama.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 33vw, 180px"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.85)_100%)]" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-black text-white">
                        <Play className="h-3 w-3 fill-current" />
                        <span>{formatCompactNumber(Number(drama.viewCount || 0))}</span>
                      </div>
                    </div>
                    <p className="line-clamp-1 text-center text-[11px] font-bold text-white">
                      {drama.title || t.dramaFallback}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {!isMobile ? <Footer /> : null}
    </main>
  );
}
