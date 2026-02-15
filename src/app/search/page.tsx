"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { DramaCard } from "@/components/features/DramaCard";
import { mockDramas } from "@/lib/mockData";

const hotSearches = ["Romance", "CEO", "Sweet", "Revenge", "Drama"];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<typeof mockDramas>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      const filtered = mockDramas.filter(
        (drama) =>
          drama.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          drama.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          drama.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setResults(filtered);
      setHasSearched(true);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleHotSearch = (tag: string) => {
    handleSearch(tag);
  };

  return (
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
                className="w-full rounded-full border border-bg-elevated bg-bg-secondary px-6 py-4 text-lg text-text-primary placeholder-text-tertiary focus:border-accent-primary focus:outline-none"
              />
              <button className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-accent-primary text-white transition hover:bg-red-700">
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
            <h3 className="mb-4 text-sm font-semibold text-text-tertiary uppercase">Hot Searches</h3>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleHotSearch(tag)}
                  className="rounded-full bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-elevated hover:text-text-primary"
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
              <h2 className="text-lg font-semibold text-text-primary">
                {results.length} {results.length === 1 ? "Result" : "Results"} for &quot;{query}&quot;
              </h2>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((drama) => (
                  <DramaCard key={drama.id} drama={drama} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-16 w-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-text-secondary">No results found</p>
                <p className="mt-2 text-text-tertiary">Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
