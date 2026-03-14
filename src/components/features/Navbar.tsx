"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

interface NavbarProps {
  activePath?: string;
  variant?: "default" | "transparent";
  showSearch?: boolean;
  showAuthButtons?: boolean;
  className?: string;
  renderSearch?: React.ReactNode;
}

const navLinks = [
  { href: "/", key: "home" },
  { href: "/browse", key: "browse" },
  { href: "/rankings", key: "rankings" },
  { href: "/user/favorites", key: "myList" },
  { href: "/creator", key: "creator" },
  { href: "/affiliate", key: "affiliate" },
];

const NAV_LABELS: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { home: "Home", browse: "Browse", rankings: "Rankings", myList: "My List", creator: "Creator", affiliate: "Affiliate", signIn: "Sign In", getStarted: "Get Started" },
  es: { home: "Inicio", browse: "Explorar", rankings: "Ranking", myList: "Mi lista", creator: "Creator", affiliate: "Afiliados", signIn: "Entrar", getStarted: "Comenzar" },
  pt: { home: "Início", browse: "Explorar", rankings: "Ranking", myList: "Minha Lista", creator: "Creator", affiliate: "Afiliados", signIn: "Entrar", getStarted: "Começar" },
  id: { home: "Beranda", browse: "Jelajahi", rankings: "Peringkat", myList: "Daftar Saya", creator: "Kreator", affiliate: "Afiliasi", signIn: "Masuk", getStarted: "Mulai" },
  zh: { home: "首页", browse: "浏览", rankings: "排行", myList: "我的收藏", creator: "创作者", affiliate: "推广", signIn: "登录", getStarted: "开始使用" },
  ja: { home: "ホーム", browse: "閲覧", rankings: "ランキング", myList: "マイリスト", creator: "クリエイター", affiliate: "アフィリエイト", signIn: "ログイン", getStarted: "はじめる" },
  hi: { home: "होम", browse: "ब्राउज़", rankings: "रैंकिंग", myList: "मेरी सूची", creator: "क्रिएटर", affiliate: "अफिलिएट", signIn: "साइन इन", getStarted: "शुरू करें" } };

export function Navbar({
  activePath,
  variant = "default",
  showSearch = true,
  showAuthButtons = true,
  className,
  renderSearch }: NavbarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const navText = resolveLocaleCopy(NAV_LABELS, locale);
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const toLocalePath = (href: string) => localizePath(href, locale);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    userApi.getNotifications(token)
      .then((res: { data: { unreadCount: number } }) => setUnreadCount(res.data.unreadCount))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      const opacity = Math.min(window.scrollY / 100, 1);
      setScrollOpacity(opacity);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bgStyle =
    variant === "transparent"
      ? { backgroundColor: `rgba(20, 20, 20, ${scrollOpacity * 0.95})` }
      : undefined;

  const bgClass =
    variant === "transparent"
      ? "transition-colors duration-300"
      : "bg-[#141414]/95 backdrop-blur-sm";

  return (
    <nav
      className={cn("fixed left-0 right-0 top-0 z-50", bgClass, scrollOpacity > 0.1 && variant === "transparent" ? "backdrop-blur-sm" : "", className)}
      style={bgStyle}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={toLocalePath("/")} className="flex items-center">
          <Image
            src="/logo.png"
            alt="TinyTale"
            width={378}
            height={97}
            className="h-[97px] w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={toLocalePath(link.href)}
              className={cn(
                "text-sm font-medium transition hover:text-white",
                (activePath || normalizedPath) === link.href ? "text-white" : "text-gray-300"
              )}
            >
              {navText[link.key] || link.key}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {renderSearch ? (
            <div className="hidden flex-1 justify-center px-4 md:flex">{renderSearch}</div>
          ) : showSearch ? (
            <Link href={toLocalePath("/search")} className="text-gray-300 hover:text-white" aria-label="Search">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          ) : null}

          {user ? (
            /* Authenticated State */
            <div className="flex items-center gap-3">
              <Link
                href={toLocalePath("/user/coins")}
                className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-yellow-500 transition hover:bg-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="font-medium">{Number(user.coins || 0).toFixed(2)}</span>
                <span className="text-xs font-semibold text-yellow-400">ADD</span>
              </Link>
              <Link href={toLocalePath("/user/notifications")} className="relative text-gray-300 transition hover:text-white" aria-label="Notifications">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{unreadCount}</span>
                )}
              </Link>
              <Link
                href={toLocalePath("/user/profile")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white"
              >
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.nickname} width={32} height={32} className="h-full w-full rounded-full object-cover" />
                ) : (
                  user.nickname?.charAt(0).toUpperCase() || "U"
                )}
              </Link>
            </div>
          ) : showAuthButtons ? (
            /* Unauthenticated State */
            <div className="flex items-center gap-3">
              <Link
                href={toLocalePath("/auth/login")}
                className="text-sm font-medium text-gray-300 hover:text-white"
              >
                {navText.signIn}
              </Link>
              <Link
                href={toLocalePath("/auth/register")}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {navText.getStarted}
              </Link>
            </div>
          ) : null}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-gray-800 bg-[#141414] md:hidden">
          <div className="space-y-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={toLocalePath(link.href)}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block py-2 text-sm font-medium",
                  (activePath || normalizedPath) === link.href ? "text-white" : "text-gray-400"
                )}
              >
                {navText[link.key] || link.key}
              </Link>
            ))}
            <div className="pt-2">
              <LanguageSwitcher className="w-full" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
