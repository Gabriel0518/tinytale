"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { mockDramas } from "@/lib/mockData";

const hotSearchItems = [
  { rank: 1, title: "The Billionaire's Secret", type: "trending" as const },
  { rank: 2, title: "Love in the Rain", type: "views" as const, value: "23k" },
  { rank: 3, title: "My Boss is a Vampire", type: "views" as const, value: "19k" },
  { rank: 4, title: "Revenge of the Ex", type: "trending" as const },
  { rank: 5, title: "Forbidden Love", type: "views" as const },
];

const trendingTags = ["Romance", "ReelShort", "CEO", "Revenge", "Fantasy"];

const ITEMS_PER_PAGE = 10;

function getDramaBadge(drama: Drama): string | null {
  if ((drama.viewCount || 0) > 2000000) return "HOT";
  if (drama.createdAt && new Date(drama.createdAt) > new Date("2024-09-01")) return "NEW";
  return null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [allDramas, setAllDramas] = useState<Drama[]>([]);
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDramas = async () => {
      try {
        const res = await dramasApi.getAll({ limit: 50 });
        const data = res.data?.dramas || [];
        setAllDramas(data.length > 0 ? data : mockDramas);
      } catch {
        setAllDramas(mockDramas);
      }
    };
    fetchDramas();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [allDramas]);

  const doSearch = (q: string) => {
    setQuery(q);
    setInputValue(q);
    setCurrentPage(1);
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    const lower = q.toLowerCase();
    const matched = allDramas.filter(
      (d) =>
        d.title.toLowerCase().includes(lower) ||
        d.description?.toLowerCase().includes(lower) ||
        d.categories?.some((c) => c.toLowerCase().includes(lower))
    );
    setResults(matched);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputValue);
  };

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          className="w-full rounded-full border border-gray-700 bg-[#1f1f1f] py-2 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(""); doSearch(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
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

                  {/* Sort Bar */}
                  <div className="mb-6 flex items-center gap-3">
                    <button className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white">
                      Relevance
                    </button>
                    <button className="flex items-center gap-1 rounded-full bg-[#2a2a2a] px-4 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                    </button>
                  </div>

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
                  ) : paginatedResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {paginatedResults.map((drama) => {
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
                              {badge && (
                                <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold ${badge === "HOT" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                                  {badge}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-sm text-gray-400 transition hover:text-white disabled:opacity-30"
                      >
                        &lt;
                      </button>
                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-red-600 text-white"
                              : "bg-[#2a2a2a] text-gray-400 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 3 && <span className="text-gray-500">...</span>}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-sm text-gray-400 transition hover:text-white disabled:opacity-30"
                      >
                        &gt;
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
                    <h3 className="mb-3 text-sm font-bold text-gray-400">🔥 Hot Searches</h3>
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
      <footer className="mt-8 border-t border-gray-800 bg-[#0a0a0a] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
                  <span className="text-lg font-bold text-white">T</span>
                </div>
                <span className="text-xl font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                The next generation of short-form storytelling. One-bite thousands of bite-sized drama anytime, anywhere.
              </p>
              {/* Social Icons */}
              <div className="mt-4 flex items-center gap-3">
                <a href="#" className="text-gray-500 transition hover:text-white" aria-label="Facebook">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-500 transition hover:text-white" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="text-gray-500 transition hover:text-white" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" className="text-gray-500 transition hover:text-white" aria-label="YouTube">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Discover */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Discover</h4>
              <div className="space-y-2">
                <Link href="/rankings" className="block text-sm text-gray-500 transition hover:text-white">Trending Now</Link>
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">Most Popular</Link>
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">New Releases</Link>
                <Link href="/browse" className="block text-sm text-gray-500 transition hover:text-white">Coming Soon</Link>
              </div>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Help Center</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Feedback</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Terms of Service</Link>
                <Link href="/help" className="block text-sm text-gray-500 transition hover:text-white">Privacy Policy</Link>
              </div>
            </div>

            {/* Column 4: Get the App */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Get the App</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
                <a href="#" className="flex items-center gap-3 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.627L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
            <p className="text-sm text-gray-600">&copy; 2025 TinyTale. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <a href="#" className="transition hover:text-white">Privacy</a>
              <span>·</span>
              <a href="#" className="transition hover:text-white">Cookies</a>
              <span>·</span>
              <a href="#" className="transition hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
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
