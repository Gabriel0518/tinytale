"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { removeLocalePrefix } from "@/lib/i18n";

export default function UserLoading() {
  const pathname = usePathname();
  const normalizedPath = removeLocalePrefix(pathname || "/user/profile");
  const activePath = normalizedPath.startsWith("/user/favorites")
    ? "/user/favorites"
    : "/user/profile";

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar activePath={activePath} />
      <div className="mx-auto hidden max-w-7xl px-4 pb-16 pt-24 md:block">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-8 w-40 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-72 animate-pulse rounded-full bg-white/6" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-xl bg-white/6" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
              <div className="h-32 w-24 animate-pulse rounded-xl bg-white/6" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-5 w-48 animate-pulse rounded-full bg-white/8" />
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/6" />
                <div className="h-2 w-full animate-pulse rounded-full bg-white/6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-32 pt-[calc(env(safe-area-inset-top)+84px)] md:hidden">
        <div className="mb-7 space-y-3">
          <div className="h-8 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/8" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[2/3] animate-pulse rounded-[18px] bg-white/6" />
              <div className="h-3 w-14 animate-pulse rounded-full bg-white/6" />
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
