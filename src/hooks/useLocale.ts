"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { detectClientLocale, SupportedLocale } from "@/lib/i18n";

export function useLocale(): SupportedLocale {
  const pathname = usePathname();
  const [locale, setLocale] = useState<SupportedLocale>(() => detectClientLocale(pathname ?? undefined));

  useEffect(() => {
    setLocale(detectClientLocale(pathname ?? undefined));
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLocale = () => {
      setLocale(detectClientLocale(pathname ?? undefined));
    };

    window.addEventListener("tinytale:language-changed", syncLocale as EventListener);
    window.addEventListener("popstate", syncLocale);
    window.addEventListener("focus", syncLocale);

    return () => {
      window.removeEventListener("tinytale:language-changed", syncLocale as EventListener);
      window.removeEventListener("popstate", syncLocale);
      window.removeEventListener("focus", syncLocale);
    };
  }, [pathname]);

  return locale;
}
