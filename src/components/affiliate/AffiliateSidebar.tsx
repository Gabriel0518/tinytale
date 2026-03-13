"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath, removeLocalePrefix, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

const navItems = [
  { href: "/affiliate/dashboard", key: "dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/affiliate/reports", key: "reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/affiliate/creatives", key: "creatives", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/affiliate/payments", key: "payments", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
] as const;

const COPY: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    affiliate: "Affiliate",
    dashboard: "Dashboard",
    reports: "Commission Reports",
    creatives: "Creative Assets",
    payments: "Payments",
    help: "Help & Support",
  },
  zh: {
    affiliate: "推广",
    dashboard: "总览",
    reports: "佣金报表",
    creatives: "素材中心",
    payments: "收款管理",
    help: "帮助与支持",
  },
  ja: {
    affiliate: "アフィリエイト",
    dashboard: "ダッシュボード",
    reports: "コミッションレポート",
    creatives: "クリエイティブ素材",
    payments: "支払い管理",
    help: "ヘルプ",
  },
  es: {
    affiliate: "Afiliados",
    dashboard: "Panel",
    reports: "Reportes de comisión",
    creatives: "Recursos creativos",
    payments: "Pagos",
    help: "Ayuda",
  },
  pt: {
    affiliate: "Afiliados",
    dashboard: "Painel",
    reports: "Relatórios de comissão",
    creatives: "Materiais criativos",
    payments: "Pagamentos",
    help: "Ajuda",
  },
  hi: {
    affiliate: "अफिलिएट",
    dashboard: "डैशबोर्ड",
    reports: "कमीशन रिपोर्ट",
    creatives: "क्रिएटिव एसेट्स",
    payments: "पेमेंट्स",
    help: "सहायता",
  },
  id: {
    affiliate: "Afiliasi",
    dashboard: "Dasbor",
    reports: "Laporan komisi",
    creatives: "Aset kreatif",
    payments: "Pembayaran",
    help: "Bantuan",
  },
};

export default function AffiliateSidebar() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const pathname = removeLocalePrefix(usePathname() || "/");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-[#0a0a12] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">TinyTale</span>
          <span className="ml-1 text-xs text-purple-400">{t.affiliate}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/affiliate/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={localizePath(item.href, locale)}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                active ? "bg-purple-600/15 text-purple-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
              </svg>
              {t[item.key]}
            </Link>
          );
        })}
      </nav>

      {/* Help & Support */}
      <div className="border-t border-gray-800/60 px-4 py-4">
        <Link href={localizePath("/affiliate", locale)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.help}
        </Link>
      </div>
    </aside>
  );
}
