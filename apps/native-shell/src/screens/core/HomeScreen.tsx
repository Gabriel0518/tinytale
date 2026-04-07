import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { ChevronRight, Play, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category, Drama, HomepageBanner, HomepageFeaturedBuckets, HomepageHeroBanner, HomepagePlaylist } from '@domain';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData, unwrapCollectionData } from '../../lib/api-response';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const HOME_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type HomeHeroSlide = {
  key: string;
  cover: string;
  description: string;
  href: string;
  rating?: number;
  tag: string;
  title: string;
  durationMs: number;
};

function uniqueDramas(dramas: Drama[]) {
  const seen = new Set<string>();
  return dramas.filter((drama) => {
    if (!drama?._id || seen.has(drama._id)) return false;
    seen.add(drama._id);
    return true;
  });
}

function resolveDramaEpisodesLabel(drama?: Drama | null) {
  const count = drama?.totalEpisodes || drama?.episodes?.length || 0;
  return count > 0 ? `${count} Episodes` : 'Fresh Today';
}

function resolveStatusChip(drama: Drama, index: number, variant: 'trending' | 'new') {
  if (variant === 'new') {
    return index === 0 ? { label: 'New', tone: 'blue' as const } : null;
  }

  if (index === 0) return { label: 'Hot', tone: 'primary' as const };
  if (drama.isCompleted) return { label: 'Completed', tone: 'green' as const };
  if ((drama.totalEpisodes || drama.episodes?.length || 0) <= 12) return { label: 'New', tone: 'primary' as const };
  return { label: 'Ongoing', tone: 'green' as const };
}

function highlightTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) {
    return title;
  }

  const lead = words.slice(0, -1).join(' ');
  const accent = words[words.length - 1];

  return (
    <>
      {lead}{' '}
      <span className="home-stitch-accent">{accent}</span>
    </>
  );
}

function resolveHero(
  heroBanners: HomepageHeroBanner[],
  banners: HomepageBanner[],
  dramaPool: Drama[]
) {
  const heroBanner = heroBanners[0];
  const bannerDrama = heroBanner?.dramaId ? dramaPool.find((item) => item._id === heroBanner.dramaId) : undefined;
  const fallbackDrama = dramaPool[0];
  const sourceDrama = bannerDrama || fallbackDrama;
  const standardBanner = banners.find((item) => item.slot === 'featured') || banners[0];

  if (!heroBanner && !sourceDrama && !standardBanner) return null;

  return {
    cover:
      heroBanner?.coverImage ||
      sourceDrama?.horizontalCover ||
      standardBanner?.image ||
      sourceDrama?.cover ||
      '',
    description:
      heroBanner?.subtitle ||
      sourceDrama?.description ||
      standardBanner?.subtitle ||
      '',
    href: sourceDrama?._id ? routeBuilders.dramaDetail(sourceDrama._id) : routeBuilders.browse(),
    rating: sourceDrama?.rating,
    tag: heroBanner?.tag || 'Trending #1',
    title: heroBanner?.title || sourceDrama?.title || standardBanner?.title || 'TinyTale',
  };
}

