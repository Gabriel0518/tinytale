import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { removeLocalePrefix } from '@i18n';
import { getNativeShellWebBaseUrl } from '../lib/runtime-config';

const APP_LINK_HOSTS = new Set(['tinytale.top', 'www.tinytale.top', 'localhost', '10.0.2.2']);
const CUSTOM_SCHEMES = new Set(['top.tinytale.app', 'tinytale']);
const PENDING_ROUTE_KEY = 'tinytale.native.pending-route';
const LAST_HANDLED_TARGET_DEDUPE_MS = 2500;
const EXTERNAL_WEB_RETURN_DEDUPE_MS = 15000;
const WEB_ONLY_PREFIXES = ['/creator', '/affiliate', '/ref'];
const WEB_ONLY_PATHS = new Set(['/about', '/press', '/careers', '/privacy', '/terms', '/cookies', '/help']);
const NATIVE_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/browse$/,
  /^\/search$/,
  /^\/rankings$/,
  /^\/category\/[^/?#]+$/,
  /^\/drama\/[^/?#]+$/,
  /^\/play\/[^/?#]+\/[^/?#]+$/,
  /^\/auth\/login$/,
  /^\/auth\/register$/,
  /^\/auth\/reset-password$/,
  /^\/auth\/reset-password\/verify$/,
  /^\/user\/profile$/,
  /^\/user\/favorites$/,
  /^\/user\/history$/,
  /^\/user\/notifications$/,
  /^\/user\/purchases$/,
  /^\/user\/settings$/,
  /^\/user\/coins$/,
  /^\/user\/subscription$/,
] as const;

export type RouteTarget = { kind: 'native'; path: string } | { kind: 'web'; url: string };

let lastHandledTarget: { key: string; handledAt: number } | null = null;
let lastOpenedExternalWebTarget: { key: string; openedAt: number } | null = null;

function getWebBaseUrl() {
  return getNativeShellWebBaseUrl();
}

function stripTrailingSlash(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

function sanitizeHashPath(input: string) {
  if (!input) return '/';
  if (input.startsWith('/#/')) return input.slice(2);
  if (input.startsWith('#/')) return input.slice(1);
  if (input.startsWith('#')) return input.slice(1) || '/';
  return input;
}

function joinSchemeHostPath(url: URL) {
  const normalizedHost = url.hostname ? `/${url.hostname}` : '';
  const normalizedPath = url.pathname === '/' ? '' : url.pathname;
  return `${normalizedHost}${normalizedPath}${url.search}${url.hash}` || '/';
}

function tryParseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isAppHostedUrl(url: URL) {
  const scheme = url.protocol.replace(':', '');
  return APP_LINK_HOSTS.has(url.hostname) || CUSTOM_SCHEMES.has(scheme);
}

export function normalizeDeepLink(input: string): string {
  const url = tryParseUrl(input);
  if (url && isAppHostedUrl(url)) {
    const scheme = url.protocol.replace(':', '');
    const rawPath = CUSTOM_SCHEMES.has(scheme)
      ? joinSchemeHostPath(url)
      : `${url.pathname || '/'}${url.search}${url.hash}`;
    return rawPath || '/';
  }

  return input.startsWith('/') || input.startsWith('#') ? input : `/${input}`;
}

function splitPathComponents(input: string) {
  const sanitized = sanitizeHashPath(input);
  const [pathWithMaybeLocale, suffix = ''] = sanitized.split(/(?=[?#])/);
  const stripped = removeLocalePrefix(pathWithMaybeLocale || '/');
  return {
    pathname: stripped.startsWith('/') ? stripped : `/${stripped}`,
    suffix,
  };
}

function remapNativePath(pathname: string) {
  const playbackMatch = pathname.match(/^\/drama\/([^/]+)\/play\/([^/]+)$/);
  if (playbackMatch) {
    return `/play/${playbackMatch[1]}/${playbackMatch[2]}`;
  }
  return pathname;
}

function sanitizePath(input: string) {
  const { pathname, suffix } = splitPathComponents(input);
  const nextPath = remapNativePath(pathname);
  return `${nextPath}${suffix}`;
}

function toCanonicalPathKey(input: string) {
  const normalized = sanitizePath(normalizeDeepLink(input));
  const [pathnameWithLocale = '/', suffix = ''] = normalized.split(/(?=[?#])/);
  const strippedPathname = stripTrailingSlash(removeLocalePrefix(pathnameWithLocale || '/'));
  return `${strippedPathname}${suffix}`;
}

function isWebBaseHost(url: URL) {
  const webBaseUrl = tryParseUrl(getWebBaseUrl());
  if (!webBaseUrl) {
    return false;
  }
  return webBaseUrl.hostname === url.hostname;
}

export function isWebOnlyPath(pathname: string) {
  const stripped = removeLocalePrefix(pathname);
  return WEB_ONLY_PATHS.has(stripped) || WEB_ONLY_PREFIXES.some((prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`));
}

function isKnownNativePath(pathname: string) {
  const stripped = removeLocalePrefix(pathname);
  return NATIVE_ROUTE_PATTERNS.some((pattern) => pattern.test(stripped));
}

function toSafeNativePath(input: string) {
  const normalized = sanitizePath(normalizeDeepLink(input));
  const [pathname] = normalized.split(/[?#]/);
  return isKnownNativePath(pathname) ? normalized : '/';
}

async function openWebUrl(url: string) {
  lastOpenedExternalWebTarget = {
    key: getTargetKey({ kind: 'web', url }),
    openedAt: Date.now(),
  };

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function classifyRouteTarget(input: string): RouteTarget {
  const parsedUrl = tryParseUrl(input);
  if (parsedUrl && !isAppHostedUrl(parsedUrl)) {
    return {
      kind: 'web',
      url: parsedUrl.toString(),
    };
  }

  const normalized = sanitizePath(normalizeDeepLink(input));
  const [pathname] = normalized.split(/[?#]/);

  if (isWebOnlyPath(pathname)) {
    return {
      kind: 'web',
      url: `${getWebBaseUrl().replace(/\/+$/, '')}${normalized}`,
    };
  }

  return {
    kind: 'native',
    path: toSafeNativePath(normalized),
  };
}

function getTargetKey(target: RouteTarget) {
  if (target.kind === 'native') {
    return `native:${toCanonicalPathKey(target.path)}`;
  }

  const parsedUrl = tryParseUrl(target.url);
  if (!parsedUrl) {
    return `web:${target.url}`;
  }

  if (isAppHostedUrl(parsedUrl) || isWebBaseHost(parsedUrl)) {
    return `web:${toCanonicalPathKey(`${parsedUrl.pathname || '/'}${parsedUrl.search}${parsedUrl.hash}`)}`;
  }

  return `web:${parsedUrl.toString()}`;
}

export function shouldHandleRouteTarget(target: RouteTarget, dedupeWindowMs = LAST_HANDLED_TARGET_DEDUPE_MS) {
  const targetKey = getTargetKey(target);
  const now = Date.now();

  if (lastHandledTarget && lastHandledTarget.key === targetKey && now - lastHandledTarget.handledAt < dedupeWindowMs) {
    return false;
  }

  lastHandledTarget = {
    key: targetKey,
    handledAt: now,
  };
  return true;
}

function shouldSuppressExternalWebReturn(target: RouteTarget) {
  if (target.kind !== 'web' || !lastOpenedExternalWebTarget) {
    return false;
  }

  const targetKey = getTargetKey(target);
  return (
    lastOpenedExternalWebTarget.key === targetKey &&
    Date.now() - lastOpenedExternalWebTarget.openedAt < EXTERNAL_WEB_RETURN_DEDUPE_MS
  );
}

export function resolveInitialRouteFromLocation(locationLike: Location) {
  if (locationLike.hash.startsWith('#/')) {
    return sanitizePath(locationLike.hash);
  }

  const pathFromHref = normalizeDeepLink(locationLike.href);
  const pathFromPathname = sanitizeHashPath(locationLike.pathname);
  const normalizedHref = sanitizePath(pathFromHref);
  const normalizedPathname = sanitizePath(pathFromPathname);

  if (normalizedHref !== '/' && normalizedHref !== '/index.html') {
    return normalizedHref;
  }

  if (normalizedPathname !== '/' && normalizedPathname !== '/index.html') {
    return normalizedPathname;
  }

  return '/';
}

export function applyInitialDeepLink() {
  if (typeof window === 'undefined') return;

  const initialRoute = resolveInitialRouteFromLocation(window.location);
  const target = classifyRouteTarget(initialRoute);

  if (!shouldHandleRouteTarget(target)) {
    return;
  }

  if (target.kind === 'web') {
    void openWebUrl(target.url);
    window.location.hash = '/';
    return;
  }

  if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
    window.location.hash = target.path;
  }
}

export async function persistPendingRoute(input: string) {
  const target = classifyRouteTarget(input);
  try {
    await Preferences.set({
      key: PENDING_ROUTE_KEY,
      value: JSON.stringify(target),
    });
  } catch {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PENDING_ROUTE_KEY, JSON.stringify(target));
    }
  }
}

export async function clearPendingRoute() {
  try {
    await Preferences.remove({ key: PENDING_ROUTE_KEY });
  } catch {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PENDING_ROUTE_KEY);
    }
  }
}

export async function consumePendingRoute() {
  let rawValue: string | null = null;

  try {
    const response = await Preferences.get({ key: PENDING_ROUTE_KEY });
    rawValue = response.value;
    if (rawValue) {
      await Preferences.remove({ key: PENDING_ROUTE_KEY });
    }
  } catch {
    if (typeof window !== 'undefined') {
      rawValue = window.localStorage.getItem(PENDING_ROUTE_KEY);
      window.localStorage.removeItem(PENDING_ROUTE_KEY);
    }
  }

  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as RouteTarget;
  } catch {
    return null;
  }
}

export async function routeToTarget(input: string) {
  const target = classifyRouteTarget(input);

  if (target.kind === 'web') {
    await openWebUrl(target.url);
    return target;
  }

  if (typeof window !== 'undefined') {
    const nextHash = `#${target.path}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = target.path;
    }
  }

  return target;
}

export async function handleIncomingRouteTarget(input: string, dedupeWindowMs = LAST_HANDLED_TARGET_DEDUPE_MS) {
  const target = classifyRouteTarget(input);

  if (shouldSuppressExternalWebReturn(target)) {
    return null;
  }

  if (!shouldHandleRouteTarget(target, dedupeWindowMs)) {
    return null;
  }

  if (target.kind === 'web') {
    await openWebUrl(target.url);
    return target;
  }

  if (typeof window !== 'undefined') {
    const nextHash = `#${target.path}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = target.path;
    }
  }

  return target;
}

export function resolveNotificationTarget(payload: unknown) {
  const notification =
    payload && typeof payload === 'object' && 'notification' in payload
      ? (payload as { notification?: Record<string, unknown> }).notification
      : payload;
  const notificationRecord = notification && typeof notification === 'object' ? (notification as Record<string, unknown>) : {};
  const data =
    notificationRecord.data && typeof notificationRecord.data === 'object'
      ? (notificationRecord.data as Record<string, unknown>)
      : {};

  const directPathCandidates = [
    data.route,
    data.path,
    data.href,
    data.url,
    data.targetPath,
    notificationRecord.link,
    notificationRecord.route,
    notificationRecord.path,
    notificationRecord.url,
  ];
  const directPath = directPathCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);

  if (directPath) {
    return directPath;
  }

  const dramaId =
    typeof data.dramaId === 'string'
      ? data.dramaId
      : typeof data.drama === 'object' && data.drama && '_id' in (data.drama as Record<string, unknown>)
        ? String((data.drama as Record<string, unknown>)._id)
        : undefined;
  const episodeId = typeof data.episodeId === 'string' ? data.episodeId : undefined;

  if (dramaId && episodeId) {
    return `/play/${dramaId}/${episodeId}`;
  }

  if (dramaId) {
    return `/drama/${dramaId}`;
  }

  return '/user/notifications';
}
