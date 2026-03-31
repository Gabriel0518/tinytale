'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';
import { mockDramas } from '@/lib/mockData';
import {localizePath, SupportedLocale } from '@/lib/i18n';
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { resolveSafeImageUrl } from '@/lib/safe-image';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { MobileScrollTabs } from '@/components/mobile/MobileScrollTabs';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';

const RANKINGS_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    unknown: 'Unknown',
    today: 'Today',
    oneDayAgo: '1 day ago',
    daysAgo: 'days ago',
    todayTab: 'Today',
    weekTab: 'This Week',
    monthTab: 'This Month',
    allTimeTab: 'All Time',
    hotRanking: 'Hot Ranking',
    newArrivals: 'New Arrivals',
    mostCollected: 'Most Collected (Est.)',
    viewsSuffix: 'Views',
    favsSuffix: 'Favs',
    viewFullList: 'View Full List',
    dramaFallback: 'Drama',
    pageTitle: 'Drama Leaderboards',
    pageDesc: 'Discover the most popular short dramas updated daily.' },
  zh: {
    unknown: '未知',
    today: '今天',
    oneDayAgo: '1 天前',
    daysAgo: '天前',
    todayTab: '今日',
    weekTab: '本周',
    monthTab: '本月',
    allTimeTab: '全部',
    hotRanking: '热门排行',
    newArrivals: '新剧上新',
    mostCollected: '收藏最多（估算）',
    viewsSuffix: '播放',
    favsSuffix: '收藏',
    viewFullList: '查看完整榜单',
    dramaFallback: '短剧',
    pageTitle: '短剧排行榜',
    pageDesc: '发现每日更新的人气短剧。' },
  ja: {
    unknown: '不明',
    today: '今日',
    oneDayAgo: '1日前',
    daysAgo: '日前',
    todayTab: '今日',
    weekTab: '今週',
    monthTab: '今月',
    allTimeTab: '全期間',
    hotRanking: '人気ランキング',
    newArrivals: '新着',
    mostCollected: 'お気に入り数（推定）',
    viewsSuffix: '再生',
    favsSuffix: 'お気に入り',
    viewFullList: '一覧を見る',
    dramaFallback: 'ドラマ',
    pageTitle: 'ドラマランキング',
    pageDesc: '人気ショートドラマを毎日更新。' },
  es: {
    unknown: 'Desconocido',
    today: 'Hoy',
    oneDayAgo: 'hace 1 día',
    daysAgo: 'días atrás',
    todayTab: 'Hoy',
    weekTab: 'Esta semana',
    monthTab: 'Este mes',
    allTimeTab: 'Todo',
    hotRanking: 'Ranking caliente',
    newArrivals: 'Novedades',
    mostCollected: 'Más guardados (est.)',
    viewsSuffix: 'vistas',
    favsSuffix: 'favoritos',
    viewFullList: 'Ver lista completa',
    dramaFallback: 'Drama',
    pageTitle: 'Clasificación de dramas',
    pageDesc: 'Descubre los dramas cortos más populares.' },
  pt: {
    unknown: 'Desconhecido',
    today: 'Hoje',
    oneDayAgo: 'há 1 dia',
    daysAgo: 'dias atrás',
    todayTab: 'Hoje',
    weekTab: 'Esta semana',
    monthTab: 'Este mês',
    allTimeTab: 'Todo período',
    hotRanking: 'Ranking quente',
    newArrivals: 'Novidades',
    mostCollected: 'Mais salvos (est.)',
    viewsSuffix: 'visualizações',
    favsSuffix: 'favoritos',
    viewFullList: 'Ver lista completa',
    dramaFallback: 'Drama',
    pageTitle: 'Ranking de dramas',
    pageDesc: 'Descubra os dramas curtos mais populares.' },
  hi: {
    unknown: 'अज्ञात',
    today: 'आज',
    oneDayAgo: '1 दिन पहले',
    daysAgo: 'दिन पहले',
    todayTab: 'आज',
    weekTab: 'इस सप्ताह',
    monthTab: 'इस माह',
    allTimeTab: 'सभी समय',
    hotRanking: 'हॉट रैंकिंग',
    newArrivals: 'नए आगमन',
    mostCollected: 'सबसे ज्यादा सेव (अनुमान)',
    viewsSuffix: 'व्यूज़',
    favsSuffix: 'फेव्स',
    viewFullList: 'पूरी सूची देखें',
    dramaFallback: 'ड्रामा',
    pageTitle: 'ड्रामा लीडरबोर्ड',
    pageDesc: 'लोकप्रिय शॉर्ट ड्रामा देखें।' },
  id: {
    unknown: 'Tidak diketahui',
    today: 'Hari ini',
    oneDayAgo: '1 hari lalu',
    daysAgo: 'hari lalu',
    todayTab: 'Hari ini',
    weekTab: 'Minggu ini',
    monthTab: 'Bulan ini',
    allTimeTab: 'Sepanjang waktu',
    hotRanking: 'Peringkat panas',
    newArrivals: 'Rilis baru',
    mostCollected: 'Paling disimpan (estimasi)',
    viewsSuffix: 'tayangan',
    favsSuffix: 'favorit',
    viewFullList: 'Lihat daftar lengkap',
    dramaFallback: 'Drama',
    pageTitle: 'Papan peringkat drama',
    pageDesc: 'Temukan drama pendek paling populer.' } };

