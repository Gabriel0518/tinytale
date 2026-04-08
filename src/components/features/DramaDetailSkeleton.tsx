"use client";

import { Footer } from "@/components/features/Footer";
import { Navbar } from "@/components/features/Navbar";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-white/8 ${className}`} />;
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-white/6 ${className}`} />;
}

export function DramaDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar activePath="/browse" variant="default" mobileHeaderVariant="default" />

      <main className="pb-16 pt-[calc(env(safe-area-inset-top)+72px)] md:pt-24">
        <div className="md:hidden">
          <section className="relative overflow-hidden px-4 pb-8">
            <SkeletonCard className="h-[22rem] w-full rounded-[32px]" />
            <div className="mt-6 flex items-center gap-3">
              <SkeletonBlock className="h-11 w-32 rounded-full" />
              <SkeletonBlock className="h-11 w-11 rounded-full" />
              <SkeletonBlock className="h-11 w-11 rounded-full" />
            </div>
            <div className="mt-6 space-y-3">
              <SkeletonBlock className="h-10 w-3/4 rounded-2xl" />
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-4 w-1/2" />
            </div>
          </section>

          <section className="px-4 py-2">
            <SkeletonBlock className="h-6 w-28" />
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-9 w-9 rounded-xl" />
              ))}
            </div>
            <SkeletonCard className="mt-5 h-40 w-full rounded-[24px]" />
          </section>

          <section className="px-4 py-6">
            <SkeletonBlock className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-[88%]" />
              <SkeletonBlock className="h-4 w-[72%]" />
            </div>
          </section>

          <section className="px-4 py-2">
            <SkeletonBlock className="h-6 w-32" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} className="aspect-[2/3] w-full rounded-[20px]" />
              ))}
            </div>
          </section>
        </div>

        <div className="mx-auto hidden max-w-7xl px-4 md:block">
          <section className="grid grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] gap-8">
            <SkeletonCard className="aspect-[16/9] w-full rounded-[32px]" />
            <div className="space-y-5 pt-4">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-12 w-4/5 rounded-2xl" />
              <SkeletonBlock className="h-4 w-3/5" />
              <SkeletonBlock className="h-4 w-2/5" />
              <div className="flex gap-3 pt-2">
                <SkeletonBlock className="h-12 w-40 rounded-full" />
                <SkeletonBlock className="h-12 w-12 rounded-full" />
                <SkeletonBlock className="h-12 w-12 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 grid grid-cols-[minmax(0,1fr)_22rem] gap-8">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <SkeletonBlock className="h-6 w-40" />
                <div className="mt-5 flex flex-wrap gap-2">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-10 w-10 rounded-xl" />
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <SkeletonBlock className="h-6 w-36" />
                <div className="mt-4 space-y-3">
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-[92%]" />
                  <SkeletonBlock className="h-4 w-[76%]" />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <SkeletonBlock className="h-6 w-28" />
                <div className="mt-5 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-28" />
                          <SkeletonBlock className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <SkeletonBlock className="h-3 w-full" />
                        <SkeletonBlock className="h-3 w-[88%]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <SkeletonBlock className="h-6 w-32" />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonCard key={index} className="aspect-[2/3] w-full rounded-[22px]" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
