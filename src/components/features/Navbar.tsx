"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, LogIn, Search } from "lucide-react";
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
import { dismissActiveKeyboard } from "@/lib/capacitor-bridge";

interface NavbarProps {
  activePath?: string;
  variant?: "default" | "transparent";
  mobileHeaderVariant?: "default" | "brand-search";
  showSearch?: boolean;
  showAuthButtons?: boolean;
  className?: string;
  renderSearch?: React.ReactNode;
  mobileTitle?: string;
  forceBackButton?: boolean;
  mobileShowBrand?: boolean;
  mobileRightSlot?: React.ReactNode;
}

const MOBILE_RECENT_SEARCHES_KEY = "tinytale:mobile-recent-searches";
const MOBILE_QUICK_SEARCHES = [
  "Romance",
  "CEO",
  "Revenge",
  "Fantasy",
  "Trending",
];

const desktopNavLinks = [
  { href: "/", key: "home" },
  { href: "/browse", key: "browse" },
  { href: "/rankings", key: "rankings" },
  { href: "/user/favorites", key: "list" },
  { href: "/affiliate", key: "affiliate" },
  { href: "/creator", key: "creator" },
];

export const NAV_LABELS: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: { home: "Home", browse: "Browse", rankings: "Rankings", list: "List", affiliate: "Affiliate", creator: "Creator", play: "Play", history: "History", profile: "Profile", signIn: "Sign In", getStarted: "Get Started", search: "Search", notifications: "Notifications", add: "Add", balance: "Balance", openMenu: "Open menu", closeMenu: "Close menu", cancel: "Cancel", searchPlaceholder: "Search dramas, genres, actors...", recentSearches: "Recent searches", quickSearches: "Popular right now", searchHint: "Find your next vertical drama in one tap.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Your latest release and system updates live here.", inboxUnread: "{{count}} unread updates waiting for you." },
  es: { home: "Inicio", browse: "Explorar", rankings: "Rankings", list: "Lista", affiliate: "Affiliate", creator: "Creator", play: "Play", history: "Historial", profile: "Perfil", signIn: "Entrar", getStarted: "Comenzar", search: "Buscar", notifications: "Notificaciones", add: "Recargar", balance: "Saldo", openMenu: "Abrir menú", closeMenu: "Cerrar menú", cancel: "Cerrar", searchPlaceholder: "Busca dramas, géneros, actores...", recentSearches: "Búsquedas recientes", quickSearches: "Popular ahora", searchHint: "Encuentra tu próximo vertical drama al instante.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Tus novedades y avisos del sistema aparecen aquí.", inboxUnread: "Tienes {{count}} novedades sin leer." },
  pt: { home: "Início", browse: "Explorar", rankings: "Rankings", list: "Lista", affiliate: "Affiliate", creator: "Creator", play: "Play", history: "Histórico", profile: "Perfil", signIn: "Entrar", getStarted: "Começar", search: "Buscar", notifications: "Notificações", add: "Adicionar", balance: "Saldo", openMenu: "Abrir menu", closeMenu: "Fechar menu", cancel: "Fechar", searchPlaceholder: "Busque dramas, gêneros, atores...", recentSearches: "Buscas recentes", quickSearches: "Em alta agora", searchHint: "Encontre seu próximo drama vertical em um toque.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Seus novos episódios e alertas do sistema aparecem aqui.", inboxUnread: "Você tem {{count}} atualizações não lidas." },
  id: { home: "Beranda", browse: "Jelajahi", rankings: "Peringkat", list: "Daftar", affiliate: "Affiliate", creator: "Creator", play: "Putar", history: "Riwayat", profile: "Profil", signIn: "Masuk", getStarted: "Mulai", search: "Cari", notifications: "Notifikasi", add: "Isi ulang", balance: "Saldo", openMenu: "Buka menu", closeMenu: "Tutup menu", cancel: "Tutup", searchPlaceholder: "Cari drama, genre, aktor...", recentSearches: "Pencarian terakhir", quickSearches: "Sedang populer", searchHint: "Temukan drama vertikal berikutnya dengan cepat.", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "Rilis baru dan update sistemmu muncul di sini.", inboxUnread: "Ada {{count}} update belum dibaca untukmu." },
  zh: { home: "首页", browse: "浏览", rankings: "榜单", list: "List", affiliate: "Affiliate", creator: "Creator", play: "播放", history: "历史", profile: "我的", signIn: "登录", getStarted: "开始使用", search: "搜索", notifications: "通知", add: "充值", balance: "余额", openMenu: "打开菜单", closeMenu: "关闭菜单", cancel: "关闭", searchPlaceholder: "搜索短剧、类型、演员...", recentSearches: "最近搜索", quickSearches: "现在热门", searchHint: "一键找到下一部竖屏短剧。", hotLabel: "热门", inboxTitle: "收件箱", inboxEmpty: "最新上新和系统提醒都会出现在这里。", inboxUnread: "你有 {{count}} 条未读更新。" },
  ja: { home: "ホーム", browse: "閲覧", rankings: "ランキング", list: "List", affiliate: "Affiliate", creator: "Creator", play: "再生", history: "履歴", profile: "マイ", signIn: "ログイン", getStarted: "はじめる", search: "検索", notifications: "通知", add: "追加", balance: "残高", openMenu: "メニューを開く", closeMenu: "メニューを閉じる", cancel: "閉じる", searchPlaceholder: "ドラマ、ジャンル、俳優を検索...", recentSearches: "最近の検索", quickSearches: "人気の検索", searchHint: "次に見る縦型ドラマをすぐ見つけよう。", hotLabel: "Hot", inboxTitle: "受信箱", inboxEmpty: "新着やシステム通知はここに表示されます。", inboxUnread: "{{count}} 件の未読アップデートがあります。" },
  hi: { home: "होम", browse: "ब्राउज़", rankings: "रैंकिंग", list: "List", affiliate: "Affiliate", creator: "Creator", play: "चलाएँ", history: "इतिहास", profile: "प्रोफाइल", signIn: "साइन इन", getStarted: "शुरू करें", search: "खोजें", notifications: "सूचनाएं", add: "रिचार्ज", balance: "बैलेंस", openMenu: "मेनू खोलें", closeMenu: "मेनू बंद करें", cancel: "बंद करें", searchPlaceholder: "ड्रामा, जॉनर, अभिनेता खोजें...", recentSearches: "हाल की खोजें", quickSearches: "अभी लोकप्रिय", searchHint: "एक टैप में अगला वर्टिकल ड्रामा खोजें।", hotLabel: "Hot", inboxTitle: "Inbox", inboxEmpty: "आपके नए अपडेट और系统消息 यहां दिखेंगे।", inboxUnread: "आपके लिए {{count}} अनरीड अपडेट हैं।" } };

