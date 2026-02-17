'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';

function BrowseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [sortBy, setSortBy] = useState<string>('rating');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await categoriesApi.getAll();
        setCategories(res.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDramas = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 50 };
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        params.sort = sortBy;

        const res: any = await dramasApi.getAll(params);
        setDramas(res.data?.dramas || []);
      } catch (error) {
        console.error('Failed to fetch dramas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDramas();
  }, [selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <Navbar activePath="/browse" />

      <div className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Browse Dramas</h1>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === cat.slug
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white"
            >
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : dramas.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              No dramas found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
              {dramas.map((drama) => (
                <Link key={drama._id} href={`/drama/${drama._id}`}>
                  <div className="group relative aspect-[2/3] overflow-hidden rounded-lg">
                    <img
                      src={drama.cover}
                      alt={drama.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                      <p className="truncate text-sm font-medium text-white">{drama.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-300">{drama.rating?.toFixed(1)} ★</p>
                        <p className="text-xs text-gray-300">{drama.year}</p>
                      </div>
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

export default function Browse() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#141414]" />}>
      <BrowseContent />
    </Suspense>
  );
}
