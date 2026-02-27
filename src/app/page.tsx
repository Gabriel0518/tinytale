'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dramasApi, categoriesApi } from '@/lib/api';
import { Drama, Category } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { FeaturedBanner } from '@/components/features/FeaturedBanner';
import { Footer } from '@/components/features/Footer';
import { mockDramas, mockCategories } from '@/lib/mockData';

function validCover(url?: string): string | undefined {
  if (!url || url.startsWith('blob:')) return undefined;
  return url;
}

export default function Home() {
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
    { key: 'all', label: 'All' },
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
                  🔥 #{heroIndex + 1} Hot Ranking
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
                <span>{heroDrama.totalEpisodes} Episodes</span>
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
                {heroDrama.description}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/drama/${heroDrama._id}`}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Now
                </Link>
                <button
                  onClick={() => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('token');
                    if (token) {
                      router.push('/user/favorites');
                    } else {
                      router.push('/auth/login?redirect=/user/favorites');
                    }
                  }}
                  className="flex items-center gap-2 rounded-full border border-gray-500 px-6 py-3 font-medium text-white transition hover:border-white hover:bg-white/10"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  My List
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
                      aria-label={`Go to slide ${i + 1}`}
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
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-gray-800" />
            ))}
          </div>
        </section>
      ) : (
        <HomeCarousel
          title="🔥 Trending Now"
          dramas={trendingDramas}
        />
      )}

      {/* New Releases */}
      {!loading && (
        <HomeCarousel
          title="✨ New Releases"
          dramas={newReleases}
        />
      )}

      {/* Editorial Banner — removed hardcoded, now dynamic from API */}

      {/* Recommendations (from admin featured) */}
      {!loading && recommendations.length > 0 && (
        <HomeCarousel
          title="💎 Recommendations"
          dramas={recommendations}
        />
      )}

      {/* Custom Playlists + Banners (inserted by banner position field) */}
      {!loading && (() => {
        const visiblePlaylists = customPlaylists.filter(pl => pl.dramas.length > 0);
        const elements: React.ReactNode[] = [];

        const getBannerHref = (b: typeof banners[0]) =>
          b.linkType === 'url' ? (b.linkId.startsWith('http') ? b.linkId : '/browse')
          : b.linkType === 'playlist' ? (b.linkId ? `/browse?playlist=${b.linkId}` : '/browse')
          : b.linkId ? `/drama/${b.linkId}` : '/browse';

        // Group banners by their target position (1-based: position=3 means after 3rd playlist)
        const bannersByPosition = new Map<number, typeof banners>();
        banners.forEach(b => {
          const pos = b.position || 1;
          if (!bannersByPosition.has(pos)) bannersByPosition.set(pos, []);
          bannersByPosition.get(pos)!.push(b);
        });

        const insertedPositions = new Set<number>();

        visiblePlaylists.forEach((pl, i) => {
          elements.push(
            <HomeCarousel
              key={`playlist-${pl._id}`}
              title={`${pl.icon ? pl.icon + ' ' : ''}${pl.name}`}
              dramas={pl.dramas}
            />
          );
          // Insert banners whose position matches this playlist index (1-based)
          const pos = i + 1;
          const bannersAtPos = bannersByPosition.get(pos);
          if (bannersAtPos) {
            bannersAtPos.forEach(b => {
              if (b.slot === 'featured') {
                elements.push(<FeaturedBanner key={`fbanner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />);
              } else {
                elements.push(<EditorialBanner key={`banner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />);
              }
            });
            insertedPositions.add(pos);
          }
        });

        // Append banners whose position exceeds playlist count at the end
        bannersByPosition.forEach((bList, pos) => {
          if (!insertedPositions.has(pos)) {
            bList.forEach(b => {
              if (b.slot === 'featured') {
                elements.push(<FeaturedBanner key={`fbanner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />);
              } else {
                elements.push(<EditorialBanner key={`banner-${b._id}`} title={b.title} subtitle={b.subtitle} backgroundImage={b.image} href={getBannerHref(b)} />);
              }
            });
          }
        });

        return elements;
      })()}

      {/* Editor's Choice */}
      {!loading && editorsChoice.length > 0 && (
        <HomeCarousel
          title="⭐ Editor's Choice"
          dramas={editorsChoice}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
