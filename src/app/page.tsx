'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { Footer } from '@/components/features/Footer';
import { mockDramas, mockCategories } from '@/lib/mockData';

export default function Home() {
  const router = useRouter();
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

  // Filter dramas by active category
  const filteredDramas = useMemo(() => {
    if (activeCategory === 'all') return dramas;
    return dramas.filter(d =>
      d.categories?.some(c => c.toLowerCase() === activeCategory.toLowerCase())
    );
  }, [dramas, activeCategory]);

  const trendingDramas = useMemo(() => filteredDramas.slice(0, 8), [filteredDramas]);
  const newReleases = useMemo(() =>
    [...filteredDramas].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    ).slice(0, 8),
    [filteredDramas]
  );
  const editorsChoice = useMemo(() =>
    filteredDramas.filter(d => (d.rating || 0) >= 8.5).slice(0, 8),
    [filteredDramas]
  );

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
                backgroundImage: `url(${heroDrama.horizontalCover || heroDrama.cover || 'https://picsum.photos/seed/hero/1920/1080'})`,
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
                    {cat}{i < Math.min((heroDrama.categories?.length ?? 0), 3) - 1 && ' · '}
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
                <button
                  onClick={() => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('token');
                    if (token) {
                      router.push('/user/favorites');
                    } else {
                      router.push('/auth/login?redirect=/user/favorites');
                    }
                  }}
                  className="flex items-center gap-2 rounded-full border border-gray-500 px-6 py-3 font-medium text-white transition hover:border-white hover:bg-white/10"
                >
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
              aria-pressed={activeCategory === pill.key}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
                activeCategory === pill.key
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
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
      {!loading && (
        <EditorialBanner
          title="Weekly Top Picks:"
          subtitle="The Best of Revenge"
          backgroundImage="https://picsum.photos/seed/editorial/800/400"
        />
      )}

      {/* Editor's Choice */}
      {!loading && editorsChoice.length > 0 && (
        <HomeCarousel
          title="⭐ Editor's Choice"
          dramas={editorsChoice}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
