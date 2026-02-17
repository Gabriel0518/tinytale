'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { mockDramas, mockCategories } from '@/lib/mockData';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'ongoing' | 'completed' | 'upcoming';
type SortOption = 'popular' | 'latest' | 'top-rated';

// Badge config for drama status/tags
const statusBadges: Record<string, { label: string; className: string }> = {
  hot: { label: 'HOT', className: 'bg-red-600 text-white' },
  new: { label: 'NEW', className: 'bg-green-600 text-white' },
  vip: { label: 'VIP', className: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black' },
  completed: { label: 'Completed', className: 'bg-blue-600/80 text-white' },
  ongoing: { label: 'Ongoing', className: 'bg-orange-500 text-white' },
  'coming-soon': { label: 'COMING SOON', className: 'bg-purple-600 text-white' },
};

function getDramaBadge(drama: Drama): string | null {
  if ((drama.viewCount || 0) > 2000000) return 'hot';
  if (drama.createdAt && new Date(drama.createdAt) > new Date('2024-09-01')) return 'new';
  if (drama.isCompleted) return 'completed';
  if (drama.status === 'published' && !drama.isCompleted) return 'ongoing';
  return null;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dramasRes, categoriesRes] = await Promise.all([
          dramasApi.getAll({ limit: 50 }),
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

  // Filter & sort
  const filtered = dramas
    .filter(d => {
      if (selectedCategory !== 'all' && !d.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase())) return false;
      if (statusFilter === 'ongoing' && d.isCompleted) return false;
      if (statusFilter === 'completed' && !d.isCompleted) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === 'latest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'top-rated') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const genrePills = [
    { key: 'all', label: 'All' },
    ...categories.map(c => ({ key: c.slug, label: c.name })),
  ];

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'upcoming', label: 'Upcoming' },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'popular', label: 'Popular' },
    { key: 'latest', label: 'Latest' },
    { key: 'top-rated', label: 'Top Rated' },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/browse" />

      <div className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">
            Browse Library
          </h1>
          <p className="mt-2 text-sm text-gray-400 md:text-base">
            Discover thousands of bite-sized dramas tailored for you.
          </p>

          {/* Filter Section */}
          <div className="mt-8 space-y-5">
            {/* Genre Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">Genre</span>
              <div className="flex flex-wrap gap-2">
                {genrePills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => { setSelectedCategory(pill.key); setVisibleCount(12); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      selectedCategory === pill.key
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setStatusFilter(opt.key); setVisibleCount(12); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      statusFilter === opt.key
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">Sort by</span>
                <div className="flex gap-4">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`text-sm font-medium transition ${
                        sortBy === opt.key
                          ? 'text-white underline underline-offset-4 decoration-amber-500 decoration-2'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Showing {filtered.length} results
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                    aria-label="Grid view"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                    aria-label="List view"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drama Grid / List */}
          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-800" />
                    <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                No dramas found matching your filters.
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {visible.map((drama) => {
                  const badge = getDramaBadge(drama);
                  return (
                    <Link key={drama._id} href={`/drama/${drama._id}`} className="group">
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                        {/* Status Badge */}
                        {badge && statusBadges[badge] && (
                          <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadges[badge].className}`}>
                            {statusBadges[badge].label}
                          </span>
                        )}
                        {/* Hover Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-medium text-white">{drama.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {drama.categories?.[0] || 'Drama'}
                        {' · '}
                        Ep {drama.totalEpisodes || '?'}
                        {' · '}
                        <span className="text-yellow-500">★ {drama.rating?.toFixed(1)}</span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {visible.map((drama) => {
                  const badge = getDramaBadge(drama);
                  return (
                    <Link key={drama._id} href={`/drama/${drama._id}`} className="group flex gap-4 rounded-lg bg-[#1f1f1f] p-4 transition hover:bg-[#2a2a2a]">
                      <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-lg">
                        <img src={drama.cover} alt={drama.title} className="h-full w-full object-cover" />
                        {badge && statusBadges[badge] && (
                          <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${statusBadges[badge].className}`}>
                            {statusBadges[badge].label}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white">{drama.title}</h3>
                        <p className="mt-1 text-sm text-gray-400">{drama.categories?.join(' · ')}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{drama.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>{drama.totalEpisodes} Episodes</span>
                          <span>{drama.year}</span>
                          <span className="text-yellow-500">★ {drama.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="flex items-center gap-2 rounded-full border border-amber-500/60 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-amber-400 transition hover:border-amber-400 hover:bg-amber-400/10"
              >
                Load More Dramas
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0a0a0a] py-12 mt-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
                  <span className="text-lg font-bold text-white">T</span>
                </div>
                <span className="text-xl font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">Watch premium short dramas anytime, anywhere.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Discover</h4>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">Browse All</Link>
                <Link href="/rankings" className="block text-sm text-gray-500 transition hover:text-white">Rankings</Link>
                <Link href="/browse?category=romance" className="block text-sm text-gray-500 transition hover:text-white">Romance</Link>
                <Link href="/browse?category=revenge" className="block text-sm text-gray-500 transition hover:text-white">Revenge</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Help Center</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Terms of Service</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Privacy Policy</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Contact Us</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Get the App</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  App Store
                </a>
                <a href="#" className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
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

export default function Browse() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#141414]" />}>
      <BrowseContent />
    </Suspense>
  );
}