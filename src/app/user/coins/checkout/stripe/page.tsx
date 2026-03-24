"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { coinsApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";

type StripeCheckoutCopy = {
  title: string;
  subtitle: string;
  summary: string;
  checkoutHint: string;
  continue: string;
  back: string;
  missingPackage: string;
  coins: string;
  bonus: string;
  total: string;
  providerTitle: string;
};

const COPY: FlexibleRecord<SupportedLocale, StripeCheckoutCopy> = {
  en: {
    title: "Stripe Checkout",
    subtitle: "Pay with card in Stripe's secure hosted checkout.",
    summary: "Recharge Summary",
    checkoutHint: "You will be redirected to Stripe to complete the payment.",
    continue: "Continue to Stripe",
    back: "Back to Recharge",
    missingPackage: "No recharge package selected.",
    coins: "Coins",
    bonus: "Bonus",
    total: "Total",
    providerTitle: "Powered by Stripe",
  },
  zh: {
    title: "Stripe 收银台",
    subtitle: "通过 Stripe 安全托管收银台完成银行卡支付。",
    summary: "充值摘要",
    checkoutHint: "点击后将跳转到 Stripe 完成支付。",
    continue: "前往 Stripe 支付",
    back: "返回充值页",
    missingPackage: "未选择充值套餐。",
    coins: "金币",
    bonus: "赠送",
    total: "合计",
    providerTitle: "由 Stripe 提供支持",
  },
};

export default function StripeCheckoutPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const { token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const packageId = searchParams.get("packageId") || "";
  const coins = Number(searchParams.get("coins") || 0);
  const bonus = Number(searchParams.get("bonus") || 0);
  const price = Number(searchParams.get("price") || 0);

  const amountLocale = ({
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    pt: "pt-BR",
    hi: "hi-IN",
    id: "id-ID",
    ko: "ko-KR",
    fr: "fr-FR",
  } as const)[locale] || "en-US";

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat(amountLocale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(price || 0));
  }, [amountLocale, price]);

  const handleContinue = async () => {
    if (!token || !packageId) return;
    setSubmitting(true);
    try {
      const res = await coinsApi.createOrder(token, packageId, "stripe");
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      toast("Stripe checkout URL was not returned", "error");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to create Stripe checkout", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(29,78,216,0.24),rgba(8,8,8,0.96)_45%)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-300/80">{t.providerTitle}</p>
          <h1 className="mt-4 text-3xl font-semibold">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-300">{t.subtitle}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-lg font-semibold">{t.summary}</h2>
              {packageId ? (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{t.coins}</span>
                    <span className="font-semibold text-white">{coins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{t.bonus}</span>
                    <span className="font-semibold text-emerald-400">+{bonus.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm text-gray-400">{t.total}</span>
                    <span className="text-2xl font-bold text-white">{formattedPrice}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-rose-300">{t.missingPackage}</p>
              )}
            </div>

            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-6">
              <div className="inline-flex rounded-full border border-blue-300/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-100">
                Card payment
              </div>
              <p className="mt-5 text-sm leading-6 text-gray-300">{t.checkoutHint}</p>
              <button
                onClick={handleContinue}
                disabled={!token || !packageId || submitting}
                className="mt-8 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Loading..." : t.continue}
              </button>
              <Link
                href={localizePath("/user/coins", locale)}
                className="mt-4 inline-flex text-sm text-blue-100/80 transition hover:text-white"
              >
                {t.back}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
