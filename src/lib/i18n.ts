import {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  LOCALE_DISPLAY_NAMES,
  LOCALE_SHORT_LABELS,
  SUPPORTED_LOCALES,
  extractLocaleFromPath,
  isSupportedLocale,
  localizePath,
  parseAcceptLanguageHeader,
  removeLocalePrefix,
  type SupportedLocale,
} from '@i18n';

export {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  LOCALE_DISPLAY_NAMES,
  LOCALE_SHORT_LABELS,
  SUPPORTED_LOCALES,
  extractLocaleFromPath,
  isSupportedLocale,
  localizePath,
  parseAcceptLanguageHeader,
  removeLocalePrefix,
};
export type { SupportedLocale };

export function getCookieLocale(): SupportedLocale | null {
  if (typeof document === 'undefined') return null;

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('user_lang='))
    ?.split('=')[1];

  if (!cookieValue) return null;
  const decoded = decodeURIComponent(cookieValue);
  return isSupportedLocale(decoded) ? decoded : null;
}

export function detectClientLocale(pathname?: string): SupportedLocale {
  const candidates: Array<string | undefined> = [pathname];
  if (typeof window !== 'undefined') {
    candidates.push(window.location.pathname);
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const pathLocale = extractLocaleFromPath(candidate);
    if (pathLocale) return pathLocale;
  }

  const cookieLocale = getCookieLocale();
  if (cookieLocale) return cookieLocale;

  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (isSupportedLocale(htmlLang)) {
      return htmlLang;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLocale = parseAcceptLanguageHeader(navigator.languages?.join(',') || navigator.language);
    if (browserLocale) return browserLocale;
  }

  return DEFAULT_LOCALE;
}
