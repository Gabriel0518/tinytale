'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import { categoriesApi, dramasApi } from '@/lib/api';
import { MobileBrowseGridSkeleton, MobilePillRowSkeleton } from '@/components/mobile/MobileSkeletons';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { useLocale } from '@/hooks/useLocale';
import { usePlatform } from '@/hooks/usePlatform';
import { localizeCategoryLabel, normalizeCategoryKey } from '@/lib/categoryI18n';
import { localizePath, SupportedLocale } from '@/lib/i18n';
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { resolveSafeImageUrl } from '@/lib/safe-image';
import { getDramaBadge, resolveDramaMode } from '@/lib/utils';
import { readViewCache, writeViewCache } from '@/lib/view-cache';
import { Category, Drama } from '@/types';

type StatusFilter = 'all' | 'ongoing' | 'completed' | 'upcoming';
type SortOption = 'popular' | 'latest' | 'top-rated';
type CardBadge = 'hot' | 'new' | 'top';

type BrowseViewCache = {
  dramas: Drama[];
  categories: Category[];
};

const BROWSE_VIEW_CACHE_MAX_AGE_MS = 3 * 60 * 1000;

const badgeStyles: Record<CardBadge, { label: string; className: string }> = {
  hot: { label: 'HOT', className: 'bg-[#ff3b5c] text-white' },
  new: { label: 'NEW', className: 'bg-[#40d27f] text-black' },
  top: { label: 'TOP', className: 'bg-[#ffd84d] text-black' },
};

