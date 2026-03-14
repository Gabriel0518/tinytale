"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath, removeLocalePrefix } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

const APPROVED_ONLY_PREFIXES = [
  "/creator/dashboard",
  "/creator/dramas",
  "/creator/analytics",
  "/creator/contract",
  "/creator/settlements",
  "/creator/tickets",
  "/creator/settings",
  "/creator/notifications",
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const locale = useLocale();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  const isLanding = normalizedPath === "/creator";
  const isPendingPage = normalizedPath === "/creator/pending";
  const isApplyPage =
    normalizedPath === "/creator/apply" || normalizedPath === "/creator/apply/status";

  const isApprovedOnlyPath = useMemo(
    () => APPROVED_ONLY_PREFIXES.some((p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`)),
    [normalizedPath]
  );

  useEffect(() => {
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
        const status = String(
          res?.data?.applicationStatus ||
            res?.data?.status ||
            res?.data?.application?.status ||
            res?.data?.creator?.status ||
            ""
        ).toLowerCase();

        if (status === "approved") {
          if (isLanding || isPendingPage || isApplyPage) {
            router.replace(localizePath("/creator/dashboard", locale));
            return;
          }
          if (!cancelled) setChecking(false);
          return;
        }

        if (status === "pending" || status === "under_review" || status === "in_review") {
          if (!isPendingPage) {
            router.replace(localizePath("/creator/pending", locale));
            return;
          }
          if (!cancelled) setChecking(false);
          return;
        }

        // Unapplied / rejected / missing profile
        if (isApprovedOnlyPath || isPendingPage) {
          router.replace(localizePath("/creator", locale));
          return;
        }

        if (!cancelled) setChecking(false);
      } catch {
        // Fallback as unapproved user
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
    authLoading,
    token,
    router,
    locale,
    pathname,
    isLanding,
    isPendingPage,
    isApplyPage,
    isApprovedOnlyPath,
  ]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f8]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
      </div>
    );
  }

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <Link className="text-lg font-bold text-[#0f172a]" href={localizePath("/creator", locale)}>
              TinyTale Creator
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link className="text-sm text-[#475569] hover:text-[#0f172a]" href={localizePath("/creator/dashboard", locale)}>
                Dashboard
              </Link>
              <Link className="text-sm text-[#475569] hover:text-[#0f172a]" href={localizePath("/creator/dramas", locale)}>
                Dramas
              </Link>
              <Link className="text-sm text-[#475569] hover:text-[#0f172a]" href={localizePath("/creator/analytics", locale)}>
                Analytics
              </Link>
              <Link className="text-sm text-[#475569] hover:text-[#0f172a]" href={localizePath("/creator/settlements", locale)}>
                Settlements
              </Link>
            </nav>
          </div>
          <Link className="text-sm text-[#1877F2] hover:text-[#166fe5]" href={localizePath("/", locale)}>
            Back to TinyTale
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