export const MOBILE_SEARCH_LABELS: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    resultsTitle: "Search Results",
    resultsFor: "Results for",
    searchPromptDesc: "Use a title, genre, or actor to explore short dramas.",
    searching: "Searching...",
    foundPrefix: "Found",
    foundSuffix: "dramas matching your search.",
    noResultsTitle: "No results found",
    noResultsDesc: "Try searching with different keywords",
    allResults: "All Results",
    ongoing: "Ongoing",
    completed: "Completed",
    topRated: "Top Rated",
    dramaFallback: "Drama",
    eps: "Eps",
    emptyPanelHint: "Search results will appear here.",
  },
  zh: {
    resultsTitle: "搜索结果",
    resultsFor: "搜索结果",
    searchPromptDesc: "输入剧名、类型或演员，结果会显示在这里。",
    searching: "搜索中...",
    foundPrefix: "共找到",
    foundSuffix: "部短剧",
    noResultsTitle: "未找到结果",
    noResultsDesc: "请尝试其他关键词",
    allResults: "全部结果",
    ongoing: "连载中",
    completed: "已完结",
    topRated: "高评分",
    dramaFallback: "短剧",
    eps: "集",
    emptyPanelHint: "搜索结果会显示在这里。",
  },
  ja: {
    resultsTitle: "検索結果",
    resultsFor: "検索結果",
    searchPromptDesc: "タイトル・ジャンル・俳優を入力すると、ここに結果が表示されます。",
    searching: "検索中...",
    foundPrefix: "",
    foundSuffix: "件の作品が見つかりました",
    noResultsTitle: "結果が見つかりません",
    noResultsDesc: "別のキーワードでお試しください",
    allResults: "すべて",
    ongoing: "連載中",
    completed: "完結",
    topRated: "高評価",
    dramaFallback: "ドラマ",
    eps: "話",
    emptyPanelHint: "検索結果はここに表示されます。",
  },
  es: {
    resultsTitle: "Resultados de búsqueda",
    resultsFor: "Resultados para",
    searchPromptDesc: "Usa un título, género o actor para explorar dramas cortos.",
    searching: "Buscando...",
    foundPrefix: "Se encontraron",
    foundSuffix: "dramas",
    noResultsTitle: "No se encontraron resultados",
    noResultsDesc: "Prueba con otras palabras clave",
    allResults: "Todos",
    ongoing: "En curso",
    completed: "Completado",
    topRated: "Mejor valorados",
    dramaFallback: "Drama",
    eps: "Eps",
    emptyPanelHint: "Los resultados aparecerán aquí.",
  },
  pt: {
    resultsTitle: "Resultados da busca",
    resultsFor: "Resultados para",
    searchPromptDesc: "Use um título, gênero ou ator para explorar dramas curtos.",
    searching: "Buscando...",
    foundPrefix: "Encontrados",
    foundSuffix: "dramas",
    noResultsTitle: "Nenhum resultado encontrado",
    noResultsDesc: "Tente outras palavras-chave",
    allResults: "Todos",
    ongoing: "Em andamento",
    completed: "Concluído",
    topRated: "Mais bem avaliados",
    dramaFallback: "Drama",
    eps: "Eps",
    emptyPanelHint: "Os resultados aparecerão aqui.",
  },
  hi: {
    resultsTitle: "खोज परिणाम",
    resultsFor: "परिणाम",
    searchPromptDesc: "शीर्षक, जॉनर या अभिनेता डालें, परिणाम यहीं दिखेंगे।",
    searching: "खोज जारी है...",
    foundPrefix: "मिले",
    foundSuffix: "ड्रामा",
    noResultsTitle: "कोई परिणाम नहीं मिला",
    noResultsDesc: "दूसरे कीवर्ड आज़माएँ",
    allResults: "सभी परिणाम",
    ongoing: "जारी",
    completed: "पूर्ण",
    topRated: "टॉप रेटेड",
    dramaFallback: "ड्रामा",
    eps: "एप",
    emptyPanelHint: "खोज परिणाम यहां दिखाई देंगे।",
  },
  id: {
    resultsTitle: "Hasil pencarian",
    resultsFor: "Hasil untuk",
    searchPromptDesc: "Gunakan judul, genre, atau aktor untuk menemukan drama pendek.",
    searching: "Mencari...",
    foundPrefix: "Ditemukan",
    foundSuffix: "drama",
    noResultsTitle: "Tidak ada hasil",
    noResultsDesc: "Coba kata kunci lain",
    allResults: "Semua hasil",
    ongoing: "Berjalan",
    completed: "Selesai",
    topRated: "Rating tertinggi",
    dramaFallback: "Drama",
    eps: "Ep",
    emptyPanelHint: "Hasil pencarian akan muncul di sini.",
  },
};

