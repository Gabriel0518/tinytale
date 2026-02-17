'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { mockDramas, mockCategories } from '@/lib/mockData';

export default function Home() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dramasRes, categoriesRes] = await Promise.all([
          dramasApi.getAll({ limit: 20 }),
          categoriesApi.getAll(),
        ]);
        const fetchedDramas = dramasRes.data?.dramas || [];
        const fetchedCategories = categoriesRes.data || [];
        setDramas(fetchedDramas.length > 0 ? fetchedDramas : mockDramas);
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories);
      } catch {
        setDramas(mockDramas);
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroDrama = dramas[0];
  const trendingDramas = dramas.slice(0, 8);
  const newReleases = [...dramas].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  ).slice(0, 8);
  const editorsChoice = dramas.filter(d => (d.rating || 0) >= 8.5).slice(0, 8);

  // Category pills from design
  const categoryPills = [
    { key: 'all', label: 'All' },
    ...categories.slice(0, 7).map(c => ({ key: c.slug, label: c.name })),
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/" variant="transparent" />

      {/* Hero Banner */}
      <section className="relative h-[70vh] w-full overflow-hidden md:h-[85vh]">
        {heroDrama ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroDrama.cover || 'https://picsum.photos/seed/hero/1920/1080'})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />

            <div className="absolute bottom-24 left-0 right-0 mx-auto max-w-7xl px-4 md:bottom-32">
              <h1 className="max-w-lg text-4xl font-bold leading-tight text-white md:text-6xl">
                {heroDrama.title}
              </h1>

              {/* Meta info: rating, genres, year, episodes */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1 text-yellow-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {heroDrama.rating?.toFixed(1)}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                {heroDrama.categories?.slice(0, 3).map((cat, i) => (
                  <span key={cat}>
                    {cat}{i < Math.min(heroDrama.categories!.length, 3) - 1 && ' · '}
                  </span>
                ))}
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                <span>{heroDrama.year}</span>
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                <span>{heroDrama.totalEpisodes} Episodes</span>
              </div>

              {/* Description */}
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
                {heroDrama.description}
              </p>

              {/* Action buttons */}
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/drama/${heroDrama._id}`}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Now
                </Link>
                <button className="flex items-center gap-2 rounded-full border border-gray-500 px-6 py-3 font-medium text-white transition hover:border-white hover:bg-white/10">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  My List
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          </div>
        )}
      </section>

      {/* Category Filter Pills */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categoryPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setActiveCategory(pill.key)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
                activeCategory === pill.key
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <button className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#3a3a3a] hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      </section>

      {/* Trending Now */}
      {loading ? (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
            ))}
          </div>
        </section>
      ) : (
        <HomeCarousel
          title="🔥 Trending Now"
          dramas={trendingDramas}
        />
      )}

      {/* New Releases */}
      {!loading && (
        <HomeCarousel
          title="✨ New Releases"
          dramas={newReleases}
        />
      )}

      {/* Editorial Banner */}
      <EditorialBanner
        title="Weekly Top Picks:"
        subtitle="The Best of Revenge"
        backgroundImage="https://picsum.photos/seed/editorial/800/400"
      />

      {/* Editor's Choice */}
      {!loading && editorsChoice.length > 0 && (
        <HomeCarousel
          title="⭐ Editor's Choice"
          dramas={editorsChoice}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0a0a0a] py-12 mt-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
                  <span className="text-lg font-bold text-white">T</span>
                </div>
                <span className="text-xl font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Watch premium short dramas anytime, anywhere.
              </p>
            </div>

            {/* Browse */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Browse</h4>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">All Dramas</Link>
                <Link href="/rankings" className="block text-sm text-gray-500 transition hover:text-white">Rankings</Link>
                <Link href="/browse?category=romance" className="block text-sm text-gray-500 transition hover:text-white">Romance</Link>
                <Link href="/browse?category=revenge" className="block text-sm text-gray-500 transition hover:text-white">Revenge</Link>
              </div>
            </div>

            {/* Account */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Account</h4>
              <div className="space-y-2">
                <Link href="/user/profile" className="block text-sm text-gray-500 transition hover:text-white">My Profile</Link>
                <Link href="/user/favorites" className="block text-sm text-gray-500 transition hover:text-white">My List</Link>
                <Link href="/user/history" className="block text-sm text-gray-500 transition hover:text-white">Watch History</Link>
                <Link href="/user/coins" className="block text-sm text-gray-500 transition hover:text-white">Coins</Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Help Center</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Terms of Service</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Privacy Policy</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Contact Us</Link>
              </div>
            </div>
          </div>

          {/* Social & Copyright */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} TinyTale. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-600 transition hover:text-white" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-gray-600 transition hover:text-white" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="text-gray-600 transition hover:text-white" aria-label="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="text-gray-600 transition hover:text-white" aria-label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
