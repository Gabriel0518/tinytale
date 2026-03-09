import { NextRequest, NextResponse } from 'next/server';
import {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  extractLocaleFromPath,
  isSupportedLocale,
  localizePath,
  parseAcceptLanguageHeader,
  removeLocalePrefix,
} from '@/lib/i18n';

const BYPASS_PREFIXES = ['/api', '/_next', '/admin', '/cdn'];
const BYPASS_EXACT = new Set(['/favicon.ico', '/robots.txt', '/sitemap.xml', '/manifest.json']);
const PUBLIC_FILE = /\.[^/]+$/;

function shouldBypass(pathname: string): boolean {
  if (BYPASS_EXACT.has(pathname)) return true;
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (PUBLIC_FILE.test(pathname)) return true;
  return false;
}

function detectRequestLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get('user_lang')?.value;
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get('accept-language');
  const browserLocale = parseAcceptLanguageHeader(acceptLanguage);
  if (browserLocale) {
    return browserLocale;
  }

  const country = request.headers.get('cf-ipcountry') || '';
  if (country && COUNTRY_LANG_MAP[country]) {
    return COUNTRY_LANG_MAP[country];
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldBypass(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale-path', pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const urlLocale = extractLocaleFromPath(pathname);

  if (urlLocale) {
    const rewrittenPath = removeLocalePrefix(pathname);
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewrittenPath;
    rewriteUrl.search = search;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-lang', urlLocale);
    requestHeaders.set('x-locale-path', pathname);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });

    response.cookies.set('user_lang', urlLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    return response;
  }

  const detectedLocale = detectRequestLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = localizePath(pathname, detectedLocale);
  redirectUrl.search = search;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('user_lang', detectedLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