const TOP_LEVEL_MOBILE_ROUTES = new Set(["/", "/browse", "/play", "/search", "/user/favorites", "/user/profile"]);

export function Navbar({
  activePath,
  variant = "default",
  mobileHeaderVariant = "default",
  showSearch = true,
  showAuthButtons = true,
  className,
  renderSearch,
  mobileTitle,
  forceBackButton = false,
  mobileShowBrand = true,
  mobileRightSlot,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const navText = resolveLocaleCopy(NAV_LABELS, locale);
  const mobileSearchText = resolveLocaleCopy(MOBILE_SEARCH_LABELS, locale);
  const normalizedPath = removeLocalePrefix(pathname || "/");
  const toLocalePath = (href: string) => localizePath(href, locale);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { isMobile } = usePlatform();
  const { user, token } = useAuth();
  const showMobileBackButton = forceBackButton || (!TOP_LEVEL_MOBILE_ROUTES.has(normalizedPath) && normalizedPath !== "");
  const mobileHeaderTitle = mobileTitle?.trim() || "";
  const usesBrandSearchHeader = isMobile && mobileHeaderVariant === "brand-search";

  const resolvedDesktopNavLinks = useMemo(() => desktopNavLinks, []);

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

  const closeMobileSearch = useCallback(() => {
    void dismissActiveKeyboard(40);
    setIsSearchOpen(false);
  }, []);

  const submitMobileSearch = async (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    persistRecentSearch(normalized);
    setMobileSearchValue(normalized);
    await dismissActiveKeyboard(40);
  };

  const bgStyle =
    variant === "transparent"
      ? { backgroundColor: `rgba(20, 20, 20, ${scrollOpacity * 0.95})` }
      : undefined;

  const bgClass =
    variant === "transparent"
      ? "transition-colors duration-300"
      : "bg-[#141414]/95";

  const handleMobileBack = () => {
    if (typeof window === "undefined") {
      router.push(toLocalePath("/"));
      return;
    }

    void dismissActiveKeyboard();

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(toLocalePath("/"));
  };

  return (
    <>
      <nav
        className={cn(
          "fixed left-0 right-0 top-0 z-50",
          isMobile && "pt-[calc(max(env(safe-area-inset-top),0.6rem)+10px)]",
          bgClass,
          scrollOpacity > 0.1 && variant === "transparent" && !isMobile ? "backdrop-blur-sm" : "",
          className
        )}
        style={bgStyle}
      >
        <div className="mx-auto max-w-7xl px-4">
          {usesBrandSearchHeader ? (
            <div className="flex h-[68px] items-center gap-3 md:hidden">
              {renderSearch ? (
                <div className="min-w-0 flex-1 md:hidden">
                  {renderSearch}
                </div>
              ) : showSearch ? (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="relative flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#161b24] pl-10 pr-4 text-left text-sm text-white/45 shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#1a202b]"
                  aria-label={navText.search}
                >
                  <Search className="absolute left-3.5 h-4 w-4 text-white/45" />
                  <span className="truncate">{navText.searchPlaceholder}</span>
                </button>
              ) : (
                <div className="h-11 flex-1 rounded-2xl border border-white/10 bg-[#161b24]" />
              )}

              <Link
                href={user ? toLocalePath("/user/coins") : toLocalePath("/auth/login")}
                className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-[#161b24] px-2.5 text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#1a202b]"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffd84d] text-[10px] font-black text-[#111318]">
                  $
                </span>
                <span className="min-w-[3.5ch] text-right text-sm font-semibold tabular-nums text-white">
                  {Number(user?.coins || 0).toFixed(0)}
                </span>
              </Link>
            </div>
          ) : (
        <div className="flex h-12 items-center justify-between md:h-20">
          {/* Logo */}
          <div className="flex min-w-0 items-center gap-2">
            {showMobileBackButton ? (
              <button
                type="button"
                onClick={handleMobileBack}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/6 text-white transition hover:bg-white/10 md:hidden"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            <Link href={toLocalePath("/")} className="hidden items-center gap-3 md:flex">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-red-600 text-lg font-black text-white shadow-[0_10px_24px_rgba(229,9,20,0.28)]">
                T
              </span>
              <span className="text-[1.75rem] font-black tracking-tight text-white">
                TinyTale
              </span>
            </Link>
            {mobileShowBrand ? (
              <Link href={toLocalePath("/")} className="flex min-w-0 items-center gap-2 md:hidden">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-600 text-[11px] font-black text-white">
                  T
                </span>
                <span className="truncate text-sm font-semibold tracking-[0.01em] text-white">
                  {mobileHeaderTitle || "TinyTale"}
                </span>
              </Link>
            ) : (
              <div className="min-w-0 flex-1 md:hidden" />
            )}
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {resolvedDesktopNavLinks.map((link) => (
              <Link
                key={link.href}
                href={toLocalePath(link.href)}
                className={cn(
                  "text-sm font-semibold tracking-[0.01em] transition hover:text-white",
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
              {user ? (
                <Link
                  href={toLocalePath("/user/coins")}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2.5 text-xs font-semibold text-yellow-300 transition hover:border-yellow-400/40 hover:bg-yellow-500/15"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span>{Number(user.coins || 0).toFixed(0)}</span>
                </Link>
              ) : null}

              {showSearch ? (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-gray-100 transition hover:bg-white/10"
                  aria-label={navText.search}
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              ) : null}

              {mobileRightSlot}

              {user ? (
                <Link
                  href={toLocalePath("/user/notifications")}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-gray-100 transition hover:bg-white/10"
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
          )}
        </div>
      </nav>
      <MobileFullscreenSearch
        open={isMobile && isSearchOpen}
        value={mobileSearchValue}
        onChange={setMobileSearchValue}
        onClose={closeMobileSearch}
        onSubmit={submitMobileSearch}
        recentSearches={recentSearches}
        quickSearches={MOBILE_QUICK_SEARCHES}
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
      <BottomTabBar notificationCount={unreadCount} />
    </>
  );
}
