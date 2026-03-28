'use client';

import Link from 'next/link';
import { Bell, Clock3, Search, X } from 'lucide-react';

interface MobileFullscreenSearchProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (value: string) => void;
  recentSearches: string[];
  quickSearches: string[];
  notificationsHref: string;
  unreadCount: number;
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
  };
}

export function MobileFullscreenSearch({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  recentSearches,
  quickSearches,
  notificationsHref,
  unreadCount,
  labels,
}: MobileFullscreenSearchProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#090b12]/96 backdrop-blur-xl">
      <div className="flex h-full flex-col px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">{labels.title}</p>
            <p className="mt-1 text-sm text-white/60">{labels.searchHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/8 px-3 text-sm font-medium text-white/80"
          >
            <X className="mr-1 h-4 w-4" />
            <span>{labels.cancel}</span>
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(value);
          }}
          className="mt-5"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              autoFocus
              type="search"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="h-14 w-full rounded-[22px] border border-white/10 bg-white/6 pl-12 pr-12 text-base text-white placeholder:text-white/30 outline-none transition focus:border-red-500/80 focus:bg-white/9"
            />
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45"
                aria-label={labels.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-6 grid gap-5 overflow-y-auto pb-4">
          {recentSearches.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{labels.recentSearches}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSubmit(item)}
                    className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
              {labels.quickSearches}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSubmit(item)}
                  className="rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-4 text-left text-sm font-medium text-white/88 transition hover:bg-white/[0.08]"
                >
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-red-400/80">{labels.hotLabel}</span>
                  <span className="mt-2 block">{item}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">{labels.notifications}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{labels.inboxTitle}</p>
                <p className="mt-1 text-sm text-white/55">
                  {unreadCount > 0 ? labels.inboxUnread(unreadCount) : labels.inboxEmpty}
                </p>
              </div>
              <Link
                href={notificationsHref}
                className="relative inline-flex h-10 items-center justify-center rounded-full bg-white/8 px-4 text-sm font-medium text-white/85"
                onClick={onClose}
              >
                <Bell className="mr-2 h-4 w-4" />
                {labels.notifications}
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {Math.min(unreadCount, 99)}
                  </span>
                ) : null}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
