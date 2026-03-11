"use client";
export const dynamic = 'force-dynamic';

import { useCallback, useState, useEffect} from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

interface CoinPackage {
  id?: string;
  _id: string;
  coins: number;
  price: number;
  bonus: number;
  tag: string | null;
  originalPrice: number | null;
}

interface PricingContext {
  tier: 1 | 2 | 3;
  countryCode: string;
  currencyCode: string;
}

type PaymentMethod = "stripe" | "paypal" | "apple_pay";

type CoinsCopy = {
  title: string;
  subtitle: string;
  currentBalance: string;
  coinsUnit: string;
  transactionHistory: string;
  selectPackage: string;
  tagPopular: string;
  tagBestValue: string;
  bonus: string;
  notes: string[];
  orderSummary: string;
  selectedCoins: (coins: number) => string;
  bonusCoins: string;
  total: string;
  selectPackageHint: string;
  paymentMethod: string;
  paymentMethodLabels: Record<PaymentMethod, string>;
  paySecurely: string;
  haveRedeemCode: string;
  enterCode: string;
  redeem: string;
  securedBy: string;
  toasts: {
    checkoutFailed: string;
    paymentFailed: string;
    redeemSuccess: (coins: number) => string;
    invalidCode: string;
    genericError: string;
  };
};

