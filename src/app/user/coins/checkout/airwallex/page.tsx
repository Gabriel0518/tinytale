"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { coinsApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";

declare global {
  interface Window {
    AirwallexComponentsSDK?: {
      init: (options: { env: "demo" | "prod"; enabledElements: string[] }) => Promise<{
        payments: {
          redirectToCheckout: (options: Record<string, unknown>) => Promise<void> | void;
        };
      }>;
    };
  }
}

type AirwallexCheckoutCopy = {
  title: string;
  subtitle: string;
  summary: string;
  continue: string;
  back: string;
  missingPackage: string;
  coins: string;
  bonus: string;
  total: string;
  providerTitle: string;
  checkoutHint: string;
  httpsWarning: string;
  methodLabel: string;
  sdkLoading: string;
  sdkFailed: string;
  checkoutDataIncomplete: string;
  checkoutCreateFailed: string;
  methodMap: Record<string, string>;
};

const COPY: FlexibleRecord<SupportedLocale, AirwallexCheckoutCopy> = {
  en: {
    title: "Airwallex Checkout",
    subtitle: "Use Airwallex Hosted Payment Page in the test environment first.",
    summary: "Recharge Summary",
    continue: "Continue to Airwallex",
    back: "Back to Recharge",
    missingPackage: "No recharge package selected.",
    coins: "Coins",
    bonus: "Bonus",
    total: "Total",
    providerTitle: "Powered by Airwallex",
    checkoutHint: "A hosted Airwallex payment page will open in the next step.",
    httpsWarning: "Airwallex hosted checkout requires an HTTPS success URL. Please set AIRWALLEX_SUCCESS_URL or FRONTEND_URL to an HTTPS page before testing this flow.",
    methodLabel: "Chosen Method",
    sdkLoading: "Airwallex checkout is still loading. Please try again in a moment.",
    sdkFailed: "Failed to load Airwallex checkout SDK. Please refresh and try again.",
    checkoutDataIncomplete: "Airwallex checkout session data is incomplete.",
    checkoutCreateFailed: "Failed to create Airwallex checkout.",
    methodMap: {
      card: "Global Cards",
      cards: "Global Cards",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX Online Banking",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "Local Bank Transfer",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / Bank Redirect",
      local: "Local Payment Methods",
    },
  },
  zh: {
    title: "Airwallex 收银台",
    subtitle: "当前先接入 Airwallex 测试环境的 Hosted Payment Page。",
    summary: "充值摘要",
    continue: "前往 Airwallex 支付",
    back: "返回充值页",
    missingPackage: "未选择充值套餐。",
    coins: "金币",
    bonus: "赠送",
    total: "合计",
    providerTitle: "由 Airwallex 提供支持",
    checkoutHint: "下一步会跳转到 Airwallex 托管支付页完成支付。",
    httpsWarning: "Airwallex 托管收银台要求成功回跳地址必须为 HTTPS。测试前请先把 AIRWALLEX_SUCCESS_URL 或 FRONTEND_URL 配置成 HTTPS 页面。",
    methodLabel: "已选方式",
    sdkLoading: "Airwallex 收银台仍在加载，请稍后再试。",
    sdkFailed: "Airwallex 收银台 SDK 加载失败，请刷新页面后重试。",
    checkoutDataIncomplete: "Airwallex 收银台会话数据不完整。",
    checkoutCreateFailed: "创建 Airwallex 收银台失败。",
    methodMap: {
      card: "全球银行卡",
      cards: "全球银行卡",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX 网银支付",
      tng: "Touch 'n Go 电子钱包",
      qris: "QRIS",
      local_bank: "本地银行转账",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS 转数快",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "便利店支付",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / 银行跳转",
      local: "本地支付方式",
    },
  },
};

export default function AirwallexCheckoutPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const { token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);

  const packageId = searchParams.get("packageId") || "";
  const coins = Number(searchParams.get("coins") || 0);
  const bonus = Number(searchParams.get("bonus") || 0);
  const price = Number(searchParams.get("price") || 0);
  const paymentOption = searchParams.get("paymentOption") || "cards";

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

  useEffect(() => {
    if (typeof window !== "undefined" && window.AirwallexComponentsSDK) {
      setSdkReady(true);
      setSdkFailed(false);
    }
  }, []);

  const handleContinue = async () => {
    if (!token || !packageId) return;
    if (sdkFailed) {
      toast(t.sdkFailed, "error");
      return;
    }
    if (!sdkReady || !window.AirwallexComponentsSDK) {
      toast(t.sdkLoading, "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await coinsApi.createOrder(token, packageId, "airwallex", paymentOption);
      const successUrl = String(res.data?.successUrl || "");
      if (!successUrl.startsWith("https://")) {
        toast(t.httpsWarning, "error");
        return;
      }

      if (!res.data?.paymentIntentId || !res.data?.clientSecret) {
        toast(t.checkoutDataIncomplete, "error");
        return;
      }

      const sdk = await window.AirwallexComponentsSDK.init({
        env: res.data.env || "demo",
        enabledElements: ["payments"],
      });

      const failUrl = `${window.location.origin}${localizePath("/user/coins", locale)}?cancelled=true`;
      await sdk.payments.redirectToCheckout({
        intent_id: res.data.paymentIntentId,
        client_secret: res.data.clientSecret,
        currency: (res.data.currency || "USD").toUpperCase(),
        country_code: (res.data.countryCode || "US").toUpperCase(),
        successUrl,
        failUrl,
        pendingUrl: successUrl,
      });
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : t.checkoutCreateFailed, "error");
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
      <Script
        src="https://static.airwallex.com/components/sdk/v1/index.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkReady(Boolean(window.AirwallexComponentsSDK));
          setSdkFailed(!window.AirwallexComponentsSDK);
        }}
        onError={() => {
          setSdkReady(false);
          setSdkFailed(true);
        }}
      />
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.22),rgba(8,8,8,0.96)_45%)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.28em] text-teal-200/80">{t.providerTitle}</p>
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

            <div className="rounded-2xl border border-teal-400/20 bg-teal-500/10 p-6">
              <div className="inline-flex rounded-full border border-teal-300/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-100">
                {t.methodMap[paymentOption] || t.methodMap.cards}
              </div>
              <p className="mt-5 text-sm leading-6 text-gray-300">{t.checkoutHint}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-100/70">{t.methodLabel}</p>
                <p className="mt-2 text-sm font-semibold text-white">{t.methodMap[paymentOption] || t.methodMap.cards}</p>
              </div>
              <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                {t.httpsWarning}
              </p>
              <button
                onClick={handleContinue}
                disabled={!token || !packageId || submitting}
                className="mt-8 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Loading..." : t.continue}
              </button>
              <Link
                href={localizePath("/user/coins", locale)}
                className="mt-4 inline-flex text-sm text-teal-100/80 transition hover:text-white"
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
