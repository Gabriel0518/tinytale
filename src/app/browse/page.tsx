'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { getDramaBadge } from '@/lib/utils';
import { mockDramas, mockCategories } from '@/lib/mockData';
import { localizePath, SupportedLocale } from '@/lib/i18n';
import { localizeCategoryLabel, normalizeCategoryKey } from '@/lib/categoryI18n';
import { useLocale } from '@/hooks/useLocale';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'ongoing' | 'completed' | 'upcoming';
type SortOption = 'popular' | 'latest' | 'top-rated';

// Badge config for drama status/tags
const badgeStyles: Record<string, { label: string; className: string }> = {
  hot: { label: 'HOT', className: 'bg-red-600 text-white' },
  new: { label: 'NEW', className: 'bg-green-600 text-white' } };

const BROWSE_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: { title: 'Browse Library', subtitle: 'Discover thousands of bite-sized dramas tailored for you.', genre: 'Genre', status: 'Status', sortBy: 'Sort by', all: 'All', ongoing: 'Ongoing', completed: 'Completed', upcoming: 'Upcoming', popular: 'Popular', latest: 'Latest', topRated: 'Top Rated', showing: 'Showing', results: 'results', gridView: 'Grid view', listView: 'List view', noUpcoming: 'No upcoming dramas at the moment. Check back soon!', noResults: 'No dramas found matching your filters.', dramaFallback: 'Drama', epShort: 'episodes', loadMore: 'Load More', episodesWord: 'Episodes' },
  zh: { title: '浏览片库', subtitle: '发现适合你的高品质短剧。', genre: '类型', status: '状态', sortBy: '排序', all: '全部', ongoing: '连载中', completed: '已完结', upcoming: '即将上线', popular: '热门', latest: '最新', topRated: '高分', showing: '共显示', results: '条结果', gridView: '网格视图', listView: '列表视图', noUpcoming: '暂无即将上线短剧', noResults: '没有符合筛选条件的短剧', dramaFallback: '短剧', epShort: '集', loadMore: '加载更多', episodesWord: '集' },
  ja: { title: 'ライブラリ', subtitle: 'あなた向けのショートドラマを探そう。', genre: 'ジャンル', status: 'ステータス', sortBy: '並び替え', all: 'すべて', ongoing: '配信中', completed: '完結', upcoming: '近日公開', popular: '人気', latest: '新着', topRated: '高評価', showing: '表示中', results: '件', gridView: 'グリッド', listView: 'リスト', noUpcoming: '近日公開の作品はありません', noResults: '条件に一致する作品がありません', dramaFallback: 'ドラマ', epShort: '話', loadMore: 'もっと見る', episodesWord: '話' },
  es: { title: 'Explorar catálogo', subtitle: 'Descubre miles de dramas cortos para ti.', genre: 'Género', status: 'Estado', sortBy: 'Ordenar', all: 'Todo', ongoing: 'En emisión', completed: 'Completado', upcoming: 'Próximamente', popular: 'Popular', latest: 'Reciente', topRated: 'Mejor valorado', showing: 'Mostrando', results: 'resultados', gridView: 'Vista cuadrícula', listView: 'Vista lista', noUpcoming: 'No hay próximos dramas por ahora', noResults: 'No se encontraron dramas con estos filtros', dramaFallback: 'Drama', epShort: 'episodios', loadMore: 'Cargar más', episodesWord: 'Episodios' },
  pt: { title: 'Explorar catálogo', subtitle: 'Descubra dramas curtos para você.', genre: 'Gênero', status: 'Status', sortBy: 'Ordenar por', all: 'Todos', ongoing: 'Em andamento', completed: 'Concluído', upcoming: 'Em breve', popular: 'Popular', latest: 'Mais recente', topRated: 'Melhor avaliado', showing: 'Mostrando', results: 'resultados', gridView: 'Visão em grade', listView: 'Visão em lista', noUpcoming: 'Sem dramas futuros no momento', noResults: 'Nenhum drama encontrado para os filtros', dramaFallback: 'Drama', epShort: 'episódios', loadMore: 'Carregar mais', episodesWord: 'Episódios' },
  hi: { title: 'लाइब्रेरी ब्राउज़ करें', subtitle: 'आपके लिए शॉर्ट ड्रामा खोजें।', genre: 'शैली', status: 'स्थिति', sortBy: 'क्रमबद्ध करें', all: 'सभी', ongoing: 'चल रहा है', completed: 'पूर्ण', upcoming: 'जल्द आ रहा', popular: 'लोकप्रिय', latest: 'नवीनतम', topRated: 'शीर्ष रेटेड', showing: 'दिखाए जा रहे', results: 'परिणाम', gridView: 'ग्रिड दृश्य', listView: 'सूची दृश्य', noUpcoming: 'अभी कोई आगामी ड्रामा नहीं', noResults: 'फ़िल्टर के अनुसार कोई ड्रामा नहीं मिला', dramaFallback: 'ड्रामा', epShort: 'एपिसोड', loadMore: 'और लोड करें', episodesWord: 'एपिसोड' },
  id: { title: 'Jelajahi katalog', subtitle: 'Temukan drama pendek pilihan untukmu.', genre: 'Genre', status: 'Status', sortBy: 'Urutkan', all: 'Semua', ongoing: 'Berjalan', completed: 'Selesai', upcoming: 'Segera hadir', popular: 'Populer', latest: 'Terbaru', topRated: 'Rating tertinggi', showing: 'Menampilkan', results: 'hasil', gridView: 'Tampilan grid', listView: 'Tampilan daftar', noUpcoming: 'Belum ada drama yang akan datang', noResults: 'Tidak ada drama sesuai filter', dramaFallback: 'Drama', epShort: 'episode', loadMore: 'Muat lebih banyak', episodesWord: 'Episode' } };

