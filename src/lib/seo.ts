import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
  extractLocaleFromPath,
  isSupportedLocale,
  localizePath,
  removeLocalePrefix,
} from '@/lib/i18n';

const FALLBACK_SITE_URL = 'https://tinytale.top';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, '');

export function getSiteUrl(): string {
  return siteUrl;
}

export function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const noHash = normalized.split('#')[0];
  const noQuery = noHash.split('?')[0];
  return noQuery || '/';
}

export function resolveRequestLocale(pathname: string, headerLocale?: string | null): SupportedLocale {
  const normalizedHeaderLocale = String(headerLocale || '').trim().toLowerCase();
  if (isSupportedLocale(normalizedHeaderLocale)) {
    return normalizedHeaderLocale;
  }

  const pathLocale = extractLocaleFromPath(pathname);
  if (pathLocale) {
    return pathLocale;
  }

  return DEFAULT_LOCALE;
}

export function getBasePath(pathname: string): string {
  return removeLocalePrefix(normalizePath(pathname));
}

export function toAbsoluteUrl(pathname: string): string {
  return `${siteUrl}${pathname}`;
}

export function buildCanonicalUrl(pathname: string, locale: SupportedLocale): string {
  const localizedPath = localizePath(getBasePath(pathname), locale);
  return toAbsoluteUrl(localizedPath);
}

export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const basePath = getBasePath(pathname);
  const alternates: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    alternates[locale] = toAbsoluteUrl(localizePath(basePath, locale));
  }

  alternates['x-default'] = alternates[DEFAULT_LOCALE];
  return alternates;
}

