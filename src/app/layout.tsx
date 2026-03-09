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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TinyTale - Watch Short Dramas Online",
  description: "Netflix-style vertical short drama streaming platform",
};

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
