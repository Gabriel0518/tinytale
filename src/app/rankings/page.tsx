'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';
import { Navbar } from '@/components/features/Navbar';

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
      <Navbar activePath="/rankings" />

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
