"use client";

import Link from "next/link";

interface FeaturedBannerProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  href?: string;
  className?: string;
}

export function FeaturedBanner({
  title,
  subtitle,
  backgroundImage,
  href = "/browse",
  className,
}: FeaturedBannerProps) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-8 ${className || ""}`}>
      <Link href={href} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] h-[280px] md:h-[360px]">
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50 transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f17] via-[#0f0f17]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f17]/80 via-transparent to-transparent" />
          <div className="relative flex h-full flex-col justify-end px-10 pb-10 md:justify-center md:px-16 md:pb-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                TinyTale
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">
                Featured
              </span>
            </div>
            <h3 className="max-w-xl text-3xl font-bold leading-tight text-white md:text-5xl">
              {title}
            </h3>
            <p className="mt-2 max-w-lg text-base text-gray-300 md:text-lg">
              {subtitle}
            </p>
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-600/90 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                Explore Now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
