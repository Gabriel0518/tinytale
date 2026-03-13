"use client";

import Link from "next/link";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { resolveLocaleCopy } from '@/lib/locale-copy';

const COPY: FlexibleRecord<SupportedLocale, { affiliate: string; signOut: string }> = {
  en: { affiliate: "Affiliate", signOut: "Sign Out" },
  zh: { affiliate: "推广", signOut: "退出登录" },
  ja: { affiliate: "アフィリエイト", signOut: "ログアウト" },
  es: { affiliate: "Afiliados", signOut: "Cerrar sesión" },
  pt: { affiliate: "Afiliados", signOut: "Sair" },
  hi: { affiliate: "अफिलिएट", signOut: "साइन आउट" },
  id: { affiliate: "Afiliasi", signOut: "Keluar" },
};

export default function AffiliateHeader() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);

  return (
    <header className="flex items-center justify-between border-b border-gray-800/40 bg-[#0a0a12]/80 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link href={localizePath("/", locale)} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">TinyTale</span>
          <span className="text-xs text-purple-400">{t.affiliate}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = localizePath("/auth/login", locale);
          }}
          className="text-sm text-gray-400 hover:text-white"
        >
          {t.signOut}
        </button>
      </div>
    </header>
  );
}
