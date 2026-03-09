"use client";

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SupportedLocale, detectClientLocale, localizePath } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { settingsApi } from '@/lib/api';

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

  const currentLocale = useMemo(() => detectClientLocale(pathname), [pathname]);

  const switchLanguage = (nextLocale: SupportedLocale) => {
    const targetPath = localizePath(pathname || '/', nextLocale);
    const search = typeof window !== 'undefined' ? window.location.search : '';

    document.cookie = `user_lang=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;

    if (token) {
      settingsApi.updateSettings(token, { language: nextLocale }).catch(() => {});
    }

    router.push(search ? `${targetPath}${search}` : targetPath);
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
