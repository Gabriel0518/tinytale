"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { detectClientLocale, localizePath, SupportedLocale } from "@/lib/i18n";

interface EditorialBannerProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  href?: string;
  className?: string;
}

const EDITORIAL_BANNER_TEXT: Record<SupportedLocale, Record<string, string>> = {
  en: { editorial: "Editorial", cta: "Explore Now" },
  zh: { editorial: "专题", cta: "立即探索" },
  ja: { editorial: "編集", cta: "今すぐ見る" },
  es: { editorial: "Editorial", cta: "Explorar ahora" },
  pt: { editorial: "Editorial", cta: "Explorar agora" },
  hi: { editorial: "संपादकीय", cta: "अभी देखें" },
  id: { editorial: "Editorial", cta: "Jelajahi sekarang" },
};

export function EditorialBanner({
  title,
  subtitle,
  backgroundImage,
  href = "/browse",
  className,
}: EditorialBannerProps) {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = EDITORIAL_BANNER_TEXT[locale] || EDITORIAL_BANNER_TEXT.en;
  const targetHref = href.startsWith("http") ? href : localizePath(href, locale);

  return (
    <section className={`mx-auto max-w-7xl px-4 py-6 ${className || ""}`}>
      <Link href={targetHref} className="block">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] h-[200px] md:h-[240px]">
          {backgroundImage && (
            <div
              className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#1a1a2e]/80 to-transparent" />
          <div className="relative flex h-full flex-col justify-center px-8 md:px-12">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                TinyTale
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t.editorial}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white md:text-3xl">
              {title}
            </h3>
            <p className="mt-1 text-base text-gray-300 md:text-lg">
              {subtitle}
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-red-400 transition hover:text-red-300">
                {t.cta}
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
