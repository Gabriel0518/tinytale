'use client';

export const dynamic = 'force-dynamic';

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Play, Plus, Star } from 'lucide-react';
import { dramasApi, categoriesApi, userApi } from '@/lib/api';
import { Drama, Category, HomepageBanner, HomepageFeaturedBuckets, HomepageHeroBanner, HomepagePlaylist } from '@/types';
import { Navbar } from '@/components/features/Navbar';
import { HomeCarousel } from '@/components/features/HomeCarousel';
import { EditorialBanner } from '@/components/features/EditorialBanner';
import { FeaturedBanner } from '@/components/features/FeaturedBanner';
import { Footer } from '@/components/features/Footer';
import { mockDramas, mockCategories } from '@/lib/mockData';
import { localizePath, SupportedLocale } from '@/lib/i18n';
import { localizeCategoryLabel, normalizeCategoryKey } from '@/lib/categoryI18n';
import { usePlatform } from '@/hooks/usePlatform';
import { useLocale } from '@/hooks/useLocale';
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { resolveOptionalSafeImageUrl } from '@/lib/safe-image';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { MobileScrollTabs } from '@/components/mobile/MobileScrollTabs';

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

const MOBILE_HOME_TRENDING: MobileCuratedCard[] = [
  {
    key: 'contract-bride',
    title: 'Contract Bride',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxVXCUfjR_4xqYGFHLkTVhPVFssrdwFPNDiDGBx7VGu7p6xwGWtVf2e-SoD-jlIC8rsLf-1O5jUTU2Wt-Cixlkwxx7x9epdbXCn2tb1uUJA0dGFvgHacG2RHPspaebAhi4s8xgGXSa7sFSeuil8a6IocApKsWAveLqATx_cja6KrNa1_HqikHzegNsODIuKRPc8z5zR40iLHTEQLFql5h0lSwrmRxDoJbzREzkZ1aIyidcgB0ga7rEJvOZofTA0hFA9QDUff2vS4',
    meta: '102 Episodes',
    rating: '4.8',
    badge: { label: 'Hot', tone: 'primary' },
    genres: ['romance', 'drama'],
    backingIndex: 1,
  },
  {
    key: 'the-lost-heir',
    title: 'The Lost Heir',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBIH9md2mH3sWS7a00ZmFKHTvKL8Dqqr4mWvixD5wti95u1EU7ICvZlc3Y6vUMk5rgV1ueI_yeG2XKuYwRbtOg2pAfYGGcOeKtGZmdlW8tvGLC1EEYm3055h-LdombAzm2iyQeBPdeu9z6YWg7AGoeVu7puRHlMp3IQeb62Fx0pDSCz67bsQhDwvWI3jyfjR5jknOuMzQmnkn3rV3VQs27btAM5D_GHT2AY8YDFW8u736WQLSRAPho1py-OURu_lRxQlDJl7EvD8ZM',
    meta: '45 Episodes',
    rating: '4.7',
    badge: { label: 'Ongoing', tone: 'success' },
    genres: ['ceo', 'drama'],
    backingIndex: 2,
  },
  {
    key: 'moonlight-soul',
    title: 'Moonlight Soul',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbqTQchxqoj6TYH9bkir6vndLNN-v7B0kG9bhAfB5ohCTmTdkmAuuh8jsEjwAAkl0t6AlbYIF_E4SjkmLDbRGfTso3sUxq71Ta3Gce64yg926Ih8oPkWSpQvYuT7Oiz9LJ-nxaP4PBApCJ2HnIe27wklqnT-t9374o3eBL_P82sSOxcS8tfyTWCDsozPll4N39Xyn0hCpTJRc1fTUQ_Fe056ij2-dNMddaAqM5HPRDkqeSPSMi8GKcvomTGX1C_Va7FrJ9bpPkd_4',
    meta: 'Completed',
    rating: '4.9',
    genres: ['romance', 'mystery'],
    backingIndex: 3,
  },
  {
    key: 'betrayal-game',
    title: 'Betrayal Game',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB59HEfveupKKgkZZUKCa7wF3pzoAQqBVnI_ri6kKHixwSxK_0ZB68SxOKlLYp8vVv6lpaJPv7Y8ZDmQnrEDF7koH885G7WyVi6WPoMB1VVo3rIFDMrbr8wWkLZStH9B4Y-xuVSMKRmGVl0rstHB7mUPbiKTQOdTx2nHXMd10-m1Zumnd6ULJugM6XGLcgQ-mYr-9ZmO5tnVlWikchzi8SqeFFN7bWdPdaUeCL0zBgXiLGZ0z4cx2Ll4zmmv5a61frsd4RoFQqiHn0',
    meta: '12 Episodes',
    rating: '4.5',
    badge: { label: 'New', tone: 'info' },
    genres: ['revenge', 'drama'],
    backingIndex: 4,
  },
];

