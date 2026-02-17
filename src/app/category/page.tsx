'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { DramaCard } from '@/components/features/DramaCard';

function CategoryContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await categoriesApi.getAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDramas = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { limit: 50 };
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        params.sort = sortBy;

        const res: any = await dramasApi.getAll(params);
        setDramas(res.data?.dramas || []);
      } catch (err) {
        console.error('Failed to fetch dramas:', err);
        setError('Failed to load dramas. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDramas();
  }, [selectedCategory, sortBy]);

  const currentCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden w-48 flex-shrink-0 md:block">
              <h3 className="mb-4 text-sm font-semibold text-text-tertiary uppercase">Categories</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedCategory === 'all'
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  All Dramas
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedCategory === category.slug
                        ? 'bg-accent-primary text-white'
                        : 'text-text-secondary hover:bg-bg-secondary'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">
                  {currentCategory?.name || 'All Dramas'}
                </h1>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-bg-elevated bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Mobile Categories */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedCategory === category.slug
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Drama Grid */}
              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-bg-elevated" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory)}
                    className="mt-4 rounded bg-accent-primary px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Retry
                  </button>
                </div>
              ) : dramas.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-text-tertiary">No dramas found in this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {dramas.map((drama) => (
                    <Link key={drama._id} href={`/drama/${drama._id}`}>
                      <DramaCard drama={drama} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <CategoryContent />
    </Suspense>
  );
}
