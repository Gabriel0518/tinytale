import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import {
  COUNTRY_LANG_MAP,
  DEFAULT_LOCALE,
  isSupportedLocale,
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
const NATIVE_APP_USER_AGENT_TOKEN = "TinyTaleNativeApp";

function resolveHtmlLang(): SupportedLocale {
  const requestHeaders = headers();
  const requestCookies = cookies();

  const requestLocale = requestHeaders.get("x-user-lang")?.trim().toLowerCase();
  if (isSupportedLocale(requestLocale)) return requestLocale;

  const cookieLocale = requestCookies.get("user_lang")?.value?.trim().toLowerCase();
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const country = (
    requestHeaders.get("cf-ipcountry") ||
    requestHeaders.get("x-vercel-ip-country") ||
    requestHeaders.get("x-country-code") ||
    ""
  ).toUpperCase();
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const htmlLang = resolveHtmlLang();

  return (
    <html lang={htmlLang} className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ua=navigator.userAgent||"";var isNative=ua.indexOf("${NATIVE_APP_USER_AGENT_TOKEN}")!==-1||(window.Capacitor&&typeof window.Capacitor.isNativePlatform==="function"&&window.Capacitor.isNativePlatform());if(!isNative)return;document.documentElement.classList.add("native-app-boot","native-app-launching");if(document.body){document.body.classList.add("native-app-boot","native-app-launching");}else{document.addEventListener("DOMContentLoaded",function(){document.body&&document.body.classList.add("native-app-boot","native-app-launching");},{once:true});}}catch(e){}})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background: #141414; }
              #native-app-launch-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: #141414; opacity: 0; pointer-events: none; transition: opacity 300ms ease; }
              .native-app-launch-shell { position: relative; display: flex; width: 100%; max-width: 24rem; flex-direction: column; align-items: center; justify-content: center; padding: 0 2rem; text-align: center; opacity: 0; transform: translateY(10px); transition: opacity 220ms ease, transform 220ms ease; }
              .native-app-launch-glow { position: absolute; inset-inline: 1.5rem; top: 50%; height: 10rem; transform: translateY(-50%); border-radius: 9999px; background: radial-gradient(circle, rgba(229, 9, 20, 0.18), transparent 68%); filter: blur(48px); }
              .native-app-launch-badge { position: relative; display: flex; height: 5rem; width: 5rem; align-items: center; justify-content: center; overflow: hidden; border-radius: 26px; border: 1px solid rgba(255, 255, 255, 0.1); background: linear-gradient(145deg, #ff445f, #d90b1c); box-shadow: 0 18px 46px rgba(229, 9, 20, 0.34); }
              .native-app-launch-badge-letter { font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: #fff; }
              .native-app-launch-wordmark { position: relative; margin-top: 1.25rem; }
              .native-app-launch-title { margin: 0; font-size: 1.7rem; font-weight: 900; letter-spacing: -0.04em; color: #fff; }
              .native-app-launch-subtitle { margin: 0.5rem 0 0; font-size: 12px; font-weight: 500; letter-spacing: 0.18em; color: rgba(255, 255, 255, 0.48); }
              .native-app-launch-progress { position: relative; margin-top: 2rem; height: 3px; width: 8rem; overflow: hidden; border-radius: 9999px; background: rgba(255, 255, 255, 0.08); }
              .native-app-launch-progress-bar { position: absolute; inset-block: 0; left: 0; width: 50%; border-radius: 9999px; background: linear-gradient(90deg, rgba(255, 216, 77, 0.15), #ffd84d, rgba(255, 216, 77, 0.15)); animation: tinytale-launch-bar 1.2s ease-in-out infinite; }
              html.native-app-boot #native-app-launch-overlay { opacity: 1; pointer-events: auto; }
              html.native-app-brand-visible .native-app-launch-shell { opacity: 1; transform: translateY(0); }
              html.native-app-boot.native-app-launch-hiding #native-app-launch-overlay { opacity: 0; pointer-events: none; }
              @keyframes tinytale-launch-bar {
                0% { transform: translateX(-110%); opacity: 0.35; }
                20% { opacity: 1; }
                50% { transform: translateX(55%); opacity: 1; }
                100% { transform: translateX(220%); opacity: 0.2; }
              }
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TinyTale" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <div id="native-app-launch-overlay" aria-hidden="true">
          <div className="native-app-launch-shell">
            <div className="native-app-launch-glow" />
            <div className="native-app-launch-badge">
              <span className="native-app-launch-badge-letter">T</span>
            </div>
            <div className="native-app-launch-wordmark">
              <p className="native-app-launch-title">TinyTale</p>
              <p className="native-app-launch-subtitle">SHORT DRAMA STREAMING</p>
            </div>
            <div className="native-app-launch-progress">
              <div className="native-app-launch-progress-bar" />
            </div>
          </div>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
