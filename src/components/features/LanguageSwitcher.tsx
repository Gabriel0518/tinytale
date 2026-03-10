"use client";

import { usePathname, useRouter } from 'next/navigation';
import { SupportedLocale, localizePath } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { settingsApi } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';

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
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();
  const currentLocale = useLocale();

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
    <select
      aria-label="Language"
      value={currentLocale}
      onChange={(event) => switchLanguage(event.target.value as SupportedLocale)}
      className={`rounded-md border border-gray-700 bg-[#1a1a2e] px-2 py-1 text-xs text-gray-200 outline-none transition-colors hover:border-gray-500 ${className || ''}`.trim()}
    >
      {LANGUAGE_OPTIONS.map((language) => (
        <option key={language.code} value={language.code}>
          {language.flag} {language.name}
        </option>
      ))}
    </select>
  );
}
