'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { DramaCard } from '@/components/features/DramaCard';
import { detectClientLocale, localizePath, SupportedLocale } from '@/lib/i18n';

const CATEGORY_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: {
    categories: 'Categories',
    allDramas: 'All Dramas',
    sortBy: 'Sort dramas by',
    newest: 'Newest',
    topRated: 'Top Rated',
    all: 'All',
    retry: 'Retry',
    noDramas: 'No dramas found in this category',
    loadMore: 'Load More',
    remaining: 'remaining',
    errorFallback: 'Failed to load dramas. Please try again.',
  },
  zh: {
    categories: '分类',
    allDramas: '全部短剧',
    sortBy: '排序方式',
    newest: '最新',
    topRated: '高分',
    all: '全部',
    retry: '重试',
    noDramas: '该分类暂无短剧',
    loadMore: '加载更多',
    remaining: '剩余',
    errorFallback: '加载短剧失败，请重试。',
  },
  ja: {
    categories: 'カテゴリ',
    allDramas: 'すべてのドラマ',
    sortBy: '並び替え',
    newest: '新着',
    topRated: '高評価',
    all: 'すべて',
    retry: '再試行',
    noDramas: 'このカテゴリには作品がありません',
    loadMore: 'もっと見る',
    remaining: '件',
    errorFallback: '読み込みに失敗しました。再試行してください。',
  },
  es: {
    categories: 'Categorías',
    allDramas: 'Todos los dramas',
    sortBy: 'Ordenar',
    newest: 'Más recientes',
    topRated: 'Mejor valorados',
    all: 'Todo',
    retry: 'Reintentar',
    noDramas: 'No hay dramas en esta categoría',
    loadMore: 'Cargar más',
    remaining: 'restantes',
    errorFallback: 'No se pudieron cargar los dramas.',
  },
  pt: {
    categories: 'Categorias',
    allDramas: 'Todos os dramas',
    sortBy: 'Ordenar por',
    newest: 'Mais novos',
    topRated: 'Melhor avaliados',
    all: 'Todos',
    retry: 'Tentar novamente',
    noDramas: 'Nenhum drama nesta categoria',
    loadMore: 'Carregar mais',
    remaining: 'restantes',
    errorFallback: 'Falha ao carregar dramas.',
  },
  hi: {
    categories: 'श्रेणियाँ',
    allDramas: 'सभी ड्रामा',
    sortBy: 'क्रमबद्ध करें',
    newest: 'नवीनतम',
    topRated: 'शीर्ष रेटेड',
    all: 'सभी',
    retry: 'फिर से प्रयास करें',
    noDramas: 'इस श्रेणी में कोई ड्रामा नहीं मिला',
    loadMore: 'और लोड करें',
    remaining: 'बाकी',
    errorFallback: 'ड्रामा लोड नहीं हो पाया।',
  },
  id: {
    categories: 'Kategori',
    allDramas: 'Semua drama',
    sortBy: 'Urutkan',
    newest: 'Terbaru',
    topRated: 'Rating tertinggi',
    all: 'Semua',
    retry: 'Coba lagi',
    noDramas: 'Tidak ada drama di kategori ini',
    loadMore: 'Muat lebih banyak',
    remaining: 'tersisa',
    errorFallback: 'Gagal memuat drama.',
  },
};

function CategoryContent() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = CATEGORY_TEXT[locale] || CATEGORY_TEXT.en;
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [retryCount, setRetryCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);

  const ITEMS_PER_PAGE = 12;

  /* Sync selectedCategory from URL search params */
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  /* Update URL when category changes */
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setVisibleCount(ITEMS_PER_PAGE);
    if (category === 'all') {
      router.push(localizePath('/category', locale));
    } else {
      router.push(`${localizePath('/category', locale)}?category=${category}`);
    }
  }, [router, locale]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
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
        const params: { category?: string; sort?: string; limit?: number } = { limit: 50 };
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        params.sort = sortBy;

        const res = await dramasApi.getAll(params);
        setDramas(res.data?.dramas || []);
      } catch (err) {
        console.error('Failed to fetch dramas:', err);
        setError(t.errorFallback);
      } finally {
        setLoading(false);
      }
    };
    fetchDramas();
  }, [selectedCategory, sortBy, retryCount, t.errorFallback]);

  const currentCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden w-48 flex-shrink-0 md:block">
              <h3 className="mb-4 text-sm font-semibold text-text-tertiary uppercase">{t.categories}</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => handleCategoryChange('all')}
                  aria-pressed={selectedCategory === 'all'}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedCategory === 'all'
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  {t.allDramas}
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryChange(category.slug)}
                    aria-pressed={selectedCategory === category.slug}
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
                  {currentCategory?.name || t.allDramas}
                </h1>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label={t.sortBy}
                  className="rounded-lg border border-bg-elevated bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                >
                  <option value="newest">{t.newest}</option>
                  <option value="rating">{t.topRated}</option>
                </select>
              </div>

              {/* Mobile Categories */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
                <button
                  onClick={() => handleCategoryChange('all')}
                  aria-pressed={selectedCategory === 'all'}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {t.all}
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryChange(category.slug)}
                    aria-pressed={selectedCategory === category.slug}
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
                  <p role="alert" className="text-red-400">{error}</p>
                  <button
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="mt-4 rounded bg-accent-primary px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    {t.retry}
                  </button>
                </div>
              ) : dramas.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-text-tertiary">{t.noDramas}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {dramas.slice(0, visibleCount).map((drama) => (
                      <Link key={drama._id} href={localizePath(`/drama/${drama._id}`, locale)}>
                        <DramaCard drama={drama} />
                      </Link>
                    ))}
                  </div>
                  {visibleCount < dramas.length && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                        className="rounded-lg border border-bg-elevated bg-bg-secondary px-6 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-elevated"
                      >
                        {t.loadMore} ({dramas.length - visibleCount} {t.remaining})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary">
          <Navbar />
          <main className="pt-20 pb-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex gap-8">
                <aside className="hidden w-48 flex-shrink-0 md:block">
                  <div className="mb-4 h-4 w-24 animate-pulse rounded bg-bg-elevated" />
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-9 animate-pulse rounded-lg bg-bg-elevated" />
                    ))}
                  </div>
                </aside>
                <div className="flex-1">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-8 w-40 animate-pulse rounded bg-bg-elevated" />
                    <div className="h-9 w-28 animate-pulse rounded-lg bg-bg-elevated" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-bg-elevated" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
