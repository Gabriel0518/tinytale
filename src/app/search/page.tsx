"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { MOBILE_SEARCH_LABELS, NAV_LABELS } from "@/components/features/Navbar";
import { MobileFullscreenSearch } from "@/components/mobile/MobileFullscreenSearch";
import { resolveParentPath } from "@/lib/mobile-navigation";

const RECENT_SEARCHES_KEY = "tinytale:mobile-recent-searches";

function SearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const navText = resolveLocaleCopy(NAV_LABELS, locale);
  const mobileSearchText = resolveLocaleCopy(MOBILE_SEARCH_LABELS, locale);
  const queryFromUrl = (searchParams?.get("q") || "").trim();
  const [value, setValue] = useState(queryFromUrl);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const syncQueryInUrl = useCallback((nextValue: string) => {
    if (typeof window === "undefined") return;

    const trimmed = nextValue.trim();
    const nextUrl = trimmed
      ? `${localizePath("/search", locale)}?q=${encodeURIComponent(trimmed)}`
      : localizePath("/search", locale);

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [locale]);

  useEffect(() => {
    setValue(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === "string").slice(0, 6));
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  const persistRecentSearch = useCallback((nextValue: string) => {
    if (typeof window === "undefined") return;

    const trimmed = nextValue.trim();
    if (!trimmed) return;

    const nextSearches = [trimmed, ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(nextSearches);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));
  }, [recentSearches]);

  const handleChange = useCallback((nextValue: string) => {
    setValue(nextValue);
    syncQueryInUrl(nextValue);
  }, [syncQueryInUrl]);

  const handleSubmit = useCallback((nextValue: string) => {
    const trimmed = nextValue.trim();
    setValue(trimmed);
    syncQueryInUrl(trimmed);
    persistRecentSearch(trimmed);
  }, [persistRecentSearch, syncQueryInUrl]);

  const handleClose = useCallback(() => {
    router.replace(localizePath(resolveParentPath(pathname || "/search"), locale), { scroll: false });
  }, [locale, pathname, router]);

  return (
    <MobileFullscreenSearch
      open
      value={value}
      onChange={handleChange}
      onClose={handleClose}
      onSubmit={handleSubmit}
      recentSearches={recentSearches}
      quickSearches={[]}
      labels={{
        title: navText.search,
        cancel: navText.cancel,
        searchPlaceholder: navText.searchPlaceholder,
        recentSearches: navText.recentSearches,
        quickSearches: navText.quickSearches,
        searchHint: navText.searchHint,
        notifications: navText.notifications,
        hotLabel: navText.hotLabel,
        inboxTitle: navText.inboxTitle,
        inboxEmpty: navText.inboxEmpty,
        inboxUnread: (count) => (navText.inboxUnread || "{{count}} unread updates waiting for you.")
          .replace("{{count}}", String(count)),
        resultsTitle: mobileSearchText.resultsTitle,
        searchPromptDesc: mobileSearchText.searchPromptDesc,
        noResultsTitle: mobileSearchText.noResultsTitle,
        noResultsDesc: mobileSearchText.noResultsDesc,
        foundPrefix: mobileSearchText.foundPrefix,
        foundSuffix: mobileSearchText.foundSuffix,
        allResults: mobileSearchText.allResults,
        ongoing: mobileSearchText.ongoing,
        completed: mobileSearchText.completed,
        topRated: mobileSearchText.topRated,
        resultsFor: mobileSearchText.resultsFor,
        dramaFallback: mobileSearchText.dramaFallback,
        eps: mobileSearchText.eps,
        searching: mobileSearchText.searching,
        emptyPanelHint: mobileSearchText.emptyPanelHint,
      }}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
