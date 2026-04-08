'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

const COPY: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Application Submitted",
    subtitle: "Your application is under review. We'll get back to you within 24 hours.",
    whileWaiting: "While You Wait",
    docsTitle: "Program Documentation",
    docsDesc: "Review affiliate terms, payout rules, and commission structure.",
    communityTitle: "Join Our Community",
    backHome: "Back to Affiliate",
  },
  zh: {
    title: "申请已提交",
    subtitle: "你的申请正在审核中，我们会在 24 小时内反馈结果。",
    whileWaiting: "审核等待期间",
    docsTitle: "计划文档",
    docsDesc: "可先查看推广计划条款、结算规则与佣金结构。",
    communityTitle: "加入社区",
    backHome: "返回推广首页",
  },
  ja: {
    title: "申請が送信されました",
    subtitle: "申請を審査中です。24時間以内に結果をご案内します。",
    whileWaiting: "審査中にできること",
    docsTitle: "プログラム資料",
    docsDesc: "アフィリエイト規約、支払いルール、報酬体系を確認できます。",
    communityTitle: "コミュニティに参加",
    backHome: "アフィリエイトへ戻る",
  },
  es: {
    title: "Solicitud enviada",
    subtitle: "Tu solicitud está en revisión. Te responderemos en 24 horas.",
    whileWaiting: "Mientras esperas",
    docsTitle: "Documentación del programa",
    docsDesc: "Revisa términos, reglas de pago y estructura de comisiones.",
    communityTitle: "Únete a la comunidad",
    backHome: "Volver a Afiliados",
  },
  pt: {
    title: "Solicitação enviada",
    subtitle: "Sua solicitação está em análise. Retornaremos em até 24 horas.",
    whileWaiting: "Enquanto aguarda",
    docsTitle: "Documentação do programa",
    docsDesc: "Revise termos, regras de pagamento e estrutura de comissão.",
    communityTitle: "Participe da comunidade",
    backHome: "Voltar para Afiliados",
  },
  hi: {
    title: "आवेदन जमा हो गया",
    subtitle: "आपका आवेदन समीक्षा में है। हम 24 घंटे के भीतर अपडेट देंगे।",
    whileWaiting: "इंतज़ार के दौरान",
    docsTitle: "प्रोग्राम दस्तावेज़",
    docsDesc: "अफिलिएट नियम, भुगतान नियम और कमीशन संरचना देखें।",
    communityTitle: "समुदाय से जुड़ें",
    backHome: "अफिलिएट होम पर वापस जाएँ",
  },
  id: {
    title: "Pengajuan terkirim",
    subtitle: "Pengajuan Anda sedang ditinjau. Kami akan menghubungi dalam 24 jam.",
    whileWaiting: "Sambil menunggu",
    docsTitle: "Dokumentasi program",
    docsDesc: "Tinjau syarat afiliasi, aturan pembayaran, dan struktur komisi.",
    communityTitle: "Gabung komunitas",
    backHome: "Kembali ke Afiliasi",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tinytale.top';

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function AffiliatePendingPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const [socialLinks, setSocialLinks] = useState({ telegram: '', discord: '' });

  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/api/settings/social`)
      .then((r) => r.json())
      .then((res) => {
        if (!active || !res?.success || !res.data) return;

        const telegram = typeof res.data.social_telegram === 'string'
          ? normalizeExternalUrl(res.data.social_telegram)
          : '';
        const discord = typeof res.data.social_discord === 'string'
          ? normalizeExternalUrl(res.data.social_discord)
          : '';

        setSocialLinks({ telegram, discord });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Checkmark Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <svg
            className="h-10 w-10 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-bold text-white mb-3">{t.title}</h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          {t.subtitle}
        </p>

        {/* While You Wait Section */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-4">
            {t.whileWaiting}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={localizePath("/affiliate/docs", locale)}
              className="block rounded-xl bg-[#13131d] border border-gray-800/50 p-5 text-left transition hover:border-purple-500/40 hover:bg-[#1a1a2e]"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{t.docsTitle}</h3>
              <p className="text-xs text-gray-500">{t.docsDesc}</p>
            </Link>

            <div className="rounded-xl bg-[#13131d] border border-gray-800/50 p-5 text-left">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{t.communityTitle}</h3>
              <div className="flex gap-3">
                {socialLinks.telegram ? (
                  <a
                    href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-300 transition hover:text-white"
                  >
                    Telegram
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-500"
                  >
                    Telegram
                  </span>
                )}
                {socialLinks.discord ? (
                  <a
                    href={socialLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-300 transition hover:text-white"
                  >
                    Discord
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-500"
                  >
                    Discord
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <Link href={localizePath("/affiliate", locale)} className="text-sm text-gray-500 hover:text-gray-300 transition">
          &larr; {t.backHome}
        </Link>
      </div>
    </div>
  );
}