const MOBILE_HOME_WEEKLY_PICK = {
  title: 'WEEKLY TOP PICKS',
  description: 'Curated by our editors. The must-watch series of the week.',
  actionLabel: 'Explore Collection',
  cover:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAuKhrAwhJX86yeOD0jv7JW5GXG-yrZP492Itz2nLvMZJ8IvDEr7wpic-zPxFOCiUeYrLUqaieRSn3ZDpE_4rI4WZsMx9MCX268-yl57UoKNLDG8OSIBV-AZd0AZXPPnU0iqM9MlW6Y1gkJNhG7r1MsLExj-5rTS81m9bRIg6lhvJE6k7xXyPxEhKp_6t67yB705Enz5symJZJj4AvBYQkPRbD3w0DhnwZN2A_nBFaTdnj4CV3mAdkdQJYwHKpUd5OkclIFf5kOvNc',
};

const MOBILE_HOME_NEW_RELEASES: MobileCuratedCard[] = [
  {
    key: 'neon-pulse',
    title: 'Neon Pulse',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCY822hWb9mHLqQYFbrE2AKcbFxoqtIA5mh3WGOrnOa2XD8ndVeaMaiU2nosJ6ZM4JZAGVeSZDXjyQrqpRMY2-Xwjlq4X4l1PLUbHFJsheRyCtrpzC8BcMX8ia11emiesVpdcdR-Ycr7a0sJStXIISua5rh8ztpys4O0Zy-HUgrAwGz9P3Fm_avX-HzRdxySEIk8UW4VY0IgbwAwBCgA5OCodz4gn9p96wPg2oEfS5njX1LfVsBBVVBX0UUt5DjqV2lYGUo4clVZAk',
    meta: 'Fresh Today',
    badge: { label: 'New', tone: 'info' },
    genres: ['drama', 'mystery'],
    backingIndex: 5,
  },
  {
    key: 'the-archive',
    title: 'The Archive',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC2GGfDZ7YVpQGykAUCZJEfX_E3DGxMo1IFnPAgEHT8FaR7c4opHNfYtG1AfRBZQiCqE1mu2NYDm9fskZ-89Y7PPpyr82NL_AryakVFJYtf9ArOtyzn9x4rfyJfShnhW5zyg_9M7CRPy9Yr_2XKsIcoJVoyL-uSa4-mludtoeSsLcg8UuGl9SLjljLwGRqxwKyvduGtw2NLufSNL9aPdn5qIyzfE7OOKMeG-SBsfKtqVCR7JznMl3J4sgfBQHASQXR0SCLcwa8wUes',
    meta: '5 Episodes',
    genres: ['mystery', 'drama'],
    backingIndex: 6,
  },
  {
    key: 'love-and-gold',
    title: 'Love & Gold',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD9uUSzFhDPjQFkwu-5OPX-p2g_DgbBRFX3beKkhEsQpalooT05LK35V-3ey35k2GqIQPJA120tQh1G1SKitbDfstnL8h1DnhNvTns6k4blk9TCUNMY9AU0BrnK4hIpHSQvu_XM5f-JK3VjBP_QkqEJfQzCmEWU16cCLHOfQGxZ8WXji06vb_MUGB9n854AVQ57uADjYFE5Iup3quLiYVpiZAQtP7idbTozHJ0wl9uN9lObx15l-F9NO1c2XnXe2tROcDNacRXAhRQ',
    meta: 'Just Added',
    genres: ['romance', 'ceo'],
    backingIndex: 7,
  },
];

