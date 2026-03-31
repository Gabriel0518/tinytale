'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { dramasApi } from '@/lib/api';
import { Drama } from '@/types';
import { getDramaBadge, resolveDramaMode } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { localizePath } from '@/lib/i18n';
import { resolveSafeImageUrl } from '@/lib/safe-image';

type SearchState = 'idle' | 'loading' | 'resolved';

interface MobileFullscreenSearchProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (value: string) => void;
  recentSearches: string[];
  quickSearches: string[];
  labels: {
    title: string;
    cancel: string;
    searchPlaceholder: string;
    recentSearches: string;
    quickSearches: string;
    searchHint: string;
    notifications: string;
    hotLabel: string;
    inboxTitle: string;
    inboxEmpty: string;
    inboxUnread: (count: number) => string;
    resultsTitle?: string;
    searchPromptDesc?: string;
    noResultsTitle?: string;
    noResultsDesc?: string;
    foundPrefix?: string;
    foundSuffix?: string;
    allResults?: string;
    ongoing?: string;
    completed?: string;
    topRated?: string;
    resultsFor?: string;
    dramaFallback?: string;
    eps?: string;
    searching?: string;
    emptyPanelHint?: string;
  };
}

const badgeStyles: Record<string, string> = {
  hot: 'bg-red-600 text-white',
  new: 'bg-green-600 text-white',
};

export function MobileFullscreenSearch({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  recentSearches,
  labels,
}: MobileFullscreenSearchProps) {
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [results, setResults] = useState<Drama[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const query = value.trim();

  const uiText = {
    completed: labels.completed || 'Completed',
    ongoing: labels.ongoing || 'Ongoing',
    resultsTitle: labels.resultsTitle || 'Search Results',
    searching: labels.searching || 'Searching...',
    noResultsTitle: labels.noResultsTitle || 'No results found',
    dramaFallback: labels.dramaFallback || 'Drama',
    eps: labels.eps || 'Eps',
  };

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    if (!query) {
      setResults([]);
      setSearchState('idle');
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchState('loading');
      try {
        const res = await dramasApi.getAll({ search: query, limit: 20 });
        if (cancelled) return;
        setResults(res.data?.dramas || []);
      } catch {
        if (cancelled) return;
        setResults([]);
      } finally {
        if (!cancelled) {
          setSearchState('resolved');
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#141414]">
      <div className="flex h-full min-h-0 flex-col pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(max(env(safe-area-inset-top),0.6rem)+10px)]">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col px-4">
          <div className="mx-auto flex w-full max-w-4xl min-h-0 flex-1 flex-col">
            <div className="mb-4 flex h-[68px] items-center gap-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit(value);
                }}
                className="flex-1"
              >
                <div className="relative h-11 overflow-hidden rounded-2xl border border-white/10 bg-[#161b24] shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    ref={inputRef}
                    type="search"
                    enterKeyHint="search"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={labels.searchPlaceholder}
                    className="h-11 w-full bg-transparent py-0 pl-10 pr-10 text-sm text-white placeholder:text-white/45 outline-none"
                  />
                  {value ? (
                    <button
                      type="button"
                      onClick={() => onChange('')}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/15 hover:text-white"
                      aria-label={labels.cancel}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </form>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white/8 px-4 text-sm font-medium text-white/80 transition hover:bg-white/12 hover:text-white"
              >
                {labels.cancel}
              </button>
            </div>

            <div className="keyboard-safe-scroll min-h-0 flex-1 pb-[calc(1rem+min(var(--tinytale-keyboard-inset),14rem))]">
              {recentSearches.length > 0 ? (
                <section className="mb-6">
                  <div className="-mx-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-0 md:px-0">
                    <div className="flex min-w-max gap-2 pb-1">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onSubmit(item)}
                          className="rounded-full bg-[#25282e] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/72 transition hover:bg-[#30343d] hover:text-white"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="mb-5">
                <div className="min-w-0">
                  <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                    {uiText.resultsTitle}
                  </h2>
                </div>
              </section>

              {searchState === 'loading' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[0.72] animate-pulse rounded-[20px] bg-[#25282e] shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                    />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {results.map((drama) => {
                    const badge = getDramaBadge(drama);
                    const mode = resolveDramaMode(drama);
                    const hasRating = typeof drama.rating === 'number' && drama.rating > 0;
                    const primaryTagClass = mode === 'completed' ? 'bg-[#3456ff]' : 'bg-[#ff3b5c]';
                    const metadata = mode === 'completed'
                      ? `${uiText.completed} · ${drama.categories?.[0] || uiText.dramaFallback}`
                      : `${drama.totalEpisodes || '?'} ${uiText.eps} · ${drama.categories?.[0] || uiText.dramaFallback}`;

                    return (
                      <Link
                        key={drama._id}
                        href={localizePath(`/drama/${drama._id}`, locale)}
                        onClick={onClose}
                        className="group relative aspect-[0.72] overflow-hidden rounded-[20px] bg-[#25282e] shadow-[0_18px_40px_rgba(0,0,0,0.32)] transition duration-200 active:scale-[0.98] [will-change:transform]"
                      >
                        <Image
                          src={resolveSafeImageUrl(drama.cover)}
                          alt={drama.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-110"
                          sizes="44vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/24 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white ${primaryTagClass}`}>
                              {mode === 'completed' ? uiText.completed : uiText.ongoing}
                            </span>
                            {badge && badgeStyles[badge] ? (
                              <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${badgeStyles[badge]}`}>
                                {badge.toUpperCase()}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.15] text-white">
                            {drama.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-white/72">
                            {hasRating ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-[#ffd84d]">★</span>
                                <span className="text-white/82">{drama.rating.toFixed(1)}</span>
                              </span>
                            ) : null}
                            {hasRating ? <span className="text-white/26">•</span> : null}
                            <span className="truncate">{metadata}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : query ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <p className="text-sm font-medium text-white/58">
                    {uiText.noResultsTitle}
                  </p>
                </div>
              ) : (
                <div className="min-h-[220px]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
