"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Footer } from "@/components/features/Footer";
import { Navbar } from "@/components/features/Navbar";
import { useToast } from "@/components/ui/Toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { dramasApi, userApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { isNativeApp } from "@/lib/capacitor-bridge";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { resolveDramaMode } from "@/lib/utils";
import { readViewCache, writeViewCache } from "@/lib/view-cache";
import { Drama } from "@/types";

type SortOption = "newest" | "oldest" | "title-az" | "title-za";

type FavoriteEntry = {
  drama: Drama;
  favoriteId?: string;
  savedAt?: string;
  updatedAt?: string;
};

type FavoritesViewCache = {
  favorites: FavoriteEntry[];
};

type FavoritesCopy = {
  title: string;
  savedTitles: string;
  loading: string;
  sortNewest: string;
  sortOldest: string;
  sortAz: string;
  sortZa: string;
  removed: string;
  restored: string;
  restoreFailed: string;
  removeTitle: string;
  defaultCategory: string;
  epsShort: string;
  loadMore: string;
  loadMoreTitles: string;
  emptyTitle: string;
  emptyDesc: string;
  browseDramas: string;
  vip: string;
  curated: string;
  search: string;
  statusHot: string;
  statusOngoing: string;
  statusNew: string;
  statusCompleted: string;
  statusPremium: string;
  timeToday: string;
  timeDaysAgo: (days: number) => string;
  timeWeeksAgo: (weeks: number) => string;
  timeMonthsAgo: (months: number) => string;
};