const MOBILE_HOME_EDITORS_CHOICE: MobileCuratedCard[] = [
  {
    key: 'shadow-of-the-forest',
    title: 'Shadow of the Forest',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdZD2yqNa_TBbVHWIebyVP5LwB6Ky8GNTEkRneP-M3Dx65xfVtu1wCKezAAroc70hPP7PC9YYAfpo2xEARl2H98Ob8QSoH1ldpXj0DCAAcfiD5_rhR6SNXsMpm8fzqKkeZRkvsXwMYtPeB39X4bP4diwo94-lfBURGJ7wJcyyvvZQ1cRVfHvct03HIs6Ute1-3PXNGJ-hlg8RZmhTT4sow9UOQNidYN2JnAUMY1y3WDSMU6PBGgtW8RhtGp2KLRj-aaENwZPhAaNc',
    meta: "Editor's Pick",
    genres: ['mystery', 'drama'],
    backingIndex: 8,
  },
  {
    key: 'the-glass-house',
    title: 'The Glass House',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBlWMXjs0O8JHXLEptoLkur_NZ-JrKoxoFCtR4PybqcfVjO7DOS4bXVp2YPNH0-ZMU5byK7HiQKEu1zkIg0mLNtC-yE_h8OvcZKaTfmrajBFSBa9DidirdQ8hy2cZeNwCcN9ZKv85Vsy2U9UtNarLc_uKPKU422djqTeauyTzFaG-kgs4CFHEHIvJmTVHrZ2n5qjQs6lMTKx_xELCQRn39q1X5jzCL43RTORRJ6xw9zYgXU9ZJhnDYHE4cnuq1gs2kJ2Fdu9K1RqJ0',
    meta: 'Staff Select',
    genres: ['ceo', 'drama'],
    backingIndex: 9,
  },
  {
    key: 'fluid-emotions',
    title: 'Fluid Emotions',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBXHhUBZSmSaU4AF84tuO0rgHFsNajrwk7yfWHDkeAoe1yegVixGmVfi29Stvj4e9fXKc3ijsOkz3XRZ0ExHWQ28P48kcVCZSrON9_ICXqCIJfRJKJ2MhUwWWs4V1scyIV3VMgWcCV1Ao0mTEXNTWdv_Q5wXGQi7VGrxTcFyHzl9evO5AmQyudkOFm1Gwupecaij6-77NSF7nJzJ1J5qL5jXSvbqeqljw1uMdbWmMCsS_-dORi1JBRFlJ9ydX9s9gkqhjO55tvqCs',
    meta: 'Staff Select',
    genres: ['romance', 'drama'],
    backingIndex: 10,
  },
];

const MOBILE_HOME_DRAMA_LIMIT = 96;
const MOBILE_HOME_INITIAL_CARD_COUNT = 4;
const MOBILE_HOME_SECONDARY_STAGE_DELAY_MS = 700;
const MOBILE_HOME_PREFETCH_DELAY_MS = 1200;

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
    <div className="mb-4 flex items-center justify-between px-4">
      <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-white">{title}</h2>
      <Link
        href={sectionActionHref(locale)}
        className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff6c82]"
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
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={resolveMobileHref(item, dramas, locale, '/browse')}
            className="group flex-none active:scale-[0.98]"
          >
            <div className="w-36">
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-[22px] bg-[#1a1c21] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {item.rating ? (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-1 text-[10px] font-semibold text-white">
                    <Star className="h-3 w-3 fill-[#ffd24d] text-[#ffd24d]" />
                    <span>{item.rating}</span>
                  </div>
                ) : null}
                {item.badge ? (
                  <div className="absolute bottom-2 left-2">
                    <span className={`rounded-md px-1.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] ${badgeToneClassName[item.badge.tone]}`}>
                      {item.badge.label}
                    </span>
                  </div>
                ) : null}
              </div>
              <h3 className="truncate text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-[11px] font-medium text-white/45">{item.meta}</p>
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
    <section className="mt-10 px-4 md:hidden">
      <Link
        href={content.href}
        className="relative flex h-48 items-center overflow-hidden rounded-[28px] bg-[#1b1e25] px-7 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
      >
        <Image
          src={content.cover}
          alt={content.title}
          fill
          className="object-cover opacity-24"
          sizes="100vw"
        />
        <div className="relative z-10 max-w-[220px]">
          <h2 className="text-[1.6rem] font-extrabold italic tracking-[-0.04em] text-white">
            {content.title}
          </h2>
          <p className="mt-3 text-xs font-medium leading-5 text-white/60">
            {content.description}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#ff7086]">
            <span>{content.actionLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </section>
  );
}

