"use client";

export const dynamic = "force-dynamic";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { normalizeCreatorApplicationStatus } from "@/lib/creator";
import { usePlatform } from "@/hooks/usePlatform";
import { localizePath, removeLocalePrefix } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { translateCreatorText } from "./_lib/creator-i18n";
import CreatorSidebar from "./_components/CreatorSidebar";
import CreatorTopHeader from "./_components/CreatorTopHeader";
import CreatorI18nProvider from "./_components/CreatorI18nProvider";

const APPROVED_ONLY_PREFIXES = [
  "/creator/dashboard",
  "/creator/dramas",
  "/creator/analytics",
  "/creator/settlements",
  "/creator/tickets",
  "/creator/settings",
  "/creator/notifications",
];

const PENDING_STATUSES = new Set(["pending", "under_review"]);
const REVISION_REQUIRED_STATUSES = new Set(["need_more_info", "rejected", "suspended"]);
const APPROVED_STATUSES = new Set(["approved"]);
const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/creator/dashboard" },
  { label: "Dramas", href: "/creator/dramas" },
  { label: "Analytics", href: "/creator/analytics" },
  { label: "Settlements", href: "/creator/settlements" },
  { label: "Settings", href: "/creator/settings" },
  { label: "Tickets", href: "/creator/tickets" },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const locale = useLocale();
  const router = useRouter();
  const { token, loading: authLoading, user } = useAuth();
  const { isApp, isMobile } = usePlatform();
  const [checking, setChecking] = useState(true);
  const isRestrictedPlatform = isApp || isMobile;

  const isLanding = normalizedPath === "/creator";
  const isPendingPage = normalizedPath === "/creator/pending";
  const isApplyPath =
    normalizedPath === "/creator/apply" || normalizedPath.startsWith("/creator/apply/");
  const isApprovedOnlyPath = useMemo(
    () => APPROVED_ONLY_PREFIXES.some((p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`)),
    [normalizedPath]
  );

  useEffect(() => {
    if (isRestrictedPlatform) {
      router.replace(localizePath("/", locale));
      return;
    }

    if (authLoading) return;

    const redirectTarget = pathname || localizePath("/creator", locale);
    const authToken = token;

    if (!authToken) {
      router.replace(
        `${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(redirectTarget)}`
      );
      return;
    }

    let cancelled = false;

    async function guard(currentToken: string) {
      try {
        const res: any = await creatorApi.getApplicationStatus(currentToken);
        const rawStatus = String(
          res?.data?.applicationStatus ||
            res?.data?.status ||
            res?.data?.application?.status ||
            res?.data?.creator?.status ||
            ""
        ).toLowerCase();
        const status = normalizeCreatorApplicationStatus(rawStatus);

        if (PENDING_STATUSES.has(status)) {
          if (isApprovedOnlyPath || isApplyPath) {
            router.replace(localizePath("/creator/pending", locale));
            return;
          }
          if (!cancelled) setChecking(false);
          return;
        }

        if (REVISION_REQUIRED_STATUSES.has(status)) {
          if (isApprovedOnlyPath || isPendingPage) {
            router.replace(localizePath("/creator/apply/status", locale));
            return;
          }
          if (!cancelled) setChecking(false);
          return;
        }

        // Approved-only sections remain protected.
        if (isApprovedOnlyPath && !APPROVED_STATUSES.has(status)) {
          router.replace(localizePath("/creator", locale));
          return;
        }

        // For non-pending users, keep /creator/pending inaccessible.
        if (isPendingPage) {
          router.replace(localizePath("/creator", locale));
          return;
        }

        if (!cancelled) setChecking(false);
      } catch {
        // Fallback as regular non-approved landing behavior.
        if (isApprovedOnlyPath || isPendingPage) {
          router.replace(localizePath("/creator", locale));
          return;
        }
        if (!cancelled) setChecking(false);
      }
    }

    guard(authToken);

    return () => {
      cancelled = true;
    };
  }, [
    isRestrictedPlatform,
    authLoading,
    token,
    router,
    locale,
    pathname,
    isLanding,
    isPendingPage,
    isApplyPath,
    isApprovedOnlyPath,
  ]);

  if (isRestrictedPlatform || authLoading || checking) {
    return (
      <CreatorI18nProvider locale={locale}>
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7f8]">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
        </div>
      </CreatorI18nProvider>
    );
  }

  if (isLanding) {
    return <CreatorI18nProvider locale={locale}>{children}</CreatorI18nProvider>;
  }

  if (!isApprovedOnlyPath) {
    return <CreatorI18nProvider locale={locale}>{children}</CreatorI18nProvider>;
  }

  return (
    <CreatorI18nProvider locale={locale}>
      <div className="min-h-screen bg-[#f5f7f8]">
        <CreatorSidebar locale={locale} normalizedPath={normalizedPath} user={user} />
        <div className="min-h-screen lg:ml-[272px]">
          <CreatorTopHeader locale={locale} />
          <nav className="border-b border-[#e2e8f0] bg-white px-4 py-2 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {MOBILE_NAV_ITEMS.map((item) => {
                const active = normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={localizePath(item.href, locale)}
                    className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold ${
                      active ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#f8fafc] text-[#475569]"
                    }`}
                  >
                    {translateCreatorText(item.label, locale)}
                  </Link>
                );
              })}
            </div>
          </nav>
          <main className="keyboard-safe-form p-4 md:p-5 lg:px-6 lg:py-6 xl:px-8 xl:py-7 2xl:px-10">
            <div className="mx-auto w-full max-w-[1320px]">{children}</div>
          </main>
        </div>
      </div>
    </CreatorI18nProvider>
  );
}