const BROWSE_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    title: 'Browse Library',
    subtitle: 'Discover your next vertical drama by mood, genre, and momentum.',
    genre: 'Genre',
    status: 'Status',
    sortBy: 'Sort',
    all: 'All',
    ongoing: 'Ongoing',
    completed: 'Completed',
    upcoming: 'Upcoming',
    popular: 'Popular',
    latest: 'Latest',
    topRated: 'Top Rated',
    noUpcoming: 'No upcoming dramas at the moment. Check back soon.',
    noResults: 'No dramas found matching your filters.',
    dramaFallback: 'Drama',
    epShort: 'eps',
    results: 'results',
    loadMore: 'Load More',
    refreshPull: 'PULL TO REFRESH',
    refreshRelease: 'RELEASE TO REFRESH',
    refreshing: 'REFRESHING',
    curatedForYou: 'Curated for your next binge',
  },
  zh: {
    title: '浏览片库',
    subtitle: '按题材、状态和热度，快速找到下一部想追的竖屏短剧。',
    genre: '类型',
    status: '状态',
    sortBy: '排序',
    all: '全部',
    ongoing: '连载中',
    completed: '已完结',
    upcoming: '即将上线',
    popular: '热门',
    latest: '最新',
    topRated: '高分',
    noUpcoming: '暂无即将上线短剧，晚点再来看看。',
    noResults: '没有符合当前筛选条件的短剧。',
    dramaFallback: '短剧',
    epShort: '集',
    results: '部结果',
    loadMore: '加载更多',
    refreshPull: '下拉刷新',
    refreshRelease: '松开刷新',
    refreshing: '刷新中',
    curatedForYou: '为你挑选的下一部上头短剧',
  },
  ja: {
    title: 'ライブラリ',
    subtitle: '気分、ジャンル、人気から次に観る縦型ドラマを見つけよう。',
    genre: 'ジャンル',
    status: 'ステータス',
    sortBy: '並び替え',
    all: 'すべて',
    ongoing: '配信中',
    completed: '完結',
    upcoming: '近日公開',
    popular: '人気',
    latest: '新着',
    topRated: '高評価',
    noUpcoming: '近日公開の作品はまだありません。',
    noResults: '条件に合う作品がありません。',
    dramaFallback: 'ドラマ',
    epShort: '話',
    results: '件',
    loadMore: 'もっと見る',
    refreshPull: '引っ張って更新',
    refreshRelease: '離して更新',
    refreshing: '更新中',
    curatedForYou: '次にハマる作品をピックアップ',
  },
  es: {
    title: 'Explorar catálogo',
    subtitle: 'Encuentra tu próximo drama vertical por género, estado y energía.',
    genre: 'Género',
    status: 'Estado',
    sortBy: 'Ordenar',
    all: 'Todo',
    ongoing: 'En emisión',
    completed: 'Completado',
    upcoming: 'Próximamente',
    popular: 'Popular',
    latest: 'Reciente',
    topRated: 'Mejor valorado',
    noUpcoming: 'No hay próximos dramas por ahora.',
    noResults: 'No se encontraron dramas con esos filtros.',
    dramaFallback: 'Drama',
    epShort: 'eps',
    results: 'resultados',
    loadMore: 'Cargar más',
    refreshPull: 'DESLIZA PARA ACTUALIZAR',
    refreshRelease: 'SUELTA PARA ACTUALIZAR',
    refreshing: 'ACTUALIZANDO',
    curatedForYou: 'Tu próxima obsesión en vertical',
  },
  pt: {
    title: 'Explorar catálogo',
    subtitle: 'Encontre seu próximo drama vertical por clima, gênero e ritmo.',
    genre: 'Gênero',
    status: 'Status',
    sortBy: 'Ordenar',
    all: 'Todos',
    ongoing: 'Em andamento',
    completed: 'Concluído',
    upcoming: 'Em breve',
    popular: 'Popular',
    latest: 'Mais recente',
    topRated: 'Melhor avaliado',
    noUpcoming: 'Nenhum drama futuro no momento.',
    noResults: 'Nenhum drama encontrado para esses filtros.',
    dramaFallback: 'Drama',
    epShort: 'eps',
    results: 'resultados',
    loadMore: 'Carregar mais',
    refreshPull: 'PUXE PARA ATUALIZAR',
    refreshRelease: 'SOLTE PARA ATUALIZAR',
    refreshing: 'ATUALIZANDO',
    curatedForYou: 'Sua próxima maratona vertical',
  },
  hi: {
    title: 'लाइब्रेरी ब्राउज़ करें',
    subtitle: 'मूड, शैली और ट्रेंड के हिसाब से अगला वर्टिकल ड्रामा खोजें।',
    genre: 'शैली',
    status: 'स्थिति',
    sortBy: 'क्रमबद्ध करें',
    all: 'सभी',
    ongoing: 'चल रहा है',
    completed: 'पूर्ण',
    upcoming: 'जल्द आ रहा',
    popular: 'लोकप्रिय',
    latest: 'नवीनतम',
    topRated: 'टॉप रेटेड',
    noUpcoming: 'अभी कोई आगामी ड्रामा नहीं है।',
    noResults: 'इन फ़िल्टरों के लिए कोई ड्रामा नहीं मिला।',
    dramaFallback: 'ड्रामा',
    epShort: 'एप',
    results: 'परिणाम',
    loadMore: 'और लोड करें',
    refreshPull: 'रीफ़्रेश के लिए खींचें',
    refreshRelease: 'रीफ़्रेश के लिए छोड़ें',
    refreshing: 'रीफ़्रेश हो रहा है',
    curatedForYou: 'आपके अगले बिंज के लिए चुना गया',
  },
  id: {
    title: 'Jelajahi katalog',
    subtitle: 'Temukan drama vertikal berikutnya berdasarkan genre, status, dan hype.',
    genre: 'Genre',
    status: 'Status',
    sortBy: 'Urutkan',
    all: 'Semua',
    ongoing: 'Berjalan',
    completed: 'Selesai',
    upcoming: 'Segera hadir',
    popular: 'Populer',
    latest: 'Terbaru',
    topRated: 'Rating tertinggi',
    noUpcoming: 'Belum ada drama yang akan datang.',
    noResults: 'Tidak ada drama yang cocok dengan filter ini.',
    dramaFallback: 'Drama',
    epShort: 'eps',
    results: 'hasil',
    loadMore: 'Muat lebih banyak',
    refreshPull: 'TARIK UNTUK MENYEGARKAN',
    refreshRelease: 'LEPAS UNTUK MENYEGARKAN',
    refreshing: 'MENYEGARKAN',
    curatedForYou: 'Pilihan drama berikutnya untukmu',
  },
};

function resolveCardBadge(drama: Drama): CardBadge | null {
  const badge = getDramaBadge(drama);
  if (badge) return badge;
  if ((drama.rating || 0) >= 9) return 'top';
  return null;
}

