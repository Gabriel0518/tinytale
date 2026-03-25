import type { SupportedLocale } from "@/lib/i18n";

export const AIRWALLEX_COMPONENT_LOCALES = ["de", "en", "es", "fr", "it", "ja", "ko", "zh"] as const;

export type AirwallexComponentLocale = (typeof AIRWALLEX_COMPONENT_LOCALES)[number];

const AIRWALLEX_LOCALE_MAP: Record<SupportedLocale, AirwallexComponentLocale> = {
  en: "en",
  zh: "zh",
  ja: "ja",
  es: "es",
  pt: "en",
  hi: "en",
  id: "en",
  ko: "ko",
  fr: "fr",
};

export function resolveAirwallexLocale(locale: SupportedLocale): AirwallexComponentLocale {
  return AIRWALLEX_LOCALE_MAP[locale] || "en";
}

