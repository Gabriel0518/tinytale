import type { MetadataRoute } from 'next';
import { localizePath, SUPPORTED_LOCALES } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tinytale.top';
const STATIC_PATHS = ['/', '/browse', '/category', '/rankings', '/search', '/help'];
const DRAMA_PAGE_LIMIT = 100;
const EPISODE_FETCH_CONCURRENCY = 8;

type DramaListItem = {
  _id: string;
  updatedAt?: string;
  createdAt?: string;
};

type EpisodeListItem = {
  _id: string;
  updatedAt?: string;
  createdAt?: string;
};

type DramaListResponse = {
  success: boolean;
  data?: {
    dramas?: DramaListItem[];
    totalPages?: number;
  };
};

type DramaDetailResponse = {
  success: boolean;
  data?: {
    episodes?: EpisodeListItem[];
  };
};

async function fetchDramaPage(page: number, limit: number): Promise<DramaListResponse> {
  const url = `${API_URL}/api/dramas?lang=en&page=${page}&limit=${limit}&sort=newest`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Failed to fetch dramas page ${page}`);
  }
  return response.json();
}

async function fetchAllDramas(): Promise<DramaListItem[]> {
  const firstPage = await fetchDramaPage(1, DRAMA_PAGE_LIMIT);
  const firstDramas = firstPage.data?.dramas || [];
  const totalPages = Number(firstPage.data?.totalPages || 1);

  if (totalPages <= 1) {
    return firstDramas;
  }

  const pageRequests: Promise<DramaListResponse>[] = [];
  for (let page = 2; page <= totalPages; page += 1) {
    pageRequests.push(fetchDramaPage(page, DRAMA_PAGE_LIMIT));
  }

  const pageResults = await Promise.allSettled(pageRequests);
  const aggregated = [...firstDramas];

  for (const result of pageResults) {
    if (result.status === 'fulfilled') {
      aggregated.push(...(result.value.data?.dramas || []));
    }
  }

  return aggregated;
}

async function fetchDramaEpisodes(dramaId: string): Promise<EpisodeListItem[]> {
  const url = `${API_URL}/api/dramas/${dramaId}?lang=en`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) return [];
  const payload = (await response.json()) as DramaDetailResponse;
  return payload.data?.episodes || [];
}

async function fetchEpisodesByDrama(dramaIds: string[]): Promise<Map<string, EpisodeListItem[]>> {
  const episodeMap = new Map<string, EpisodeListItem[]>();

  for (let i = 0; i < dramaIds.length; i += EPISODE_FETCH_CONCURRENCY) {
    const batch = dramaIds.slice(i, i + EPISODE_FETCH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (dramaId) => {
        const episodes = await fetchDramaEpisodes(dramaId);
        return { dramaId, episodes };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        episodeMap.set(result.value.dramaId, result.value.episodes);
      }
    }
  }

  return episodeMap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${siteUrl}${localizePath(path, locale)}`,
        lastModified: now,
        changeFrequency: path === '/' ? 'daily' : 'weekly',
        priority: path === '/' ? 1 : 0.8,
      });
    }
  }

  try {
    const dramas = await fetchAllDramas();
    const seenDramaIds = new Set<string>();
    const uniqueDramas = dramas.filter((drama) => {
      if (!drama?._id || seenDramaIds.has(drama._id)) return false;
      seenDramaIds.add(drama._id);
      return true;
    });

    const episodesByDrama = await fetchEpisodesByDrama(uniqueDramas.map((drama) => drama._id));

    for (const drama of uniqueDramas) {
      const dramaLastModified = drama.updatedAt || drama.createdAt || now.toISOString();

      for (const locale of SUPPORTED_LOCALES) {
        entries.push({
          url: `${siteUrl}${localizePath(`/drama/${drama._id}`, locale)}`,
          lastModified: dramaLastModified,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }

      const episodes = episodesByDrama.get(drama._id) || [];
      const seenEpisodeIds = new Set<string>();
      const uniqueEpisodes = episodes.filter((episode) => {
        if (!episode?._id || seenEpisodeIds.has(episode._id)) return false;
        seenEpisodeIds.add(episode._id);
        return true;
      });

      for (const episode of uniqueEpisodes) {
        const episodeLastModified = episode.updatedAt || episode.createdAt || dramaLastModified;
        for (const locale of SUPPORTED_LOCALES) {
          entries.push({
            url: `${siteUrl}${localizePath(`/drama/${drama._id}/play/${episode._id}`, locale)}`,
            lastModified: episodeLastModified,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Keep static URLs when API is temporarily unavailable.
  }

  return entries;
}
