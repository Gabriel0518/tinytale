"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { SupportedLocale, localizePath } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { settingsApi } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS: Array<{ code: SupportedLocale; name: string; flag: string }> = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'pt', name: 'Português', flag: 'PT' },
  { code: 'id', name: 'Indonesia', flag: 'ID' },
  { code: 'zh', name: '中文', flag: 'ZH' },
  { code: 'ja', name: '日本語', flag: 'JA' },
  { code: 'hi', name: 'हिंदी', flag: 'HI' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();
  const currentLocale = useLocale();
  const currentLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((language) => language.code === currentLocale) || LANGUAGE_OPTIONS[0],
    [currentLocale]
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const switchLanguage = (nextLocale: SupportedLocale) => {
    if (nextLocale === currentLocale) return;

    const targetPath = localizePath(pathname || '/', nextLocale);
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const targetUrl = search ? `${targetPath}${search}` : targetPath;

    document.cookie = `user_lang=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('user_lang', nextLocale);
      window.dispatchEvent(new CustomEvent('tinytale:language-changed', { detail: { locale: nextLocale } }));
    }

    if (token) {
      settingsApi.updateSettings(token, { language: nextLocale }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl === targetUrl) {
        window.location.reload();
        return;
      }
      window.location.assign(targetUrl);
      return;
    }

    router.push(targetUrl);
    router.refresh();
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full min-w-[126px] items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
          "border-gray-700/90 bg-[#161625]/95 text-gray-100 backdrop-blur-sm hover:border-gray-500 hover:bg-[#1a1a2e]",
          isOpen ? "border-gray-500 shadow-[0_8px_20px_rgba(0,0,0,0.4)]" : ""
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-[11px] tracking-wide text-gray-300">{currentLanguage.flag}</span>
          <span className="truncate">{currentLanguage.name}</span>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-150", isOpen ? "rotate-180" : "")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className={cn(
            "absolute left-0 top-full z-50 mt-2 w-full min-w-[188px] overflow-hidden rounded-xl border border-gray-700/80",
            "bg-[#111218]/95 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          )}
        >
          {LANGUAGE_OPTIONS.map((language) => {
            const selected = language.code === currentLocale;
            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setIsOpen(false);
                  switchLanguage(language.code);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 text-xs tracking-wide text-gray-400">{language.flag}</span>
                  <span>{language.name}</span>
                </span>
                {selected ? <Check className="h-3.5 w-3.5 text-red-400" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
