'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { mockDramas } from '@/lib/mockData';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return String(n);
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
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
        const res = await dramasApi.getRankings('rating');
        const data = res.data || [];
        setAllDramas(data.length > 0 ? data : mockDramas);
      } catch {
        setAllDramas(mockDramas);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Three ranking lists
  const hotRanking = [...allDramas]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);
  const newArrivals = [...allDramas]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);
  const mostCollected = [...allDramas]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
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
                <img
                  src={dramas[0].cover}
                  alt={dramas[0].title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
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
                <img
                  src={drama.cover}
                  alt={drama.title}
                  className="h-14 w-10 shrink-0 rounded object-cover"
                />
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
              'Most Collected',
              '🔖',
              mostCollected,
              (d) => `${formatViews((d.viewCount || 0) / 3)}+ Favs`,
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 bg-[#0a0a0a] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
                  <span className="text-lg font-bold text-white">T</span>
                </div>
                <span className="text-xl font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">The next generation of streaming. Watch short dramas anytime, anywhere.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Discover</h4>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">Browse All</Link>
                <Link href="/rankings" className="block text-sm text-gray-500 transition hover:text-white">Rankings</Link>
                <Link href="/browse?category=romance" className="block text-sm text-gray-500 transition hover:text-white">New Releases</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Genres</h4>
              <div className="space-y-2">
                <Link href="/browse?category=romance" className="block text-sm text-gray-500 transition hover:text-white">Romance</Link>
                <Link href="/browse?category=revenge" className="block text-sm text-gray-500 transition hover:text-white">Revenge</Link>
                <Link href="/browse?category=fantasy" className="block text-sm text-gray-500 transition hover:text-white">Fantasy</Link>
                <Link href="/browse?category=suspense" className="block text-sm text-gray-500 transition hover:text-white">Suspense</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Help Center</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Terms of Service</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Privacy Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Get the App</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  App Store
                </a>
                <a href="#" className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-800 pt-8 text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} TinyTale. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
