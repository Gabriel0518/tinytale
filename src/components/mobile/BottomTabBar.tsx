"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Compass, Home, PlayCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { triggerHaptic } from "@/lib/capacitor-bridge";
import { prefetchPlayFeedBootstrap } from "@/lib/play-feed-prefetch";

interface BottomTabBarProps {
  notificationCount?: number;
  forceVisible?: boolean;
}

type TabItem = {
  href: string;
  key: "home" | "browse" | "play" | "watchlist" | "me";
  icon: LucideIcon;
};

const TAB_ITEMS: TabItem[] = [
  { href: "/", key: "home", icon: Home },
  { href: "/browse", key: "browse", icon: Compass },
  { href: "/play", key: "play", icon: PlayCircle },
  { href: "/user/favorites", key: "watchlist", icon: Bookmark },
  { href: "/user/profile", key: "me", icon: User },
];

const TAB_LABELS: FlexibleRecord<SupportedLocale, Record<TabItem["key"], string>> = {
  en: { home: "Home", browse: "Browse", play: "Play", watchlist: "Watchlist", me: "Me" },
  es: { home: "Inicio", browse: "Explorar", play: "Play", watchlist: "Mi lista", me: "Yo" },
  pt: { home: "Início", browse: "Explorar", play: "Play", watchlist: "Minha lista", me: "Eu" },
  id: { home: "Beranda", browse: "Jelajahi", play: "Putar", watchlist: "Daftar tontonan", me: "Saya" },
  zh: { home: "首页", browse: "浏览", play: "播放", watchlist: "片单", me: "我的" },
  ja: { home: "ホーム", browse: "閲覧", play: "再生", watchlist: "マイリスト", me: "マイ" },
  hi: { home: "होम", browse: "ब्राउज़", play: "चलाएँ", watchlist: "वॉचलिस्ट", me: "मैं" },
};

const HIDDEN_PREFIXES = ["/admin", "/affiliate", "/auth"];
const HIDDEN_ROUTES = [
  "/about",
  "/careers",
  "/cookies",
  "/help",
  "/press",
  "/privacy",
  "/terms",
];

const CREATOR_WORKSPACE_SEGMENTS = new Set([
  "apply",
  "pending",
  "dashboard",
  "dramas",
  "analytics",
  "settlements",
  "contract",
  "settings",
  "notifications",
  "tickets",
]);

const TAB_NAVIGATION_MASK_TIMEOUT_MS = 10000;
const TAB_NAVIGATION_STATE_EVENT = "tinytale:bottom-tab-state";

type BottomTabNavigationState = {
  selectedHref: string | null;
  maskHref: string | null;
};

let bottomTabNavigationState: BottomTabNavigationState = {
  selectedHref: null,
  maskHref: null,
};

function readBottomTabNavigationState(): BottomTabNavigationState {
  return bottomTabNavigationState;
}

function writeBottomTabNavigationState(nextState: BottomTabNavigationState) {
  bottomTabNavigationState = nextState;

  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<BottomTabNavigationState>(TAB_NAVIGATION_STATE_EVENT, {
      detail: nextState,
    })
  );
}

function isCreatorWorkspacePath(pathname: string) {
  if (pathname === "/creator") return true;
  if (!pathname.startsWith("/creator/")) return false;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  return CREATOR_WORKSPACE_SEGMENTS.has(segments[1]);
}

function isPublicCreatorProfilePath(pathname: string) {
  if (!pathname.startsWith("/creator/")) return false;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return false;
  return !CREATOR_WORKSPACE_SEGMENTS.has(segments[1]);
}

