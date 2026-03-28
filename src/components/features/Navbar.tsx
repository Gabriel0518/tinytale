"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogIn, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { MobileFullscreenSearch } from "@/components/mobile/MobileFullscreenSearch";
import { usePlatform } from "@/hooks/usePlatform";
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

const MOBILE_RECENT_SEARCHES_KEY = "tinytale:mobile-recent-searches";
const MOBILE_QUICK_SEARCHES = [
  "Romance",
  "CEO",
  "Revenge",
  "Fantasy",
  "Trending",
];

const navLinks = [
  { href: "/", key: "home" },
  { href: "/browse", key: "browse" },
  { href: "/rankings", key: "rankings" },
  { href: "/user/favorites", key: "myList" },
  { href: "/creator", key: "creator" },
  { href: "/affiliate", key: "affiliate" },
];

const NAV_LABELS: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { home: "Home", browse: "Browse", rankings: "Rankings", myList: "My List", creator: "Creator", affiliate: "Affiliate", signIn: "Sign In", getStarted: "Get Started", search: "Search", notifications: "Notifications", add: "Add", openMenu: "Open menu", closeMenu: "Close menu", cancel: "Cancel", searchPlaceholder: "Search dramas, genres, actors...", recentSearches: "Recent searches", quickSearches: "Popular right now", searchHint: "Find your next vertical drama in one tap.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Your latest release and system updates live here.", inboxUnread: "{{count}} unread updates waiting for you." },
  es: { home: "Inicio", browse: "Explorar", rankings: "Ranking", myList: "Mi lista", creator: "Creator", affiliate: "Afiliados", signIn: "Entrar", getStarted: "Comenzar", search: "Buscar", notifications: "Notificaciones", add: "Recargar", openMenu: "Abrir menú", closeMenu: "Cerrar menú", cancel: "Cerrar", searchPlaceholder: "Busca dramas, géneros, actores...", recentSearches: "Búsquedas recientes", quickSearches: "Popular ahora", searchHint: "Encuentra tu próximo vertical drama al instante.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Tus novedades y avisos del sistema aparecen aquí.", inboxUnread: "Tienes {{count}} novedades sin leer." },
  pt: { home: "Início", browse: "Explorar", rankings: "Ranking", myList: "Minha Lista", creator: "Creator", affiliate: "Afiliados", signIn: "Entrar", getStarted: "Começar", search: "Buscar", notifications: "Notificações", add: "Adicionar", openMenu: "Abrir menu", closeMenu: "Fechar menu", cancel: "Fechar", searchPlaceholder: "Busque dramas, gêneros, atores...", recentSearches: "Buscas recentes", quickSearches: "Em alta agora", searchHint: "Encontre seu próximo drama vertical em um toque.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Seus novos episódios e alertas do sistema aparecem aqui.", inboxUnread: "Você tem {{count}} atualizações não lidas." },
  id: { home: "Beranda", browse: "Jelajahi", rankings: "Peringkat", myList: "Daftar Saya", creator: "Kreator", affiliate: "Afiliasi", signIn: "Masuk", getStarted: "Mulai", search: "Cari", notifications: "Notifikasi", add: "Isi ulang", openMenu: "Buka menu", closeMenu: "Tutup menu", cancel: "Tutup", searchPlaceholder: "Cari drama, genre, aktor...", recentSearches: "Pencarian terakhir", quickSearches: "Sedang populer", searchHint: "Temukan drama vertikal berikutnya dengan cepat.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Rilis baru dan update sistemmu muncul di sini.", inboxUnread: "Ada {{count}} update belum dibaca untukmu." },
  zh: { home: "首页", browse: "浏览", rankings: "排行", myList: "我的收藏", creator: "创作者", affiliate: "推广", signIn: "登录", getStarted: "开始使用", search: "搜索", notifications: "通知", add: "充值", openMenu: "打开菜单", closeMenu: "关闭菜单", cancel: "关闭", searchPlaceholder: "搜索短剧、类型、演员...", recentSearches: "最近搜索", quickSearches: "现在热门", searchHint: "一键找到下一部竖屏短剧。", hotLabel: "热门", inboxTitle: "收件箱", inboxEmpty: "最新上新和系统提醒都会出现在这里。", inboxUnread: "你有 {{count}} 条未读更新。" },
  ja: { home: "ホーム", browse: "閲覧", rankings: "ランキング", myList: "マイリスト", creator: "クリエイター", affiliate: "アフィリエイト", signIn: "ログイン", getStarted: "はじめる", search: "検索", notifications: "通知", add: "追加", openMenu: "メニューを開く", closeMenu: "メニューを閉じる", cancel: "閉じる", searchPlaceholder: "ドラマ、ジャンル、俳優を検索...", recentSearches: "最近の検索", quickSearches: "人気の検索", searchHint: "次に見る縦型ドラマをすぐ見つけよう。", hotLabel: "Hot", inboxTitle: "受信箱", inboxEmpty: "新着やシステム通知はここに表示されます。", inboxUnread: "{{count}} 件の未読アップデートがあります。" },
  hi: { home: "होम", browse: "ब्राउज़", rankings: "रैंकिंग", myList: "मेरी सूची", creator: "क्रिएटर", affiliate: "अफिलिएट", signIn: "साइन इन", getStarted: "शुरू करें", search: "खोजें", notifications: "सूचनाएं", add: "रिचार्ज", openMenu: "मेनू खोलें", closeMenu: "मेनू बंद करें", cancel: "बंद करें", searchPlaceholder: "ड्रामा, जॉनर, अभिनेता खोजें...", recentSearches: "हाल की खोजें", quickSearches: "अभी लोकप्रिय", searchHint: "एक टैप में अगला वर्टिकल ड्रामा खोजें।", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "आपके नए अपडेट और सिस्टम संदेश यहां दिखेंगे।", inboxUnread: "आपके लिए {{count}} अनरीड अपडेट हैं।" } };

