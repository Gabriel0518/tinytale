'use client';

export const dynamic = 'force-dynamic';

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Play, Plus, Star } from 'lucide-react';
import { homeApi, prefetchDramaDetailBundle, userApi } from '@/lib/api';
import { Drama, Category, HomepageBanner, HomepageFeaturedBuckets, HomepageHeroBanner, HomepagePlaylist } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { FeaturedBanner } from '@/components/features/FeaturedBanner';
import { Footer } from '@/components/features/Footer';
import { localizePath, removeLocalePrefix, SupportedLocale } from '@/lib/i18n';
import { localizeCategoryLabel, normalizeCategoryKey } from '@/lib/categoryI18n';
import { usePlatform } from '@/hooks/usePlatform';
import { useLocale } from '@/hooks/useLocale';
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { resolveOptionalSafeImageUrl } from '@/lib/safe-image';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { MobileScrollTabs } from '@/components/mobile/MobileScrollTabs';
import { MobileHeroSkeleton, MobilePillRowSkeleton, MobileShelfSkeleton } from '@/components/mobile/MobileSkeletons';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/authContext';
import { readViewCache, writeViewCache } from '@/lib/view-cache';

function validCover(url?: string): string | undefined {
  return resolveOptionalSafeImageUrl(url);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function extractFavoriteDramaIds(payload: unknown): string[] {
  const data = (payload as { data?: unknown })?.data ?? payload;
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray((data as { favorites?: unknown[] })?.favorites)
      ? (data as { favorites: unknown[] }).favorites
      : Array.isArray((data as { items?: unknown[] })?.items)
        ? (data as { items: unknown[] }).items
        : Array.isArray((data as { dramas?: unknown[] })?.dramas)
          ? (data as { dramas: unknown[] }).dramas
          : [];

  const ids = new Set<string>();

  rawItems.forEach((item) => {
    if (typeof item === 'string') {
      ids.add(item);
      return;
    }

    if (!item || typeof item !== 'object') return;

    const record = item as {
      _id?: unknown;
      dramaId?: unknown;
      drama?: { _id?: unknown };
    };

    if (typeof record.dramaId === 'string') {
      ids.add(record.dramaId);
      return;
    }

    if (typeof record.drama?._id === 'string') {
      ids.add(record.drama._id);
      return;
    }

    if (typeof record._id === 'string') {
      ids.add(record._id);
    }
  });

  return Array.from(ids);
}

const HOME_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
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
    continueWatching: 'Continue Watching',
    editorsChoice: "Editor's Choice",
    more: 'More',
    inMyList: 'In My List',
    addedToList: 'Added to My List',
    removedFromList: 'Removed from My List',
    signInFavorite: 'Please sign in to add favorites',
    episodesShort: 'eps',
    pullToRefresh: 'PULL TO REFRESH',
    releaseToRefresh: 'RELEASE TO REFRESH',
    refreshing: 'REFRESHING',
    browseFallback: '/browse' },
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
    continueWatching: '继续观看',
    editorsChoice: '编辑精选',
    more: '更多',
    inMyList: '已在片单',
    addedToList: '已加入片单',
    removedFromList: '已从片单移除',
    signInFavorite: '登录后即可收藏',
    episodesShort: '集',
    pullToRefresh: '下拉刷新',
    releaseToRefresh: '松开刷新',
    refreshing: '正在刷新',
    browseFallback: '/browse' },
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
    continueWatching: '視聴を続ける',
    editorsChoice: '編集部のおすすめ',
    more: 'もっと見る',
    inMyList: 'マイリスト登録済み',
    addedToList: 'マイリストに追加しました',
    removedFromList: 'マイリストから削除しました',
    signInFavorite: 'お気に入り追加にはログインが必要です',
    episodesShort: '話',
    pullToRefresh: '引っ張って更新',
    releaseToRefresh: '離して更新',
    refreshing: '更新中',
    browseFallback: '/browse' },
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
    continueWatching: 'Seguir viendo',
    editorsChoice: 'Selección del editor',
    more: 'Más',
    inMyList: 'En mi lista',
    addedToList: 'Añadido a Mi lista',
    removedFromList: 'Eliminado de Mi lista',
    signInFavorite: 'Inicia sesión para añadir favoritos',
    episodesShort: 'eps',
    pullToRefresh: 'DESLIZA PARA ACTUALIZAR',
    releaseToRefresh: 'SUELTA PARA ACTUALIZAR',
    refreshing: 'ACTUALIZANDO',
    browseFallback: '/browse' },
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
    continueWatching: 'Continuar assistindo',
    editorsChoice: 'Escolha do editor',
    more: 'Mais',
    inMyList: 'Na Minha Lista',
    addedToList: 'Adicionado à Minha Lista',
    removedFromList: 'Removido da Minha Lista',
    signInFavorite: 'Faça login para adicionar aos favoritos',
    episodesShort: 'eps',
    pullToRefresh: 'PUXE PARA ATUALIZAR',
    releaseToRefresh: 'SOLTE PARA ATUALIZAR',
    refreshing: 'ATUALIZANDO',
    browseFallback: '/browse' },
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
    continueWatching: 'देखना जारी रखें',
    editorsChoice: 'एडिटर की पसंद',
    more: 'और',
    inMyList: 'मेरी सूची में',
    addedToList: 'मेरी सूची में जोड़ा गया',
    removedFromList: 'मेरी सूची से हटाया गया',
    signInFavorite: 'फेवरेट जोड़ने के लिए साइन इन करें',
    episodesShort: 'एप',
    pullToRefresh: 'रीफ्रेश करने के लिए खींचें',
    releaseToRefresh: 'रीफ्रेश करने के लिए छोड़ें',
    refreshing: 'रीफ्रेश हो रहा है',
    browseFallback: '/browse' },
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
    continueWatching: 'Lanjut menonton',
    editorsChoice: 'Pilihan editor',
    more: 'Lainnya',
    inMyList: 'Sudah di daftar',
    addedToList: 'Ditambahkan ke Daftar Saya',
    removedFromList: 'Dihapus dari Daftar Saya',
    signInFavorite: 'Masuk untuk menambahkan favorit',
    episodesShort: 'ep',
    pullToRefresh: 'TARIK UNTUK MEMUAT ULANG',
    releaseToRefresh: 'LEPAS UNTUK MEMUAT ULANG',
    refreshing: 'MEMUAT ULANG',
    browseFallback: '/browse' } };

