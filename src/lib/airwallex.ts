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

export function normalizeAirwallexVerificationCode(code: string | null | undefined): string {
  const normalized = String(code || "").trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (!normalized) return "";
  if (normalized === "TRANSFER_METHOD_UNSUPPORTED" || normalized === "UNSUPPORTED_TRANSFER_METHOD") {
    return "CANNOT_VERIFY";
  }
  return normalized;
}

function humanizeVerificationCode(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getAirwallexVerificationDetail(params: {
  code?: string | null;
  message?: string | null;
  accountNameMatchResult?: string | null;
}): string {
  const code = normalizeAirwallexVerificationCode(params.code);
  const message = String(params.message || "").trim();
  const accountNameMatchResult = String(params.accountNameMatchResult || "").trim().toUpperCase();

  if (!code) return "";
  if (code === "CANNOT_VERIFY") {
    return "Automatic verification is unavailable for this payout route. Your bank details were still saved for finance review.";
  }
  if (code === "EXTERNAL_SERVICE_UNAVAILABLE") {
    return "Automatic verification is temporarily unavailable. Please try again later.";
  }
  if (code === "INVALID") {
    return message || "This bank account could not be verified. Please review the details and submit again.";
  }
  if (code === "VERIFIED" && accountNameMatchResult && accountNameMatchResult !== "FULL_MATCH") {
    return `Verified with review needed: ${humanizeVerificationCode(accountNameMatchResult)}.`;
  }

  return message || humanizeVerificationCode(code);
}
