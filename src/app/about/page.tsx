import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, localizePath } from "@/lib/i18n";

export default function AboutRedirectPage() {
  const localeHeader = headers().get("x-user-lang")?.trim().toLowerCase();
  const locale = isSupportedLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE;
  redirect(`${localizePath("/help", locale)}?tab=about&section=mission`);
}