type MobileCuratedCard = {
  key: string;
  title: string;
  cover: string;
  meta: string;
  dramaId?: string;
  rating?: string;
  badge?: {
    label: string;
    tone: 'primary' | 'success' | 'info';
  };
  genres: string[];
  backingIndex?: number;
};

type HomeViewCache = {
  dramas: Drama[];
  categories: Category[];
  hotRankings: Drama[];
  recommendations: Drama[];
  featuredTrending: Drama[];
  featuredNewReleases: Drama[];
  customPlaylists: HomepagePlaylist[];
  banners: HomepageBanner[];
  heroBanners: HomepageHeroBanner[];
};

const MOBILE_HOME_CATEGORY_PILLS = [
  { key: 'all', labels: { en: 'All', zh: '全部' } },
  { key: 'romance', labels: { en: 'Romance', zh: '爱情' } },
  { key: 'revenge', labels: { en: 'Revenge', zh: '复仇' } },
  { key: 'ceo', labels: { en: 'CEO', zh: '总裁' } },
  { key: 'drama', labels: { en: 'Drama', zh: '剧情' } },
  { key: 'mystery', labels: { en: 'Mystery', zh: '悬疑' } },
] as const;

const MOBILE_HOME_HERO = {
  title: 'Hidden Secrets of the Billionaire',
  accent: 'Billionaire',
  description:
    'Trapped in a web of deceit, Sarah must choose between the man she loves and the truth that could destroy his empire.',
  tag: 'Trending #1',
  rating: '4.9',
  cover:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCP-z1aATlvdb_OaUqZj2c79Gfq2yMBk398CQr8-kgs5mBCV9StoA32uQfDtixLVFo2ih-2nraGBCodfW9ZiikvKkf1SwMFqcjjDDnengc0-kxGJ139AtQiki-Y0p-FQJECvC3fXE5DwaAEn_rfbwj6kDQe9IeAV9MQMChBhpwNlycbAF00qsQJSUBviDZqB2G9D8EPuOh-tRlxOatvrMdgRQQdfvIoLrsqm-FQe1kzpCf8vEE_t2Y0nOCDnmWNJc1MVSzITBU4khU',
  backingIndex: 0,
};

const MOBILE_HOME_WEEKLY_PICK = {
  title: 'WEEKLY TOP PICKS',
  description: 'Curated by our editors. The must-watch series of the week.',
  actionLabel: 'Explore Collection',
  cover:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAuKhrAwhJX86yeOD0jv7JW5GXG-yrZP492Itz2nLvMZJ8IvDEr7wpic-zPxFOCiUeYrLUqaieRSn3ZDpE_4rI4WZsMx9MCX268-yl57UoKNLDG8OSIBV-AZd0AZXPPnU0iqM9MlW6Y1gkJNhG7r1MsLExj-5rTS81m9bRIg6lhvJE6k7xXyPxEhKp_6t67yB705Enz5symJZJj4AvBYQkPRbD3w0DhnwZN2A_nBFaTdnj4CV3mAdkdQJYwHKpUd5OkclIFf5kOvNc',
};

const MOBILE_HOME_DRAMA_LIMIT = 96;
const MOBILE_HOME_INITIAL_CARD_COUNT = 4;
const MOBILE_HOME_SECONDARY_STAGE_DELAY_MS = 700;
const MOBILE_HOME_PREFETCH_DELAY_MS = 1200;
const HOME_VIEW_CACHE_MAX_AGE_MS = 3 * 60 * 1000;

function matchesMobileCategory(genres: string[], activeCategory: string) {
  if (normalizeCategoryKey(activeCategory) === 'all') return true;
  return genres.some((genre) => normalizeCategoryKey(genre) === normalizeCategoryKey(activeCategory));
}

function filterMobileCards(items: MobileCuratedCard[], activeCategory: string) {
  const filtered = items.filter((item) => matchesMobileCategory(item.genres, activeCategory));
  return filtered.length > 0 ? filtered : items;
}

function buildMobileDramaMeta(drama: Drama, episodeLabel: string) {
  if (drama.totalEpisodes && drama.totalEpisodes > 0) {
    return `${drama.totalEpisodes} ${episodeLabel}`;
  }
  if (drama.dramaMode === 'completed' || drama.isCompleted) {
    return 'Completed';
  }
  return 'Now Streaming';
}

function buildMobileDramaBadge(
  drama: Drama,
  index: number,
  mode: 'trending' | 'new'
): MobileCuratedCard['badge'] | undefined {
  if (mode === 'trending' && index === 0) {
    return { label: 'Hot', tone: 'primary' };
  }

  const createdAt = drama.createdAt ? new Date(drama.createdAt) : null;
  const isFresh = createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
    ? Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 21
    : false;

  if (mode === 'new' || isFresh) {
    return { label: 'New', tone: 'info' };
  }

  if (drama.dramaMode !== 'completed' && !drama.isCompleted) {
    return { label: 'Ongoing', tone: 'success' };
  }

  return undefined;
}

function mapDramaToMobileCard(
  drama: Drama,
  index: number,
  mode: 'trending' | 'new',
  episodeLabel: string
): MobileCuratedCard {
  return {
    key: String(drama._id),
    dramaId: String(drama._id),
    title: drama.title,
    cover: validCover(drama.cover) || '/placeholder-cover.svg',
    meta: buildMobileDramaMeta(drama, episodeLabel),
    rating: drama.rating ? drama.rating.toFixed(1) : undefined,
    badge: buildMobileDramaBadge(drama, index, mode),
    genres: drama.categories || [],
  };
}