const COPY: FlexibleRecord<SupportedLocale, FavoritesCopy> = {
  en: {
    title: "My Watchlist",
    savedTitles: "titles saved",
    loading: "Loading",
    sortNewest: "Date Added (Newest)",
    sortOldest: "Date Added (Oldest)",
    sortAz: "Title (A-Z)",
    sortZa: "Title (Z-A)",
    removed: "Removed from favorites",
    restored: "Restored to favorites",
    restoreFailed: "Failed to restore favorite",
    removeTitle: "Remove from watchlist",
    defaultCategory: "Drama",
    epsShort: "eps",
    loadMore: "Load More",
    loadMoreTitles: "Load More Titles",
    emptyTitle: "No Favorites Yet",
    emptyDesc: "Start adding dramas to your watchlist to see them here",
    browseDramas: "Browse Dramas",
    vip: "VIP",
    curated: "CURATED",
    search: "Search",
    statusHot: "HOT",
    statusOngoing: "ONGOING",
    statusNew: "NEW",
    statusCompleted: "COMPLETED",
    statusPremium: "PREMIUM",
    timeToday: "Today",
    timeDaysAgo: (days) => `${days}d ago`,
    timeWeeksAgo: (weeks) => `${weeks}w ago`,
    timeMonthsAgo: (months) => `${months}mo ago`,
  },
  zh: {
    title: "我的片单",
    savedTitles: "个已收藏",
    loading: "加载中",
    sortNewest: "加入时间（最新）",
    sortOldest: "加入时间（最早）",
    sortAz: "标题（A-Z）",
    sortZa: "标题（Z-A）",
    removed: "已从收藏中移除",
    restored: "已恢复到收藏",
    restoreFailed: "恢复收藏失败",
    removeTitle: "从片单移除",
    defaultCategory: "短剧",
    epsShort: "集",
    loadMore: "加载更多",
    loadMoreTitles: "加载更多片单",
    emptyTitle: "还没有收藏",
    emptyDesc: "去添加你喜欢的短剧吧",
    browseDramas: "浏览短剧",
    vip: "VIP",
    curated: "精选",
    search: "搜索",
    statusHot: "热门",
    statusOngoing: "连载中",
    statusNew: "新上架",
    statusCompleted: "已完结",
    statusPremium: "会员精选",
    timeToday: "今天",
    timeDaysAgo: (days) => `${days}天前`,
    timeWeeksAgo: (weeks) => `${weeks}周前`,
    timeMonthsAgo: (months) => `${months}个月前`,
  },
  ja: {
    title: "マイリスト",
    savedTitles: "件を保存",
    loading: "読み込み中",
    sortNewest: "追加日（新しい順）",
    sortOldest: "追加日（古い順）",
    sortAz: "タイトル（A-Z）",
    sortZa: "タイトル（Z-A）",
    removed: "お気に入りから削除しました",
    restored: "お気に入りに戻しました",
    restoreFailed: "復元に失敗しました",
    removeTitle: "ウォッチリストから削除",
    defaultCategory: "ドラマ",
    epsShort: "話",
    loadMore: "もっと見る",
    loadMoreTitles: "作品をもっと見る",
    emptyTitle: "お気に入りはまだありません",
    emptyDesc: "ドラマを追加するとここに表示されます",
    browseDramas: "ドラマを探す",
    vip: "VIP",
    curated: "CURATED",
    search: "検索",
    statusHot: "人気",
    statusOngoing: "配信中",
    statusNew: "新着",
    statusCompleted: "完結",
    statusPremium: "プレミアム",
    timeToday: "今日",
    timeDaysAgo: (days) => `${days}日前`,
    timeWeeksAgo: (weeks) => `${weeks}週間前`,
    timeMonthsAgo: (months) => `${months}か月前`,
  },
  es: {
    title: "Mi Lista",
    savedTitles: "títulos guardados",
    loading: "Cargando",
    sortNewest: "Fecha agregada (Más reciente)",
    sortOldest: "Fecha agregada (Más antigua)",
    sortAz: "Título (A-Z)",
    sortZa: "Título (Z-A)",
    removed: "Eliminado de favoritos",
    restored: "Restaurado en favoritos",
    restoreFailed: "No se pudo restaurar",
    removeTitle: "Quitar de mi lista",
    defaultCategory: "Drama",
    epsShort: "epis",
    loadMore: "Cargar más",
    loadMoreTitles: "Cargar más títulos",
    emptyTitle: "Aún no tienes favoritos",
    emptyDesc: "Agrega dramas para verlos aquí",
    browseDramas: "Explorar dramas",
    vip: "VIP",
    curated: "CURATED",
    search: "Buscar",
    statusHot: "HOT",
    statusOngoing: "EN EMISIÓN",
    statusNew: "NUEVO",
    statusCompleted: "COMPLETADO",
    statusPremium: "PREMIUM",
    timeToday: "Hoy",
    timeDaysAgo: (days) => `hace ${days} d`,
    timeWeeksAgo: (weeks) => `hace ${weeks} sem`,
    timeMonthsAgo: (months) => `hace ${months} mes`,
  },
  pt: {
    title: "Minha Lista",
    savedTitles: "títulos salvos",
    loading: "Carregando",
    sortNewest: "Data adicionada (Mais recente)",
    sortOldest: "Data adicionada (Mais antiga)",
    sortAz: "Título (A-Z)",
    sortZa: "Título (Z-A)",
    removed: "Removido dos favoritos",
    restored: "Restaurado aos favoritos",
    restoreFailed: "Falha ao restaurar",
    removeTitle: "Remover da lista",
    defaultCategory: "Drama",
    epsShort: "eps",
    loadMore: "Carregar mais",
    loadMoreTitles: "Carregar mais títulos",
    emptyTitle: "Sem favoritos ainda",
    emptyDesc: "Adicione dramas para ver aqui",
    browseDramas: "Explorar dramas",
    vip: "VIP",
    curated: "CURATED",
    search: "Buscar",
    statusHot: "HOT",
    statusOngoing: "EM EXIBIÇÃO",
    statusNew: "NOVO",
    statusCompleted: "CONCLUÍDO",
    statusPremium: "PREMIUM",
    timeToday: "Hoje",
    timeDaysAgo: (days) => `há ${days}d`,
    timeWeeksAgo: (weeks) => `há ${weeks} sem`,
    timeMonthsAgo: (months) => `há ${months} meses`,
  },
  hi: {
    title: "मेरी वॉचलिस्ट",
    savedTitles: "टाइटल सेव किए गए",
    loading: "लोड हो रहा है",
    sortNewest: "जोड़ा गया (नया)",
    sortOldest: "जोड़ा गया (पुराना)",
    sortAz: "शीर्षक (A-Z)",
    sortZa: "शीर्षक (Z-A)",
    removed: "फेवरेट से हटाया गया",
    restored: "फेवरेट में वापस जोड़ा गया",
    restoreFailed: "वापस जोड़ना विफल",
    removeTitle: "वॉचलिस्ट से हटाएँ",
    defaultCategory: "ड्रामा",
    epsShort: "एपि",
    loadMore: "और लोड करें",
    loadMoreTitles: "और टाइटल लोड करें",
    emptyTitle: "अभी कोई फेवरेट नहीं",
    emptyDesc: "ड्रामा जोड़ें, यहाँ दिखेंगे",
    browseDramas: "ड्रामा ब्राउज़ करें",
    vip: "VIP",
    curated: "क्यूरेटेड",
    search: "खोजें",
    statusHot: "हॉट",
    statusOngoing: "जारी",
    statusNew: "नया",
    statusCompleted: "पूर्ण",
    statusPremium: "प्रीमियम",
    timeToday: "आज",
    timeDaysAgo: (days) => `${days} दिन पहले`,
    timeWeeksAgo: (weeks) => `${weeks} हफ्ते पहले`,
    timeMonthsAgo: (months) => `${months} महीने पहले`,
  },
  id: {
    title: "Daftar Tonton Saya",
    savedTitles: "judul disimpan",
    loading: "Memuat",
    sortNewest: "Tanggal ditambah (Terbaru)",
    sortOldest: "Tanggal ditambah (Terlama)",
    sortAz: "Judul (A-Z)",
    sortZa: "Judul (Z-A)",
    removed: "Dihapus dari favorit",
    restored: "Dipulihkan ke favorit",
    restoreFailed: "Gagal memulihkan favorit",
    removeTitle: "Hapus dari daftar tonton",
    defaultCategory: "Drama",
    epsShort: "eps",
    loadMore: "Muat lebih banyak",
    loadMoreTitles: "Muat lebih banyak judul",
    emptyTitle: "Belum ada favorit",
    emptyDesc: "Tambahkan drama ke daftar tontonmu",
    browseDramas: "Jelajahi drama",
    vip: "VIP",
    curated: "CURATED",
    search: "Cari",
    statusHot: "HOT",
    statusOngoing: "BERLANJUT",
    statusNew: "BARU",
    statusCompleted: "SELESAI",
    statusPremium: "PREMIUM",
    timeToday: "Hari ini",
    timeDaysAgo: (days) => `${days}h lalu`,
    timeWeeksAgo: (weeks) => `${weeks}mgg lalu`,
    timeMonthsAgo: (months) => `${months}bln lalu`,
  },
};

