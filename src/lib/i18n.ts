export const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'es', 'pt', 'hi', 'id', 'ko', 'fr'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_DISPLAY_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
  hi: 'हिंदी',
  id: 'Indonesia',
  ko: '한국어',
  fr: 'Français',
};

export const LOCALE_SHORT_LABELS: Record<SupportedLocale, string> = {
  en: 'EN',
  zh: 'ZH',
  ja: 'JA',
  es: 'ES',
  pt: 'PT',
  hi: 'HI',
  id: 'ID',
  ko: 'KO',
  fr: 'FR',
};

export const COUNTRY_LANG_MAP: Record<string, SupportedLocale> = {
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  BR: 'pt', PT: 'pt',
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh', MO: 'zh',
  JP: 'ja',
  KR: 'ko',
  FR: 'fr', BE: 'fr', CH: 'fr',
  ID: 'id',
  IN: 'hi',
};

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  if (!value) return false;
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function parseAcceptLanguageHeader(acceptLanguage: string | null | undefined): SupportedLocale | null {
  if (!acceptLanguage) return null;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        quality: Number.parseFloat(q),
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const language of languages) {
    if (isSupportedLocale(language.code)) {
      return language.code;
    }
  }

  return null;
}

export function extractLocaleFromPath(pathname: string): SupportedLocale | null {
  const [, firstSegment] = pathname.split('/');
  if (isSupportedLocale(firstSegment)) {
    return firstSegment;
  }
  return null;
}

export function removeLocalePrefix(pathname: string): string {
  const locale = extractLocaleFromPath(pathname);
  if (!locale) return pathname || '/';

  const normalized = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return normalized || '/';
}

export function localizePath(pathname: string, locale: SupportedLocale): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const strippedPath = removeLocalePrefix(normalizedPath);
  return strippedPath === '/' ? `/${locale}` : `/${locale}${strippedPath}`;
}

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