function BrowseContent() {
  const locale = useLocale();
  const t = resolveLocaleCopy(BROWSE_TEXT, locale);
  const { isMobile } = usePlatform();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const cacheKey = `browse-view:${locale}`;
  const [cachedView, setCachedView] = useState<BrowseViewCache | null>(null);

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [visibleCount, setVisibleCount] = useState(isMobile ? 12 : 18);

  useEffect(() => {
    setCachedView(readViewCache<BrowseViewCache>(cacheKey, BROWSE_VIEW_CACHE_MAX_AGE_MS));
  }, [cacheKey]);

  useEffect(() => {
    if (!cachedView) return;
    setDramas(cachedView.dramas);
    setCategories(cachedView.categories);
    setLoading(false);
  }, [cachedView]);

  useEffect(() => {
    const fetchData = async () => {
      if (!cachedView) {
        setLoading(true);
      }
      try {
        const [dramasRes, categoriesRes] = await Promise.all([
          dramasApi.getAll({ limit: 50 }),
          categoriesApi.getAll(),
        ]);
        const fetchedDramas = dramasRes.data?.dramas || [];
        const fetchedCategories = categoriesRes.data || [];
        setDramas(fetchedDramas);
        setCategories(fetchedCategories);
        writeViewCache<BrowseViewCache>(cacheKey, {
          dramas: fetchedDramas,
          categories: fetchedCategories,
        });
      } catch {
        if (!cachedView) {
          setDramas([]);
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [cacheKey, cachedView]);

  useEffect(() => {
    setSelectedCategory(categoryParam || 'all');
  }, [categoryParam]);

  useEffect(() => {
    setVisibleCount(isMobile ? 12 : 18);
  }, [isMobile, selectedCategory, statusFilter, sortBy]);

  const filteredDramas = useMemo(
    () =>
      dramas
        .filter((drama) => {
          if (
            selectedCategory !== 'all' &&
            !drama.categories?.some(
              (category) => normalizeCategoryKey(category) === normalizeCategoryKey(selectedCategory)
            )
          ) {
            return false;
          }

          const dramaMode = resolveDramaMode(drama);

          if (statusFilter === 'ongoing' && dramaMode === 'completed') return false;
          if (statusFilter === 'completed' && dramaMode !== 'completed') return false;

          if (statusFilter === 'upcoming') {
            if (!drama.releaseDate) return false;
            return new Date(drama.releaseDate) > new Date();
          }

          return true;
        })
        .sort((a, b) => {
          if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
          if (sortBy === 'latest') return (b.createdAt || '').localeCompare(a.createdAt || '');
          return (b.rating || 0) - (a.rating || 0);
        }),
    [dramas, selectedCategory, statusFilter, sortBy]
  );

  const visibleDramas = filteredDramas.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDramas.length;

  useEffect(() => {
    const prefetchCount = isMobile ? 6 : 10;
    visibleDramas.slice(0, prefetchCount).forEach((drama) => {
      router.prefetch(localizePath(`/drama/${drama._id}`, locale));
    });
  }, [visibleDramas, isMobile, router, locale]);

  useEffect(() => {
    if (!isMobile || !hasMore || loading) return undefined;

    const node = loaderRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 6, filteredDramas.length));
        }
      },
      { rootMargin: '250% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredDramas.length, hasMore, isMobile, loading]);

  const categoryOptions = [
    { key: 'all', label: t.all },
    ...categories.map((category) => ({
      key: category.slug,
      label: localizeCategoryLabel(category.name, locale, category.slug),
    })),
  ];

  const statusOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: t.all },
    { key: 'ongoing', label: t.ongoing },
    { key: 'completed', label: t.completed },
    { key: 'upcoming', label: t.upcoming },
  ];

  const sortOptions: Array<{ key: SortOption; label: string }> = [
    { key: 'popular', label: t.popular },
    { key: 'latest', label: t.latest },
    { key: 'top-rated', label: t.topRated },
  ];

  const renderCard = (drama: Drama) => {
    const badge = resolveCardBadge(drama);

    return (
      <Link
        key={drama._id}
        href={localizePath(`/drama/${drama._id}`, locale)}
        className="group relative overflow-hidden rounded-[18px] border border-white/5 bg-[#151922] shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition-transform duration-200 active:scale-[0.985] md:hover:-translate-y-1"
      >
        <div className="relative aspect-[0.71] overflow-hidden">
          <Image
            src={resolveSafeImageUrl(drama.cover)}
            alt={drama.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 46vw, (max-width: 1200px) 22vw, 16vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/18 to-transparent" />

          {badge ? (
            <span
              className={`absolute left-2 top-2 rounded-md px-1.5 py-[3px] text-[9px] font-black tracking-[0.12em] ${badgeStyles[badge].className}`}
            >
              {badgeStyles[badge].label}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.15] text-white">
              {drama.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold">
              <span className="inline-flex items-center gap-1 text-[#ffd84d]">
                <Star className="h-3 w-3 fill-current" />
                {(drama.rating || 0).toFixed(1)}
              </span>
              <span className="text-white/50">
                {drama.totalEpisodes || '?'} {t.epShort}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <MobilePageShell
      activePath="/browse"
      title={t.title}
      variant="transparent"
      mobileHeaderVariant="brand-search"
      className="bg-[#0f1115]"
      contentClassName="bg-[#0f1115]"
    >
      <PullToRefresh
        disabled={!isMobile}
        onRefresh={async () => {
          const [dramasRes, categoriesRes] = await Promise.all([
            dramasApi.getAll({ limit: 50 }),
            categoriesApi.getAll(),
          ]);
          const fetchedDramas = dramasRes.data?.dramas || [];
          const fetchedCategories = categoriesRes.data || [];
          setDramas(fetchedDramas);
          setCategories(fetchedCategories);
          writeViewCache<BrowseViewCache>(cacheKey, {
            dramas: fetchedDramas,
            categories: fetchedCategories,
          });
          setVisibleCount(isMobile ? 12 : 18);
        }}
        pullLabel={t.refreshPull}
        releaseLabel={t.refreshRelease}
        refreshingLabel={t.refreshing}
      >
        <div className="mx-auto max-w-7xl px-3 pb-6 pt-2 md:px-4 md:pb-8 md:pt-10">
          {!isMobile ? (
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff3b5c]">
                  {t.curatedForYou}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{t.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">{t.subtitle}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-right">
                <div className="text-xs uppercase tracking-[0.24em] text-gray-500">{t.sortBy}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{filteredDramas.length}</div>
                <div className="text-sm text-gray-400">{t.results}</div>
              </div>
            </div>
          ) : null}

          {loading && isMobile ? (
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/8 bg-[#131720] p-4">
                <MobilePillRowSkeleton />
              </div>
              <MobileBrowseGridSkeleton />
            </div>
          ) : (
            <>
              <section
                className={`${
                  isMobile
                    ? 'sticky top-[calc(78px+env(safe-area-inset-top))] z-20 -mx-3 mb-3.5 bg-[#0f1115]/95 px-3 py-2.5 backdrop-blur-2xl'
                    : 'mb-8 rounded-[32px] border border-white/8 bg-[#131720] p-6'
                }`}
              >
                <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {categoryOptions.map((option) => {
                    const active = selectedCategory === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedCategory(option.key)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? 'bg-white text-[#0f1115]'
                            : 'bg-[#202532] text-[#aab0be] hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="pt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff3b5c]">
                        {t.status}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1.5">
                        {statusOptions.map((option) => {
                          const active = statusFilter === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setStatusFilter(option.key)}
                              className={`text-[11px] font-bold transition ${
                                active ? 'text-white' : 'text-gray-500 hover:text-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!isMobile ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400">
                        <Sparkles className="h-3.5 w-3.5 text-[#ff3b5c]" />
                        {filteredDramas.length} {t.results}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="pt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff3b5c]">
                        {t.sortBy}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1.5">
                        {sortOptions.map((option) => {
                          const active = sortBy === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setSortBy(option.key)}
                              className={`text-[11px] font-bold transition ${
                                active ? 'text-white' : 'text-gray-500 hover:text-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-[#1c212b] text-gray-400">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </section>

              {loading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: isMobile ? 6 : 12 }).map((_, index) => (
                    <div key={index} className="aspect-[0.71] animate-pulse rounded-[18px] bg-[#171a21]" />
                  ))}
                </div>
              ) : filteredDramas.length === 0 ? (
                <div className="rounded-[28px] border border-white/8 bg-[#131720] px-6 py-16 text-center">
                  <p className="text-base font-medium text-white">
                    {statusFilter === 'upcoming' ? t.noUpcoming : t.noResults}
                  </p>
                </div>
              ) : (
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-6">
                  {visibleDramas.map(renderCard)}
                </section>
              )}

              {hasMore && !loading ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + (isMobile ? 6 : 12))}
                    className="hidden rounded-full border border-[#ff3b5c]/50 px-7 py-3 text-sm font-semibold text-[#ff5b75] transition hover:border-[#ff3b5c] hover:bg-[#ff3b5c]/10 md:inline-flex"
                  >
                    {t.loadMore}
                  </button>
                </div>
              ) : null}

              {isMobile && hasMore ? <div ref={loaderRef} className="h-10 w-full" aria-hidden="true" /> : null}
            </>
          )}
        </div>
      </PullToRefresh>
    </MobilePageShell>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1115]" />}>
      <BrowseContent />
    </Suspense>
  );
}