function BrowseContent() {
  const locale = useLocale();
  const t = BROWSE_TEXT[locale] || BROWSE_TEXT.en;
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dramasRes, categoriesRes] = await Promise.all([
          dramasApi.getAll({ limit: 50 }),
          categoriesApi.getAll(),
        ]);
        const fetchedDramas = dramasRes.data?.dramas || [];
        const fetchedCategories = categoriesRes.data || [];
        setDramas(fetchedDramas.length > 0 ? fetchedDramas : mockDramas);
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories);
      } catch {
        setDramas(mockDramas);
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryParam]);

  // Sync selectedCategory when URL param changes
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Scroll to top when filters change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory, statusFilter, sortBy]);

  // Filter & sort (wrapped in useMemo)
  const filtered = useMemo(() => dramas
    .filter(d => {
      if (
        selectedCategory !== 'all' &&
        !d.categories?.some((c) => normalizeCategoryKey(c) === normalizeCategoryKey(selectedCategory))
      ) {
        return false;
      }
      if (statusFilter === 'ongoing' && d.isCompleted) return false;
      if (statusFilter === 'completed' && !d.isCompleted) return false;
      if (statusFilter === 'upcoming') {
        // Filter by future releaseDate, or show nothing if no releaseDate
        if (!d.releaseDate) return false;
        return new Date(d.releaseDate) > new Date();
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === 'latest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'top-rated') return (b.rating || 0) - (a.rating || 0);
      return 0;
    }),
    [dramas, selectedCategory, statusFilter, sortBy]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const genrePills = [
    { key: 'all', label: t.all },
    ...categories.map((c) => ({ key: c.slug, label: localizeCategoryLabel(c.name, locale, c.slug) })),
  ];

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t.all },
    { key: 'ongoing', label: t.ongoing },
    { key: 'completed', label: t.completed },
    { key: 'upcoming', label: t.upcoming },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'popular', label: t.popular },
    { key: 'latest', label: t.latest },
    { key: 'top-rated', label: t.topRated },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/browse" />

      <div className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-gray-400 md:text-base">
            {t.subtitle}
          </p>

          {/* Filter Section */}
          <div className="mt-8 space-y-5">
            {/* Genre Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">{t.genre}</span>
              <div className="flex flex-wrap gap-2">
                {genrePills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => { setSelectedCategory(pill.key); setVisibleCount(12); }}
                    aria-pressed={selectedCategory === pill.key}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      selectedCategory === pill.key
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">{t.status}</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setStatusFilter(opt.key); setVisibleCount(12); }}
                    aria-pressed={statusFilter === opt.key}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      statusFilter === opt.key
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">{t.sortBy}</span>
                <div className="flex gap-4">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      aria-pressed={sortBy === opt.key}
                      className={`text-sm font-medium transition ${
                        sortBy === opt.key
                          ? 'text-white underline underline-offset-4 decoration-amber-500 decoration-2'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {t.showing} {filtered.length} {t.results}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                    aria-label={t.gridView}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                    aria-label={t.listView}
                    aria-pressed={viewMode === 'list'}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drama Grid / List */}
          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-800" />
                    <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400" role="alert">
                {statusFilter === 'upcoming'
                  ? t.noUpcoming
                  : t.noResults}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {visible.map((drama) => {
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
                        {/* Status Badge */}
                        {badge && badgeStyles[badge] && (
                          <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${badgeStyles[badge].className}`}>
                            {badgeStyles[badge].label}
                          </span>
                        )}
                        {/* Hover Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-medium text-white">{drama.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {drama.categories?.[0] || t.dramaFallback}
                        {' · '}
                        {drama.totalEpisodes || '?'} {t.epShort}
                        {' · '}
                        <span className="text-yellow-500">★ {drama.rating?.toFixed(1)}</span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {visible.map((drama) => {
                  const badge = getDramaBadge(drama);
                  return (
                    <Link key={drama._id} href={localizePath(`/drama/${drama._id}`, locale)} className="group flex gap-4 rounded-lg bg-[#1f1f1f] p-4 transition hover:bg-[#2a2a2a]">
                      <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image src={drama.cover} alt={drama.title} fill className="object-cover" />
                        {badge && badgeStyles[badge] && (
                          <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${badgeStyles[badge].className}`}>
                            {badgeStyles[badge].label}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white">{drama.title}</h3>
                        <p className="mt-1 text-sm text-gray-400">{drama.categories?.join(' · ')}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{drama.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>{drama.totalEpisodes} {t.episodesWord}</span>
                          <span>{drama.year}</span>
                          <span className="text-yellow-500">★ {drama.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="flex items-center gap-2 rounded-full border border-amber-500/60 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-amber-400 transition hover:border-amber-400 hover:bg-amber-400/10"
              >
                {t.loadMore}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
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
