'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { FeaturedBanner } from '@/components/features/FeaturedBanner';
import { Footer } from '@/components/features/Footer';
import { mockDramas, mockCategories } from '@/lib/mockData';
import { detectClientLocale, localizePath, SupportedLocale } from '@/lib/i18n';

function validCover(url?: string): string | undefined {
  if (!url || url.startsWith('blob:')) return undefined;
  return url;
}

const HOME_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: {
    all: 'All',
    hotRanking: 'Hot Ranking',
    episodes: 'Episodes',
    watchNow: 'Watch Now',
    myList: 'My List',
    slideLabel: 'Go to slide',
    trendingNow: 'Trending Now',
    newReleases: 'New Releases',
    recommendations: 'Recommendations',
    editorsChoice: "Editor's Choice",
    browseFallback: '/browse',
  },
  zh: {
    all: '全部',
    hotRanking: '热门榜',
    episodes: '集',
    watchNow: '立即观看',
    myList: '我的收藏',
    slideLabel: '跳转到第',
    trendingNow: '热门推荐',
    newReleases: '最新上新',
    recommendations: '推荐内容',
    editorsChoice: '编辑精选',
    browseFallback: '/browse',
  },
  ja: {
    all: 'すべて',
    hotRanking: '人気ランキング',
    episodes: '話',
    watchNow: '今すぐ見る',
    myList: 'マイリスト',
    slideLabel: 'スライド',
    trendingNow: 'トレンド',
    newReleases: '新着',
    recommendations: 'おすすめ',
    editorsChoice: '編集部のおすすめ',
    browseFallback: '/browse',
  },
  es: {
    all: 'Todo',
    hotRanking: 'Ranking caliente',
    episodes: 'episodios',
    watchNow: 'Ver ahora',
    myList: 'Mi lista',
    slideLabel: 'Ir a la diapositiva',
    trendingNow: 'Tendencias',
    newReleases: 'Novedades',
    recommendations: 'Recomendaciones',
    editorsChoice: 'Selección del editor',
    browseFallback: '/browse',
  },
  pt: {
    all: 'Todos',
    hotRanking: 'Ranking em alta',
    episodes: 'episódios',
    watchNow: 'Assistir agora',
    myList: 'Minha Lista',
    slideLabel: 'Ir para o slide',
    trendingNow: 'Em alta',
    newReleases: 'Novidades',
    recommendations: 'Recomendações',
    editorsChoice: 'Escolha do editor',
    browseFallback: '/browse',
  },
  hi: {
    all: 'सभी',
    hotRanking: 'हॉट रैंकिंग',
    episodes: 'एपिसोड',
    watchNow: 'अभी देखें',
    myList: 'मेरी सूची',
    slideLabel: 'स्लाइड पर जाएँ',
    trendingNow: 'ट्रेंडिंग',
    newReleases: 'नई रिलीज़',
    recommendations: 'सिफ़ारिशें',
    editorsChoice: 'एडिटर की पसंद',
    browseFallback: '/browse',
  },
  id: {
    all: 'Semua',
    hotRanking: 'Peringkat panas',
    episodes: 'episode',
    watchNow: 'Tonton sekarang',
    myList: 'Daftar Saya',
    slideLabel: 'Pergi ke slide',
    trendingNow: 'Sedang tren',
    newReleases: 'Rilis baru',
    recommendations: 'Rekomendasi',
    editorsChoice: 'Pilihan editor',
    browseFallback: '/browse',
  },
};

