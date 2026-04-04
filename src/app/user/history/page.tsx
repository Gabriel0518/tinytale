"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { readViewCache, writeViewCache } from "@/lib/view-cache";

interface HistoryItem {
  _id?: string;
  dramaId: string;
  episodeId: string;
  title?: string;
  cover?: string;
  drama?: { _id: string; title: string; cover: string; categories?: string[] };
  episode?: { episodeNumber: number; title: string };
  watchedAt: string;
  progress?: number;
  lastEpisode?: number;
}

type HistoryViewCache = {
  history: HistoryItem[];
};

type HistoryCopy = {
  title: string;
  subtitle: string;
  clearHistory: string;
  removed: string;
  cleared: string;
  groupToday: string;
  groupYesterday: string;
  groupLastWeek: string;
  groupOlder: string;
  justNow: string;
  updatedHours: (h: number) => string;
  updatedDays: (d: number) => string;
  unknownDrama: string;
  defaultCategory: string;
  episode: string;
  minsLeft: string;
  removeLabel: string;
  emptyTitle: string;
  emptyDesc: string;
  browseDramas: string;
  clearTitle: string;
  clearDesc: string;
  cancel: string;
  clearAll: string;
};

const COPY: FlexibleRecord<SupportedLocale, HistoryCopy> = {
  en: {
    title: "Watch History",
    subtitle: "Resume watching your favorite dramas right where you left off.",
    clearHistory: "Clear History",
    removed: "Removed from history",
    cleared: "History cleared",
    groupToday: "Today",
    groupYesterday: "Yesterday",
    groupLastWeek: "Last Week",
    groupOlder: "Older",
    justNow: "Just now",
    updatedHours: (h) => `Updated ${h}h ago`,
    updatedDays: (d) => `Updated ${d}d ago`,
    unknownDrama: "Unknown Drama",
    defaultCategory: "Drama",
    episode: "Episode",
    minsLeft: "m left",
    removeLabel: "Remove from history",
    emptyTitle: "No Watch History",
    emptyDesc: "Start watching dramas and your history will appear here",
    browseDramas: "Browse Dramas",
    clearTitle: "Clear Watch History?",
    clearDesc: "This will remove all your watch history. This action cannot be undone.",
    cancel: "Cancel",
    clearAll: "Clear All" },
  zh: {
    title: "观看历史",
    subtitle: "从你上次中断的位置继续观看。",
    clearHistory: "清空历史",
    removed: "已从历史中移除",
    cleared: "历史已清空",
    groupToday: "今天",
    groupYesterday: "昨天",
    groupLastWeek: "最近一周",
    groupOlder: "更早",
    justNow: "刚刚",
    updatedHours: (h) => `${h}小时前更新`,
    updatedDays: (d) => `${d}天前更新`,
    unknownDrama: "未知短剧",
    defaultCategory: "短剧",
    episode: "第",
    minsLeft: "分钟剩余",
    removeLabel: "从历史移除",
    emptyTitle: "暂无观看历史",
    emptyDesc: "开始观看后会在这里显示",
    browseDramas: "浏览短剧",
    clearTitle: "清空观看历史？",
    clearDesc: "这会删除你的全部观看历史，且无法恢复。",
    cancel: "取消",
    clearAll: "全部清空" },
  ja: {
    title: "視聴履歴",
    subtitle: "前回の続きからすぐに再生できます。",
    clearHistory: "履歴を削除",
    removed: "履歴から削除しました",
    cleared: "履歴を削除しました",
    groupToday: "今日",
    groupYesterday: "昨日",
    groupLastWeek: "先週",
    groupOlder: "それ以前",
    justNow: "たった今",
    updatedHours: (h) => `${h}時間前に更新`,
    updatedDays: (d) => `${d}日前に更新`,
    unknownDrama: "不明なドラマ",
    defaultCategory: "ドラマ",
    episode: "第",
    minsLeft: "分残り",
    removeLabel: "履歴から削除",
    emptyTitle: "視聴履歴はありません",
    emptyDesc: "視聴するとここに表示されます",
    browseDramas: "ドラマを見る",
    clearTitle: "視聴履歴を削除しますか？",
    clearDesc: "すべての履歴が削除され、この操作は取り消せません。",
    cancel: "キャンセル",
    clearAll: "すべて削除" },
  es: {
    title: "Historial",
    subtitle: "Continúa tus dramas donde lo dejaste.",
    clearHistory: "Borrar historial",
    removed: "Eliminado del historial",
    cleared: "Historial borrado",
    groupToday: "Hoy",
    groupYesterday: "Ayer",
    groupLastWeek: "Última semana",
    groupOlder: "Anterior",
    justNow: "Ahora mismo",
    updatedHours: (h) => `Actualizado hace ${h} h`,
    updatedDays: (d) => `Actualizado hace ${d} d`,
    unknownDrama: "Drama desconocido",
    defaultCategory: "Drama",
    episode: "Episodio",
    minsLeft: "min restantes",
    removeLabel: "Quitar del historial",
    emptyTitle: "Sin historial",
    emptyDesc: "Empieza a ver dramas y aparecerán aquí",
    browseDramas: "Explorar dramas",
    clearTitle: "¿Borrar historial?",
    clearDesc: "Se eliminará todo tu historial. Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    clearAll: "Borrar todo" },
  pt: {
    title: "Histórico",
    subtitle: "Continue seus dramas de onde parou.",
    clearHistory: "Limpar histórico",
    removed: "Removido do histórico",
    cleared: "Histórico limpo",
    groupToday: "Hoje",
    groupYesterday: "Ontem",
    groupLastWeek: "Última semana",
    groupOlder: "Mais antigos",
    justNow: "Agora",
    updatedHours: (h) => `Atualizado há ${h}h`,
    updatedDays: (d) => `Atualizado há ${d}d`,
    unknownDrama: "Drama desconhecido",
    defaultCategory: "Drama",
    episode: "Episódio",
    minsLeft: "min restantes",
    removeLabel: "Remover do histórico",
    emptyTitle: "Sem histórico",
    emptyDesc: "Comece a assistir e seu histórico aparecerá aqui",
    browseDramas: "Explorar dramas",
    clearTitle: "Limpar histórico?",
    clearDesc: "Isso removerá todo o seu histórico. A ação não pode ser desfeita.",
    cancel: "Cancelar",
    clearAll: "Limpar tudo" },
  hi: {
    title: "देखने का इतिहास",
    subtitle: "जहाँ छोड़ा था वहीं से देखना जारी रखें।",
    clearHistory: "इतिहास साफ करें",
    removed: "इतिहास से हटाया गया",
    cleared: "इतिहास साफ किया गया",
    groupToday: "आज",
    groupYesterday: "कल",
    groupLastWeek: "पिछला सप्ताह",
    groupOlder: "पुराना",
    justNow: "अभी",
    updatedHours: (h) => `${h}घं पहले अपडेट`,
    updatedDays: (d) => `${d}दिन पहले अपडेट`,
    unknownDrama: "अज्ञात ड्रामा",
    defaultCategory: "ड्रामा",
    episode: "एपिसोड",
    minsLeft: "मिनट बाकी",
    removeLabel: "इतिहास से हटाएँ",
    emptyTitle: "कोई इतिहास नहीं",
    emptyDesc: "देखना शुरू करें, इतिहास यहाँ दिखेगा",
    browseDramas: "ड्रामा ब्राउज़ करें",
    clearTitle: "इतिहास साफ करें?",
    clearDesc: "यह आपका पूरा इतिहास हटाएगा। इसे वापस नहीं किया जा सकता।",
    cancel: "रद्द करें",
    clearAll: "सब साफ करें" },
  id: {
    title: "Riwayat Tonton",
    subtitle: "Lanjutkan menonton drama dari titik terakhir.",
    clearHistory: "Hapus riwayat",
    removed: "Dihapus dari riwayat",
    cleared: "Riwayat dihapus",
    groupToday: "Hari ini",
    groupYesterday: "Kemarin",
    groupLastWeek: "Minggu lalu",
    groupOlder: "Lebih lama",
    justNow: "Baru saja",
    updatedHours: (h) => `Diperbarui ${h}j lalu`,
    updatedDays: (d) => `Diperbarui ${d}h lalu`,
    unknownDrama: "Drama tidak dikenal",
    defaultCategory: "Drama",
    episode: "Episode",
    minsLeft: "m tersisa",
    removeLabel: "Hapus dari riwayat",
    emptyTitle: "Belum ada riwayat",
    emptyDesc: "Mulai menonton drama dan riwayat akan muncul di sini",
    browseDramas: "Jelajahi drama",
    clearTitle: "Hapus riwayat tonton?",
    clearDesc: "Semua riwayat akan dihapus dan tidak bisa dibatalkan.",
    cancel: "Batal",
    clearAll: "Hapus semua" } };

const HISTORY_VIEW_CACHE_MAX_AGE_MS = 1000 * 60 * 15;

function groupByTime(items: HistoryItem[], t: HistoryCopy) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; color: string; items: HistoryItem[] }[] = [
    { label: t.groupToday, color: "bg-red-500", items: [] },
    { label: t.groupYesterday, color: "bg-amber-500", items: [] },
    { label: t.groupLastWeek, color: "bg-gray-600", items: [] },
    { label: t.groupOlder, color: "bg-gray-700", items: [] },
  ];

  items.forEach((item) => {
    const d = new Date(item.watchedAt);
    if (d >= today) groups[0].items.push(item);
    else if (d >= yesterday) groups[1].items.push(item);
    else if (d >= lastWeek) groups[2].items.push(item);
    else groups[3].items.push(item);
  });

  return groups.filter((g) => g.items.length > 0);
}

