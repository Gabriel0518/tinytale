'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dramasApi, categoriesApi, featuredApi } from '@/lib/api';
import { Drama, Category } from '@/types';

export default function Home() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<{ [key: string]: Drama[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dramasRes, categoriesRes, featuredRes] = await Promise.all([
          dramasApi.getAll({ limit: 12 }),
          categoriesApi.getAll(),
          dramasApi.getFeatured(),
        ]);

        setDramas(dramasRes.data?.dramas || []);
        setCategories(categoriesRes.data || []);
        setFeatured(featuredRes.data || {});
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroDrama = dramas[0] || {};

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
            <Link href="/rankings" className="text-sm font-medium text-gray-300 hover:text-white">
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
            <Link
              href="/auth/register"
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="relative h-[60vh] w-full overflow-hidden md:h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroDrama.cover || 'https://picsum.photos/seed/hero/1920/1080'})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />

        <div className="absolute bottom-20 left-0 right-0 mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            {heroDrama.title || 'Loading...'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-300 md:text-base">
            {heroDrama.description || 'Discover amazing short dramas'}
          </p>
          <div className="mt-4 flex gap-3">
            {heroDrama._id && (
              <Link
                href={`/drama/${heroDrama._id}`}
                className="flex items-center gap-2 rounded bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Now
              </Link>
            )}
            <button className="flex items-center gap-2 rounded bg-gray-600 px-6 py-2.5 font-medium text-white transition hover:bg-gray-700">
              More Info
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-4">
          <Link
            href="/browse"
            className="whitespace-nowrap rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/browse?category=${category.slug}`}
              className="whitespace-nowrap rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Content */}
      {featured.featured && featured.featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="mb-6 text-xl font-bold text-white">Featured</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {featured.featured.slice(0, 5).map((drama: Drama) => (
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
                    <p className="text-xs text-gray-300">{drama.rating?.toFixed(1)} ★</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Dramas */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-6 text-xl font-bold text-white">Trending Dramas</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
            ))}
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
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#141414] py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-white">TinyTale</span>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            © 2024 TinyTale. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
