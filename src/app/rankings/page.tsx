'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { mockDramas } from '@/lib/mockData';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';

function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return String(n);
}

function daysAgo(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function rankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-gray-600';
}

export default function Rankings() {
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
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'all', label: 'All Time' },
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
            <Link href={`/drama/${dramas[0]._id}`} className="group relative mb-4 block overflow-hidden rounded-lg">
              <div className="relative aspect-[3/4]">
                <Image
                  src={dramas[0].cover}
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
                href={`/drama/${drama._id}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[#252525]"
              >
                <span className={`w-5 text-center text-sm font-bold ${rankColor(i + 2)}`}>
                  {i + 2}
                </span>
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
                  <Image
                    src={drama.cover}
                    alt={drama.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-white">{drama.title}</h4>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {drama.categories?.[0] || 'Drama'} · {metricFn(drama)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* View Full List */}
          <div className="mt-3 border-t border-gray-800 pt-3 text-center">
            <Link href="/browse" className="text-xs font-medium text-gray-400 transition hover:text-amber-400">
              View Full List →
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/rankings" />

      <div className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header + Period Filter */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Drama Leaderboards</h1>
              <p className="mt-2 text-sm text-gray-400">
                Discover the most popular short dramas updated daily.
              </p>
            </div>
            <div className="flex gap-1 rounded-full bg-[#1f1f1f] p-1">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  aria-pressed={period === p.key}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    period === p.key
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Three-Column Leaderboard Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {renderSection(
              'Hot Ranking',
              '🔥',
              hotRanking,
              (d) => `${formatViews(d.viewCount || 0)} Views`,
            )}
            {renderSection(
              'New Arrivals',
              '💎',
              newArrivals,
              (d) => daysAgo(d.createdAt || ''),
            )}
            {renderSection(
              'Most Collected (Est.)',
              '🔖',
              mostCollected,
              (d) => `~${formatViews((d.viewCount || 0) / 3)} Favs`,
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
