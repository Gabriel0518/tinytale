"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";

const hotSearches = ["Romance", "CEO", "Sweet", "Revenge", "Drama"];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      setLoading(true);
      try {
        const res = await dramasApi.getAll({ search: searchQuery });
        setResults(res.data?.dramas || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleHotSearch = (tag: string) => {
    handleSearch(tag);
  };

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <Navbar showSearch={false} />

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Search Header */}
          <div className="mb-8">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for dramas..."
                  className="w-full rounded-full border border-gray-800 bg-gray-900 px-6 py-4 text-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                />
                <button
                  onClick={() => handleSearch(query)}
                  className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Hot Searches */}
          {!hasSearched && (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase">Hot Searches</h3>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleHotSearch(tag)}
                    className="rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {hasSearched && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {loading ? 'Searching...' : `${results.length} ${results.length === 1 ? "Result" : "Results"} for "${query}"`}
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.map((drama) => (
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
              ) : (
                <div className="py-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-lg font-medium text-gray-400">No results found</p>
                  <p className="mt-2 text-gray-500">Try searching with different keywords</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141414] pt-20 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