function resolveMobileHref(
  item: { dramaId?: string; backingIndex?: number },
  dramas: Drama[],
  locale: SupportedLocale,
  fallbackPath: string
) {
  if (item.dramaId) {
    return localizePath(`/drama/${item.dramaId}`, locale);
  }

  const backingDrama = typeof item.backingIndex === 'number' ? dramas[item.backingIndex] : null;
  return backingDrama?._id ? localizePath(`/drama/${backingDrama._id}`, locale) : localizePath(fallbackPath, locale);
}

function sectionActionHref(locale: SupportedLocale) {
  return localizePath('/browse', locale);
}

function MobileSectionHeader({
  title,
  locale,
  actionLabel,
}: {
  title: string;
  locale: SupportedLocale;
  actionLabel: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between px-6">
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      <Link
        href={sectionActionHref(locale)}
        className="text-xs font-bold uppercase tracking-widest text-[#ff3b5c]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function MobileCuratedRail({
  title,
  items,
  locale,
  dramas,
  actionLabel,
}: {
  title: string;
  items: MobileCuratedCard[];
  locale: SupportedLocale;
  dramas: Drama[];
  actionLabel: string;
}) {
  const badgeToneClassName = {
    primary: 'bg-[#ff3b5c] text-white',
    success: 'bg-[#42b96d] text-white',
    info: 'bg-[#2196f3] text-white',
  } as const;

  return (
    <section className="mt-8 md:hidden">
      <MobileSectionHeader title={title} locale={locale} actionLabel={actionLabel} />
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-6 pb-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={resolveMobileHref(item, dramas, locale, '/browse')}
            className="group flex-none active:scale-[0.98]"
          >
            <div className="w-36">
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-xl bg-[#1a1c21]">
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="144px"
                />
                {item.rating ? (
                  <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5">
                    <Star className="h-2.5 w-2.5 fill-[#ffd700] text-[#ffd700]" />
                    <span className="text-[10px] font-bold text-white">{item.rating}</span>
                  </div>
                ) : null}
                {item.badge ? (
                  <div className="absolute bottom-2 left-2">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${badgeToneClassName[item.badge.tone]}`}>
                      {item.badge.label}
                    </span>
                  </div>
                ) : null}
              </div>
              <h3 className="truncate text-sm font-bold text-white">{item.title}</h3>
              <p className="text-[10px] font-medium text-white/40">{item.meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MobileWeeklyTopPicks({
  locale,
  banner,
}: {
  locale: SupportedLocale;
  banner?: {
    title: string;
    description: string;
    actionLabel: string;
    cover: string;
    href: string;
  } | null;
}) {
  const content = banner || {
    title: MOBILE_HOME_WEEKLY_PICK.title,
    description: MOBILE_HOME_WEEKLY_PICK.description,
    actionLabel: MOBILE_HOME_WEEKLY_PICK.actionLabel,
    cover: MOBILE_HOME_WEEKLY_PICK.cover,
    href: sectionActionHref(locale),
  };

  return (
    <section className="mt-10 px-6 md:hidden">
      <Link
        href={content.href}
        className="relative flex h-48 items-center overflow-hidden rounded-2xl bg-[#25282e]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,59,92,0.15),transparent)]" />
          <Image
            src={content.cover}
            alt={content.title}
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 space-y-3 p-8">
          <h2 className="text-2xl font-extrabold italic tracking-tighter text-white">
            {content.title}
          </h2>
          <p className="max-w-[200px] text-xs font-medium text-white/60">
            {content.description}
          </p>
          <div className="inline-flex items-center gap-1 text-sm font-bold text-[#ff3b5c]">
            <span>{content.actionLabel}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
        <div className="absolute bottom-[-20px] right-[-20px] h-40 w-40 rounded-full bg-[#ff3b5c]/20 blur-3xl" />
      </Link>
    </section>
  );
}

function MobileEditorsChoiceBento({
  items,
  locale,
  dramas,
  title,
}: {
  items: MobileCuratedCard[];
  locale: SupportedLocale;
  dramas: Drama[];
  title: string;
}) {
  if (items.length < 3) return null;

  const bentoItems = items.slice(0, 3);

  return (
    <section className="mt-12 mb-12 px-6 md:hidden">
      <h3 className="mb-4 text-xl font-bold tracking-tight text-white">{title}</h3>
      <div className="grid h-[400px] grid-cols-2 gap-4">
        {/* Left: tall card */}
        <Link
          href={resolveMobileHref(bentoItems[0], dramas, locale, '/browse')}
          className="group relative overflow-hidden rounded-2xl"
        >
          <Image
            src={bentoItems[0].cover}
            alt={bentoItems[0].title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#ff3b5c]">
              Editor&apos;s Pick
            </p>
            <h4 className="text-lg font-bold leading-tight text-white">{bentoItems[0].title}</h4>
          </div>
        </Link>

        {/* Right: two stacked cards */}
        <div className="grid grid-rows-2 gap-4">
          {bentoItems.slice(1, 3).map((item) => (
            <Link
              key={item.key}
              href={resolveMobileHref(item, dramas, locale, '/browse')}
              className="group relative overflow-hidden rounded-2xl"
            >
              <Image
                src={item.cover}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const locale = useLocale();
  const t = resolveLocaleCopy(HOME_TEXT, locale);
  const { isMobile } = usePlatform();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const requestIdRef = useRef(0);
  const homeCacheKey = `home-view:${locale}:${isMobile ? 'mobile' : 'desktop'}`;
  const [cachedHomeView, setCachedHomeView] = useState<HomeViewCache | null>(null);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hotRankings, setHotRankings] = useState<Drama[]>([]);
  const [recommendations, setRecommendations] = useState<Drama[]>([]);
  const [featuredTrending, setFeaturedTrending] = useState<Drama[]>([]);
  const [featuredNewReleases, setFeaturedNewReleases] = useState<Drama[]>([]);
  const [continueWatching, setContinueWatching] = useState<Array<{
    _id: string;
    dramaId: string;
    episodeId: string | null;
    drama: Drama | null;
    episode: { _id?: string; episodeNumber?: number; title?: string; duration?: number } | null;
    progress: number;
    resumeSeconds: number;
    durationSeconds: number;
    updatedAt?: string;
  }>>([]);
  const [customPlaylists, setCustomPlaylists] = useState<HomepagePlaylist[]>([]);
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [heroBanners, setHeroBanners] = useState<HomepageHeroBanner[]>([]);
  const [favoriteDramaIds, setFavoriteDramaIds] = useState<Set<string>>(new Set());
  const [heroFavoritePending, setHeroFavoritePending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileContentStage, setMobileContentStage] = useState<'critical' | 'full'>('critical');
  const deferredActiveCategory = useDeferredValue(activeCategory);

  const mergeLocalizedDrama = useCallback((drama: Drama, localizedMap: Map<string, Drama>) => {
    const localized = localizedMap.get(drama._id);
    if (!localized) return drama;
    return {
      ...drama,
      title: localized.title || drama.title,
      description: localized.description || drama.description,
      categories: localized.categories?.length ? localized.categories : drama.categories };
  }, []);

  useEffect(() => {
    setCachedHomeView(readViewCache<HomeViewCache>(homeCacheKey, HOME_VIEW_CACHE_MAX_AGE_MS));
  }, [homeCacheKey]);

  useEffect(() => {
    if (!cachedHomeView) return;
    setDramas(cachedHomeView.dramas);
    setCategories(cachedHomeView.categories);
    setHotRankings(cachedHomeView.hotRankings);
    setRecommendations(cachedHomeView.recommendations);
    setFeaturedTrending(cachedHomeView.featuredTrending);
    setFeaturedNewReleases(cachedHomeView.featuredNewReleases);
    setCustomPlaylists(cachedHomeView.customPlaylists);
    setBanners(cachedHomeView.banners);
    setHeroBanners(cachedHomeView.heroBanners);
    setLoading(false);
  }, [cachedHomeView]);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setFavoriteDramaIds(new Set());
      return;
    }

    userApi.getFavorites(token)
      .then((res) => {
        if (cancelled) return;
        setFavoriteDramaIds(new Set(extractFavoriteDramaIds(res.data)));
      })
      .catch(() => {
        if (!cancelled) {
          setFavoriteDramaIds(new Set());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const fetchHomeData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (mode !== 'refresh' && !cachedHomeView) {
      setLoading(true);
    }

    // 添加超时保护：10 秒后强制结束 loading 状态
    const timeoutId = setTimeout(() => {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        console.warn('Home data fetch timeout after 10s');
      }
    }, 10000);

    try {
      const bootstrapRes = await homeApi.getBootstrap({ isMobile });
      const bootstrapData = (bootstrapRes as any)?.data || bootstrapRes || {};
      clearTimeout(timeoutId);

      const fetchedDramas = Array.isArray(bootstrapData.dramas) ? bootstrapData.dramas : [];
      const fetchedCategories = Array.isArray(bootstrapData.categories) ? bootstrapData.categories : [];
      const localizedDramas = fetchedDramas;
      const localizedMap = new Map<string, Drama>(
        localizedDramas.map((drama: Drama) => [drama._id, drama])
      );
      const localizedCategories = fetchedCategories.map((category: Category) => ({
        ...category,
        name: localizeCategoryLabel(category.name, locale, category.slug) }));

      if (requestId !== requestIdRef.current) return;

      setDramas(localizedDramas);
      setCategories(localizedCategories);

      const rankings = Array.isArray(bootstrapData.rankings) ? bootstrapData.rankings : [];
      setHotRankings(
        Array.isArray(rankings)
          ? rankings.slice(0, 5).map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : []
      );
      setHeroIndex(0);

      const featuredData: HomepageFeaturedBuckets = bootstrapData.featured || {};
      const recDramas = featuredData.featured || [];
      const trendingFeatured = featuredData.trending || [];
      const newFeatured = featuredData.new || [];
      setRecommendations(
        Array.isArray(recDramas)
          ? recDramas.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : []
      );
      setFeaturedTrending(
        Array.isArray(trendingFeatured)
          ? trendingFeatured.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : []
      );
      setFeaturedNewReleases(
        Array.isArray(newFeatured)
          ? newFeatured.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : []
      );

      const plData = Array.isArray(bootstrapData.playlists) ? bootstrapData.playlists : [];
      setCustomPlaylists(
        (Array.isArray(plData) ? plData : []).map((p: any) => ({
          _id: p._id,
          slug: p.slug || '',
          name: p.name,
          icon: p.icon || '',
          dramas: Array.isArray(p.dramas)
            ? p.dramas.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
            : [] }))
      );

      const bnData = Array.isArray(bootstrapData.banners) ? bootstrapData.banners : [];
      setBanners(
        (Array.isArray(bnData) ? bnData : []).map((b: any) => ({
          _id: b._id, title: b.title || '', subtitle: b.subtitle || '',
          image: b.image || '', linkType: b.linkType || 'drama', linkId: b.linkId || '',
          slot: b.slot || 'standard', position: b.position ?? 0 }))
      );

      const hbData = Array.isArray(bootstrapData.heroBanners) ? bootstrapData.heroBanners : [];
      setHeroBanners(
        (Array.isArray(hbData) ? hbData : []).map((item: any) => ({
          _id: item._id,
          coverImage: item.coverImage || '',
          title: item.title || '',
          subtitle: item.subtitle || '',
          tag: item.tag || '',
          dramaId: typeof item.dramaId === 'string' ? item.dramaId : item.dramaId?._id || '',
          displayDurationSec: Number(item.displayDurationSec || 5),
          position: Number(item.position ?? 0),
        }))
      );
      setHeroIndex(0);

      writeViewCache<HomeViewCache>(homeCacheKey, {
        dramas: localizedDramas,
        categories: localizedCategories,
        hotRankings: Array.isArray(rankings)
          ? rankings.slice(0, 5).map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : [],
        recommendations: Array.isArray(recDramas)
          ? recDramas.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : [],
        featuredTrending: Array.isArray(trendingFeatured)
          ? trendingFeatured.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : [],
        featuredNewReleases: Array.isArray(newFeatured)
          ? newFeatured.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : [],
        customPlaylists: (Array.isArray(plData) ? plData : []).map((p: any) => ({
          _id: p._id,
          slug: p.slug || '',
          name: p.name,
          icon: p.icon || '',
          dramas: Array.isArray(p.dramas)
            ? p.dramas.map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
            : [] })),
        banners: (Array.isArray(bnData) ? bnData : []).map((b: any) => ({
          _id: b._id, title: b.title || '', subtitle: b.subtitle || '',
          image: b.image || '', linkType: b.linkType || 'drama', linkId: b.linkId || '',
          slot: b.slot || 'standard', position: b.position ?? 0 })),
        heroBanners: (Array.isArray(hbData) ? hbData : []).map((item: any) => ({
          _id: item._id,
          coverImage: item.coverImage || '',
          title: item.title || '',
          subtitle: item.subtitle || '',
          tag: item.tag || '',
          dramaId: typeof item.dramaId === 'string' ? item.dramaId : item.dramaId?._id || '',
          displayDurationSec: Number(item.displayDurationSec || 5),
          position: Number(item.position ?? 0),
        })),
      });

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || '';
        if (token && !isMobile) {
          const continueRes: any = await userApi.getContinueWatching(token, 50).catch(() => null);
          if (requestId !== requestIdRef.current) return;
          const list = Array.isArray(continueRes?.data) ? continueRes.data : [];
          setContinueWatching(
            list.map((item: any) => {
              const episodeDuration = Number(item.durationSeconds ?? item?.episode?.duration ?? 0);
              const progressPercent = clampPercent(Number(item.progress || 0));
              const fallbackResumeSeconds = episodeDuration > 0
                ? Math.round((episodeDuration * progressPercent) / 100)
                : 0;
              const resumeSeconds = item.resumeSeconds ?? fallbackResumeSeconds ?? 0;
              return {
                _id: String(item._id || `${item.dramaId}-${item.episodeId || ''}`),
                dramaId: String(item.dramaId || item.drama?._id || ''),
                episodeId: item.episodeId ? String(item.episodeId) : (item.episode?._id ? String(item.episode._id) : null),
                drama: item.drama || null,
                episode: item.episode || null,
                progress: progressPercent,
                resumeSeconds: Math.max(0, Number(resumeSeconds)),
                durationSeconds: Math.max(0, episodeDuration),
                updatedAt: item.updatedAt,
              };
            })
          );
        } else {
          setContinueWatching([]);
        }
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      if (!cachedHomeView) {
        setDramas([]);
        setFeaturedTrending([]);
        setFeaturedNewReleases([]);
        setRecommendations([]);
        setCustomPlaylists([]);
        setBanners([]);
        setHeroBanners([]);
        setCategories([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [cachedHomeView, homeCacheKey, isMobile, locale, mergeLocalizedDrama]);

  useEffect(() => {
    void fetchHomeData('initial');
  }, [fetchHomeData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;

    const normalizedPath = removeLocalePrefix(window.location.pathname) || '/';
    document.documentElement.setAttribute('data-native-route-ready', normalizedPath);
    window.dispatchEvent(
      new CustomEvent('tinytale:route-ready', {
        detail: { pathname: normalizedPath },
      })
    );
  }, [loading]);

  useEffect(() => {
    setActiveCategory('all');
  }, [locale]);

  useEffect(() => {
    if (!isMobile) {
      setMobileContentStage('full');
      return;
    }

    setMobileContentStage('critical');

    const timer = window.setTimeout(() => {
      startTransition(() => setMobileContentStage('full'));
    }, MOBILE_HOME_SECONDARY_STAGE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isMobile]);

  // Auto-rotate hero banner
  useEffect(() => {
    if (isMobile && mobileContentStage !== 'full') return;

    const usingManagedHero = heroBanners.length > 0;
    const total = usingManagedHero ? heroBanners.length : hotRankings.length;
    if (total <= 1) return;

    const durationMs = usingManagedHero
      ? Math.max(3, Number(heroBanners[heroIndex]?.displayDurationSec || 5)) * 1000
      : 5000;
    const timer = setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % total);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [heroBanners, hotRankings.length, heroIndex, isMobile, mobileContentStage]);

  useEffect(() => {
    const total = heroBanners.length > 0 ? heroBanners.length : hotRankings.length;
    if (total === 0) {
      if (heroIndex !== 0) setHeroIndex(0);
      return;
    }
    if (heroIndex >= total) {
      setHeroIndex(0);
    }
  }, [heroBanners.length, hotRankings.length, heroIndex]);

  const isManagedHeroEnabled = heroBanners.length > 0;
  const currentHeroBanner = isManagedHeroEnabled
    ? heroBanners[heroIndex] || heroBanners[0]
    : null;
  const heroDrama = !isManagedHeroEnabled ? (hotRankings.length > 0 ? hotRankings[heroIndex] : dramas[0]) : null;
  const isMobileCriticalStage = isMobile && mobileContentStage !== 'full';

  const filteredDramas = useMemo(() => {
    if (normalizeCategoryKey(deferredActiveCategory) === 'all') return dramas;
    return dramas.filter(d =>
      d.categories?.some(c => normalizeCategoryKey(c) === normalizeCategoryKey(deferredActiveCategory))
    );
  }, [deferredActiveCategory, dramas]);

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
  const continueWatchingMetaMap = useMemo(
    () => new Map(continueWatching.map((item) => [item.dramaId, item])),
    [continueWatching]
  );
  const continueWatchingDramas = useMemo(
    () =>
      continueWatching
        .map((item) => item.drama)
        .filter((drama): drama is Drama => Boolean(drama?._id)),
    [continueWatching]
  );
  const currentHeroDramaId = currentHeroBanner?.dramaId || heroDrama?._id || null;
  const isCurrentHeroInList = currentHeroDramaId ? favoriteDramaIds.has(currentHeroDramaId) : false;
  const handleAddToList = useCallback(() => {
    const targetDramaId = currentHeroBanner?.dramaId || heroDrama?._id;
    if (!targetDramaId) return;

    if (!token) {
      toast(t.signInFavorite, 'info');
      const redirect = encodeURIComponent(localizePath('/user/favorites', locale));
      router.push(`${localizePath('/auth/login', locale)}?redirect=${redirect}`);
      return;
    }

    if (heroFavoritePending) return;

    setHeroFavoritePending(true);

    const isAlreadyInList = favoriteDramaIds.has(targetDramaId);
    const request = isAlreadyInList
      ? userApi.removeFavorite(token, targetDramaId)
      : userApi.addFavorite(token, targetDramaId);

    request
      .then(() => {
        setFavoriteDramaIds((prev) => {
          const next = new Set(prev);
          if (isAlreadyInList) {
            next.delete(targetDramaId);
          } else {
            next.add(targetDramaId);
          }
          return next;
        });
        toast(isAlreadyInList ? t.removedFromList : t.addedToList, 'success');
      })
      .catch((error) => {
        toast(error instanceof Error ? error.message : t.signInFavorite, 'error');
      })
      .finally(() => {
        setHeroFavoritePending(false);
      });
  }, [currentHeroBanner?.dramaId, favoriteDramaIds, heroDrama?._id, heroFavoritePending, locale, router, t.addedToList, t.removedFromList, t.signInFavorite, toast, token]);

  const mobileCategoryPills = useMemo(
    () =>
      MOBILE_HOME_CATEGORY_PILLS.map((item) => ({
        key: item.key,
        label: locale === 'zh' ? item.labels.zh : item.labels.en,
      })),
    [locale]
  );

  const categoryPills = [
    { key: 'all', label: t.all },
    ...categories.slice(0, 7).map(c => ({
      key: c.slug || normalizeCategoryKey(c.name),
      label: localizeCategoryLabel(c.name, locale, c.slug) })),
  ];
  const visibleCategoryPills = categories.length > 0 ? categoryPills : mobileCategoryPills;
  const resolveBannerHref = useCallback((banner?: HomepageBanner | null) => {
    if (!banner) return localizePath(t.browseFallback, locale);
    if (banner.linkType === 'url') {
      return banner.linkId.startsWith('http') ? banner.linkId : localizePath(t.browseFallback, locale);
    }
    if (banner.linkType === 'playlist') {
      return banner.linkId ? localizePath(`/browse?playlist=${banner.linkId}`, locale) : localizePath(t.browseFallback, locale);
    }
    return banner.linkId ? localizePath(`/drama/${banner.linkId}`, locale) : localizePath(t.browseFallback, locale);
  }, [locale, t.browseFallback]);

  const mobileHeroData = useMemo(() => {
    if (currentHeroBanner?.coverImage) {
      return {
        title: currentHeroBanner.title || '',
        description: currentHeroBanner.subtitle || '',
        tag: currentHeroBanner.tag || '',
        rating: heroDrama?.rating?.toFixed(1) || '',
        cover: validCover(currentHeroBanner.coverImage) || '',
        href: currentHeroBanner.dramaId ? localizePath(`/drama/${currentHeroBanner.dramaId}`, locale) : localizePath(t.browseFallback, locale),
      };
    }

    if (heroDrama?._id) {
      return {
        title: heroDrama.title,
        description: heroDrama.description || MOBILE_HOME_HERO.description,
        tag: hotRankings.length > 0 ? `Trending #${heroIndex + 1}` : MOBILE_HOME_HERO.tag,
        rating: heroDrama.rating?.toFixed(1) || MOBILE_HOME_HERO.rating,
        cover: validCover(heroDrama.horizontalCover) || validCover(heroDrama.cover) || MOBILE_HOME_HERO.cover,
        href: localizePath(`/drama/${heroDrama._id}`, locale),
      };
    }

    return null;
  }, [currentHeroBanner, heroDrama, heroIndex, hotRankings.length, locale, t.browseFallback]);

  const mobileTrendingCards = useMemo(() => {
    const source = featuredTrending.length > 0 ? featuredTrending : trendingDramas;
    if (source.length > 0) {
      return filterMobileCards(source.map((drama, index) => mapDramaToMobileCard(drama, index, 'trending', t.episodes)), activeCategory);
    }
    return [];
  }, [activeCategory, featuredTrending, t.episodes, trendingDramas]);

  const mobileNewReleaseCards = useMemo(() => {
    const source = featuredNewReleases.length > 0 ? featuredNewReleases : newReleases;
    if (source.length > 0) {
      return filterMobileCards(source.map((drama, index) => mapDramaToMobileCard(drama, index, 'new', t.episodes)), activeCategory);
    }
    return [];
  }, [activeCategory, featuredNewReleases, newReleases, t.episodes]);

  const mobileWeeklyBanner = useMemo(() => {
    const featuredBanner = banners.find((item) => item.slot === 'featured') || banners[0];
    if (!featuredBanner) return null;
    return {
      title: featuredBanner.title || '',
      description: featuredBanner.subtitle || '',
      actionLabel: MOBILE_HOME_WEEKLY_PICK.actionLabel,
      cover: validCover(featuredBanner.image) || '',
      href: resolveBannerHref(featuredBanner),
    };
  }, [banners, resolveBannerHref]);

  const mobileEditorsChoiceCards = useMemo(() => {
    const source = recommendations.length > 0 ? recommendations : editorsChoice;
    if (source.length > 0) {
      return filterMobileCards(
        source.map((drama, index) => ({
          ...mapDramaToMobileCard(drama, index, 'trending', t.episodes),
          badge: undefined,
        })),
        activeCategory
      );
    }
    return [];
  }, [activeCategory, editorsChoice, recommendations, t.episodes]);

  const visibleMobileTrendingCards = useMemo(
    () => (isMobileCriticalStage ? mobileTrendingCards.slice(0, MOBILE_HOME_INITIAL_CARD_COUNT) : mobileTrendingCards),
    [isMobileCriticalStage, mobileTrendingCards]
  );

  const visibleMobileNewReleaseCards = useMemo(
    () => (isMobileCriticalStage ? mobileNewReleaseCards.slice(0, MOBILE_HOME_INITIAL_CARD_COUNT) : mobileNewReleaseCards),
    [isMobileCriticalStage, mobileNewReleaseCards]
  );

  useEffect(() => {
    if (!isMobile || mobileContentStage !== 'full') return;

    const routes = new Set<string>([localizePath('/browse', locale)]);
    const dramaIds = new Set<string>();
    const primaryDramaId = currentHeroBanner?.dramaId || heroDrama?._id || trendingDramas[0]?._id;
    if (primaryDramaId) {
      dramaIds.add(primaryDramaId);
      routes.add(localizePath(`/drama/${primaryDramaId}`, locale));
    }
    trendingDramas.slice(0, 3).forEach((drama) => {
      if (drama?._id) dramaIds.add(drama._id);
    });
    newReleases.slice(0, 2).forEach((drama: Drama) => {
      if (drama?._id) dramaIds.add(drama._id);
    });

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const prefetchRoutes = () => {
      routes.forEach((route) => router.prefetch(route));
      dramaIds.forEach((dramaId) => {
        void prefetchDramaDetailBundle(dramaId);
      });
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(prefetchRoutes, { timeout: MOBILE_HOME_PREFETCH_DELAY_MS });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(prefetchRoutes, MOBILE_HOME_PREFETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    isMobile,
    mobileContentStage,
    locale,
    router,
    currentHeroBanner?.dramaId,
    heroDrama?._id,
    trendingDramas,
    newReleases,
  ]);

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar activePath="/" variant="transparent" mobileHeaderVariant="brand-search" />
      <PullToRefresh
        disabled={!isMobile}
        onRefresh={() => fetchHomeData('refresh')}
        pullLabel={t.pullToRefresh}
        releaseLabel={t.releaseToRefresh}
        refreshingLabel={t.refreshing}
      >
      {isMobile ? (
      loading && !mobileHeroData ? (
      <MobileHeroSkeleton />
      ) : mobileHeroData ? (
      <section className="relative min-h-[580px] w-full overflow-hidden md:hidden">
        <Image
          src={mobileHeroData.cover}
          alt={mobileHeroData.title}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115]/70 via-transparent to-transparent" />
        <div className="relative z-10 flex min-h-[580px] items-end px-4 pb-9 pt-[calc(92px+env(safe-area-inset-top))]">
          <div className="max-w-[86%]">
            <div className="mb-4 flex items-center gap-2">
              {mobileHeroData.tag ? (
                <span className="rounded-full bg-[#ff3b5c] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {mobileHeroData.tag}
                </span>
              ) : null}
              {mobileHeroData.rating ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#ffd24d]">
                  <Star className="h-4 w-4 fill-[#ffd24d] text-[#ffd24d]" />
                  {mobileHeroData.rating}
                </span>
              ) : null}
            </div>
            <h1 className="max-w-[290px] text-[2.35rem] font-black leading-[0.93] tracking-[-0.06em] text-white">
              {mobileHeroData.title}
            </h1>
            {mobileHeroData.description ? (
              <p className="mt-4 max-w-[320px] text-sm leading-6 text-white/72">
                {mobileHeroData.description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={mobileHeroData.href}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#ff3b5c] px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,59,92,0.3)] active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current text-white" />
                <span>{t.watchNow}</span>
              </Link>
              <button
                type="button"
                onClick={handleAddToList}
                disabled={heroFavoritePending}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-full backdrop-blur-md px-6 py-3 text-sm font-bold text-white active:scale-[0.98] ${
                  isCurrentHeroInList ? 'bg-white/20 hover:bg-white/25' : 'bg-white/10 hover:bg-white/20'
                } ${heroFavoritePending ? 'opacity-70' : ''}`}
              >
                {isCurrentHeroInList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>{isCurrentHeroInList ? t.inMyList : t.myList}</span>
              </button>
            </div>
            {/* Hero Indicator Dots */}
            {(() => {
              const total = heroBanners.length > 0 ? heroBanners.length : hotRankings.length;
              if (total <= 1) return null;
              return (
                <div className="mt-5 flex items-center gap-2">
                  {Array.from({ length: total }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === heroIndex ? 'w-7 bg-white' : 'w-3.5 bg-white/40'
                      }`}
                      aria-label={`${t.slideLabel} ${i + 1}`}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>
      ) : (
      <section className="min-h-[220px] w-full bg-[#0f1115] md:hidden" />
      )
      ) : (
      <section className="relative aspect-[9/14] max-h-[55vh] min-h-[420px] w-full overflow-hidden md:h-[85vh] md:max-h-none md:min-h-0 md:aspect-auto">
        {isManagedHeroEnabled && currentHeroBanner ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage: `url(${validCover(currentHeroBanner.coverImage) || 'https://picsum.photos/seed/hero-managed/1920/1080'})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />

            <div className="absolute bottom-28 left-0 right-0 mx-auto max-w-7xl px-4 md:bottom-32">
              {(currentHeroBanner.tag || 'TinyTale') && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                  {currentHeroBanner.tag || 'TinyTale'}
                </span>
              )}
              <h1 className="max-w-lg text-3xl font-bold leading-tight text-white md:text-6xl">
                {currentHeroBanner.title}
              </h1>
              {currentHeroBanner.subtitle && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-300 md:text-base">
                  {currentHeroBanner.subtitle}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={currentHeroBanner.dramaId ? localizePath(`/drama/${currentHeroBanner.dramaId}`, locale) : localizePath(t.browseFallback, locale)}
                  className="flex min-h-[48px] items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t.watchNow}
                </Link>
                <button
                  type="button"
                  onClick={handleAddToList}
                  disabled={heroFavoritePending}
                  className={`flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-3 font-medium text-white transition hover:border-white hover:bg-white/10 ${
                    isCurrentHeroInList ? 'border-white/70 bg-white/10' : 'border-gray-500'
                  } ${heroFavoritePending ? 'opacity-70' : ''}`}
                >
                  {isCurrentHeroInList ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {isCurrentHeroInList ? t.inMyList : t.myList}
                </button>
              </div>

              {heroBanners.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  {heroBanners.map((_, i) => (
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
        ) : heroDrama ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage: `url(${validCover(heroDrama.horizontalCover) || validCover(heroDrama.cover) || 'https://picsum.photos/seed/hero/1920/1080'})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />

            <div className="absolute bottom-28 left-0 right-0 mx-auto max-w-7xl px-4 md:bottom-32">
              {hotRankings.length > 0 && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                  🔥 #{heroIndex + 1} {t.hotRanking}
                </span>
              )}
              <h1 className="max-w-lg text-3xl font-bold leading-tight text-white md:text-6xl">
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
                  <span key={`${cat}-${i}`}>
                    {localizeCategoryLabel(cat, locale)}{i < Math.min((heroDrama.categories?.length ?? 0), 3) - 1 && ' · '}
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

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={localizePath(`/drama/${heroDrama._id}`, locale)}
                  className="flex min-h-[48px] items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t.watchNow}
                </Link>
                <button
                  type="button"
                  onClick={handleAddToList}
                  disabled={heroFavoritePending}
                  className={`flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-3 font-medium text-white transition hover:border-white hover:bg-white/10 ${
                    isCurrentHeroInList ? 'border-white/70 bg-white/10' : 'border-gray-500'
                  } ${heroFavoritePending ? 'opacity-70' : ''}`}
                >
                  {isCurrentHeroInList ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {isCurrentHeroInList ? t.inMyList : t.myList}
                </button>
              </div>

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
      )}

      {/* Category Filter Pills */}
      {loading && categories.length === 0 && isMobile ? (
        <MobilePillRowSkeleton />
      ) : (
        <section className={`mx-auto max-w-7xl py-4 ${isMobile ? 'px-6' : 'px-4 py-6'}`}>
          <MobileScrollTabs
            items={visibleCategoryPills}
            value={activeCategory}
            onChange={setActiveCategory}
            activeTabClassName="bg-white text-black"
            inactiveTabClassName={isMobile ? 'bg-[#2c2f36] text-white/70 hover:text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'}
          />
        </section>
      )}

      {isMobile ? (
        <>
          {loading && visibleMobileTrendingCards.length === 0 ? (
            <MobileShelfSkeleton titleWidthClass="w-32" />
          ) : visibleMobileTrendingCards.length > 0 ? (
            <MobileCuratedRail
              title="Trending Now"
              items={visibleMobileTrendingCards}
              locale={locale}
              dramas={dramas}
              actionLabel="See All"
            />
          ) : null}
          {mobileContentStage === 'full' ? (
            <>
              {mobileWeeklyBanner ? <MobileWeeklyTopPicks locale={locale} banner={mobileWeeklyBanner} /> : null}
              {loading && visibleMobileNewReleaseCards.length === 0 ? (
                <MobileShelfSkeleton titleWidthClass="w-28" />
              ) : visibleMobileNewReleaseCards.length > 0 ? (
                <MobileCuratedRail
                  title="New Releases"
                  items={visibleMobileNewReleaseCards}
                  locale={locale}
                  dramas={dramas}
                  actionLabel="See All"
                />
              ) : null}
              {loading && mobileEditorsChoiceCards.length === 0 ? (
                <MobileShelfSkeleton titleWidthClass="w-36" />
              ) : mobileEditorsChoiceCards.length >= 3 ? (
                <MobileEditorsChoiceBento
                  title={t.editorsChoice}
                  items={mobileEditorsChoiceCards}
                  locale={locale}
                  dramas={dramas}
                />
              ) : mobileEditorsChoiceCards.length > 0 ? (
                <MobileCuratedRail
                  title={t.editorsChoice}
                  items={mobileEditorsChoiceCards}
                  locale={locale}
                  dramas={dramas}
                  actionLabel="See All"
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>

      {!loading && continueWatchingDramas.length > 0 && (
        <HomeCarousel
          title={`⏯️ ${t.continueWatching}`}
          dramas={continueWatchingDramas}
          getDramaHref={(drama) => localizePath(`/drama/${drama._id}`, locale)}
          renderCardOverlay={(drama) => {
            const item = continueWatchingMetaMap.get(drama._id);
            if (!item) return null;

            const progressPercent = clampPercent(item.progress || 0);
            const playedSeconds = Math.max(0, Math.floor(item.resumeSeconds || 0));
            const totalSeconds = Math.max(0, Math.floor(item.durationSeconds || 0));
            const episodeLabel = item.episode?.episodeNumber ? `EP ${item.episode.episodeNumber}` : "EP ?";
            const timeLabel = totalSeconds > 0
              ? `${formatSeconds(playedSeconds)} / ${formatSeconds(totalSeconds)}`
              : formatSeconds(playedSeconds);

            return (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <div className="mb-1 text-[10px] text-gray-200">{episodeLabel}</div>
                  <div className="h-1.5 w-full rounded-full bg-white/20">
                    <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="rounded-full bg-black/75 px-3 py-1.5 text-center text-[11px] font-semibold text-white">
                    <span>{episodeLabel}</span>
                    <span className="mx-1 text-gray-300">•</span>
                    <span>{timeLabel}</span>
                  </div>
                </div>
              </>
            );
          }}
        />
      )}

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
      ) : !isMobile ? (
        <HomeCarousel
          title={`🔥 ${t.trendingNow}`}
          dramas={trendingDramas}
        />
      ) : null}

      {/* New Releases */}
      {!loading && !isMobile && (
        <HomeCarousel
          title={`✨ ${t.newReleases}`}
          dramas={newReleases}
        />
      )}

      {/* Editorial Banner — removed hardcoded, now dynamic from API */}

      {/* Recommendations (from admin featured) */}
      {!loading && !isMobile && recommendations.length > 0 && (
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
      {!loading && !isMobile && editorsChoice.length > 0 && (
        <HomeCarousel
          title={`⭐ ${t.editorsChoice}`}
          dramas={editorsChoice}
        />
      )}
        </>
      )}

      {/* Footer */}
      {!isMobile ? <Footer /> : null}
      </PullToRefresh>
    </div>
  );
}