const FAVORITES_VIEW_CACHE_MAX_AGE_MS = 1000 * 60 * 15;
const FAVORITES_ACTIVE_PATH = "/user/favorites";

function isDramaCandidate(value: unknown): value is Drama {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Drama>;
  return typeof candidate._id === "string" && typeof candidate.title === "string" && typeof candidate.cover === "string";
}

function extractFavoriteSource(payload: unknown): unknown[] {
  const data = (payload as { data?: unknown })?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray((data as { favorites?: unknown[] })?.favorites)) return (data as { favorites: unknown[] }).favorites;
  if (Array.isArray((data as { items?: unknown[] })?.items)) return (data as { items: unknown[] }).items;
  if (Array.isArray((data as { dramas?: unknown[] })?.dramas)) return (data as { dramas: unknown[] }).dramas;

  return [];
}

function normalizeFavoriteEntries(payload: unknown): FavoriteEntry[] {
  const rawItems = extractFavoriteSource(payload);
  const deduped = new Map<string, FavoriteEntry>();

  rawItems.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const record = item as {
      _id?: string;
      drama?: unknown;
      dramaId?: unknown;
      createdAt?: string;
      updatedAt?: string;
    };

    const drama =
      (isDramaCandidate(record.dramaId) ? record.dramaId : null) ||
      (isDramaCandidate(record.drama) ? record.drama : null) ||
      (isDramaCandidate(record) ? record : null);

    if (!drama) return;

    deduped.set(drama._id, {
      favoriteId: typeof record._id === "string" ? record._id : undefined,
      drama,
      savedAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    });
  });

  return Array.from(deduped.values());
}