export default function Home() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = HOME_TEXT[locale] || HOME_TEXT.en;
  const router = useRouter();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hotRankings, setHotRankings] = useState<Drama[]>([]);
  const [recommendations, setRecommendations] = useState<Drama[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<{ _id: string; slug: string; name: string; icon: string; dramas: Drama[] }[]>([]);
  const [banners, setBanners] = useState<{ _id: string; title: string; subtitle: string; image: string; linkType: string; linkId: string; slot: string; position: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dramasRes, categoriesRes, rankingsRes, featuredRes, playlistsRes, bannersRes] = await Promise.all([
          dramasApi.getAll({ limit: 20 }),
          categoriesApi.getAll(),
          dramasApi.getRankings('rating').catch(() => ({ data: [] })),
          dramasApi.getFeatured().catch(() => ({ data: {} })),
          dramasApi.getPlaylists().catch(() => ({ data: [] })),
          dramasApi.getBanners().catch(() => ({ data: [] })),
        ]);
        const fetchedDramas = dramasRes.data?.dramas || [];
        const fetchedCategories = categoriesRes.data || [];
        setDramas(fetchedDramas.length > 0 ? fetchedDramas : mockDramas);
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories);

        // Hot rankings for hero banner
        const rankings = rankingsRes.data || [];
        setHotRankings(Array.isArray(rankings) ? rankings.slice(0, 5) : []);

        // Editor recommendations
        const featuredData = featuredRes.data || {};
        const recDramas = featuredData.featured || [];
        setRecommendations(Array.isArray(recDramas) ? recDramas : []);

        // Custom playlists
        const plData = playlistsRes.data || [];
        setCustomPlaylists(
          (Array.isArray(plData) ? plData : []).map((p: any) => ({
            _id: p._id,
            slug: p.slug || '',
            name: p.name,
            icon: p.icon || '',
            dramas: Array.isArray(p.dramas) ? p.dramas : [],
          }))
        );

        // Banners
        const bnData = bannersRes.data || [];
        setBanners(
          (Array.isArray(bnData) ? bnData : []).map((b: any) => ({
            _id: b._id, title: b.title || '', subtitle: b.subtitle || '',
            image: b.image || '', linkType: b.linkType || 'drama', linkId: b.linkId || '',
            slot: b.slot || 'standard', position: b.position ?? 0,
          }))
        );
      } catch {
        setDramas(mockDramas);
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate hero banner
  useEffect(() => {
    if (hotRankings.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % hotRankings.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hotRankings.length]);

  const heroDrama = hotRankings.length > 0 ? hotRankings[heroIndex] : dramas[0];

  const filteredDramas = useMemo(() => {
    if (activeCategory === 'all') return dramas;
    return dramas.filter(d =>
      d.categories?.some(c => c.toLowerCase() === activeCategory.toLowerCase())
    );
  }, [dramas, activeCategory]);

  const trendingDramas = useMemo(() => filteredDramas.slice(0, 8), [filteredDramas]);
  const newReleases = useMemo(() =>
    [...filteredDramas].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    ).slice(0, 8),
    [filteredDramas]
  );
  const editorsChoice = useMemo(() =>
    filteredDramas.filter(d => (d.rating || 0) >= 8.5).slice(0, 8),
    [filteredDramas]
  );

  const categoryPills = [
    { key: 'all', label: t.all },
    ...categories.slice(0, 7).map(c => ({ key: c.slug, label: c.name })),
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/" variant="transparent" />

      {/* Hero Banner — Hot Rankings Carousel */}
      <section className="relative h-[70vh] w-full overflow-hidden md:h-[85vh]">
        {heroDrama ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage: `url(${validCover(heroDrama.horizontalCover) || validCover(heroDrama.cover) || 'https://picsum.photos/seed/hero/1920/1080'})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />

            <div className="absolute bottom-24 left-0 right-0 mx-auto max-w-7xl px-4 md:bottom-32">
              {hotRankings.length > 0 && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                  🔥 #{heroIndex + 1} {t.hotRanking}
                </span>
              )}
              <h1 className="max-w-lg text-4xl font-bold leading-tight text-white md:text-6xl">
                {heroDrama.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1 text-yellow-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {heroDrama.rating?.toFixed(1)}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                {heroDrama.categories?.slice(0, 3).map((cat, i) => (
                  <span key={cat}>
                    {cat}{i < Math.min((heroDrama.categories?.length ?? 0), 3) - 1 && ' · '}
                  </span>
                ))}
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                <span>{heroDrama.year}</span>
                <span className="h-1 w-1 rounded-full bg-gray-500" />
                <span>{heroDrama.totalEpisodes} {t.episodes}</span>
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
                {heroDrama.description}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={localizePath(`/drama/${heroDrama._id}`, locale)}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t.watchNow}
                </Link>
                <button
                  onClick={() => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('token');
                    if (token) {
                      router.push(localizePath('/user/favorites', locale));
                    } else {
                      const redirect = encodeURIComponent(localizePath('/user/favorites', locale));
                      router.push(`${localizePath('/auth/login', locale)}?redirect=${redirect}`);
                    }
                  }}
                  className="flex items-center gap-2 rounded-full border border-gray-500 px-6 py-3 font-medium text-white transition hover:border-white hover:bg-white/10"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.myList}
                </button>
              </div>

              {/* Carousel Indicators */}
              {hotRankings.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  {hotRankings.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === heroIndex ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`${t.slideLabel} ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          </div>
        )}
      </section>

      {/* Category Filter Pills */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categoryPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setActiveCategory(pill.key)}
              aria-pressed={activeCategory === pill.key}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
                activeCategory === pill.key
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      {loading ? (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-xl font-bold text-white">{t.trendingNow}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
            ))}
          </div>
        </section>
      ) : (
        <HomeCarousel
          title={`🔥 ${t.trendingNow}`}
          dramas={trendingDramas}
        />
      )}

      {/* New Releases */}
      {!loading && (
        <HomeCarousel
          title={`✨ ${t.newReleases}`}
          dramas={newReleases}
        />
      )}

      {/* Editorial Banner — removed hardcoded, now dynamic from API */}

      {/* Recommendations (from admin featured) */}
      {!loading && recommendations.length > 0 && (
        <HomeCarousel
          title={`💎 ${t.recommendations}`}
          dramas={recommendations}
        />
      )}

      {/* Custom Playlists + Banners (mixed by position) */}
      {!loading && (() => {
        const visiblePlaylists = customPlaylists.filter(pl => pl.dramas.length > 0);

        const getBannerHref = (b: typeof banners[0]) =>
          b.linkType === 'url'
            ? (b.linkId.startsWith('http') ? b.linkId : localizePath(t.browseFallback, locale))
            : b.linkType === 'playlist'
              ? (b.linkId ? localizePath(`/browse?playlist=${b.linkId}`, locale) : localizePath(t.browseFallback, locale))
              : b.linkId ? localizePath(`/drama/${b.linkId}`, locale) : localizePath(t.browseFallback, locale);

        // Build a unified list: playlists get position 1,2,3... banners use their own position
        type Item = { type: 'playlist'; data: typeof visiblePlaylists[0]; pos: number }
                  | { type: 'banner'; data: typeof banners[0]; pos: number };
        const items: Item[] = [];

        visiblePlaylists.forEach((pl, i) => {
          items.push({ type: 'playlist', data: pl, pos: i + 1 });
        });
        banners.forEach(b => {
          items.push({ type: 'banner', data: b, pos: b.position || 1 });
        });

        // Stable sort: by position, then playlists before banners at same position
        items.sort((a, b) => {
          if (a.pos !== b.pos) return a.pos - b.pos;
          return a.type === 'playlist' ? -1 : 1;
        });

        return items.map(item => {
          if (item.type === 'playlist') {
            const pl = item.data as typeof visiblePlaylists[0];
            return (
              <HomeCarousel
                key={`playlist-${pl._id}`}
                title={`${pl.icon ? pl.icon + ' ' : ''}${pl.name}`}
                dramas={pl.dramas}
              />
            );
          }
          const b = item.data as typeof banners[0];
          if (b.slot === 'featured') {
            return <FeaturedBanner key={`fbanner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />;
          }
          return <EditorialBanner key={`banner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />;
        });
      })()}

      {/* Editor's Choice */}
      {!loading && editorsChoice.length > 0 && (
        <HomeCarousel
          title={`⭐ ${t.editorsChoice}`}
          dramas={editorsChoice}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
