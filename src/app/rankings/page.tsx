'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';

type TabType = 'rating' | 'views' | 'newest';

export default function Rankings() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('rating');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const res = await dramasApi.getRankings(activeTab);
        setDramas(res.data || []);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [activeTab]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'rating', label: 'Top Rated' },
    { key: 'views', label: 'Most Viewed' },
    { key: 'newest', label: 'New Releases' },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 bg-[#141414]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-white">TinyTale</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/browse" className="text-sm font-medium text-gray-300 hover:text-white">
              Browse
            </Link>
            <Link href="/rankings"-sm font-medium text className="text-white">
              Rankings
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/search" className="text-gray-300 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Rankings</h1>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rankings List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex animate-pulse gap-4 rounded-lg bg-gray-800 p-4">
                  <div className="h-24 w-16 rounded bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-700" />
                    <div className="h-3 w-1/2 rounded bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : dramas.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              No rankings available
            </div>
          ) : (
            <div className="space-y-4">
              {dramas.map((drama, index) => (
                <Link
                  key={drama._id}
                  href={`/drama/${drama._id}`}
                  className="flex gap-4 rounded-lg bg-gray-900 p-4 transition hover:bg-gray-800"
                >
                  <div className="flex h-24 w-16 items-center justify-center text-2xl font-bold text-gray-600">
                    #{index + 1}
                  </div>
                  <img
                    src={drama.cover}
                    alt={drama.title}
                    className="h-24 w-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{drama.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-400">
                      <span>{drama.rating?.toFixed(1)} ★</span>
                      <span>{drama.viewCount?.toLocaleString()} views</span>
                      <span>{drama.year}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {drama.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
