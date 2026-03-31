"use client";

import Image from "next/image";
import type { Drama } from "@/types";
import { localizeCategoryLabel } from "@/lib/categoryI18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { resolveSafeImageUrl } from "@/lib/safe-image";

function validCover(url?: string): string {
  return resolveSafeImageUrl(url);
}

interface DramaCardProps {
  drama: Drama;
  onClick?: () => void;
}

export function DramaCard({ drama, onClick }: DramaCardProps) {
  const locale = useLocale();
  const episodesLabelMap: Record<string, string> = {
    en: "episodes",
    zh: "集",
    ja: "話",
    es: "episodios",
    pt: "episódios",
    hi: "एपिसोड",
    id: "episode" };
  const episodesLabel = resolveLocaleCopy(episodesLabelMap, locale);

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-bg-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg"
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
    >
      {/* Cover Image */}
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        <Image
          src={validCover(drama.cover)}
          alt={drama.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized={!drama.cover || drama.cover.startsWith('blob:')}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary">
            <svg
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-sm font-medium text-accent-gold">
          <span>★</span>
          <span>{drama.rating.toFixed(1)}</span>
        </div>

        {/* Episodes Count */}
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-text-secondary">
          {drama.episodes?.length || drama.totalEpisodes || 0} {episodesLabel}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-text-primary">
          {drama.title}
        </h3>
        <p className="mt-1 text-xs text-text-tertiary">
          {drama.categories.slice(0, 2).map((item) => localizeCategoryLabel(item, locale)).join(", ")}
        </p>
      </div>
    </div>
  );
}
