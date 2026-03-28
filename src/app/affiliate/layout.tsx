"use client";

export const dynamic = 'force-dynamic';

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar";
import AffiliateHeader from "@/components/affiliate/AffiliateHeader";
import { usePlatform } from "@/hooks/usePlatform";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { resolveLocaleCopy } from '@/lib/locale-copy';

const sidebarPages = ["/affiliate/dashboard", "/affiliate/reports", "/affiliate/creatives", "/affiliate/payments"];
const approvalRequiredPages = ["/affiliate/dashboard", "/affiliate/creatives", "/affiliate/payments"];
const COPY: FlexibleRecord<SupportedLocale, { back: string; promoter: string }> = {
  en: { back: "Back to TinyTale", promoter: "Promoter" },
  zh: { back: "返回 TinyTale", promoter: "推广员" },
  ja: { back: "TinyTale に戻る", promoter: "プロモーター" },
  es: { back: "Volver a TinyTale", promoter: "Promotor" },
  pt: { back: "Voltar para TinyTale", promoter: "Promotor" },
  hi: { back: "TinyTale पर वापस जाएँ", promoter: "प्रमोटर" },
  id: { back: "Kembali ke TinyTale", promoter: "Promotor" },
};

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname = removeLocalePrefix(rawPathname || "/");
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();
  const { isApp, isMobile } = usePlatform();
  const [checking, setChecking] = useState(true);
  const isRestrictedPlatform = isApp || isMobile;

  useEffect(() => {
    if (isRestrictedPlatform) {
      router.replace(localizePath("/", locale));
      return;
    }

    if (authLoading) {
      return;
    }

    async function checkStatus() {
      if (pathname === "/affiliate") {
        if (token) {
          try {
            const res = await promoterApi.getProfile(token);
            const status = res.data?.applicationStatus;
            if (status === "approved") {
              router.push(localizePath("/affiliate/dashboard", locale));
              return;
            }
            if (status === "pending") {
              router.push(localizePath("/affiliate/pending", locale));
              return;
            }
          } catch {
            // No promoter record — show landing page
          }
        }
        setChecking(false);
        return;
      }

      if (!token) {
        router.push(`${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(localizePath(pathname, locale))}`);
        return;
      }

      try {
        const res = await promoterApi.getProfile(token);
        const status = res.data?.applicationStatus;

        if (pathname === "/affiliate/apply" && status === "approved") {
          router.push(localizePath("/affiliate/dashboard", locale));
          return;
        }
        if (pathname === "/affiliate/apply" && status === "pending") {
          router.push(localizePath("/affiliate/pending", locale));
          return;
        }
        if (pathname === "/affiliate/pending" && status === "approved") {
          router.push(localizePath("/affiliate/dashboard", locale));
          return;
        }
        if (approvalRequiredPages.some((p) => pathname.startsWith(p)) && status !== "approved") {
          if (status === "pending") router.push(localizePath("/affiliate/pending", locale));
          else router.push(localizePath("/affiliate/apply", locale));
          return;
        }
      } catch {
        if (approvalRequiredPages.some((p) => pathname.startsWith(p))) {
          router.push(localizePath("/affiliate/apply", locale));
          return;
        }
      }

      setChecking(false);
    }

    checkStatus();
  }, [pathname, token, router, locale, authLoading, isRestrictedPlatform]);

  if (isRestrictedPlatform || ((authLoading || checking) && pathname !== "/affiliate")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a12]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const useSidebar = sidebarPages.some((p) => pathname.startsWith(p));

  if (useSidebar) {
    return (
      <div className="min-h-screen bg-[#0f0f17]">
        <AffiliateSidebar />
        <div className="ml-60">
          <header className="flex items-center justify-between px-6 py-3 bg-[#13131d] border-b border-gray-800/50">
            <Link href={localizePath("/", locale)} className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              {t.back}
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <span className="text-sm text-gray-400">{user?.nickname || user?.email || t.promoter}</span>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {pathname !== "/affiliate" && <AffiliateHeader />}
      {children}
    </div>
  );
}
