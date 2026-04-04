"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { removeLocalePrefix } from "@/lib/i18n";

function resolveLoadingActivePath(pathname: string) {
  if (pathname === "/") return "/";
  if (
    pathname.startsWith("/browse") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/rankings") ||
    (pathname.startsWith("/drama") && !pathname.includes("/play/"))
  ) {
    return "/browse";
  }
  if (pathname === "/play" || pathname.includes("/play/")) return "/play";
  if (pathname.startsWith("/user/favorites")) return "/user/favorites";
  if (pathname.startsWith("/user")) return "/user/profile";
  return pathname;
}

export default function GlobalLoading() {
  const pathname = usePathname();
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const activePath = resolveLoadingActivePath(normalizedPath);
  const isHome = activePath === "/";

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar
        activePath={activePath}
        variant={isHome ? "transparent" : "default"}
        mobileHeaderVariant={isHome ? "brand-search" : "default"}
      />
      <div className="mx-auto hidden max-w-7xl px-4 pb-16 pt-24 md:block">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-8 w-56 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-80 animate-pulse rounded-full bg-white/6" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-xl bg-white/6" />
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[2/3] animate-pulse rounded-[24px] bg-white/6" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/8" />
              <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/6" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-32 pt-[calc(env(safe-area-inset-top)+84px)] md:hidden">
        <div className="mb-8 space-y-3">
          <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-white/8" />
        </div>
        <div className="mb-5 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-white/8" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[2/3] animate-pulse rounded-[20px] bg-white/6" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/8" />
              <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