export default function Home() {
  const locale = useLocale();
  const t = resolveLocaleCopy(HOME_TEXT, locale);
  const { isMobile } = usePlatform();
  const router = useRouter();
  const requestIdRef = useRef(0);
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

  const fetchHomeData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (mode !== 'refresh') {
      setLoading(true);
    }

    try {
      const [dramasRes, categoriesRes, rankingsRes, featuredRes, playlistsRes, bannersRes, heroBannersRes] = await Promise.all([
        dramasApi.getAll({ limit: isMobile ? MOBILE_HOME_DRAMA_LIMIT : 200 }),
        categoriesApi.getAll(),
        dramasApi.getRankings('rating').catch(() => ({ data: [] })),
        dramasApi.getFeatured().catch(() => ({ data: {} })),
        dramasApi.getPlaylists().catch(() => ({ data: [] })),
        dramasApi.getBanners().catch(() => ({ data: [] })),
        dramasApi.getHeroBanners().catch(() => ({ data: [] })),
      ]);
      const fetchedDramas = dramasRes.data?.dramas || [];
      const fetchedCategories = categoriesRes.data || [];
      const localizedDramas = fetchedDramas.length > 0 ? fetchedDramas : mockDramas;
      const localizedMap = new Map<string, Drama>(
        localizedDramas.map((drama: Drama) => [drama._id, drama])
      );
      const localizedCategories = (fetchedCategories.length > 0 ? fetchedCategories : mockCategories).map((category: Category) => ({
        ...category,
        name: localizeCategoryLabel(category.name, locale, category.slug) }));

      if (requestId !== requestIdRef.current) return;

      setDramas(localizedDramas);
      setCategories(localizedCategories);

      const rankings = rankingsRes.data || [];
      setHotRankings(
        Array.isArray(rankings)
          ? rankings.slice(0, 5).map((item: Drama) => mergeLocalizedDrama(item, localizedMap))
          : []
      );
      setHeroIndex(0);

      const featuredData: HomepageFeaturedBuckets = featuredRes.data || {};
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

      const plData = playlistsRes.data || [];
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

      const bnData = bannersRes.data || [];
      setBanners(
        (Array.isArray(bnData) ? bnData : []).map((b: any) => ({
          _id: b._id, title: b.title || '', subtitle: b.subtitle || '',
          image: b.image || '', linkType: b.linkType || 'drama', linkId: b.linkId || '',
          slot: b.slot || 'standard', position: b.position ?? 0 }))
      );

      const hbData = heroBannersRes.data || [];
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
      setDramas(mockDramas);
      setFeaturedTrending([]);
      setFeaturedNewReleases([]);
      setRecommendations([]);
      setCustomPlaylists([]);
      setBanners([]);
      setHeroBanners([]);
      setCategories(
        mockCategories.map((category) => ({
          ...category,
          name: localizeCategoryLabel(category.name, locale, category.slug) }))
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [isMobile, locale, mergeLocalizedDrama]);

  useEffect(() => {
    void fetchHomeData('initial');
  }, [fetchHomeData]);

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
  const handleAddToList = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.push(localizePath('/user/favorites', locale));
      return;
    }

    const redirect = encodeURIComponent(localizePath('/user/favorites', locale));
    router.push(`${localizePath('/auth/login', locale)}?redirect=${redirect}`);
  }, [locale, router]);

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
        title: currentHeroBanner.title || MOBILE_HOME_HERO.title,
        description: currentHeroBanner.subtitle || MOBILE_HOME_HERO.description,
        tag: currentHeroBanner.tag || MOBILE_HOME_HERO.tag,
        rating: heroDrama?.rating?.toFixed(1) || MOBILE_HOME_HERO.rating,
        cover: validCover(currentHeroBanner.coverImage) || MOBILE_HOME_HERO.cover,
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

    return {
      title: MOBILE_HOME_HERO.title,
      description: MOBILE_HOME_HERO.description,
      tag: MOBILE_HOME_HERO.tag,
      rating: MOBILE_HOME_HERO.rating,
      cover: MOBILE_HOME_HERO.cover,
      href: resolveMobileHref(MOBILE_HOME_HERO, dramas, locale, t.browseFallback),
    };
  }, [currentHeroBanner, dramas, heroDrama, heroIndex, hotRankings.length, locale, t.browseFallback]);

  const mobileTrendingCards = useMemo(() => {
    const source = featuredTrending.length > 0 ? featuredTrending : trendingDramas;
    if (source.length > 0) {
      return filterMobileCards(source.map((drama, index) => mapDramaToMobileCard(drama, index, 'trending', t.episodes)), activeCategory);
    }
    return filterMobileCards(MOBILE_HOME_TRENDING, activeCategory);
  }, [activeCategory, featuredTrending, t.episodes, trendingDramas]);

  const mobileNewReleaseCards = useMemo(() => {
    const source = featuredNewReleases.length > 0 ? featuredNewReleases : newReleases;
    if (source.length > 0) {
      return filterMobileCards(source.map((drama, index) => mapDramaToMobileCard(drama, index, 'new', t.episodes)), activeCategory);
    }
    return filterMobileCards(MOBILE_HOME_NEW_RELEASES, activeCategory);
  }, [activeCategory, featuredNewReleases, newReleases, t.episodes]);

  const mobileWeeklyBanner = useMemo(() => {
    const featuredBanner = banners.find((item) => item.slot === 'featured') || banners[0];
    if (!featuredBanner) return null;
    return {
      title: featuredBanner.title || MOBILE_HOME_WEEKLY_PICK.title,
      description: featuredBanner.subtitle || MOBILE_HOME_WEEKLY_PICK.description,
      actionLabel: MOBILE_HOME_WEEKLY_PICK.actionLabel,
      cover: validCover(featuredBanner.image) || MOBILE_HOME_WEEKLY_PICK.cover,
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
    return filterMobileCards(MOBILE_HOME_EDITORS_CHOICE, activeCategory);
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
    const primaryDramaId = currentHeroBanner?.dramaId || heroDrama?._id || trendingDramas[0]?._id;
    if (primaryDramaId) {
      routes.add(localizePath(`/drama/${primaryDramaId}`, locale));
    }

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const prefetchRoutes = () => {
      routes.forEach((route) => router.prefetch(route));
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
              <span className="rounded-full bg-[#ff3b5c] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {mobileHeroData.tag}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#ffd24d]">
                <Star className="h-4 w-4 fill-[#ffd24d] text-[#ffd24d]" />
                {mobileHeroData.rating}
              </span>
            </div>
            <h1 className="max-w-[290px] text-[2.35rem] font-black leading-[0.93] tracking-[-0.06em] text-white">
              {mobileHeroData.title}
            </h1>
            <p className="mt-4 max-w-[320px] text-sm leading-6 text-white/72">
              {mobileHeroData.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={mobileHeroData.href}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#ff3b5c] px-6 py-3 text-sm font-bold text-white active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current text-white" />
                <span>{t.watchNow}</span>
              </Link>
              <button
                type="button"
                onClick={handleAddToList}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span>{t.myList}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
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
                  onClick={() => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('token');
                    if (token) {
                      router.push(localizePath('/user/favorites', locale));
                    } else {
                      const redirect = encodeURIComponent(localizePath('/user/favorites', locale));
                      router.push(`${localizePath('/auth/login', locale)}?redirect=${redirect}`);
                    }
                  }}
                  className="flex min-h-[48px] items-center gap-2 rounded-full border border-gray-500 px-5 py-3 font-medium text-white transition hover:border-white hover:bg-white/10"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.myList}
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
                  onClick={() => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('token');
                    if (token) {
                      router.push(localizePath('/user/favorites', locale));
                    } else {
                      const redirect = encodeURIComponent(localizePath('/user/favorites', locale));
                      router.push(`${localizePath('/auth/login', locale)}?redirect=${redirect}`);
                    }
                  }}
                  className="flex min-h-[48px] items-center gap-2 rounded-full border border-gray-500 px-5 py-3 font-medium text-white transition hover:border-white hover:bg-white/10"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.myList}
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
      <section className="mx-auto max-w-7xl px-4 py-6">
        <MobileScrollTabs
          items={visibleCategoryPills}
          value={activeCategory}
          onChange={setActiveCategory}
          activeTabClassName="bg-white text-black"
          inactiveTabClassName={isMobile ? 'bg-[#2b2f37] text-white/68 hover:bg-[#353a45] hover:text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'}
        />
      </section>

      {isMobile ? (
        <>
          <MobileCuratedRail
            title="Trending Now"
            items={visibleMobileTrendingCards}
            locale={locale}
            dramas={dramas}
            actionLabel="See All"
          />
          {mobileContentStage === 'full' ? (
            <>
              <MobileWeeklyTopPicks locale={locale} banner={mobileWeeklyBanner} />
              <MobileCuratedRail
                title="New Releases"
                items={visibleMobileNewReleaseCards}
                locale={locale}
                dramas={dramas}
                actionLabel="See All"
              />
              <MobileCuratedRail
                title={t.editorsChoice}
                items={mobileEditorsChoiceCards}
                locale={locale}
                dramas={dramas}
                actionLabel="See All"
              />
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
