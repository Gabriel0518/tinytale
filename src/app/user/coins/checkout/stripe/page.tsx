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
  methodLabel: string;
  methodMap: Record<string, string>;
  checkoutUrlMissing: string;
  createCheckoutFailed: string;
  loading: string;
};

const STRIPE_PROVIDER_TITLES: FlexibleRecord<SupportedLocale, string> = {
  en: "Powered by Stripe",
  zh: "由 Stripe 提供支持",
  ja: "Stripe 提供",
  es: "Con tecnología de Stripe",
  pt: "Tecnologia Stripe",
  hi: "Stripe द्वारा संचालित",
  id: "Didukung oleh Stripe",
  ko: "Stripe 제공",
  fr: "Propulsé par Stripe",
};

const STRIPE_WALLET_LABELS: FlexibleRecord<SupportedLocale, string> = {
  en: "Apple Pay / Google Pay / Link",
  zh: "Apple Pay、Google Pay、Link 钱包",
  ja: "Apple Pay・Google Pay・Link ウォレット",
  es: "Billeteras Apple Pay, Google Pay y Link",
  pt: "Carteiras Apple Pay, Google Pay e Link",
  hi: "Apple Pay, Google Pay और Link वॉलेट",
  id: "Dompet Apple Pay, Google Pay, dan Link",
  ko: "Apple Pay, Google Pay, Link 지갑",
  fr: "Portefeuilles Apple Pay, Google Pay et Link",
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
    providerTitle: STRIPE_PROVIDER_TITLES.en,
    methodLabel: "Chosen Method",
    checkoutUrlMissing: "Stripe checkout URL was not returned.",
    createCheckoutFailed: "Failed to create Stripe checkout.",
    loading: "Loading...",
    methodMap: {
      card: "Credit / Debit Card",
      wallet: STRIPE_WALLET_LABELS.en,
    },
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
    providerTitle: STRIPE_PROVIDER_TITLES.zh,
    methodLabel: "已选方式",
    checkoutUrlMissing: "未返回 Stripe 收银台链接。",
    createCheckoutFailed: "创建 Stripe 支付失败。",
    loading: "加载中...",
    methodMap: {
      card: "信用卡 / 借记卡",
      wallet: STRIPE_WALLET_LABELS.zh,
    },
  },
  ja: {
    title: "Stripe チェックアウト",
    subtitle: "Stripe の安全なホスト型チェックアウトでカード決済を完了します。",
    summary: "チャージ概要",
    checkoutHint: "支払い完了のため Stripe にリダイレクトされます。",
    continue: "Stripe に進む",
    back: "チャージページへ戻る",
    missingPackage: "チャージパッケージが選択されていません。",
    coins: "コイン",
    bonus: "ボーナス",
    total: "合計",
    providerTitle: STRIPE_PROVIDER_TITLES.ja,
    methodLabel: "選択中の方法",
    checkoutUrlMissing: "Stripe のチェックアウト URL が返されませんでした。",
    createCheckoutFailed: "Stripe チェックアウトの作成に失敗しました。",
    loading: "読み込み中...",
    methodMap: {
      card: "クレジット / デビットカード",
      wallet: STRIPE_WALLET_LABELS.ja,
    },
  },
  es: {
    title: "Checkout de Stripe",
    subtitle: "Paga con tarjeta en el checkout seguro alojado por Stripe.",
    summary: "Resumen de recarga",
    checkoutHint: "Serás redirigido a Stripe para completar el pago.",
    continue: "Continuar con Stripe",
    back: "Volver a Recargas",
    missingPackage: "No se seleccionó ningún paquete de recarga.",
    coins: "Monedas",
    bonus: "Bonificación",
    total: "Total",
    providerTitle: STRIPE_PROVIDER_TITLES.es,
    methodLabel: "Método elegido",
    checkoutUrlMissing: "No se devolvió la URL de checkout de Stripe.",
    createCheckoutFailed: "No se pudo crear el checkout de Stripe.",
    loading: "Cargando...",
    methodMap: {
      card: "Tarjeta de crédito / débito",
      wallet: STRIPE_WALLET_LABELS.es,
    },
  },
  pt: {
    title: "Checkout Stripe",
    subtitle: "Pague com cartão no checkout seguro hospedado pela Stripe.",
    summary: "Resumo da recarga",
    checkoutHint: "Você será redirecionado para a Stripe para concluir o pagamento.",
    continue: "Continuar para Stripe",
    back: "Voltar para Recarga",
    missingPackage: "Nenhum pacote de recarga foi selecionado.",
    coins: "Moedas",
    bonus: "Bônus",
    total: "Total",
    providerTitle: STRIPE_PROVIDER_TITLES.pt,
    methodLabel: "Método escolhido",
    checkoutUrlMissing: "A URL do checkout da Stripe não foi retornada.",
    createCheckoutFailed: "Falha ao criar o checkout da Stripe.",
    loading: "Carregando...",
    methodMap: {
      card: "Cartão de crédito / débito",
      wallet: STRIPE_WALLET_LABELS.pt,
    },
  },
  hi: {
    title: "Stripe चेकआउट",
    subtitle: "Stripe के सुरक्षित होस्टेड checkout में कार्ड से भुगतान करें।",
    summary: "रिचार्ज सारांश",
    checkoutHint: "भुगतान पूरा करने के लिए आपको Stripe पर भेजा जाएगा।",
    continue: "Stripe पर जाएं",
    back: "रिचार्ज पर वापस जाएं",
    missingPackage: "कोई रिचार्ज पैकेज चयनित नहीं है।",
    coins: "कॉइन",
    bonus: "बोनस",
    total: "कुल",
    providerTitle: STRIPE_PROVIDER_TITLES.hi,
    methodLabel: "चुना गया तरीका",
    checkoutUrlMissing: "Stripe checkout URL वापस नहीं मिला।",
    createCheckoutFailed: "Stripe checkout बनाने में विफल।",
    loading: "लोड हो रहा है...",
    methodMap: {
      card: "क्रेडिट / डेबिट कार्ड",
      wallet: STRIPE_WALLET_LABELS.hi,
    },
  },
  id: {
    title: "Checkout Stripe",
    subtitle: "Bayar dengan kartu melalui checkout aman yang dihosting Stripe.",
    summary: "Ringkasan isi ulang",
    checkoutHint: "Kamu akan diarahkan ke Stripe untuk menyelesaikan pembayaran.",
    continue: "Lanjut ke Stripe",
    back: "Kembali ke Isi Ulang",
    missingPackage: "Belum ada paket isi ulang yang dipilih.",
    coins: "Koin",
    bonus: "Bonus",
    total: "Total",
    providerTitle: STRIPE_PROVIDER_TITLES.id,
    methodLabel: "Metode terpilih",
    checkoutUrlMissing: "URL checkout Stripe tidak dikembalikan.",
    createCheckoutFailed: "Gagal membuat checkout Stripe.",
    loading: "Memuat...",
    methodMap: {
      card: "Kartu kredit / debit",
      wallet: STRIPE_WALLET_LABELS.id,
    },
  },
  ko: {
    title: "Stripe 결제",
    subtitle: "Stripe의 안전한 호스팅 결제 페이지에서 카드로 결제하세요.",
    summary: "충전 요약",
    checkoutHint: "결제 완료를 위해 Stripe로 이동합니다.",
    continue: "Stripe로 계속",
    back: "충전 페이지로 돌아가기",
    missingPackage: "선택한 충전 패키지가 없습니다.",
    coins: "코인",
    bonus: "보너스",
    total: "합계",
    providerTitle: STRIPE_PROVIDER_TITLES.ko,
    methodLabel: "선택한 결제수단",
    checkoutUrlMissing: "Stripe 체크아웃 URL이 반환되지 않았습니다.",
    createCheckoutFailed: "Stripe 체크아웃을 생성하지 못했습니다.",
    loading: "로딩 중...",
    methodMap: {
      card: "신용 / 체크카드",
      wallet: STRIPE_WALLET_LABELS.ko,
    },
  },
  fr: {
    title: "Checkout Stripe",
    subtitle: "Payez par carte via le checkout sécurisé hébergé par Stripe.",
    summary: "Récapitulatif de recharge",
    checkoutHint: "Vous serez redirigé vers Stripe pour finaliser le paiement.",
    continue: "Continuer vers Stripe",
    back: "Retour à la recharge",
    missingPackage: "Aucun forfait de recharge sélectionné.",
    coins: "Pièces",
    bonus: "Bonus",
    total: "Total",
    providerTitle: STRIPE_PROVIDER_TITLES.fr,
    methodLabel: "Méthode choisie",
    checkoutUrlMissing: "L’URL de checkout Stripe n’a pas été renvoyée.",
    createCheckoutFailed: "Impossible de créer le checkout Stripe.",
    loading: "Chargement...",
    methodMap: {
      card: "Carte bancaire",
      wallet: STRIPE_WALLET_LABELS.fr,
    },
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
  const getRuntimeErrorMessage = (error: unknown, fallback: string) => {
    if (locale === "en" && error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const packageId = searchParams.get("packageId") || "";
  const coins = Number(searchParams.get("coins") || 0);
  const bonus = Number(searchParams.get("bonus") || 0);
  const price = Number(searchParams.get("price") || 0);
  const paymentOption = searchParams.get("paymentOption") || "card";

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
      const res = await coinsApi.createOrder(token, packageId, "stripe", paymentOption);
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      toast(t.checkoutUrlMissing, "error");
    } catch (error: unknown) {
      toast(getRuntimeErrorMessage(error, t.createCheckoutFailed), "error");
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
                {t.methodMap[paymentOption] || t.methodMap.card}
              </div>
              <p className="mt-5 text-sm leading-6 text-gray-300">{t.checkoutHint}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-100/70">{t.methodLabel}</p>
                <p className="mt-2 text-sm font-semibold text-white">{t.methodMap[paymentOption] || t.methodMap.card}</p>
              </div>
              <button
                onClick={handleContinue}
                disabled={!token || !packageId || submitting}
                className="mt-8 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t.loading : t.continue}
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
