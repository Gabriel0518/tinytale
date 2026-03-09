import type { MetadataRoute } from 'next';
import { localizePath, SUPPORTED_LOCALES } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7002';
const STATIC_PATHS = ['/', '/browse', '/category', '/rankings', '/search', '/help'];

type DramaListItem = {
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

async function fetchDramaPage(page: number, limit: number): Promise<DramaListResponse> {
  const url = `${API_URL}/api/dramas?lang=en&page=${page}&limit=${limit}&sort=newest`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Failed to fetch dramas page ${page}`);
  }
  return response.json();
}

async function fetchAllDramas(): Promise<DramaListItem[]> {
  const limit = 100;
  const firstPage = await fetchDramaPage(1, limit);
  const firstDramas = firstPage.data?.dramas || [];
  const totalPages = Number(firstPage.data?.totalPages || 1);

  if (totalPages <= 1) {
    return firstDramas;
  }

  const pageRequests: Promise<DramaListResponse>[] = [];
  for (let page = 2; page <= totalPages; page += 1) {
    pageRequests.push(fetchDramaPage(page, limit));
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
    for (const drama of dramas) {
      const lastModified = drama.updatedAt || drama.createdAt || now.toISOString();
      for (const locale of SUPPORTED_LOCALES) {
        entries.push({
          url: `${siteUrl}${localizePath(`/drama/${drama._id}`, locale)}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    }
  } catch {
    // Keep static URLs when API is temporarily unavailable.
  }

  return entries;
}

