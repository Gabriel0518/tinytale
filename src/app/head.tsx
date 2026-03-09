import { headers } from 'next/headers';
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  normalizePath,
  resolveRequestLocale,
} from '@/lib/seo';

const NOINDEX_PATH_PREFIXES = ['/admin'];

export default function Head() {
  const requestHeaders = headers();
  const rawPath = requestHeaders.get('x-locale-path') || '/';
  const pathname = normalizePath(rawPath);

  if (NOINDEX_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return (
      <>
        <meta name="robots" content="noindex,nofollow" />
      </>
    );
  }

  const locale = resolveRequestLocale(pathname, requestHeaders.get('x-user-lang'));
  const canonical = buildCanonicalUrl(pathname, locale);
  const alternates = buildLanguageAlternates(pathname);

  return (
    <>
      <link rel="canonical" href={canonical} />
      {Object.entries(alternates).map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
    </>
  );
}

