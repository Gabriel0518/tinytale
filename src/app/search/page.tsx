"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { getDramaBadge } from "@/lib/utils";
import { detectClientLocale, localizePath, SupportedLocale } from "@/lib/i18n";

const hotSearchItems = [
  { rank: 1, title: "The Billionaire's Secret", type: "trending" as const },
  { rank: 2, title: "Love in the Rain", type: "views" as const, value: "23k" },
  { rank: 3, title: "My Boss is a Vampire", type: "views" as const, value: "19k" },
  { rank: 4, title: "Revenge of the Ex", type: "trending" as const },
  { rank: 5, title: "Forbidden Love", type: "views" as const },
];

const trendingTags = ["Romance", "ReelShort", "CEO", "Revenge", "Fantasy"];

const ITEMS_PER_PAGE = 12;

const SEARCH_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: {
    searchPlaceholder: "Search dramas, genres...",
    searchAria: "Search dramas",
    clearSearch: "Clear search",
    searchMobilePlaceholder: "Search for dramas, genres, actors...",
    hotSearches: "Hot Searches",
    trendingTags: "Trending Tags",
    resultsFor: "Results for",
    searching: "Searching...",
    foundPrefix: "Found",
    foundSuffix: "dramas matching your search.",
    dramaFallback: "Drama",
    completed: "Completed",
    eps: "Eps",
    noResultsTitle: "No results found",
    noResultsDesc: "Try searching with different keywords",
    loadMore: "Load More",
    defaultTitle: "Search for your favorite dramas",
    defaultDesc: "Try a title, genre, or actor name",
    loading: "Loading...",
  },
  zh: {
    searchPlaceholder: "搜索短剧、类型...",
    searchAria: "搜索短剧",
    clearSearch: "清除搜索",
    searchMobilePlaceholder: "搜索短剧、类型、演员...",
    hotSearches: "热门搜索",
    trendingTags: "热门标签",
    resultsFor: "搜索结果",
    searching: "搜索中...",
    foundPrefix: "共找到",
    foundSuffix: "部短剧",
    dramaFallback: "短剧",
    completed: "已完结",
    eps: "集",
    noResultsTitle: "未找到结果",
    noResultsDesc: "请尝试其他关键词",
    loadMore: "加载更多",
    defaultTitle: "搜索你喜欢的短剧",
    defaultDesc: "试试输入剧名、类型或演员",
    loading: "加载中...",
  },
  ja: {
    searchPlaceholder: "ドラマやジャンルを検索...",
    searchAria: "ドラマ検索",
    clearSearch: "検索をクリア",
    searchMobilePlaceholder: "ドラマ・ジャンル・俳優で検索...",
    hotSearches: "人気検索",
    trendingTags: "トレンドタグ",
    resultsFor: "検索結果",
    searching: "検索中...",
    foundPrefix: "",
    foundSuffix: "件の作品が見つかりました",
    dramaFallback: "ドラマ",
    completed: "完結",
    eps: "話",
    noResultsTitle: "結果が見つかりません",
    noResultsDesc: "別のキーワードでお試しください",
    loadMore: "もっと見る",
    defaultTitle: "お気に入りのドラマを検索",
    defaultDesc: "タイトル・ジャンル・俳優で検索してみましょう",
    loading: "読み込み中...",
  },
  es: {
    searchPlaceholder: "Buscar dramas, géneros...",
    searchAria: "Buscar dramas",
    clearSearch: "Limpiar búsqueda",
    searchMobilePlaceholder: "Busca dramas, géneros, actores...",
    hotSearches: "Búsquedas populares",
    trendingTags: "Etiquetas en tendencia",
    resultsFor: "Resultados para",
    searching: "Buscando...",
    foundPrefix: "Se encontraron",
    foundSuffix: "dramas",
    dramaFallback: "Drama",
    completed: "Completado",
    eps: "Eps",
    noResultsTitle: "No se encontraron resultados",
    noResultsDesc: "Prueba con otras palabras clave",
    loadMore: "Cargar más",
    defaultTitle: "Busca tus dramas favoritos",
    defaultDesc: "Prueba por título, género o actor",
    loading: "Cargando...",
  },
  pt: {
    searchPlaceholder: "Buscar dramas, gêneros...",
    searchAria: "Buscar dramas",
    clearSearch: "Limpar busca",
    searchMobilePlaceholder: "Busque dramas, gêneros, atores...",
    hotSearches: "Buscas em alta",
    trendingTags: "Tags em alta",
    resultsFor: "Resultados para",
    searching: "Buscando...",
    foundPrefix: "Encontrados",
    foundSuffix: "dramas",
    dramaFallback: "Drama",
    completed: "Concluído",
    eps: "Eps",
    noResultsTitle: "Nenhum resultado encontrado",
    noResultsDesc: "Tente outras palavras-chave",
    loadMore: "Carregar mais",
    defaultTitle: "Busque seus dramas favoritos",
    defaultDesc: "Tente por título, gênero ou ator",
    loading: "Carregando...",
  },
  hi: {
    searchPlaceholder: "ड्रामा, जॉनर खोजें...",
    searchAria: "ड्रामा खोजें",
    clearSearch: "खोज साफ़ करें",
    searchMobilePlaceholder: "ड्रामा, जॉनर, अभिनेता खोजें...",
    hotSearches: "ट्रेंडिंग सर्च",
    trendingTags: "ट्रेंडिंग टैग",
    resultsFor: "परिणाम",
    searching: "खोज जारी है...",
    foundPrefix: "मिले",
    foundSuffix: "ड्रामा",
    dramaFallback: "ड्रामा",
    completed: "पूर्ण",
    eps: "एप",
    noResultsTitle: "कोई परिणाम नहीं मिला",
    noResultsDesc: "दूसरे कीवर्ड आज़माएँ",
    loadMore: "और लोड करें",
    defaultTitle: "अपने पसंदीदा ड्रामा खोजें",
    defaultDesc: "टाइटल, जॉनर या अभिनेता से खोजें",
    loading: "लोड हो रहा है...",
  },
  id: {
    searchPlaceholder: "Cari drama, genre...",
    searchAria: "Cari drama",
    clearSearch: "Hapus pencarian",
    searchMobilePlaceholder: "Cari drama, genre, aktor...",
    hotSearches: "Pencarian populer",
    trendingTags: "Tag tren",
    resultsFor: "Hasil untuk",
    searching: "Mencari...",
    foundPrefix: "Ditemukan",
    foundSuffix: "drama",
    dramaFallback: "Drama",
    completed: "Selesai",
    eps: "Ep",
    noResultsTitle: "Tidak ada hasil",
    noResultsDesc: "Coba kata kunci lain",
    loadMore: "Muat lebih banyak",
    defaultTitle: "Cari drama favoritmu",
    defaultDesc: "Coba judul, genre, atau aktor",
    loading: "Memuat...",
  },
};

