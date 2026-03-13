"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { userApi, dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { resolveDramaMode } from "@/lib/utils";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

type SortOption = "newest" | "oldest" | "title-az" | "title-za";

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
  emptyTitle: string;
  emptyDesc: string;
  browseDramas: string;
  vip: string;
  statusHot: string;
  statusOngoing: string;
  statusNew: string;
  statusCompleted: string;
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
    emptyTitle: "No Favorites Yet",
    emptyDesc: "Start adding dramas to your watchlist to see them here",
    browseDramas: "Browse Dramas",
    vip: "VIP",
    statusHot: "HOT",
    statusOngoing: "ONGOING",
    statusNew: "NEW",
    statusCompleted: "COMPLETED",
    timeToday: "Today",
    timeDaysAgo: (days) => `${days}d ago`,
    timeWeeksAgo: (weeks) => `${weeks}w ago`,
    timeMonthsAgo: (months) => `${months}mo ago` },
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
    emptyTitle: "还没有收藏",
    emptyDesc: "去添加你喜欢的短剧吧",
    browseDramas: "浏览短剧",
    vip: "VIP",
    statusHot: "热门",
    statusOngoing: "连载中",
    statusNew: "新上架",
    statusCompleted: "已完结",
    timeToday: "今天",
    timeDaysAgo: (days) => `${days}天前`,
    timeWeeksAgo: (weeks) => `${weeks}周前`,
    timeMonthsAgo: (months) => `${months}个月前` },
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
    emptyTitle: "お気に入りはまだありません",
    emptyDesc: "ドラマを追加するとここに表示されます",
    browseDramas: "ドラマを探す",
    vip: "VIP",
    statusHot: "人気",
    statusOngoing: "配信中",
    statusNew: "新着",
    statusCompleted: "完結",
    timeToday: "今日",
    timeDaysAgo: (days) => `${days}日前`,
    timeWeeksAgo: (weeks) => `${weeks}週間前`,
    timeMonthsAgo: (months) => `${months}か月前` },
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
    emptyTitle: "Aún no tienes favoritos",
    emptyDesc: "Agrega dramas para verlos aquí",
    browseDramas: "Explorar dramas",
    vip: "VIP",
    statusHot: "HOT",
    statusOngoing: "EN EMISIÓN",
    statusNew: "NUEVO",
    statusCompleted: "COMPLETADO",
    timeToday: "Hoy",
    timeDaysAgo: (days) => `hace ${days} d`,
    timeWeeksAgo: (weeks) => `hace ${weeks} sem`,
    timeMonthsAgo: (months) => `hace ${months} mes` },
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
    emptyTitle: "Sem favoritos ainda",
    emptyDesc: "Adicione dramas para ver aqui",
    browseDramas: "Explorar dramas",
    vip: "VIP",
    statusHot: "HOT",
    statusOngoing: "EM EXIBIÇÃO",
    statusNew: "NOVO",
    statusCompleted: "CONCLUÍDO",
    timeToday: "Hoje",
    timeDaysAgo: (days) => `há ${days}d`,
    timeWeeksAgo: (weeks) => `há ${weeks} sem`,
    timeMonthsAgo: (months) => `há ${months} meses` },
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
    emptyTitle: "अभी कोई फेवरेट नहीं",
    emptyDesc: "ड्रामा जोड़ें, यहाँ दिखेंगे",
    browseDramas: "ड्रामा ब्राउज़ करें",
    vip: "VIP",
    statusHot: "हॉट",
    statusOngoing: "जारी",
    statusNew: "नया",
    statusCompleted: "पूर्ण",
    timeToday: "आज",
    timeDaysAgo: (days) => `${days} दिन पहले`,
    timeWeeksAgo: (weeks) => `${weeks} हफ्ते पहले`,
    timeMonthsAgo: (months) => `${months} महीने पहले` },
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
    emptyTitle: "Belum ada favorit",
    emptyDesc: "Tambahkan drama ke daftar tontonmu",
    browseDramas: "Jelajahi drama",
    vip: "VIP",
    statusHot: "HOT",
    statusOngoing: "BERLANJUT",
    statusNew: "BARU",
    statusCompleted: "SELESAI",
    timeToday: "Hari ini",
    timeDaysAgo: (days) => `${days}h lalu`,
    timeWeeksAgo: (weeks) => `${weeks}mgg lalu`,
    timeMonthsAgo: (months) => `${months}bln lalu` } };

function getStatusBadge(drama: Drama, t: FavoritesCopy) {
  const mode = resolveDramaMode(drama);
  if (mode !== "completed" && drama.viewCount && drama.viewCount > 5000)
    return { label: t.statusHot, color: "bg-red-500" };
  if (mode !== "completed") return { label: t.statusOngoing, color: "bg-green-600" };
  if (drama.createdAt && Date.now() - new Date(drama.createdAt).getTime() < 30 * 86400000)
    return { label: t.statusNew, color: "bg-blue-500" };
  return { label: t.statusCompleted, color: "bg-gray-600" };
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
  const { token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      try {
        const res = await userApi.getFavorites(token);
        const favData = res.data;
        if (Array.isArray(favData)) {
          setFavorites(favData);
        } else if (favData?.favorites) {
          const dramaResults = await Promise.all(
            favData.favorites.map((fav: { dramaId: string }) => dramasApi.getById(fav.dramaId))
          );
          setFavorites(dramaResults.map((r: { data?: { drama?: Drama } }) => r.data?.drama).filter((d): d is Drama => Boolean(d)));
        }
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchFavorites();
    else setLoading(false);
  }, [token]);

  const handleRemove = async (dramaId: string) => {
    if (!token) return;
    const removedDrama = favorites.find((d) => d._id === dramaId);
    try {
      await userApi.removeFavorite(token, dramaId);
      setFavorites((prev) => prev.filter((d) => d._id !== dramaId));
      toast(t.removed, "success");
      if (removedDrama) {
        (window as unknown as { __lastRemovedFavorite?: unknown }).__lastRemovedFavorite = {
          drama: removedDrama,
          restore: async () => {
            try {
              await userApi.addFavorite(token, dramaId);
              setFavorites((prev) => [...prev, removedDrama]);
              toast(t.restored, "success");
            } catch {
              toast(t.restoreFailed, "error");
            }
          } };
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...favorites];
    switch (sort) {
      case "newest": return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "oldest": return arr.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case "title-az": return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "title-za": return arr.sort((a, b) => b.title.localeCompare(a.title));
      default: return arr;
    }
  }, [favorites, sort]);

  if (authLoading) return null;

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
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
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-4 pr-10 text-sm text-gray-300 focus:border-[#D4AF37] focus:outline-none transition"
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
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visible.map((drama) => {
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

                        {drama.episodes?.some((ep) => !ep.isFree) && (
                          <span className="absolute right-2.5 top-2.5 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                            {t.vip}
                          </span>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="text-xs font-medium text-white">{drama.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleRemove(drama._id)}
                      className="absolute right-2.5 bottom-[4.5rem] rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                      title={t.removeTitle}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="mt-2.5 px-0.5">
                      <h3 className="text-sm font-medium text-white truncate">{drama.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {drama.categories?.[0] || t.defaultCategory} · {drama.totalEpisodes || "?"} {t.epsShort}
                        {drama.createdAt ? ` · ${timeAgo(drama.createdAt, t)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + 10)}
                  className="rounded-lg border border-white/10 bg-white/5 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {t.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">{t.emptyTitle}</h2>
            <p className="mt-2 text-sm text-gray-500">{t.emptyDesc}</p>
            <Link href={localizePath("/browse", locale)} className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700">
              {t.browseDramas}
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
