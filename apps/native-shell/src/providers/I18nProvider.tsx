import { DEFAULT_LOCALE, LOCALE_SHORT_LABELS, isSupportedLocale, type SupportedLocale } from '@i18n';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const LOCALE_STORAGE_KEY = 'tinytale:native-shell-locale';

type I18nContextValue = {
  locale: SupportedLocale;
  localeLabel: string;
  setLocale: (locale: SupportedLocale) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function readStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)?.trim().toLowerCase();
  if (raw && isSupportedLocale(raw)) {
    return raw;
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(readStoredLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      localeLabel: LOCALE_SHORT_LABELS[locale],
      setLocale,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
