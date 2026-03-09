import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  isSupportedLocale,
  parseAcceptLanguageHeader,
  SupportedLocale,
} from "@/lib/i18n";
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  getSiteUrl,
  normalizePath,
  resolveRequestLocale,
} from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

const SITE_TITLE = "TinyTale - Watch Short Dramas Online";
const SITE_DESCRIPTION = "Netflix-style vertical short drama streaming platform";
const NOINDEX_PATH_PREFIXES = ["/admin"];

function resolveHtmlLang(): SupportedLocale {
  const requestHeaders = headers();
  const requestCookies = cookies();

  const requestLocale = requestHeaders.get("x-user-lang")?.trim().toLowerCase();
  if (isSupportedLocale(requestLocale)) return requestLocale;

  const cookieLocale = requestCookies.get("user_lang")?.value?.trim().toLowerCase();
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const browserLocale = parseAcceptLanguageHeader(requestHeaders.get("accept-language"));
  if (browserLocale) return browserLocale;

  const country = requestHeaders.get("cf-ipcountry") || "";
  if (country && COUNTRY_LANG_MAP[country]) return COUNTRY_LANG_MAP[country];

  return DEFAULT_LOCALE;
}

export function generateMetadata(): Metadata {
  const requestHeaders = headers();
  const pathname = normalizePath(requestHeaders.get("x-locale-path") || "/");
  const metadataBase = new URL(getSiteUrl());
  const metadata: Metadata = {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    metadataBase,
  };

  if (NOINDEX_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    metadata.robots = {
      index: false,
      follow: false,
    };
    return metadata;
  }

  const locale = resolveRequestLocale(pathname, requestHeaders.get("x-user-lang"));
  metadata.alternates = {
    canonical: buildCanonicalUrl(pathname, locale),
    languages: buildLanguageAlternates(pathname),
  };
  return metadata;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const htmlLang = resolveHtmlLang();

  return (
    <html lang={htmlLang} className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