function extractFavoriteDramaIds(payload: unknown): string[] {
  const rawItems = extractFavoriteSource(payload);
  const ids = new Set<string>();

  rawItems.forEach((item) => {
    if (typeof item === "string") {
      ids.add(item);
      return;
    }

    if (!item || typeof item !== "object") return;

    const record = item as { dramaId?: unknown };
    if (typeof record.dramaId === "string") {
      ids.add(record.dramaId);
    }
  });

  return Array.from(ids);
}

function getEntryTimestamp(entry: FavoriteEntry) {
  return entry.savedAt || entry.updatedAt || entry.drama.createdAt || "";
}

function getStatusBadge(drama: Drama, t: FavoritesCopy) {
  const mode = resolveDramaMode(drama);

  if (mode !== "completed" && drama.viewCount && drama.viewCount > 5000) {
    return { label: t.statusHot, color: "bg-red-500" };
  }

  if (mode !== "completed") {
    return { label: t.statusOngoing, color: "bg-green-600" };
  }

  if (drama.createdAt && Date.now() - new Date(drama.createdAt).getTime() < 30 * 86400000) {
    return { label: t.statusNew, color: "bg-blue-500" };
  }

  return { label: t.statusCompleted, color: "bg-gray-600" };
}

function getAppStatusText(drama: Drama, t: FavoritesCopy) {
  const hasPremiumEpisodes = Boolean(drama.episodes?.some((episode) => !episode.isFree));
  const mode = resolveDramaMode(drama);

  if (hasPremiumEpisodes) {
    return { label: t.statusPremium, color: "text-[#f4c95d]" };
  }

  if (mode === "completed") {
    return { label: t.statusCompleted, color: "text-white/45" };
  }

  if (drama.viewCount && drama.viewCount > 5000) {
    return { label: t.statusHot, color: "text-[#ff6b86]" };
  }

  return { label: t.statusOngoing, color: "text-[#ff6b86]" };
}

function timeAgo(dateStr: string | undefined, t: FavoritesCopy) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 1) return t.timeToday;
  if (days < 7) return t.timeDaysAgo(days);
  if (days < 30) return t.timeWeeksAgo(Math.floor(days / 7));
  return t.timeMonthsAgo(Math.floor(days / 30));
}

