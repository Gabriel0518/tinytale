"use client";

import { ReactNode, useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Drama } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { localizeCategoryLabel } from "@/lib/categoryI18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

function validCover(url?: string): string {
  if (!url || url.startsWith('blob:')) return '/placeholder-cover.svg';
  return url;
}

interface HomeCarouselProps {
  title: string;
  dramas: Drama[];
  className?: string;
  getDramaHref?: (drama: Drama) => string;
  renderCardOverlay?: (drama: Drama) => ReactNode;
}

const CAROUSEL_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { scrollLeft: "Scroll left", scrollRight: "Scroll right", episodes: "episodes" },
  zh: { scrollLeft: "向左滚动", scrollRight: "向右滚动", episodes: "集" },
  ja: { scrollLeft: "左へスクロール", scrollRight: "右へスクロール", episodes: "話" },
  es: { scrollLeft: "Desplazar a la izquierda", scrollRight: "Desplazar a la derecha", episodes: "episodios" },
  pt: { scrollLeft: "Rolar para a esquerda", scrollRight: "Rolar para a direita", episodes: "episódios" },
  hi: { scrollLeft: "बाईं ओर स्क्रॉल करें", scrollRight: "दाईं ओर स्क्रॉल करें", episodes: "एपिसोड" },
  id: { scrollLeft: "Gulir ke kiri", scrollRight: "Gulir ke kanan", episodes: "episode" } };

export function HomeCarousel({ title, dramas, className, getDramaHref, renderCardOverlay }: HomeCarouselProps) {
  const locale = useLocale();
  const t = resolveLocaleCopy(CAROUSEL_TEXT, locale);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasDragged = useRef(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, dramas]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 3) hasDragged.current = true;
    scrollRef.current.scrollLeft = scrollStartX.current - dx;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!dramas.length) return null;

  // Card width class: w-[calc(50vw-24px)] md:w-[calc(33.33vw-24px)] lg:w-[calc(25vw-24px)] xl:w-[calc(20vw-24px)]
  const cardWidthClass =
    "w-[calc(50vw-24px)] md:w-[calc(33.33vw-24px)] lg:w-[calc(25vw-24px)] xl:w-[calc(20vw-24px)]";

  return (
    <section className={`relative mx-auto max-w-7xl px-4 py-8 ${className || ""}`}>
      <h2 className="mb-6 text-xl font-bold text-white">{title}</h2>

      <div className="group/carousel relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90 md:flex"
            aria-label={t.scrollLeft}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="carousel-scroll flex gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            cursor: isDragging ? "grabbing" : "grab" }}
        >
          {dramas.map((drama) => (
            <Link
              key={drama._id}
              href={getDramaHref ? getDramaHref(drama) : localizePath(`/drama/${drama._id}`, locale)}
              className={`shrink-0 snap-start ${cardWidthClass}`}
              draggable={false}
              onClick={(e) => {
                if (hasDragged.current) e.preventDefault();
              }}
            >
              <div className="group relative aspect-[2/3] overflow-hidden rounded-lg">
                <Image
                  src={validCover(drama.cover)}
                  alt={drama.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 768px) 44vw, (max-width: 1200px) 30vw, 20vw"
                  draggable={false}
                  unoptimized={!drama.cover || drama.cover.startsWith('blob:')}
                />
                {renderCardOverlay?.(drama)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-sm font-medium text-white">{drama.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-300">{drama.rating?.toFixed(1)} ★</p>
                    {drama.year && <p className="text-xs text-gray-300">{drama.year}</p>}
                    {drama.totalEpisodes && (
                      <p className="text-xs text-gray-300">{drama.totalEpisodes} {t.episodes}</p>
                    )}
                  </div>
                  {drama.categories && drama.categories.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {drama.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-gray-200">
                          {localizeCategoryLabel(cat, locale)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90 md:flex"
            aria-label={t.scrollRight}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
