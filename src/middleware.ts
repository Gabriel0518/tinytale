import { NextRequest, NextResponse } from 'next/server';
import {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  extractLocaleFromPath,
  isSupportedLocale,
  localizePath,
  removeLocalePrefix,
} from '@/lib/i18n';

const BYPASS_PREFIXES = ['/api', '/_next', '/admin', '/cdn'];
const BYPASS_EXACT = new Set(['/favicon.ico', '/robots.txt', '/sitemap.xml', '/manifest.json']);
const PUBLIC_FILE = /\.[^/]+$/;
const AUTH_COOKIE = 'tt_session';
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://api.tinytale.top' : 'http://localhost:7002')
).replace(/\/+$/, '');
const PUBLIC_PATHS = new Set([
  '/',
  '/browse',
  '/play',
  '/category',
  '/rankings',
  '/search',
  '/help',
  '/about',
  '/careers',
  '/press',
  '/terms',
  '/privacy',
  '/cookies',
  '/creator-home',
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/reset-password',
  '/auth/reset-password/verify',
  '/affiliate',
]);

function isPublicPath(pathname: string): boolean {
  const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (PUBLIC_PATHS.has(normalized)) return true;
  if (normalized.startsWith('/affiliate/')) return true;
  if (normalized.startsWith('/auth/')) return true;
  if (normalized.startsWith('/creator-home/')) return true;
  if (normalized.startsWith('/drama/')) return true;
  if (normalized.startsWith('/ref/')) return true;
  return false;
}

function shouldBypass(pathname: string): boolean {
  if (BYPASS_EXACT.has(pathname)) return true;
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (PUBLIC_FILE.test(pathname)) return true;
  return false;
}

async function detectRequestLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get('user_lang')?.value;
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Prefer backend detection once: it uses DB-backed region-language library.
  try {
    const forwardedHeaders = new Headers();
    const passthroughHeaderKeys = [
      'cf-ipcountry',
      'x-vercel-ip-country',
      'x-country-code',
      'cf-connecting-ip',
      'x-forwarded-for',
      'x-real-ip',
    ];
    for (const key of passthroughHeaderKeys) {
      const value = request.headers.get(key);
      if (value) forwardedHeaders.set(key, value);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`${API_URL}/api/i18n/detect`, {
      method: 'GET',
      headers: forwardedHeaders,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const payload = await response.json() as { data?: { detected_language?: string } };
      const backendLocale = String(payload?.data?.detected_language || '').trim().toLowerCase();
      if (isSupportedLocale(backendLocale)) {
        return backendLocale;
      }
    }
  } catch {
    // noop: fallback to local country-code mapping
  }

  const country = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country-code') ||
    ''
  ).toUpperCase();

  if (country && COUNTRY_LANG_MAP[country]) {
    return COUNTRY_LANG_MAP[country];
  }

  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const localeStrippedPath = removeLocalePrefix(pathname);

  if (shouldBypass(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale-path', pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Handle locale-prefixed static/public files such as /en/_next/static/*.
  // Redirect to the canonical framework path /_next/static/*.
  if (pathname !== localeStrippedPath && shouldBypass(localeStrippedPath)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localeStrippedPath;
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  const normalizedPath = localeStrippedPath;
  const requestLocale = extractLocaleFromPath(pathname);
  const detectedLocale = requestLocale || await detectRequestLocale(request);
  const hasSession = request.cookies.get(AUTH_COOKIE)?.value === '1';

  if (!hasSession && !isPublicPath(normalizedPath)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath('/auth/login', detectedLocale);

    const localizedReturnPath = requestLocale
      ? `${pathname}${search}`
      : `${localizePath(normalizedPath, detectedLocale)}${search}`;
    redirectUrl.searchParams.set('returnUrl', localizedReturnPath);

    return NextResponse.redirect(redirectUrl);
  }

  const urlLocale = requestLocale;

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

  const localizedFallback = await detectRequestLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = localizePath(pathname, localizedFallback);
  redirectUrl.search = search;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('user_lang', localizedFallback, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image).*)',
    '/:locale/_next/:path*',
  ],
};