function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return String(n);
}

function daysAgo(dateStr: string, t: Record<string, string>): string {
  if (!dateStr) return t.unknown;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return t.unknown;
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diff <= 0) return t.today;
  if (diff === 1) return t.oneDayAgo;
  return `${diff} ${t.daysAgo}`;
}

function rankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-gray-600';
}

export default function Rankings() {
  const locale = useLocale();
  const t = resolveLocaleCopy(RANKINGS_TEXT, locale);
  const [allDramas, setAllDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('daily');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // TODO: Backend does not support period filtering yet. When it does, pass `period` as a param.
        const res = await dramasApi.getAll({ sort: 'views', limit: 50 });
        const data = res.data?.dramas || res.data || [];
        setAllDramas(data.length > 0 ? data : mockDramas);
      } catch {
        setAllDramas(mockDramas);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Three ranking lists (wrapped in useMemo)
  const hotRanking = useMemo(() =>
    [...allDramas]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5),
    [allDramas]
  );
  const newArrivals = useMemo(() =>
    [...allDramas]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5),
    [allDramas]
  );
  const mostCollected = useMemo(() =>
    [...allDramas]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5),
    [allDramas]
  );

  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: t.todayTab },
    { key: 'weekly', label: t.weekTab },
    { key: 'monthly', label: t.monthTab },
    { key: 'all', label: t.allTimeTab },
  ];

  // Reusable ranking section renderer
  const renderSection = (
    title: string,
    icon: string,
    dramas: Drama[],
    metricFn: (d: Drama) => string,
  ) => (
    <div className="rounded-xl bg-[#1a1a1a] p-5">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-gray-800" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex animate-pulse gap-3 py-2">
              <div className="h-14 w-10 rounded bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-gray-800" />
                <div className="h-2 w-1/2 rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* #1 Featured Card */}
          {dramas[0] && (
            <Link href={localizePath(`/drama/${dramas[0]._id}`, locale)} className="group relative mb-4 block overflow-hidden rounded-[24px] transition-transform duration-100 active:scale-[0.99]">
              <div className="relative aspect-[3/4]">
                <Image
                  src={resolveSafeImageUrl(dramas[0].cover)}
                  alt={dramas[0].title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Rank Badge */}
                <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-lg font-bold text-black">
                  1
                </div>
                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base font-semibold text-white">{dramas[0].title}</h3>
                  <p className="mt-1 text-xs text-gray-300">{metricFn(dramas[0])}</p>
                </div>
                {/* Hover Play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* #2-5 List */}
          <div className="space-y-1">
            {dramas.slice(1).map((drama, i) => (
              <Link
                key={drama._id}
                href={localizePath(`/drama/${drama._id}`, locale)}
                className="group flex items-center gap-3 rounded-[18px] px-2 py-2.5 transition hover:bg-[#252525] active:scale-[0.99]"
              >
                <span className={`w-5 text-center text-sm font-bold ${rankColor(i + 2)}`}>
                  {i + 2}
                </span>
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
                  <Image
                    src={resolveSafeImageUrl(drama.cover)}
                    alt={drama.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-white">{drama.title}</h4>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {drama.categories?.[0] || t.dramaFallback} · {metricFn(drama)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* View Full List */}
          <div className="mt-3 border-t border-gray-800 pt-3 text-center">
            <Link href={localizePath('/browse', locale)} className="text-xs font-medium text-gray-400 transition hover:text-amber-400">
              {t.viewFullList} →
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <MobilePageShell activePath="/rankings" title={t.pageTitle}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header + Period Filter */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">{t.pageTitle}</h1>
              <p className="mt-2 text-sm text-gray-400">
                {t.pageDesc}
              </p>
            </div>
            <MobileScrollTabs
              items={periods}
              value={period}
              onChange={(key) => setPeriod(key as TimePeriod)}
            />
          </div>

          {/* Three-Column Leaderboard Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {renderSection(
              t.hotRanking,
              '🔥',
              hotRanking,
              (d) => `${formatViews(d.viewCount || 0)} ${t.viewsSuffix}`,
            )}
            {renderSection(
              t.newArrivals,
              '💎',
              newArrivals,
              (d) => daysAgo(d.createdAt || '', t),
            )}
            {renderSection(
              t.mostCollected,
              '🔖',
              mostCollected,
              (d) => `~${formatViews((d.viewCount || 0) / 3)} ${t.favsSuffix}`,
            )}
          </div>
        </div>
    </MobilePageShell>
  );
}
