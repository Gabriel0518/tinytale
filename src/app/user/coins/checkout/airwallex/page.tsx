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
  loading: string;
  methodMap: Record<string, string>;
};

const AIRWALLEX_PROVIDER_TITLES: FlexibleRecord<SupportedLocale, string> = {
  en: "Powered by Airwallex",
  zh: "由 Airwallex 提供支持",
  ja: "Airwallex 提供",
  es: "Con tecnología de Airwallex",
  pt: "Tecnologia Airwallex",
  hi: "Airwallex द्वारा संचालित",
  id: "Didukung oleh Airwallex",
  ko: "Airwallex 제공",
  fr: "Propulsé par Airwallex",
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
    providerTitle: AIRWALLEX_PROVIDER_TITLES.en,
    checkoutHint: "A hosted Airwallex payment page will open in the next step.",
    httpsWarning: "Airwallex hosted checkout requires an HTTPS success URL. Please set AIRWALLEX_SUCCESS_URL or FRONTEND_URL to an HTTPS page before testing this flow.",
    methodLabel: "Chosen Method",
    sdkLoading: "Airwallex checkout is still loading. Please try again in a moment.",
    sdkFailed: "Failed to load Airwallex checkout SDK. Please refresh and try again.",
    checkoutDataIncomplete: "Airwallex checkout session data is incomplete.",
    checkoutCreateFailed: "Failed to create Airwallex checkout.",
    loading: "Loading...",
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
    providerTitle: AIRWALLEX_PROVIDER_TITLES.zh,
    checkoutHint: "下一步会跳转到 Airwallex 托管支付页完成支付。",
    httpsWarning: "Airwallex 托管收银台要求成功回跳地址必须为 HTTPS。测试前请先把 AIRWALLEX_SUCCESS_URL 或 FRONTEND_URL 配置成 HTTPS 页面。",
    methodLabel: "已选方式",
    sdkLoading: "Airwallex 收银台仍在加载，请稍后再试。",
    sdkFailed: "Airwallex 收银台 SDK 加载失败，请刷新页面后重试。",
    checkoutDataIncomplete: "Airwallex 收银台会话数据不完整。",
    checkoutCreateFailed: "创建 Airwallex 收银台失败。",
    loading: "加载中...",
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
  ja: {
    title: "Airwallex チェックアウト",
    subtitle: "まずはテスト環境の Airwallex Hosted Payment Page をご利用ください。",
    summary: "チャージ概要",
    continue: "Airwallex に進む",
    back: "チャージページへ戻る",
    missingPackage: "チャージパッケージが選択されていません。",
    coins: "コイン",
    bonus: "ボーナス",
    total: "合計",
    providerTitle: AIRWALLEX_PROVIDER_TITLES.ja,
    checkoutHint: "次のステップで Airwallex のホスト型決済ページが開きます。",
    httpsWarning: "Airwallex のホスト型チェックアウトでは HTTPS の成功 URL が必要です。テスト前に AIRWALLEX_SUCCESS_URL または FRONTEND_URL を HTTPS ページに設定してください。",
    methodLabel: "選択中の方法",
    sdkLoading: "Airwallex チェックアウトを読み込み中です。しばらくしてからお試しください。",
    sdkFailed: "Airwallex チェックアウト SDK の読み込みに失敗しました。ページを更新して再試行してください。",
    checkoutDataIncomplete: "Airwallex チェックアウトのセッション情報が不足しています。",
    checkoutCreateFailed: "Airwallex チェックアウトの作成に失敗しました。",
    loading: "読み込み中...",
    methodMap: {
      card: "グローバルカード",
      cards: "グローバルカード",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX オンラインバンキング",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "現地銀行振込",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "コンビニ決済",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / 銀行リダイレクト",
      local: "ローカル決済方法",
    },
  },
  es: {
    title: "Checkout de Airwallex",
    subtitle: "Primero usa la Hosted Payment Page de Airwallex en el entorno de prueba.",
    summary: "Resumen de recarga",
    continue: "Continuar con Airwallex",
    back: "Volver a Recargas",
    missingPackage: "No se seleccionó ningún paquete de recarga.",
    coins: "Monedas",
    bonus: "Bonificación",
    total: "Total",
    providerTitle: AIRWALLEX_PROVIDER_TITLES.es,
    checkoutHint: "En el siguiente paso se abrirá una página de pago alojada por Airwallex.",
    httpsWarning: "El checkout alojado de Airwallex requiere una URL de éxito en HTTPS. Configura AIRWALLEX_SUCCESS_URL o FRONTEND_URL con una página HTTPS antes de probar este flujo.",
    methodLabel: "Método elegido",
    sdkLoading: "El checkout de Airwallex aún se está cargando. Inténtalo de nuevo en un momento.",
    sdkFailed: "No se pudo cargar el SDK de checkout de Airwallex. Recarga la página e inténtalo de nuevo.",
    checkoutDataIncomplete: "Los datos de la sesión de checkout de Airwallex están incompletos.",
    checkoutCreateFailed: "No se pudo crear el checkout de Airwallex.",
    loading: "Cargando...",
    methodMap: {
      card: "Tarjetas globales",
      cards: "Tarjetas globales",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX banca en línea",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "Transferencia bancaria local",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / Redirección bancaria",
      local: "Métodos de pago locales",
    },
  },
  pt: {
    title: "Checkout Airwallex",
    subtitle: "Primeiro use a Hosted Payment Page da Airwallex no ambiente de teste.",
    summary: "Resumo da recarga",
    continue: "Continuar para Airwallex",
    back: "Voltar para Recarga",
    missingPackage: "Nenhum pacote de recarga foi selecionado.",
    coins: "Moedas",
    bonus: "Bônus",
    total: "Total",
    providerTitle: AIRWALLEX_PROVIDER_TITLES.pt,
    checkoutHint: "Na próxima etapa, uma página de pagamento hospedada pela Airwallex será aberta.",
    httpsWarning: "O checkout hospedado da Airwallex exige uma URL de sucesso em HTTPS. Defina AIRWALLEX_SUCCESS_URL ou FRONTEND_URL como uma página HTTPS antes de testar este fluxo.",
    methodLabel: "Método escolhido",
    sdkLoading: "O checkout da Airwallex ainda está carregando. Tente novamente em instantes.",
    sdkFailed: "Falha ao carregar o SDK de checkout da Airwallex. Atualize a página e tente de novo.",
    checkoutDataIncomplete: "Os dados da sessão de checkout da Airwallex estão incompletos.",
    checkoutCreateFailed: "Falha ao criar o checkout da Airwallex.",
    loading: "Carregando...",
    methodMap: {
      card: "Cartões globais",
      cards: "Cartões globais",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX Internet Banking",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "Transferência bancária local",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / Redirecionamento bancário",
      local: "Métodos de pagamento locais",
    },
  },
  hi: {
    title: "Airwallex चेकआउट",
    subtitle: "पहले टेस्ट वातावरण में Airwallex Hosted Payment Page का उपयोग करें।",
    summary: "रिचार्ज सारांश",
    continue: "Airwallex पर जाएं",
    back: "रिचार्ज पर वापस जाएं",
    missingPackage: "कोई रिचार्ज पैकेज चयनित नहीं है।",
    coins: "कॉइन",
    bonus: "बोनस",
    total: "कुल",
    providerTitle: AIRWALLEX_PROVIDER_TITLES.hi,
    checkoutHint: "अगले चरण में Airwallex की होस्टेड भुगतान पेज खुलेगी।",
    httpsWarning: "Airwallex hosted checkout के लिए HTTPS success URL आवश्यक है। इस फ्लो को टेस्ट करने से पहले AIRWALLEX_SUCCESS_URL या FRONTEND_URL को HTTPS पेज पर सेट करें।",
    methodLabel: "चुना गया तरीका",
    sdkLoading: "Airwallex checkout अभी लोड हो रहा है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
    sdkFailed: "Airwallex checkout SDK लोड नहीं हो पाया। पेज रीफ्रेश करके फिर प्रयास करें।",
    checkoutDataIncomplete: "Airwallex checkout सत्र डेटा अधूरा है।",
    checkoutCreateFailed: "Airwallex checkout बनाने में विफल।",
    loading: "लोड हो रहा है...",
    methodMap: {
      card: "वैश्विक कार्ड",
      cards: "वैश्विक कार्ड",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX ऑनलाइन बैंकिंग",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "स्थानीय बैंक ट्रांसफर",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / बैंक रीडायरेक्ट",
      local: "स्थानीय भुगतान तरीके",
    },
  },
  id: {
    title: "Checkout Airwallex",
    subtitle: "Gunakan Hosted Payment Page Airwallex di lingkungan uji terlebih dahulu.",
    summary: "Ringkasan isi ulang",
    continue: "Lanjut ke Airwallex",
    back: "Kembali ke Isi Ulang",
    missingPackage: "Belum ada paket isi ulang yang dipilih.",
    coins: "Koin",
    bonus: "Bonus",
    total: "Total",
    providerTitle: AIRWALLEX_PROVIDER_TITLES.id,
    checkoutHint: "Pada langkah berikutnya, halaman pembayaran Airwallex yang dihosting akan dibuka.",
    httpsWarning: "Checkout terhosting Airwallex memerlukan URL sukses HTTPS. Atur AIRWALLEX_SUCCESS_URL atau FRONTEND_URL ke halaman HTTPS sebelum menguji alur ini.",
    methodLabel: "Metode terpilih",
    sdkLoading: "Checkout Airwallex masih dimuat. Coba lagi sebentar lagi.",
    sdkFailed: "Gagal memuat SDK checkout Airwallex. Muat ulang halaman lalu coba lagi.",
    checkoutDataIncomplete: "Data sesi checkout Airwallex tidak lengkap.",
    checkoutCreateFailed: "Gagal membuat checkout Airwallex.",
    loading: "Memuat...",
    methodMap: {
      card: "Kartu global",
      cards: "Kartu global",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX Perbankan Online",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "Transfer bank lokal",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / Pengalihan bank",
      local: "Metode pembayaran lokal",
    },
  },
  ko: {
    title: "Airwallex 결제",
    subtitle: "먼저 테스트 환경의 Airwallex Hosted Payment Page를 이용해 주세요.",
    summary: "충전 요약",
    continue: "Airwallex로 계속",
    back: "충전 페이지로 돌아가기",
    missingPackage: "선택한 충전 패키지가 없습니다.",
    coins: "코인",
    bonus: "보너스",
    total: "합계",
    providerTitle: "Airwallex 제공",
    checkoutHint: "다음 단계에서 Airwallex 호스팅 결제 페이지가 열립니다.",
    httpsWarning: "Airwallex 호스팅 체크아웃은 HTTPS 성공 URL이 필요합니다. 이 흐름을 테스트하기 전에 AIRWALLEX_SUCCESS_URL 또는 FRONTEND_URL을 HTTPS 페이지로 설정하세요.",
    methodLabel: "선택한 결제수단",
    sdkLoading: "Airwallex 결제를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
    sdkFailed: "Airwallex 결제 SDK를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    checkoutDataIncomplete: "Airwallex 결제 세션 데이터가 불완전합니다.",
    checkoutCreateFailed: "Airwallex 결제를 생성하지 못했습니다.",
    loading: "로딩 중...",
    methodMap: {
      card: "글로벌 카드",
      cards: "글로벌 카드",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX 온라인 뱅킹",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "현지 은행 송금",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "편의점 결제",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / 은행 리디렉션",
      local: "현지 결제수단",
    },
  },
  fr: {
    title: "Checkout Airwallex",
    subtitle: "Utilisez d'abord la Hosted Payment Page d’Airwallex dans l’environnement de test.",
    summary: "Récapitulatif de recharge",
    continue: "Continuer vers Airwallex",
    back: "Retour à la recharge",
    missingPackage: "Aucun forfait de recharge sélectionné.",
    coins: "Pièces",
    bonus: "Bonus",
    total: "Total",
    providerTitle: "Propulsé par Airwallex",
    checkoutHint: "Une page de paiement hébergée par Airwallex s’ouvrira à l’étape suivante.",
    httpsWarning: "Le checkout hébergé d’Airwallex nécessite une URL de succès en HTTPS. Configurez AIRWALLEX_SUCCESS_URL ou FRONTEND_URL vers une page HTTPS avant de tester ce flux.",
    methodLabel: "Méthode choisie",
    sdkLoading: "Le checkout Airwallex est encore en cours de chargement. Réessayez dans un instant.",
    sdkFailed: "Impossible de charger le SDK de checkout Airwallex. Actualisez la page et réessayez.",
    checkoutDataIncomplete: "Les données de session du checkout Airwallex sont incomplètes.",
    checkoutCreateFailed: "Impossible de créer le checkout Airwallex.",
    loading: "Chargement...",
    methodMap: {
      card: "Cartes globales",
      cards: "Cartes globales",
      paynow: "PayNow",
      grabpay: "GrabPay",
      fpx: "FPX banque en ligne",
      tng: "Touch 'n Go eWallet",
      qris: "QRIS",
      local_bank: "Virement bancaire local",
      promptpay: "PromptPay",
      truemoney: "TrueMoney",
      fps: "FPS",
      alipayhk: "AlipayHK",
      wechatpayhk: "WeChat Pay HK",
      konbini: "Konbini",
      ideal: "iDEAL",
      blik: "BLIK",
      sofort: "Sofort / Redirection bancaire",
      local: "Méthodes de paiement locales",
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
  const getRuntimeErrorMessage = (error: unknown, fallback: string) => {
    if (locale === "en" && error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };
  const [sdkFailed, setSdkFailed] = useState(false);
  const [showHttpsWarning, setShowHttpsWarning] = useState(false);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowHttpsWarning(window.location.protocol !== "https:");
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
        setShowHttpsWarning(true);
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
      toast(getRuntimeErrorMessage(error, t.checkoutCreateFailed), "error");
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
      <Navbar mobileTitle={t.title} />
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
              {showHttpsWarning && (
                <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                  {t.httpsWarning}
                </p>
              )}
              <button
                onClick={handleContinue}
                disabled={!token || !packageId || submitting}
                className="mt-8 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t.loading : t.continue}
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