export default function FavoritesPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const { token, user } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const { isApp } = usePlatform();
  const isNativeRuntime = isApp || (typeof window !== "undefined" && isNativeApp());
  const cacheKey = useMemo(() => {
    if (!user?._id) return "";
    return `favorites-view:${user._id}:${locale}:${isNativeRuntime ? "app" : "web"}`;
  }, [isNativeRuntime, locale, user?._id]);
  const [cachedView, setCachedView] = useState<FavoritesViewCache | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [appVisibleCount, setAppVisibleCount] = useState(8);
  const [webVisibleCount, setWebVisibleCount] = useState(10);

  useEffect(() => {
    setCachedView(cacheKey ? readViewCache<FavoritesViewCache>(cacheKey, FAVORITES_VIEW_CACHE_MAX_AGE_MS) : null);
  }, [cacheKey]);

  useEffect(() => {
    if (!cachedView) return;
    setFavorites(cachedView.favorites);
    setLoading(false);
  }, [cachedView]);

  useEffect(() => {
    if (!cacheKey || loading) return;
    writeViewCache<FavoritesViewCache>(cacheKey, { favorites });
  }, [cacheKey, favorites, loading]);

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await userApi.getFavorites(token);
        const normalized = normalizeFavoriteEntries(res.data);
        const normalizedIds = new Set(normalized.map((entry) => entry.drama._id));
        const unresolvedIds = extractFavoriteDramaIds(res.data).filter((dramaId) => !normalizedIds.has(dramaId));

        if (!unresolvedIds.length) {
          if (!cancelled) {
            setFavorites(normalized);
          }
          return;
        }

        const dramaResults = await Promise.all(
          unresolvedIds.map(async (dramaId) => {
            try {
              const dramaRes = await dramasApi.getById(dramaId);
              const drama = (dramaRes.data as { drama?: Drama })?.drama;
              return drama ? ({ drama, savedAt: undefined } as FavoriteEntry) : null;
            } catch {
              return null;
            }
          })
        );

        const fetchedEntries = dramaResults.filter((item): item is FavoriteEntry => item !== null);

        if (!cancelled) {
          setFavorites([...normalized, ...fetchedEntries]);
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
        if (!cancelled && !cachedView) {
          setFavorites([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [cachedView, token]);

  const handleRemove = async (dramaId: string) => {
    if (!token) return;

    const removedEntry = favorites.find((entry) => entry.drama._id === dramaId);

    try {
      await userApi.removeFavorite(token, dramaId);
      setFavorites((prev) => prev.filter((entry) => entry.drama._id !== dramaId));
      toast(t.removed, "success");

      if (removedEntry) {
        (window as unknown as { __lastRemovedFavorite?: unknown }).__lastRemovedFavorite = {
          drama: removedEntry.drama,
          restore: async () => {
            try {
              await userApi.addFavorite(token, dramaId);
              setFavorites((prev) => [
                {
                  ...removedEntry,
                  savedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                ...prev,
              ]);
              toast(t.restored, "success");
            } catch {
              toast(t.restoreFailed, "error");
            }
          },
        };
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  const sorted = useMemo(() => {
    const entries = [...favorites];

    switch (sort) {
      case "newest":
        return entries.sort(
          (a, b) => new Date(getEntryTimestamp(b) || 0).getTime() - new Date(getEntryTimestamp(a) || 0).getTime()
        );
      case "oldest":
        return entries.sort(
          (a, b) => new Date(getEntryTimestamp(a) || 0).getTime() - new Date(getEntryTimestamp(b) || 0).getTime()
        );
      case "title-az":
        return entries.sort((a, b) => a.drama.title.localeCompare(b.drama.title));
      case "title-za":
        return entries.sort((a, b) => b.drama.title.localeCompare(a.drama.title));
      default:
        return entries;
    }
  }, [favorites, sort]);

  const showAppLayout = isNativeRuntime;
  const renderLoadingShell = () => (
    showAppLayout ? (
      <div className="min-h-screen bg-[#0f1115] text-white">
        <Navbar activePath={FAVORITES_ACTIVE_PATH} mobileTitle={t.title} />

        <main
          className="mx-auto max-w-md px-4 pb-32"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 74px)" }}
        >
          <section className="mb-6 flex items-center gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-1 w-1 animate-pulse rounded-full bg-white/8" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-white/8" />
          </section>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[2/3] animate-pulse rounded-[18px] bg-white/6" />
                <div className="h-2.5 w-14 animate-pulse rounded-full bg-white/6" />
                <div className="h-3.5 w-24 animate-pulse rounded-full bg-white/6" />
              </div>
            ))}
          </div>
        </main>
      </div>
    ) : (
      <div className="min-h-screen bg-[#0F1014]">
        <Navbar activePath={FAVORITES_ACTIVE_PATH} mobileTitle={t.title} />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-24">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="h-8 w-52 animate-pulse rounded-full bg-white/8" />
              <div className="h-4 w-28 animate-pulse rounded-full bg-white/6" />
            </div>
            <div className="h-10 w-44 animate-pulse rounded-lg bg-white/6" />
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  );

  if (authLoading || !user) {
    return renderLoadingShell();
  }

  const visibleCount = showAppLayout ? appVisibleCount : webVisibleCount;
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  if (showAppLayout) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-white">
        <Navbar activePath={FAVORITES_ACTIVE_PATH} mobileTitle={t.title} />

        <main
          className="mx-auto max-w-md px-4 pb-32"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 74px)" }}
        >
          <section className="mb-6 flex items-center gap-2">
            <span className="text-sm font-medium text-white/60">
              {favorites.length.toLocaleString()} {t.savedTitles}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#ff3b5c]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f6c65b]">
              {t.curated}
            </span>
          </section>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-[2/3] animate-pulse rounded-[18px] bg-white/6" />
                  <div className="h-2.5 w-14 animate-pulse rounded-full bg-white/6" />
                  <div className="h-3.5 w-24 animate-pulse rounded-full bg-white/6" />
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {visible.map((entry) => {
                  const drama = entry.drama;
                  const status = getAppStatusText(drama, t);

                  return (
                    <article key={drama._id} className="relative">
                      <button
                        type="button"
                        onClick={() => handleRemove(drama._id)}
                        title={t.removeTitle}
                        aria-label={t.removeTitle}
                        className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/85 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:bg-black/65"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <Link href={localizePath(`/drama/${drama._id}`, locale)} className="block">
                        <div className="relative aspect-[2/3] overflow-hidden rounded-[18px] border border-white/10 bg-[#171a20] shadow-[0_18px_30px_rgba(0,0,0,0.3)]">
                          <Image
                            src={drama.cover}
                            alt={drama.title}
                            fill
                            sizes="50vw"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_12%,rgba(0,0,0,0.08)_34%,rgba(0,0,0,0.66)_100%)]" />
                        </div>

                        <div className="px-1 pt-2.5">
                          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${status.color}`}>
                            {status.label}
                          </p>
                          <h2 className="mt-1 truncate text-[13px] font-medium leading-[1.2] text-white/95">
                            {drama.title}
                          </h2>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAppVisibleCount((count) => count + 8)}
                    className="rounded-full border border-white/10 bg-[#1b1f27] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#242936]"
                  >
                    {t.loadMoreTitles}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-10 text-center shadow-[0_24px_42px_rgba(0,0,0,0.24)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ff3b5c]/12 text-[#ff5c79]">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">{t.emptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{t.emptyDesc}</p>
              <Link
                href={localizePath("/browse", locale)}
                className="mt-6 inline-flex rounded-full bg-[#ff3b5c] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(255,59,92,0.32)] transition hover:bg-[#ff4a6a]"
              >
                {t.browseDramas}
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar activePath={FAVORITES_ACTIVE_PATH} mobileTitle={t.title} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {favorites.length} {t.savedTitles}
            </p>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-4 pr-10 text-sm text-gray-300 transition focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="oldest">{t.sortOldest}</option>
              <option value="title-az">{t.sortAz}</option>
              <option value="title-za">{t.sortZa}</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visible.map((entry) => {
                const drama = entry.drama;
                const badge = getStatusBadge(drama, t);

                return (
                  <div key={drama._id} className="group relative">
                    <Link href={localizePath(`/drama/${drama._id}`, locale)}>
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
                        <Image
                          src={drama.cover}
                          alt={drama.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        <span className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${badge.color}`}>
                          {badge.label}
                        </span>

                        {drama.episodes?.some((episode) => !episode.isFree) ? (
                          <span className="absolute right-2.5 top-2.5 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                            {t.vip}
                          </span>
                        ) : null}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-xs font-medium text-white">{drama.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(drama._id)}
                      className="absolute bottom-[4.5rem] right-2.5 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                      title={t.removeTitle}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="mt-2.5 px-0.5">
                      <h3 className="truncate text-sm font-medium text-white">{drama.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {drama.categories?.[0] || t.defaultCategory} · {drama.totalEpisodes || "?"} {t.epsShort}
                        {getEntryTimestamp(entry) ? ` · ${timeAgo(getEntryTimestamp(entry), t)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore ? (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setWebVisibleCount((count) => count + 10)}
                  className="rounded-lg border border-white/10 bg-white/5 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {t.loadMore}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">{t.emptyTitle}</h2>
            <p className="mt-2 text-sm text-gray-500">{t.emptyDesc}</p>
            <Link
              href={localizePath("/browse", locale)}
              className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              {t.browseDramas}
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
