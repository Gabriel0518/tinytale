"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { getDramaBadge } from "@/lib/utils";

const hotSearchItems = [
  { rank: 1, title: "The Billionaire's Secret", type: "trending" as const },
  { rank: 2, title: "Love in the Rain", type: "views" as const, value: "23k" },
  { rank: 3, title: "My Boss is a Vampire", type: "views" as const, value: "19k" },
  { rank: 4, title: "Revenge of the Ex", type: "trending" as const },
  { rank: 5, title: "Forbidden Love", type: "views" as const },
];

const trendingTags = ["Romance", "ReelShort", "CEO", "Revenge", "Fantasy"];

const ITEMS_PER_PAGE = 12;

const badgeStyles: Record<string, { label: string; className: string }> = {
  hot: { label: "HOT", className: "bg-red-600 text-white" },
  new: { label: "NEW", className: "bg-green-600 text-white" },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    setInputValue(q);
    setVisibleCount(ITEMS_PER_PAGE);
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      // Clear URL param
      router.push("/search");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    // Update URL query params
    router.push(`/search?q=${encodeURIComponent(q)}`);
    try {
      const res = await dramasApi.getAll({ search: q, limit: 50 });
      const data = res.data?.dramas || [];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputValue);
  };

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  const searchInput = (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search dramas, genres..."
          aria-label="Search dramas"
          className="w-full rounded-full border border-gray-700 bg-[#1f1f1f] py-2 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(""); doSearch(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar showSearch={false} renderSearch={searchInput} />

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Mobile Search Bar */}
          <div className="mb-6 md:hidden">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search for dramas, genres, actors..."
                  className="w-full rounded-full border border-gray-700 bg-[#1f1f1f] py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(""); doSearch(""); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label="Clear search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Two-Column Layout */}
          <div className="flex gap-8">
            {/* Left Sidebar */}
            <aside className="hidden w-64 shrink-0 md:block">
              {/* Hot Searches */}
              <div className="rounded-xl bg-[#1a1a1a] p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-base">🔥</span> Hot Searches
                </h3>
                <div className="space-y-1">
                  {hotSearchItems.map((item) => (
                    <button
                      key={item.rank}
                      onClick={() => doSearch(item.title)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#252525]"
                    >
                      <span className={`w-5 text-center text-xs font-bold ${item.rank <= 3 ? "text-amber-400" : "text-gray-600"}`}>
                        #{item.rank}
                      </span>
                      <span className="flex-1 truncate text-sm text-gray-300">{item.title}</span>
                      {item.type === "views" && item.value && (
                        <span className="text-[10px] text-gray-500">{item.value}</span>
                      )}
                      {item.type === "trending" && (
                        <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Tags */}
              <div className="mt-6 rounded-xl bg-[#1a1a1a] p-5">
                <h3 className="mb-4 text-sm font-bold text-white">Trending Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => doSearch(tag)}
                      className="rounded-full bg-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-[#3a3a3a] hover:text-white"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              {hasSearched ? (
                <>
                  {/* Results Header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white">
                      Results for: <span className="italic text-red-500">&apos;{query}&apos;</span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {loading ? "Searching..." : `Found ${results.length} dramas matching your search.`}
                    </p>
                  </div>

                  {/* Sort Bar - removed non-functional buttons */}

                  {/* Results Grid */}
                  {loading ? (
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i}>
                          <div className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
                          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-800" />
                        </div>
                      ))}
                    </div>
                  ) : visibleResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {visibleResults.map((drama) => {
                        const badge = getDramaBadge(drama);
                        return (
                          <Link key={drama._id} href={`/drama/${drama._id}`} className="group">
                            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                              <Image
                                src={drama.cover}
                                alt={drama.title}
                                fill
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                              {badge && badgeStyles[badge] && (
                                <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold ${badgeStyles[badge].className}`}>
                                  {badgeStyles[badge].label}
                                </span>
                              )}
                              {drama.rating && (
                                <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                                  ★ {drama.rating.toFixed(1)}
                                </span>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <h3 className="mt-2 truncate text-sm font-medium text-white">{drama.title}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {drama.categories?.[0] || "Drama"} · {drama.isCompleted ? "Completed" : `${drama.totalEpisodes || "?"} Eps`}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    /* No Results */
                    <div className="py-16 text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-4 text-lg font-medium text-gray-400">No results found</p>
                      <p className="mt-2 text-sm text-gray-500">Try searching with different keywords</p>
                    </div>
                  )}

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-10 flex justify-center">
                      <button
                        onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                        className="flex items-center gap-2 rounded-full border border-red-500/60 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-red-400 transition hover:border-red-400 hover:bg-red-400/10"
                      >
                        Load More
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Default State - No Search Yet */
                <div className="py-16 text-center">
                  <svg className="mx-auto h-20 w-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-4 text-lg font-medium text-gray-400">Search for your favorite dramas</p>
                  <p className="mt-2 text-sm text-gray-600">Try a title, genre, or actor name</p>

                  {/* Mobile Hot Searches */}
                  <div className="mt-8 md:hidden">
                    <h3 className="mb-3 text-sm font-bold text-gray-400">Hot Searches</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {hotSearchItems.map((item) => (
                        <button
                          key={item.rank}
                          onClick={() => doSearch(item.title)}
                          className="rounded-full bg-[#2a2a2a] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#3a3a3a]"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#141414]">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