function buildHeroSlides(
  heroBanners: HomepageHeroBanner[],
  banners: HomepageBanner[],
  dramaPool: Drama[]
): HomeHeroSlide[] {
  const featuredBanner = banners.find((item) => item.slot === 'featured') || banners[0];

  if (heroBanners.length > 0) {
    return [...heroBanners]
      .sort((left, right) => (left.position || 0) - (right.position || 0))
      .map((heroBanner, index) => {
        const sourceDrama = heroBanner.dramaId ? dramaPool.find((item) => item._id === heroBanner.dramaId) : undefined;

        return {
          key: heroBanner._id,
          cover: heroBanner.coverImage || sourceDrama?.horizontalCover || '',
          description: heroBanner.subtitle || sourceDrama?.description || '',
          href: heroBanner.dramaId
            ? routeBuilders.dramaDetail(heroBanner.dramaId)
            : sourceDrama?._id
              ? routeBuilders.dramaDetail(sourceDrama._id)
              : routeBuilders.browse(),
          rating: sourceDrama?.rating,
          tag: heroBanner.tag || `Trending #${index + 1}`,
          title: heroBanner.title || sourceDrama?.title || 'TinyTale',
          durationMs: Math.max(3, Number(heroBanner.displayDurationSec || 5)) * 1000,
        };
      })
      .filter((slide) => Boolean(slide.cover));
  }

  if (featuredBanner?.image) {
    return [
      {
        key: featuredBanner._id,
        cover: featuredBanner.image,
        description: featuredBanner.subtitle || '',
        href:
          featuredBanner.linkType === 'drama' && featuredBanner.linkId
            ? routeBuilders.dramaDetail(featuredBanner.linkId)
            : routeBuilders.browse(),
        tag: 'Featured',
        title: featuredBanner.title || 'TinyTale',
        durationMs: 5000,
      },
    ];
  }

  const fallbackDrama = dramaPool.find((item) => item.horizontalCover) || dramaPool[0];

  if (!fallbackDrama) {
    return [];
  }

  return [
    {
      key: fallbackDrama._id,
      cover: fallbackDrama.horizontalCover || fallbackDrama.cover || '',
      description: fallbackDrama.description || '',
      href: routeBuilders.dramaDetail(fallbackDrama._id),
      rating: fallbackDrama.rating,
      tag: 'Trending #1',
      title: fallbackDrama.title || 'TinyTale',
      durationMs: 5000,
    },
  ];
}