function updatedAgo(dateStr: string, t: HistoryCopy) {
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (h < 1) return t.justNow;
  if (h < 24) return t.updatedHours(h);
  const d = Math.floor(h / 24);
  return t.updatedDays(d);
}

export default function HistoryPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const { token, user } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const cacheKey = useMemo(() => {
    if (!user?._id) return "";
    return `history-view:${user._id}:${locale}`;
  }, [locale, user?._id]);
  const [cachedView, setCachedView] = useState<HistoryViewCache | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setCachedView(cacheKey ? readViewCache<HistoryViewCache>(cacheKey, HISTORY_VIEW_CACHE_MAX_AGE_MS) : null);
  }, [cacheKey]);

  useEffect(() => {
    if (!cachedView) return;
    setHistory(cachedView.history);
    setLoading(false);
  }, [cachedView]);

  useEffect(() => {
    if (!cacheKey || loading) return;
    writeViewCache<HistoryViewCache>(cacheKey, { history });
  }, [cacheKey, history, loading]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await userApi.getHistory(token);
        setHistory(res.data?.history || res.data || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        if (!cachedView) {
          setHistory([]);
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
    else setLoading(false);
  }, [cachedView, token]);

  const handleRemove = async (id: string) => {
    if (!token) return;
    try {
      await userApi.deleteHistoryEntry(token, id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      toast(t.removed, "info");
    } catch (err) {
      console.error("Failed to remove history entry:", err);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    }
  };

  const handleClearAll = async () => {
    if (!token) return;
    try {
      await userApi.deleteHistory(token);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
    setHistory([]);
    setShowClearConfirm(false);
    toast(t.cleared, "info");
  };

  const groups = useMemo(() => groupByTime(history, t), [history, t]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F1014]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-44 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-72 animate-pulse rounded-full bg-white/6" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-32 w-24 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                  <div className="h-2 w-full rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {t.clearHistory}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-32 w-24 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                  <div className="h-2 w-full rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-5 w-1 rounded-full ${group.color}`} />
                  <h2 className="text-sm font-semibold text-white">{group.label}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => {
                    const coverUrl = item.cover || item.drama?.cover || "https://picsum.photos/seed/drama/200/300";
                    const title = item.title || item.drama?.title || t.unknownDrama;
                    const epNum = item.episode?.episodeNumber || item.lastEpisode || "?";
                    const epTitle = item.episode?.title || "";
                    const category = item.drama?.categories?.[0] || t.defaultCategory;
                    const progress = item.progress ?? 50;
                    const minsLeft = Math.max(1, Math.floor((100 - progress) * 0.3));
                    const itemId = item._id || `${item.dramaId}-${item.episodeId}`;

                    return (
                      <div
                        key={itemId}
                        className="group relative flex gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                      >
                        <Link href={localizePath(`/drama/${item.dramaId}`, locale)} className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                              <svg className="h-4 w-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </Link>

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={localizePath(`/drama/${item.dramaId}`, locale)} className="font-medium text-white truncate hover:text-red-400 transition">
                                {title}
                              </Link>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400">
                                {category}
                              </span>
                              <span className="text-xs text-gray-600">{updatedAgo(item.watchedAt, t)}</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 truncate">
                              {t.episode} {epNum}{epTitle ? `: ${epTitle}` : ""}
                            </p>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-600">{minsLeft}{t.minsLeft}</span>
                              <span className="text-[10px] text-gray-600">{progress}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-red-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => item._id && handleRemove(item._id)}
                          className="absolute right-3 top-3 rounded-full bg-black/50 p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                          aria-label={t.removeLabel}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">{t.emptyTitle}</h2>
            <p className="mt-2 text-sm text-gray-500">{t.emptyDesc}</p>
            <Link href={localizePath("/browse", locale)} className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700">
              {t.browseDramas}
            </Link>
          </div>
        )}
      </main>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1c23] p-6">
            <h3 className="text-lg font-semibold text-white">{t.clearTitle}</h3>
            <p className="mt-2 text-sm text-gray-400">{t.clearDesc}</p>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                {t.cancel}
              </button>
              <button onClick={handleClearAll} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
                {t.clearAll}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
