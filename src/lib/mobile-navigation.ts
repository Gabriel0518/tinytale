import { removeLocalePrefix } from '@/lib/i18n';

function splitSegments(pathname: string) {
  return pathname.split('/').filter(Boolean);
}

function normalizePathname(pathname: string) {
  const normalized = removeLocalePrefix(pathname || '/') || '/';
  if (normalized === '/') return '/';
  return normalized.replace(/\/+$/, '') || '/';
}

export function resolveParentPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return '/';

  const segments = splitSegments(normalized);

  if (normalized.startsWith('/drama/')) {
    if (segments[2] === 'play') {
      return segments[1] ? `/drama/${segments[1]}` : '/';
    }
    return '/';
  }

  if (normalized.startsWith('/user/coins/checkout/')) return '/user/coins';
  if (normalized === '/user/coins/success') return '/user/coins';
  if (normalized === '/user/subscription/success') return '/user/subscription';

  if (normalized.startsWith('/user/')) {
    if (normalized === '/user/profile' || normalized === '/user/favorites') {
      return '/';
    }
    return '/user/profile';
  }

  if (normalized.startsWith('/auth/reset-password/verify')) return '/auth/reset-password';
  if (normalized.startsWith('/auth/verify-otp')) return '/auth/login';
  if (normalized.startsWith('/auth/')) return '/';

  if (normalized.startsWith('/category')) return '/browse';
  if (normalized.startsWith('/rankings')) return '/browse';
  if (normalized.startsWith('/search')) return '/';
  if (normalized.startsWith('/browse')) return '/';
  if (normalized.startsWith('/play')) return '/';
  if (normalized.startsWith('/help')) return '/';
  if (normalized.startsWith('/ref/')) return '/';

  if (normalized.startsWith('/affiliate/')) {
    return '/affiliate';
  }

  if (normalized.startsWith('/creator/')) {
    if (segments.length <= 1) return '/';
    if (segments.length === 2) return '/creator';
    return `/${segments.slice(0, -1).join('/')}`;
  }

  if (segments.length <= 1) return '/';
  return `/${segments.slice(0, -1).join('/')}`;
}

export function canNavigateToParent(pathname: string) {
  const normalized = normalizePathname(pathname);
  return resolveParentPath(normalized) !== normalized;
}