function HomeCategories({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  const items = categories.slice(0, 6);

  return (
    <section className="home-stitch-categories">
      <div className="home-stitch-chips">
        <Link className="home-stitch-chip home-stitch-chip-active" to={routeBuilders.browse()}>
          All
        </Link>
        {items.map((category) => (
          <Link
            key={category._id}
            className="home-stitch-chip"
            to={routeBuilders.category(category.slug || category._id)}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomeRail({
  actionHref,
  dramas,
  title,
  variant,
}: {
  actionHref: string;
  dramas: Drama[];
  title: string;
  variant: 'trending' | 'new';
}) {
  if (!dramas.length) return null;

  return (
    <section className="home-stitch-rail-section">
      <div className="home-stitch-section-heading">
        <h3 className="home-stitch-section-title">{title}</h3>
        <Link className="home-stitch-see-all" to={actionHref}>
          See All
        </Link>
      </div>

      <div className="home-stitch-rail">
        {dramas.map((drama, index) => {
          const chip = resolveStatusChip(drama, index, variant);

          return (
            <Link key={drama._id} className="home-stitch-rail-card" to={routeBuilders.dramaDetail(drama._id)}>
              <div className="home-stitch-rail-poster">
                {drama.cover ? (
                  <img alt={drama.title} src={drama.cover} />
                ) : (
                  <div className="home-stitch-rail-fallback">{(drama.title || '?').slice(0, 1).toUpperCase()}</div>
                )}

                {drama.rating ? (
                  <div className="home-stitch-rating-badge">
                    <Star className="home-stitch-star" size={10} />
                    <span>{drama.rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {chip ? (
                  <div className={`home-stitch-status-badge home-stitch-status-badge-${chip.tone}`}>
                    {chip.label}
                  </div>
                ) : null}
              </div>

              <h4 className="home-stitch-rail-title">{drama.title}</h4>
              <p className="home-stitch-rail-meta">
                {variant === 'new' && index === 0 ? 'Fresh Today' : resolveDramaEpisodesLabel(drama)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyTopPicks({
  banner,
  playlists,
  fallbackDrama,
}: {
  banner?: HomepageBanner;
  playlists: HomepagePlaylist[];
  fallbackDrama?: Drama;
}) {
  const playlist = playlists[0];
  const href =
    banner?.linkType === 'drama' && banner.linkId
      ? routeBuilders.dramaDetail(banner.linkId)
      : playlist?.dramas?.[0]?._id
        ? routeBuilders.dramaDetail(playlist.dramas[0]._id)
        : fallbackDrama?._id
          ? routeBuilders.dramaDetail(fallbackDrama._id)
          : routeBuilders.browse();
  const title = banner?.title || 'WEEKLY TOP PICKS';
  const subtitle =
    banner?.subtitle || playlist?.description || 'Curated by our editors. The must-watch series of the week.';
  const image = banner?.image || playlist?.dramas?.[0]?.horizontalCover || playlist?.dramas?.[0]?.cover || '';

  return (
    <section className="home-stitch-weekly-section">
      <Link className="home-stitch-weekly-card" to={href}>
        <div className="home-stitch-weekly-media">
          {image ? <img alt={title} src={image} /> : null}
          <div className="home-stitch-weekly-radial" />
        </div>
        <div className="home-stitch-weekly-copy">
          <h3 className="home-stitch-weekly-title">{title}</h3>
          <p className="home-stitch-weekly-subtitle">{subtitle}</p>
          <span className="home-stitch-weekly-action">
            Explore Collection
            <ChevronRight size={15} />
          </span>
        </div>
        <div className="home-stitch-weekly-glow" />
      </Link>
    </section>
  );
}

function EditorsChoice({ dramas }: { dramas: Drama[] }) {
  if (!dramas.length) return null;

  const lead = dramas[0];
  const side = dramas.slice(1, 3);

  return (
    <section className="home-stitch-editors">
      <h3 className="home-stitch-section-title home-stitch-editors-title">Editor&apos;s Choice</h3>
      <div className="home-stitch-editors-grid">
        <Link className="home-stitch-editor-card home-stitch-editor-card-large" to={routeBuilders.dramaDetail(lead._id)}>
          {lead.cover ? <img alt={lead.title} className="home-stitch-editor-image" src={lead.cover} /> : null}
          <div className="home-stitch-editor-overlay" />
          <div className="home-stitch-editor-copy home-stitch-editor-copy-large">
            <p className="home-stitch-editor-kicker">Editor&apos;s Pick</p>
            <h4 className="home-stitch-editor-title home-stitch-editor-title-large">{lead.title}</h4>
          </div>
        </Link>

        <div className="home-stitch-editor-stack">
          {side.map((drama) => (
            <Link key={drama._id} className="home-stitch-editor-card" to={routeBuilders.dramaDetail(drama._id)}>
              {drama.cover ? <img alt={drama.title} className="home-stitch-editor-image" src={drama.cover} /> : null}
              <div className="home-stitch-editor-overlay" />
              <div className="home-stitch-editor-copy">
                <h4 className="home-stitch-editor-title">{drama.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeScreen() {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const api = useShellApi();
  const { isOffline } = useNetworkStatus();
  const { user } = useNativeAuth();

  const featuredQuery = useCachedQuery({
    cacheKey: 'home:featured',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'featured'],
    queryFn: () => api.dramas.getFeatured(),
  });

  const trendingFallbackQuery = useCachedQuery({
    cacheKey: 'home:trending-fallback',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'trending-fallback'],
    queryFn: () => api.dramas.getAll({ limit: 12, sort: 'views' }),
  });

  const latestFallbackQuery = useCachedQuery({
    cacheKey: 'home:latest-fallback',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'latest-fallback'],
    queryFn: () => api.dramas.getAll({ limit: 12, sort: 'latest' }),
  });

  const categoriesQuery = useCachedQuery({
    cacheKey: 'home:categories',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'categories'],
    queryFn: () => api.categories.getAll(),
  });

  const playlistsQuery = useCachedQuery({
    cacheKey: 'home:playlists',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'playlists'],
    queryFn: () => api.dramas.getPlaylists(),
  });

  const bannersQuery = useCachedQuery({
    cacheKey: 'home:banners',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'banners'],
    queryFn: () => api.dramas.getBanners(),
  });

  const heroBannersQuery = useCachedQuery({
    cacheKey: 'home:hero-banners',
    cacheMaxAgeMs: HOME_CACHE_MAX_AGE_MS,
    queryKey: ['home', 'hero-banners'],
    queryFn: () => api.dramas.getHeroBanners(),
  });

  const featuredBuckets = unwrapApiData<HomepageFeaturedBuckets>(featuredQuery.data) ?? {};
  const categories = unwrapCollectionData<Category>(categoriesQuery.data, ['categories', 'items']);
  const playlists = unwrapCollectionData<HomepagePlaylist>(playlistsQuery.data, ['playlists', 'items']);
  const banners = unwrapCollectionData<HomepageBanner>(bannersQuery.data, ['banners', 'items']);
  const heroBanners = unwrapCollectionData<HomepageHeroBanner>(heroBannersQuery.data, ['heroBanners', 'items']);
  const trendingFallback = unwrapCollectionData<Drama>(trendingFallbackQuery.data, ['dramas', 'items']);
  const latestFallback = unwrapCollectionData<Drama>(latestFallbackQuery.data, ['dramas', 'items']);

  const featured = uniqueDramas(featuredBuckets.featured || []);
  const trending = uniqueDramas([
    ...(featuredBuckets.trending || []),
    ...(featuredBuckets.rankings || []),
    ...trendingFallback,
  ]).slice(0, 8);
  const newReleases = uniqueDramas([...(featuredBuckets.new || []), ...latestFallback]).slice(0, 8);
  const playlistDramas = uniqueDramas(playlists.flatMap((playlist) => playlist.dramas || []));
  const heroPool = useMemo(
    () => uniqueDramas([...trending, ...featured, ...newReleases, ...playlistDramas]),
    [featured, trending, newReleases, playlistDramas]
  );
  const editors = uniqueDramas([...playlistDramas, ...featured, ...trending, ...newReleases]).slice(0, 3);
  const heroSlides = useMemo(() => buildHeroSlides(heroBanners, banners, heroPool), [heroBanners, banners, heroPool]);
  const hero = heroSlides[heroIndex] || resolveHero(heroBanners, banners, heroPool);
  const featuredBanner = banners.find((banner) => banner.slot === 'featured') || banners[0];

  useEffect(() => {
    if (!heroSlides.length) {
      if (heroIndex !== 0) {
        setHeroIndex(0);
      }
      return;
    }

    if (heroIndex >= heroSlides.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const activeSlide = heroSlides[heroIndex] || heroSlides[0];
    const timer = window.setTimeout(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, activeSlide?.durationMs || 5000);

    return () => window.clearTimeout(timer);
  }, [heroIndex, heroSlides]);

  function moveHero(direction: 'next' | 'prev') {
    if (heroSlides.length <= 1) return;

    setHeroIndex((current) => {
      if (direction === 'next') {
        return (current + 1) % heroSlides.length;
      }

      return (current - 1 + heroSlides.length) % heroSlides.length;
    });
  }

  function handleHeroTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    heroTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleHeroTouchEnd(event: TouchEvent<HTMLElement>) {
    const touchStart = heroTouchStartRef.current;
    heroTouchStartRef.current = null;

    if (!touchStart || heroSlides.length <= 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    moveHero(deltaX < 0 ? 'next' : 'prev');
  }

  return (
    <section className="home-stitch-page">
      <QueryState
        isLoading={
          featuredQuery.isLoading ||
          trendingFallbackQuery.isLoading ||
          latestFallbackQuery.isLoading ||
          categoriesQuery.isLoading ||
          playlistsQuery.isLoading ||
          bannersQuery.isLoading ||
          heroBannersQuery.isLoading
        }
        isFetching={
          featuredQuery.isFetching ||
          trendingFallbackQuery.isFetching ||
          latestFallbackQuery.isFetching ||
          categoriesQuery.isFetching ||
          playlistsQuery.isFetching ||
          bannersQuery.isFetching ||
          heroBannersQuery.isFetching
        }
        error={
          featuredQuery.error ||
          trendingFallbackQuery.error ||
          latestFallbackQuery.error ||
          categoriesQuery.error ||
          playlistsQuery.error ||
          bannersQuery.error ||
          heroBannersQuery.error
        }
        empty={!hero && !trending.length && !newReleases.length && !editors.length}
        offline={isOffline}
        hasCachedData={Boolean(
          featuredQuery.data ||
            trendingFallbackQuery.data ||
            latestFallbackQuery.data ||
            categoriesQuery.data ||
            playlistsQuery.data ||
            bannersQuery.data ||
            heroBannersQuery.data
        )}
        emptyLabel="Home feed has no cached or remote data yet."
        onRetry={() => {
          void featuredQuery.refetch();
          void trendingFallbackQuery.refetch();
          void latestFallbackQuery.refetch();
          void categoriesQuery.refetch();
          void playlistsQuery.refetch();
          void bannersQuery.refetch();
          void heroBannersQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={4} title="Preparing home feed" />}
      >
        {hero ? (
          <section
            className="home-stitch-hero"
            onTouchEnd={handleHeroTouchEnd}
            onTouchStart={handleHeroTouchStart}
          >
            <div
              className="home-stitch-hero-track"
              style={{ transform: `translate3d(-${heroIndex * 100}%, 0, 0)` }}
            >
              {heroSlides.map((slide) => (
                <div key={slide.key} className="home-stitch-hero-slide">
                  <div className="home-stitch-hero-media">
                    {slide.cover ? <img alt={slide.title} src={slide.cover} /> : null}
                    <div className="home-stitch-hero-gradient-top" />
                    <div className="home-stitch-hero-gradient-bottom" />
                    <div className="home-stitch-hero-gradient-horizontal" />
                  </div>
                </div>
              ))}
            </div>

            <div className="home-stitch-hero-content">
              <div className="home-stitch-hero-badges">
                <span className="home-stitch-tag">{hero.tag}</span>
                {hero.rating ? (
                  <span className="home-stitch-hero-rating">
                    <Star className="home-stitch-star" size={14} />
                    {hero.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>

              <h2 className="home-stitch-hero-title">{highlightTitle(hero.title)}</h2>

              {hero.description ? <p className="home-stitch-hero-description">{hero.description}</p> : null}

              <div className="home-stitch-hero-actions">
                <Link className="home-stitch-primary-cta" to={hero.href}>
                  <Play className="home-stitch-cta-icon" size={16} />
                  <span>Watch Now</span>
                </Link>
                <Link
                  className="home-stitch-secondary-cta"
                  to={user ? routeBuilders.favorites() : routeBuilders.login()}
                >
                  <Plus className="home-stitch-cta-icon" size={16} />
                  <span>My List</span>
                </Link>
              </div>

              {heroSlides.length > 1 ? (
                <div className="home-stitch-hero-dots" aria-label="Hero slide pagination">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.key}
                      className={`home-stitch-hero-dot ${index === heroIndex ? 'home-stitch-hero-dot-active' : ''}`}
                      type="button"
                      aria-label={`Go to hero slide ${index + 1}`}
                      aria-pressed={index === heroIndex}
                      onClick={() => setHeroIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <HomeCategories categories={categories} />
        <HomeRail actionHref={routeBuilders.browse()} dramas={trending} title="Trending Now" variant="trending" />
        <WeeklyTopPicks banner={featuredBanner} fallbackDrama={editors[0]} playlists={playlists} />
        <HomeRail actionHref={routeBuilders.browse()} dramas={newReleases} title="New Releases" variant="new" />
        <EditorsChoice dramas={editors} />
      </QueryState>
    </section>
  );
}