export function Navbar({
  activePath,
  variant = "default",
  showSearch = true,
  showAuthButtons = true,
  className,
  renderSearch }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const navText = resolveLocaleCopy(NAV_LABELS, locale);
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const toLocalePath = (href: string) => localizePath(href, locale);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { isMobile } = usePlatform();
  const { user, token } = useAuth();

  const desktopNavLinks = useMemo(() => navLinks, []);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(MOBILE_RECENT_SEARCHES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === "string").slice(0, 6));
      }
    } catch {
      window.localStorage.removeItem(MOBILE_RECENT_SEARCHES_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("overflow-hidden", isSearchOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isSearchOpen]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const persistRecentSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized || typeof window === "undefined") return;

    const next = [normalized, ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    window.localStorage.setItem(MOBILE_RECENT_SEARCHES_KEY, JSON.stringify(next));
  };

  const submitMobileSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    persistRecentSearch(normalized);
    setMobileSearchValue(normalized);
    setIsSearchOpen(false);
    router.push(`${toLocalePath("/search")}?q=${encodeURIComponent(normalized)}`);
  };

  const bgStyle =
    variant === "transparent"
      ? { backgroundColor: `rgba(20, 20, 20, ${scrollOpacity * 0.95})` }
      : undefined;

  const bgClass =
    variant === "transparent"
      ? "transition-colors duration-300"
      : "bg-[#141414]/95 backdrop-blur-sm";

  return (
    <>
      <nav
        className={cn(
          "fixed left-0 right-0 top-0 z-50",
          isMobile && "pt-safe-top",
          bgClass,
          scrollOpacity > 0.1 && variant === "transparent" ? "backdrop-blur-sm" : "",
          className
        )}
        style={bgStyle}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-20">
          {/* Logo */}
          <Link href={toLocalePath("/")} className="flex items-center">
            <Image
              src="/logo.png"
              alt="TinyTale"
              width={378}
              height={97}
              className="h-9 w-auto md:h-[97px]"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-6 md:flex">
            {desktopNavLinks.map((link) => (
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
              <Link
                href={toLocalePath("/search")}
                className="hidden text-gray-300 transition hover:text-white md:inline-flex"
                aria-label={navText.search}
              >
                <Search className="h-5 w-5" />
              </Link>
            ) : null}

            {user ? (
              /* Authenticated State */
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href={toLocalePath("/user/coins")}
                  className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-yellow-500 transition hover:bg-gray-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="font-medium">{Number(user.coins || 0).toFixed(2)}</span>
                  <span className="text-xs font-semibold text-yellow-400">{navText.add}</span>
                </Link>
                <Link href={toLocalePath("/user/notifications")} className="relative text-gray-300 transition hover:text-white" aria-label={navText.notifications}>
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
              <div className="hidden items-center gap-3 md:flex">
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

            <div className="flex items-center gap-2 md:hidden">
              {showSearch ? (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-gray-100 transition hover:bg-white/10"
                  aria-label={navText.search}
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              ) : null}

              {user ? (
                <Link
                  href={toLocalePath("/user/notifications")}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-gray-100 transition hover:bg-white/10"
                  aria-label={navText.notifications}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                  ) : null}
                </Link>
              ) : showAuthButtons ? (
                <Link
                  href={toLocalePath("/auth/login")}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white/6 px-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{navText.signIn}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
      <MobileFullscreenSearch
        open={isMobile && isSearchOpen}
        value={mobileSearchValue}
        onChange={setMobileSearchValue}
        onClose={() => setIsSearchOpen(false)}
        onSubmit={submitMobileSearch}
        recentSearches={recentSearches}
        quickSearches={MOBILE_QUICK_SEARCHES}
        notificationsHref={toLocalePath("/user/notifications")}
        unreadCount={unreadCount}
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
        }}
      />
      <BottomTabBar notificationCount={unreadCount} />
    </>
  );
}