const badgeStyles: Record<string, { label: string; className: string }> = {
  hot: { label: "HOT", className: "bg-red-600 text-white" },
  new: { label: "NEW", className: "bg-green-600 text-white" },
};

function SearchContent() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = SEARCH_TEXT[locale] || SEARCH_TEXT.en;
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
      router.push(localizePath("/search", locale));
      return;
    }
    setLoading(true);
    setHasSearched(true);
    // Update URL query params
    router.push(`${localizePath("/search", locale)}?q=${encodeURIComponent(q)}`);
    try {
      const res = await dramasApi.getAll({ search: q, limit: 50 });
      const data = res.data?.dramas || [];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

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
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAria}
          className="w-full rounded-full border border-gray-700 bg-[#1f1f1f] py-2 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(""); doSearch(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            aria-label={t.clearSearch}
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
                  placeholder={t.searchMobilePlaceholder}
                  className="w-full rounded-full border border-gray-700 bg-[#1f1f1f] py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(""); doSearch(""); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label={t.clearSearch}
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
                  <span className="text-base">🔥</span> {t.hotSearches}
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
                <h3 className="mb-4 text-sm font-bold text-white">{t.trendingTags}</h3>
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
                      {t.resultsFor}: <span className="italic text-red-500">&apos;{query}&apos;</span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {loading ? t.searching : `${t.foundPrefix} ${results.length} ${t.foundSuffix}`}
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
                          <Link key={drama._id} href={localizePath(`/drama/${drama._id}`, locale)} className="group">
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
                              {drama.categories?.[0] || t.dramaFallback} · {drama.isCompleted ? t.completed : `${drama.totalEpisodes || "?"} ${t.eps}`}
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
                      <p className="mt-4 text-lg font-medium text-gray-400">{t.noResultsTitle}</p>
                      <p className="mt-2 text-sm text-gray-500">{t.noResultsDesc}</p>
                    </div>
                  )}

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-10 flex justify-center">
                      <button
                        onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                        className="flex items-center gap-2 rounded-full border border-red-500/60 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-red-400 transition hover:border-red-400 hover:bg-red-400/10"
                      >
                        {t.loadMore}
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
                  <p className="mt-4 text-lg font-medium text-gray-400">{t.defaultTitle}</p>
                  <p className="mt-2 text-sm text-gray-600">{t.defaultDesc}</p>

                  {/* Mobile Hot Searches */}
                  <div className="mt-8 md:hidden">
                    <h3 className="mb-3 text-sm font-bold text-gray-400">{t.hotSearches}</h3>
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
          <div className="text-gray-400">{SEARCH_TEXT.en.loading}</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