const COPY: Record<SupportedLocale, CoinsCopy> = {
  en: {
    title: "Gold Recharge",
    subtitle: "Purchase gold coins to unlock premium episodes and exclusive content",
    currentBalance: "Current Balance",
    coinsUnit: "coins",
    transactionHistory: "Transaction History",
    selectPackage: "Select a Package",
    tagPopular: "Most Popular",
    tagBestValue: "Best Value",
    bonus: "Bonus",
    notes: [
      "Coins are non-refundable once purchased.",
      "Bonus coins are valid for 30 days from the date of purchase.",
      "Prices use USD as the base. Stripe Checkout may show local currency based on your location.",
    ],
    orderSummary: "Order Summary",
    selectedCoins: (coins) => `${coins.toLocaleString()} Coins`,
    bonusCoins: "Bonus Coins",
    total: "Total",
    selectPackageHint: "Select a package to continue",
    paymentMethod: "Payment Method",
    paymentMethodLabels: {
      stripe: "Credit / Debit Card",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "Pay Securely",
    haveRedeemCode: "Have a redeem code?",
    enterCode: "Enter code",
    redeem: "Redeem",
    securedBy: "Secured by 256-bit SSL encryption",
    toasts: {
      checkoutFailed: "Failed to create checkout session",
      paymentFailed: "Payment failed",
      redeemSuccess: (coins) => `Redeemed ${coins} coins!`,
      invalidCode: "Invalid or expired code",
      genericError: "An error occurred" } },
  zh: {
    title: "金币充值",
    subtitle: "购买金币以解锁付费剧集与专属内容",
    currentBalance: "当前余额",
    coinsUnit: "金币",
    transactionHistory: "交易记录",
    selectPackage: "选择套餐",
    tagPopular: "最受欢迎",
    tagBestValue: "超值推荐",
    bonus: "赠送",
    notes: [
      "金币购买后不支持退款。",
      "赠送金币自购买之日起 30 天内有效。",
      "价格以 USD 为基准，Stripe 结账时可能根据地区显示本地货币。",
    ],
    orderSummary: "订单摘要",
    selectedCoins: (coins) => `${coins.toLocaleString()} 金币`,
    bonusCoins: "赠送金币",
    total: "合计",
    selectPackageHint: "请选择一个套餐继续",
    paymentMethod: "支付方式",
    paymentMethodLabels: {
      stripe: "信用卡 / 借记卡",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "安全支付",
    haveRedeemCode: "有兑换码？",
    enterCode: "输入兑换码",
    redeem: "兑换",
    securedBy: "由 256-bit SSL 加密保护",
    toasts: {
      checkoutFailed: "创建结账会话失败",
      paymentFailed: "支付失败",
      redeemSuccess: (coins) => `成功兑换 ${coins} 金币！`,
      invalidCode: "兑换码无效或已过期",
      genericError: "发生错误" } },
  ja: {
    title: "コインチャージ",
    subtitle: "コインを購入してプレミアム話数と限定コンテンツを解放",
    currentBalance: "現在の残高",
    coinsUnit: "コイン",
    transactionHistory: "取引履歴",
    selectPackage: "パッケージを選択",
    tagPopular: "人気No.1",
    tagBestValue: "最もお得",
    bonus: "ボーナス",
    notes: [
      "購入したコインは返金できません。",
      "ボーナスコインは購入日から30日間有効です。",
      "価格はUSD基準です。Stripeチェックアウトでは地域に応じて現地通貨表示になる場合があります。",
    ],
    orderSummary: "注文概要",
    selectedCoins: (coins) => `${coins.toLocaleString()} コイン`,
    bonusCoins: "ボーナスコイン",
    total: "合計",
    selectPackageHint: "続行するにはパッケージを選択してください",
    paymentMethod: "支払い方法",
    paymentMethodLabels: {
      stripe: "クレジット / デビットカード",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "安全に支払う",
    haveRedeemCode: "引き換えコードをお持ちですか？",
    enterCode: "コードを入力",
    redeem: "引き換え",
    securedBy: "256-bit SSL 暗号化で保護",
    toasts: {
      checkoutFailed: "チェックアウトセッションの作成に失敗しました",
      paymentFailed: "支払いに失敗しました",
      redeemSuccess: (coins) => `${coins} コインを引き換えました！`,
      invalidCode: "無効または期限切れのコードです",
      genericError: "エラーが発生しました" } },
  es: {
    title: "Recarga de monedas",
    subtitle: "Compra monedas para desbloquear episodios premium y contenido exclusivo",
    currentBalance: "Saldo actual",
    coinsUnit: "monedas",
    transactionHistory: "Historial de transacciones",
    selectPackage: "Selecciona un paquete",
    tagPopular: "Más popular",
    tagBestValue: "Mejor valor",
    bonus: "Bono",
    notes: [
      "Las monedas no son reembolsables una vez compradas.",
      "Las monedas de bono son válidas por 30 días desde la compra.",
      "Los precios usan USD como base. Stripe Checkout puede mostrar moneda local según tu ubicación.",
    ],
    orderSummary: "Resumen del pedido",
    selectedCoins: (coins) => `${coins.toLocaleString()} monedas`,
    bonusCoins: "Monedas de bono",
    total: "Total",
    selectPackageHint: "Selecciona un paquete para continuar",
    paymentMethod: "Método de pago",
    paymentMethodLabels: {
      stripe: "Tarjeta de crédito / débito",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "Pagar de forma segura",
    haveRedeemCode: "¿Tienes un código?",
    enterCode: "Ingresa el código",
    redeem: "Canjear",
    securedBy: "Protegido con cifrado SSL de 256 bits",
    toasts: {
      checkoutFailed: "No se pudo crear la sesión de pago",
      paymentFailed: "Pago fallido",
      redeemSuccess: (coins) => `¡Canjeaste ${coins} monedas!`,
      invalidCode: "Código inválido o vencido",
      genericError: "Ocurrió un error" } },
  pt: {
    title: "Recarga de moedas",
    subtitle: "Compre moedas para desbloquear episódios premium e conteúdo exclusivo",
    currentBalance: "Saldo atual",
    coinsUnit: "moedas",
    transactionHistory: "Histórico de transações",
    selectPackage: "Selecione um pacote",
    tagPopular: "Mais popular",
    tagBestValue: "Melhor custo-benefício",
    bonus: "Bônus",
    notes: [
      "As moedas não são reembolsáveis após a compra.",
      "As moedas bônus são válidas por 30 dias a partir da compra.",
      "Os preços usam USD como base. O Stripe Checkout pode mostrar moeda local conforme sua região.",
    ],
    orderSummary: "Resumo do pedido",
    selectedCoins: (coins) => `${coins.toLocaleString()} moedas`,
    bonusCoins: "Moedas bônus",
    total: "Total",
    selectPackageHint: "Selecione um pacote para continuar",
    paymentMethod: "Método de pagamento",
    paymentMethodLabels: {
      stripe: "Cartão de crédito / débito",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "Pagar com segurança",
    haveRedeemCode: "Tem um código de resgate?",
    enterCode: "Digite o código",
    redeem: "Resgatar",
    securedBy: "Protegido por criptografia SSL de 256 bits",
    toasts: {
      checkoutFailed: "Falha ao criar sessão de checkout",
      paymentFailed: "Falha no pagamento",
      redeemSuccess: (coins) => `${coins} moedas resgatadas!`,
      invalidCode: "Código inválido ou expirado",
      genericError: "Ocorreu um erro" } },
  hi: {
    title: "कॉइन रिचार्ज",
    subtitle: "प्रीमियम एपिसोड और एक्सक्लूसिव कंटेंट अनलॉक करने के लिए कॉइन खरीदें",
    currentBalance: "वर्तमान बैलेंस",
    coinsUnit: "कॉइन्स",
    transactionHistory: "ट्रांजैक्शन हिस्ट्री",
    selectPackage: "पैकेज चुनें",
    tagPopular: "सबसे लोकप्रिय",
    tagBestValue: "सबसे बेहतर मूल्य",
    bonus: "बोनस",
    notes: [
      "एक बार खरीदे गए कॉइन्स रिफंड नहीं होते।",
      "बोनस कॉइन्स खरीद की तारीख से 30 दिन तक मान्य हैं।",
      "कीमतें USD को आधार मानती हैं। Stripe Checkout आपके क्षेत्र के अनुसार स्थानीय मुद्रा दिखा सकता है।",
    ],
    orderSummary: "ऑर्डर सारांश",
    selectedCoins: (coins) => `${coins.toLocaleString()} कॉइन्स`,
    bonusCoins: "बोनस कॉइन्स",
    total: "कुल",
    selectPackageHint: "जारी रखने के लिए पैकेज चुनें",
    paymentMethod: "भुगतान विधि",
    paymentMethodLabels: {
      stripe: "क्रेडिट / डेबिट कार्ड",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "सुरक्षित भुगतान",
    haveRedeemCode: "क्या आपके पास रिडीम कोड है?",
    enterCode: "कोड दर्ज करें",
    redeem: "रिडीम करें",
    securedBy: "256-bit SSL एन्क्रिप्शन द्वारा सुरक्षित",
    toasts: {
      checkoutFailed: "चेकआउट सत्र बनाना विफल रहा",
      paymentFailed: "भुगतान विफल",
      redeemSuccess: (coins) => `${coins} कॉइन्स सफलतापूर्वक रिडीम हुए!`,
      invalidCode: "अमान्य या समाप्त कोड",
      genericError: "एक त्रुटि हुई" } },
  id: {
    title: "Isi ulang koin",
    subtitle: "Beli koin untuk membuka episode premium dan konten eksklusif",
    currentBalance: "Saldo saat ini",
    coinsUnit: "koin",
    transactionHistory: "Riwayat transaksi",
    selectPackage: "Pilih paket",
    tagPopular: "Paling populer",
    tagBestValue: "Paling hemat",
    bonus: "Bonus",
    notes: [
      "Koin tidak dapat dikembalikan setelah dibeli.",
      "Koin bonus berlaku 30 hari sejak tanggal pembelian.",
      "Harga menggunakan USD sebagai dasar. Stripe Checkout dapat menampilkan mata uang lokal sesuai wilayahmu.",
    ],
    orderSummary: "Ringkasan pesanan",
    selectedCoins: (coins) => `${coins.toLocaleString()} koin`,
    bonusCoins: "Koin bonus",
    total: "Total",
    selectPackageHint: "Pilih paket untuk melanjutkan",
    paymentMethod: "Metode pembayaran",
    paymentMethodLabels: {
      stripe: "Kartu kredit / debit",
      paypal: "PayPal",
      apple_pay: "Apple Pay" },
    paySecurely: "Bayar dengan aman",
    haveRedeemCode: "Punya kode redeem?",
    enterCode: "Masukkan kode",
    redeem: "Redeem",
    securedBy: "Diamankan dengan enkripsi SSL 256-bit",
    toasts: {
      checkoutFailed: "Gagal membuat sesi checkout",
      paymentFailed: "Pembayaran gagal",
      redeemSuccess: (coins) => `Berhasil redeem ${coins} koin!`,
      invalidCode: "Kode tidak valid atau kedaluwarsa",
      genericError: "Terjadi kesalahan" } } };

const CHECKOUT_CONTEXT_COPY: Record<SupportedLocale, (countryCode: string, currencyCode: string) => string> = {
  en: (countryCode, currencyCode) => `Checkout region: ${countryCode}, settlement display currency may be ${currencyCode}.`,
  zh: (countryCode, currencyCode) => `结账地区：${countryCode}，最终展示货币可能为 ${currencyCode}。`,
  ja: (countryCode, currencyCode) => `チェックアウト地域: ${countryCode}、表示通貨は ${currencyCode} になる可能性があります。`,
  es: (countryCode, currencyCode) => `Región de checkout: ${countryCode}. La moneda mostrada puede ser ${currencyCode}.`,
  pt: (countryCode, currencyCode) => `Região do checkout: ${countryCode}. A moeda exibida pode ser ${currencyCode}.`,
  hi: (countryCode, currencyCode) => `चेकआउट क्षेत्र: ${countryCode}। अंतिम प्रदर्शित मुद्रा ${currencyCode} हो सकती है।`,
  id: (countryCode, currencyCode) => `Wilayah checkout: ${countryCode}. Mata uang yang ditampilkan bisa ${currencyCode}.`,
};

export default function CoinsPage() {
  const locale = useLocale();
  const t = COPY[locale] || COPY.en;
  const checkoutContextHint = CHECKOUT_CONTEXT_COPY[locale] || CHECKOUT_CONTEXT_COPY.en;
  const localeTag = ({
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    pt: "pt-BR",
    hi: "hi-IN",
    id: "id-ID",
  } as const)[locale] || "en-US";
  const formatUsd = useCallback(
    (value: number) =>
      new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0)),
    [localeTag]
  );

  const { user, token, refreshUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [pricingContext, setPricingContext] = useState<PricingContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [redeemCode, setRedeemCode] = useState("");
  const [showRedeem, setShowRedeem] = useState(false);
  const [balance, setBalance] = useState(0);
  const [silverBalance, setSilverBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    setSilverBalance(user.silverCoins || 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await coinsApi.getPackages() as { data?: CoinPackage[]; pricingContext?: PricingContext };
        const pkgs = (res.data || [])
          .map((item) => ({ ...item, _id: String(item._id || item.id || "") }))
          .filter((item) => item._id);
        setPackages(pkgs);
        setPricingContext(res.pricingContext || null);
        if (pkgs.length > 0) setSelectedPkg(pkgs[1]?._id || pkgs[0]._id);
      } catch {
        setPricingContext(null);
        setPackages([
          { _id: "p1", coins: 100, price: 0.99, bonus: 0, tag: null, originalPrice: null },
          { _id: "p2", coins: 550, price: 4.99, bonus: 50, tag: "Popular", originalPrice: 5.99 },
          { _id: "p3", coins: 1200, price: 9.99, bonus: 200, tag: null, originalPrice: 12.99 },
          { _id: "p4", coins: 2500, price: 19.99, bonus: 500, tag: "Best Value", originalPrice: 24.99 },
          { _id: "p5", coins: 5500, price: 49.99, bonus: 1000, tag: null, originalPrice: 59.99 },
          { _id: "p6", coins: 12000, price: 99.99, bonus: 3000, tag: null, originalPrice: 129.99 },
        ]);
        setSelectedPkg("p2");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const selected = packages.find((p) => p._id === selectedPkg);

  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!selected || !token) return;
    setPaying(true);
    try {
      const res = await coinsApi.createOrder(token, selected._id, paymentMethod);
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast(t.toasts.checkoutFailed, "error");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.toasts.paymentFailed;
      toast(message, "error");
    } finally {
      setPaying(false);
    }
  };

  const handleRedeem = async () => {
    if (!token || !redeemCode.trim()) return;
    try {
      const res = await coinsApi.redeem(token, redeemCode.trim());
      const d = res.data;
      toast(d.message || t.toasts.redeemSuccess(d.coins), "success");
      setRedeemCode("");
      setShowRedeem(false);
      await refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.toasts.genericError;
      toast(message || t.toasts.invalidCode, "error");
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-[length:200%_auto] animate-shine bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)]">{t.title}</span>
          </h1>
          <p className="text-gray-400 mt-2">{t.subtitle}</p>
        </div>

        <div className="relative mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 border border-yellow-500/20 p-6 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.1),transparent_70%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/70 mb-1">{t.currentBalance}</p>
              <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                <span className="text-4xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-shine bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)]">{balance.toLocaleString()}</span>
                <span className="text-yellow-300/60 text-lg">{t.coinsUnit}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <svg className="h-6 w-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="url(#silverGrad)" />
                  <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">S</text>
                  <defs>
                    <linearGradient id="silverGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f1f5f9" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-lg font-semibold text-gray-100">{silverBalance.toLocaleString()}</span>
                <span className="text-sm text-gray-400">Silver Coins</span>
              </div>
            </div>
            <Link href={localizePath("/user/purchases", locale)} className="flex items-center gap-2 text-sm text-yellow-300/70 hover:text-yellow-200 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t.transactionHistory}
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-5">{t.selectPackage}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPkg === pkg._id;
                const tagText = pkg.tag === "Popular" ? t.tagPopular : pkg.tag === "Best Value" ? t.tagBestValue : pkg.tag;
                return (
                  <button
                    key={pkg._id}
                    onClick={() => setSelectedPkg(pkg._id)}
                    aria-pressed={isSelected}
                    className={`relative rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                      isSelected
                        ? "bg-gradient-to-b from-yellow-900/30 to-yellow-950/20 border-2 border-yellow-500/60 shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                        : "bg-zinc-900/60 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {pkg.tag && (
                      <span className={`absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        pkg.tag === "Popular" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                      }`}>{tagText}</span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-7 h-7 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad2)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                      <span className={`text-2xl font-bold ${isSelected ? "text-yellow-300" : "text-white"}`}>{pkg.coins.toLocaleString()}</span>
                    </div>
                    {pkg.bonus > 0 && (
                      <p className="text-xs text-red-400 font-medium mb-2">+{pkg.bonus.toLocaleString()} {t.bonus}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{formatUsd(pkg.price)}</span>
                      {pkg.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">{formatUsd(pkg.originalPrice)}</span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 left-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 p-5 bg-zinc-900/40 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <div className="text-sm text-gray-400 space-y-1">
                  {t.notes.map((note) => <p key={note}>{note}</p>)}
                  {pricingContext && (
                    <p>
                      {checkoutContextHint(pricingContext.countryCode, pricingContext.currencyCode)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-5">
              <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 relative shadow-[inset_0_1px_0_rgba(255,215,0,0.15)]">
                <h3 className="text-lg font-semibold mb-5">{t.orderSummary}</h3>
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad3)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                        <span className="text-sm">{t.selectedCoins(selected.coins)}</span>
                      </div>
                      <span className="text-sm font-medium">{formatUsd(selected.price)}</span>
                    </div>
                    {selected.bonus > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">{t.bonusCoins}</span>
                        <span className="text-green-400">+{selected.bonus.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="font-semibold">{t.total}</span>
                      <span className="text-xl font-bold text-yellow-400">{formatUsd(selected.price)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t.selectPackageHint}</p>
                )}
              </div>

              <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-semibold mb-4 text-gray-300">{t.paymentMethod}</h3>
                <div className="space-y-2.5">
                  {([
                    ["stripe", t.paymentMethodLabels.stripe, <svg key="s" className="w-6 h-6" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M1 10h22" stroke="currentColor" strokeWidth="1.5" /><path d="M5 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>],
                    ["paypal", t.paymentMethodLabels.paypal, <svg key="pp" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" opacity="0.7" /></svg>],
                    ["apple_pay", t.paymentMethodLabels.apple_pay, <svg key="ap" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>],
                  ] as [PaymentMethod, string, React.ReactNode][]).map(([id, label, icon]) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      aria-pressed={paymentMethod === id}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition ${
                        paymentMethod === id
                          ? "border-yellow-500/60 bg-yellow-500/10"
                          : "border-white/10 bg-zinc-800/50 hover:border-white/20"
                      }`}
                    >
                      <span className={paymentMethod === id ? "text-yellow-400" : "text-gray-400"}>{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === id ? "border-yellow-500" : "border-gray-600"}`}>
                        {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={!selected || paying}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
              >
                {paying ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    {t.paySecurely} {selected ? formatUsd(selected.price) : ""}
                  </>
                )}
              </button>

              <div className="text-center">
                <button onClick={() => setShowRedeem(!showRedeem)} className="text-sm text-yellow-400/70 hover:text-yellow-300 transition inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  {t.haveRedeemCode}
                </button>
                {showRedeem && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder={t.enterCode}
                      aria-label={t.enterCode}
                      className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <button onClick={handleRedeem} disabled={!redeemCode.trim()} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition disabled:opacity-50">{t.redeem}</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                {t.securedBy}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
