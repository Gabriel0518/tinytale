"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Compass, Heart, Home, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { triggerHaptic } from "@/lib/capacitor-bridge";

interface BottomTabBarProps {
  notificationCount?: number;
}

type TabItem = {
  href: string;
  key: "home" | "browse" | "rankings" | "myList" | "me";
  icon: LucideIcon;
};

const TAB_ITEMS: TabItem[] = [
  { href: "/", key: "home", icon: Home },
  { href: "/browse", key: "browse", icon: Compass },
  { href: "/rankings", key: "rankings", icon: Trophy },
  { href: "/user/favorites", key: "myList", icon: Heart },
  { href: "/user/profile", key: "me", icon: User },
];

const TAB_LABELS: FlexibleRecord<SupportedLocale, Record<TabItem["key"], string>> = {
  en: { home: "Home", browse: "Browse", rankings: "Rankings", myList: "My List", me: "Me" },
  es: { home: "Inicio", browse: "Explorar", rankings: "Ranking", myList: "Mi lista", me: "Yo" },
  pt: { home: "Inicio", browse: "Explorar", rankings: "Ranking", myList: "Minha lista", me: "Eu" },
  id: { home: "Beranda", browse: "Jelajahi", rankings: "Peringkat", myList: "Daftar", me: "Saya" },
  zh: { home: "首页", browse: "浏览", rankings: "排行", myList: "片单", me: "我的" },
  ja: { home: "ホーム", browse: "閲覧", rankings: "ランキング", myList: "リスト", me: "マイ" },
  hi: { home: "होम", browse: "ब्राउज़", rankings: "रैंकिंग", myList: "लिस्ट", me: "मैं" },
};

const HIDDEN_PREFIXES = ["/admin", "/affiliate", "/creator", "/auth"];
const HIDDEN_ROUTES = [
  "/about",
  "/careers",
  "/cookies",
  "/help",
  "/press",
  "/privacy",
  "/terms",
];

function shouldShowTabBar(pathname: string) {
  if (!pathname) return false;
  if (pathname.includes("/play/")) return false;
  if (pathname.startsWith("/user/coins/checkout")) return false;
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
    pathname.startsWith("/drama")
  ) {
    return "/browse";
  }
  if (pathname.startsWith("/rankings")) return "/rankings";
  if (pathname.startsWith("/user/favorites")) return "/user/favorites";
  if (pathname.startsWith("/user")) return "/user/profile";
  return "";
}

export function BottomTabBar({ notificationCount = 0 }: BottomTabBarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const labels = resolveLocaleCopy(TAB_LABELS, locale);
  const { isMobile } = usePlatform();
  const normalizedPath = removeLocalePrefix(pathname || "/");

  const isVisible = isMobile && shouldShowTabBar(normalizedPath);
  const activeTab = useMemo(() => resolveActiveTab(normalizedPath), [normalizedPath]);

  useEffect(() => {
    document.body.classList.toggle("has-bottom-bar", isVisible);
    return () => document.body.classList.remove("has-bottom-bar");
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
      <nav
        aria-label="Mobile navigation"
        className="mobile-bottom-tab pointer-events-auto border-t border-white/10 bg-[#111111]/95 px-2 pb-safe-bottom pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {TAB_ITEMS.map((item) => {
            const active = activeTab === item.href;
            const Icon = item.icon;
            const badgeVisible = item.href === "/user/profile" && notificationCount > 0;

            return (
              <Link
                key={item.href}
                href={localizePath(item.href, locale)}
                onClick={() => {
                  void triggerHaptic('selection');
                }}
                className={cn(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition",
                  active ? "bg-white/8 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && "text-red-500")} strokeWidth={2.2} />
                  {badgeVisible ? (
                    <span className="absolute -right-2 -top-2 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {Math.min(notificationCount, 99)}
                    </span>
                  ) : null}
                </div>
                <span>{labels[item.key]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