function shouldShowTabBar(pathname: string) {
  if (!pathname) return false;
  if (pathname.includes("/play/")) return false;
  if (pathname.startsWith("/user/coins/checkout")) return false;
  if (isPublicCreatorProfilePath(pathname)) return true;
  if (isCreatorWorkspacePath(pathname)) return false;
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  if (HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return false;
  return true;
}

function resolveActiveTab(pathname: string) {
  if (pathname === "/") return "/";
  if (
    pathname.startsWith("/browse") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/category") ||
    isPublicCreatorProfilePath(pathname) ||
    (pathname.startsWith("/drama") && !pathname.includes("/play/"))
  ) {
    return "/browse";
  }
  if (pathname === "/play" || pathname.includes("/play/")) return "/play";
  if (pathname.startsWith("/user/favorites")) return "/user/favorites";
  if (pathname.startsWith("/user")) return "/user/profile";
  return "";
}

export function BottomTabBar({ notificationCount = 0, forceVisible = false }: BottomTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const labels = resolveLocaleCopy(TAB_LABELS, locale);
  const { isMobile } = usePlatform();
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const pendingResetRef = useRef<number | null>(null);
  const [navigationState, setNavigationState] = useState<BottomTabNavigationState>(readBottomTabNavigationState);

  const isVisible = isMobile && (forceVisible || shouldShowTabBar(normalizedPath));
  const activeTab = useMemo(() => resolveActiveTab(normalizedPath), [normalizedPath]);
  const displayActiveTab = navigationState.selectedHref ?? activeTab;
  const showNavigationMask = Boolean(
    isVisible &&
      navigationState.maskHref &&
      normalizedPath !== navigationState.maskHref &&
      activeTab !== navigationState.maskHref
  );

  useEffect(() => {
    TAB_ITEMS.forEach((item) => {
      router.prefetch(localizePath(item.href, locale));
    });
  }, [locale, router]);

  useEffect(() => {
    if (!isVisible) return;
    void prefetchPlayFeedBootstrap("for-you");
  }, [isVisible]);

  useEffect(() => {
    document.body.classList.toggle("has-bottom-bar", isVisible);
    return () => document.body.classList.remove("has-bottom-bar");
  }, [isVisible]);

  useEffect(() => {
    const handleNavigationState = (event: Event) => {
      const customEvent = event as CustomEvent<BottomTabNavigationState>;
      setNavigationState(customEvent.detail || readBottomTabNavigationState());
    };

    window.addEventListener(TAB_NAVIGATION_STATE_EVENT, handleNavigationState as EventListener);
    return () => {
      window.removeEventListener(TAB_NAVIGATION_STATE_EVENT, handleNavigationState as EventListener);
    };
  }, []);

  useEffect(() => {
    if (
      navigationState.selectedHref &&
      (normalizedPath === navigationState.selectedHref || activeTab === navigationState.selectedHref)
    ) {
      writeBottomTabNavigationState({
        selectedHref: null,
        maskHref: null,
      });
      return;
    }
  }, [activeTab, navigationState.selectedHref, normalizedPath]);

  useEffect(() => {
    if (!navigationState.maskHref) {
      if (pendingResetRef.current !== null) {
        window.clearTimeout(pendingResetRef.current);
        pendingResetRef.current = null;
      }
      return;
    }

    pendingResetRef.current = window.setTimeout(() => {
      writeBottomTabNavigationState({
        selectedHref: readBottomTabNavigationState().selectedHref,
        maskHref: null,
      });
      pendingResetRef.current = null;
    }, TAB_NAVIGATION_MASK_TIMEOUT_MS);

    return () => {
      if (pendingResetRef.current !== null) {
        window.clearTimeout(pendingResetRef.current);
        pendingResetRef.current = null;
      }
    };
  }, [navigationState.maskHref]);

  const handleTabNavigation = (href: string) => {
    void triggerHaptic("selection");

    if (href === "/play") {
      if (normalizedPath === href) {
        writeBottomTabNavigationState({
          selectedHref: null,
          maskHref: null,
        });
        return;
      }

      writeBottomTabNavigationState({
        selectedHref: "/play",
        maskHref: "/play",
      });
      void prefetchPlayFeedBootstrap("for-you");
      startTransition(() => {
        router.replace(localizePath("/play", locale), { scroll: false });
      });
      return;
    }

    if (normalizedPath === href) {
      writeBottomTabNavigationState({
        selectedHref: null,
        maskHref: null,
      });
      return;
    }

    writeBottomTabNavigationState({
      selectedHref: href,
      maskHref: href,
    });
    startTransition(() => {
      router.replace(localizePath(href, locale), { scroll: false });
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {showNavigationMask ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] bg-[#0f1115] md:hidden" aria-hidden="true">
          <div className="mx-auto flex h-full max-w-md flex-col px-4 pt-[calc(env(safe-area-inset-top)+18px)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-11 w-20 animate-pulse rounded-2xl bg-white/8" />
            </div>
            <div className="mb-8 space-y-3">
              <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-52 animate-pulse rounded-full bg-white/6" />
            </div>
            <div className="mb-5 flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-white/8" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pb-32">
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
      ) : null}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] md:hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(100%+env(safe-area-inset-bottom))] bg-[#111116]/95" />
        <nav
          aria-label="Mobile navigation"
          className="mobile-bottom-tab pointer-events-auto relative mx-auto max-w-md rounded-t-[28px] border-t border-white/10 bg-[#111116]/95 px-5 pb-safe-bottom pt-3 shadow-[0_-18px_36px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
        >
          <div className="mx-auto grid max-w-sm grid-cols-5 gap-1">
            {TAB_ITEMS.map((item) => {
              const active = displayActiveTab === item.href;
              const Icon = item.icon;
              const badgeVisible = item.href === "/user/profile" && notificationCount > 0;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleTabNavigation(item.href)}
                  className={cn(
                    "relative flex min-h-[58px] items-center justify-center rounded-2xl transition duration-200",
                    active ? "text-[#ff4a6a]" : "text-[#c3c5cb]/78 hover:text-white"
                  )}
                  aria-label={labels[item.key]}
                  aria-current={active ? "page" : undefined}
                >
                  {active ? (
                    <span className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(255,74,106,0.24)_0%,rgba(255,74,106,0.14)_34%,rgba(255,74,106,0.04)_58%,transparent_74%)] blur-[10px]" />
                  ) : null}
                  <div
                    className={cn(
                      "relative flex h-11 w-11 -translate-y-[10px] items-center justify-center rounded-full transition duration-200",
                      active && "bg-[#ff4a6a]/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[27px] w-[27px]",
                        active ? "text-[#ff4a6a]" : "text-current"
                      )}
                      strokeWidth={2.1}
                    />
                    {badgeVisible ? (
                      <span className="absolute -right-2 -top-2 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {Math.min(notificationCount, 99)}
                      </span>
                    ) : null}
                  </div>
                  <span className="sr-only">{labels[item.key]}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
