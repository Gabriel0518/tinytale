"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";

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

type PaymentProvider = "stripe" | "airwallex";
type PaymentOption = string;

type PaymentChannel = {
  provider: PaymentProvider;
  paymentOptions: PaymentOption[];
};

type PaymentOptionDefinition = {
  id: PaymentOption;
  label: string;
  description: string;
  pill: string;
};

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
  paymentChannel: string;
  providerTitle: string;
  providerLabels: Record<PaymentProvider, string>;
  selectedProvider: string;
  selectedMethod: string;
  noPaymentChannels: string;
  noPaymentMethods: string;
  continueToCheckout: string;
  haveRedeemCode: string;
  enterCode: string;
  redeem: string;
  securedBy: string;
  modalTitle: (provider: string) => string;
  modalSubtitle: string;
  modalNotice: string;
  availableInRegion: (countryCode: string) => string;
  chooseMethodHint: string;
  actions: {
    cancel: string;
    continue: string;
  };
  methodPills: {
    recommended: string;
    express: string;
    global: string;
    local: string;
    bank: string;
    wallet: string;
    instant: string;
  };
  paymentOptionCatalog: Record<string, { label: string; description: string }>;
  toasts: {
    selectPackageFirst: string;
    selectProviderFirst: string;
    selectPaymentMethod: string;
    paymentFailed: string;
    redeemSuccess: (coins: number) => string;
    invalidCode: string;
    genericError: string;
  };
};

const COPY: FlexibleRecord<SupportedLocale, CoinsCopy> = {
  en: {
    title: "Gold Recharge",
    subtitle: "Choose your package, then pick a payment channel and the checkout method available in your region.",
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
      "Final payment methods and currencies still depend on provider eligibility at checkout.",
    ],
    orderSummary: "Order Summary",
    selectedCoins: (coins) => `${coins.toLocaleString()} Coins`,
    bonusCoins: "Bonus Coins",
    total: "Total",
    selectPackageHint: "Select a package to continue",
    paymentChannel: "Payment Channel",
    providerTitle: "Choose a payment channel",
    providerLabels: {
      stripe: "Stripe",
      airwallex: "Airwallex",
    },
    selectedProvider: "Selected Channel",
    selectedMethod: "Selected Method",
    noPaymentChannels: "No payment channels are currently available for your region.",
    noPaymentMethods: "No payment methods are available for this channel right now.",
    continueToCheckout: "Continue to checkout",
    haveRedeemCode: "Have a redeem code?",
    enterCode: "Enter code",
    redeem: "Redeem",
    securedBy: "Secured by provider-hosted checkout and 256-bit SSL encryption",
    modalTitle: (provider) => `${provider} payment methods`,
    modalSubtitle: "Choose a payment method for your current region before we take you to the hosted checkout page.",
    modalNotice: "Provider-side availability can still change based on browser, device, risk checks, and merchant configuration.",
    availableInRegion: (countryCode) => `Available for your current region: ${countryCode}.`,
    chooseMethodHint: "Choose a payment method",
    actions: {
      cancel: "Cancel",
      continue: "Continue",
    },
    methodPills: {
      recommended: "Recommended",
      express: "Express",
      global: "Global",
      local: "Local",
      bank: "Bank",
      wallet: "Wallet",
      instant: "Instant",
    },
    paymentOptionCatalog: {
      card: {
        label: "Credit / Debit Card",
        description: "Visa, Mastercard, Amex, and other supported cards in hosted checkout.",
      },
      wallet: {
        label: "Apple Pay / Google Pay / Link",
        description: "Express wallet methods shown when your browser and device support them.",
      },
      paynow: {
        label: "PayNow",
        description: "Singapore instant bank transfer and QR payment option.",
      },
      grabpay: {
        label: "GrabPay",
        description: "Popular Southeast Asia wallet payment option.",
      },
      fpx: {
        label: "FPX Online Banking",
        description: "Malaysia online banking redirect method.",
      },
      tng: {
        label: "Touch 'n Go eWallet",
        description: "Malaysia wallet payment method.",
      },
      qris: {
        label: "QRIS",
        description: "Indonesia QR payment option.",
      },
      local_bank: {
        label: "Local Bank Transfer",
        description: "Local banking method displayed inside provider checkout.",
      },
      promptpay: {
        label: "PromptPay",
        description: "Thailand instant local payment method.",
      },
      truemoney: {
        label: "TrueMoney",
        description: "Thailand wallet payment option.",
      },
      fps: {
        label: "FPS",
        description: "Hong Kong Faster Payment System.",
      },
      alipayhk: {
        label: "AlipayHK",
        description: "Hong Kong local wallet option.",
      },
      wechatpayhk: {
        label: "WeChat Pay HK",
        description: "Hong Kong wallet option through WeChat Pay HK.",
      },
      konbini: {
        label: "Konbini",
        description: "Japan convenience store payment option.",
      },
      ideal: {
        label: "iDEAL",
        description: "Netherlands local bank payment method.",
      },
      blik: {
        label: "BLIK",
        description: "Poland code-based instant payment method.",
      },
      sofort: {
        label: "Sofort / Bank Redirect",
        description: "European online banking redirect method.",
      },
    },
    toasts: {
      selectPackageFirst: "Please select a recharge package first",
      selectProviderFirst: "Please choose a payment channel first",
      selectPaymentMethod: "Please choose a payment method first",
      paymentFailed: "Payment failed",
      redeemSuccess: (coins) => `Redeemed ${coins} coins!`,
      invalidCode: "Invalid or expired code",
      genericError: "An error occurred",
    },
  },
  zh: {
    title: "金币充值",
    subtitle: "先选择套餐，再选择支付渠道，最后按你当前地区支持的支付方式进入托管收银台完成支付。",
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
      "最终可用支付方式和展示币种仍以支付渠道结账页为准。",
    ],
    orderSummary: "订单摘要",
    selectedCoins: (coins) => `${coins.toLocaleString()} 金币`,
    bonusCoins: "赠送金币",
    total: "合计",
    selectPackageHint: "请选择一个套餐继续",
    paymentChannel: "支付渠道",
    providerTitle: "选择支付渠道",
    providerLabels: {
      stripe: "Stripe",
      airwallex: "Airwallex",
    },
    selectedProvider: "已选渠道",
    selectedMethod: "已选方式",
    noPaymentChannels: "当前地区暂时没有可用的支付渠道。",
    noPaymentMethods: "该支付渠道当前没有可用的支付方式。",
    continueToCheckout: "继续支付",
    haveRedeemCode: "有兑换码？",
    enterCode: "输入兑换码",
    redeem: "兑换",
    securedBy: "由支付渠道托管结账，并使用 256-bit SSL 加密保护",
    modalTitle: (provider) => `${provider} 支付方式`,
    modalSubtitle: "请根据你当前地区选择本次要使用的支付方式，我们会再带你进入对应的托管收银台。",
    modalNotice: "实际可用方式仍会受浏览器、设备、风控校验以及支付渠道配置影响。",
    availableInRegion: (countryCode) => `当前根据你的地区 ${countryCode} 提供以下支付方式。`,
    chooseMethodHint: "请选择支付方式",
    actions: {
      cancel: "取消",
      continue: "继续",
    },
    methodPills: {
      recommended: "推荐",
      express: "快捷",
      global: "全球",
      local: "本地",
      bank: "银行",
      wallet: "钱包",
      instant: "即时",
    },
    paymentOptionCatalog: {
      card: {
        label: "信用卡 / 借记卡",
        description: "在托管收银台中使用 Visa、Mastercard、Amex 等银行卡完成支付。",
      },
      wallet: {
        label: "Apple Pay / Google Pay / Link",
        description: "当你的浏览器和设备支持时，会展示快捷钱包支付方式。",
      },
      paynow: {
        label: "PayNow",
        description: "新加坡常用的即时银行转账与二维码支付方式。",
      },
      grabpay: {
        label: "GrabPay",
        description: "东南亚地区常见的钱包支付方式。",
      },
      fpx: {
        label: "FPX 网银支付",
        description: "马来西亚本地网银跳转支付方式。",
      },
      tng: {
        label: "Touch 'n Go 电子钱包",
        description: "马来西亚本地钱包支付方式。",
      },
      qris: {
        label: "QRIS",
        description: "印尼本地二维码支付方式。",
      },
      local_bank: {
        label: "本地银行转账",
        description: "由支付渠道在收银台中展示的本地银行支付方式。",
      },
      promptpay: {
        label: "PromptPay",
        description: "泰国本地即时支付方式。",
      },
      truemoney: {
        label: "TrueMoney",
        description: "泰国常见电子钱包支付方式。",
      },
      fps: {
        label: "FPS 转数快",
        description: "香港本地即时转账支付方式。",
      },
      alipayhk: {
        label: "AlipayHK",
        description: "香港地区常见钱包支付方式。",
      },
      wechatpayhk: {
        label: "WeChat Pay HK",
        description: "香港地区常见钱包支付方式。",
      },
      konbini: {
        label: "便利店支付",
        description: "日本本地便利店线下支付方式。",
      },
      ideal: {
        label: "iDEAL",
        description: "荷兰本地网银支付方式。",
      },
      blik: {
        label: "BLIK",
        description: "波兰本地即时码支付方式。",
      },
      sofort: {
        label: "Sofort / 银行跳转",
        description: "欧洲地区常见的网银跳转支付方式。",
      },
    },
    toasts: {
      selectPackageFirst: "请先选择充值套餐",
      selectProviderFirst: "请先选择支付渠道",
      selectPaymentMethod: "请先选择支付方式",
      paymentFailed: "支付失败",
      redeemSuccess: (coins) => `成功兑换 ${coins} 金币！`,
      invalidCode: "兑换码无效或已过期",
      genericError: "发生错误",
    },
  },
};

const CHECKOUT_CONTEXT_COPY: FlexibleRecord<SupportedLocale, (countryCode: string, currencyCode: string) => string> = {
  en: (countryCode, currencyCode) => `Checkout region: ${countryCode}, settlement display currency may be ${currencyCode}.`,
  zh: (countryCode, currencyCode) => `结账地区：${countryCode}，最终展示货币可能为 ${currencyCode}。`,
};

function StripeLogo() {
  return (
    <div className="flex h-16 w-44 items-center justify-center rounded-2xl bg-white px-4 shadow-[inset_0_0_0_1px_rgba(99,91,255,0.08)]">
      <Image
        src="/stripe-logo.svg"
        alt="Stripe"
        width={176}
        height={56}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  );
}

function AirwallexLogo() {
  return (
    <div className="flex h-16 w-44 items-center justify-center rounded-2xl bg-white px-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]">
      <Image
        src="/airwallex-logo.svg"
        alt="Airwallex"
        width={176}
        height={56}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  );
}

function CoinBadge() {
  return (
    <svg className="h-7 w-7 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="url(#coinGradSummary)" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text>
      <defs>
        <linearGradient id="coinGradSummary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function buildPaymentOption(
  copy: CoinsCopy,
  id: string,
  provider: PaymentProvider,
): PaymentOptionDefinition {
  const catalog = copy.paymentOptionCatalog[id];
  return {
    id,
    label: catalog.label,
    description: catalog.description,
    pill: getPaymentOptionPill(copy, provider, id),
  };
}

function getPaymentOptionPill(copy: CoinsCopy, provider: PaymentProvider, optionId: PaymentOption): string {
  if (provider === "stripe") {
    return optionId === "wallet" ? copy.methodPills.express : copy.methodPills.recommended;
  }

  switch (optionId) {
    case "card":
      return copy.methodPills.global;
    case "paynow":
    case "promptpay":
    case "fps":
    case "blik":
      return copy.methodPills.instant;
    case "grabpay":
    case "tng":
    case "truemoney":
    case "alipayhk":
    case "wechatpayhk":
      return copy.methodPills.wallet;
    case "fpx":
    case "ideal":
    case "sofort":
    case "local_bank":
      return copy.methodPills.bank;
    default:
      return copy.methodPills.local;
  }
}

function toPaymentOptionDefinitions(
  copy: CoinsCopy,
  provider: PaymentProvider,
  optionIds: PaymentOption[],
): PaymentOptionDefinition[] {
  return optionIds
    .filter((id) => Boolean(copy.paymentOptionCatalog[id]))
    .map((id) => buildPaymentOption(copy, id, provider));
}

const PROVIDER_CARD_META: Record<PaymentProvider, { logo: JSX.Element; border: string; glow: string }> = {
  stripe: {
    logo: <StripeLogo />,
    border: "border-[#635bff]/40",
    glow: "shadow-[0_0_32px_rgba(99,91,255,0.12)]",
  },
  airwallex: {
    logo: <AirwallexLogo />,
    border: "border-teal-400/35",
    glow: "shadow-[0_0_32px_rgba(45,212,191,0.12)]",
  },
};

export default function CoinsPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const checkoutContextHint = resolveLocaleCopy(CHECKOUT_CONTEXT_COPY, locale);
  const localeTag = ({
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

  const formatUsd = useCallback(
    (value: number) =>
      new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0)),
    [localeTag],
  );

  const { user, token, refreshUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [pricingContext, setPricingContext] = useState<PricingContext | null>(null);
  const [paymentChannels, setPaymentChannels] = useState<Partial<Record<PaymentProvider, PaymentChannel>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("stripe");
  const [providerSelections, setProviderSelections] = useState<Record<PaymentProvider, PaymentOption | null>>({
    stripe: null,
    airwallex: null,
  });
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [modalSelection, setModalSelection] = useState<PaymentOption | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [showRedeem, setShowRedeem] = useState(false);
  const [balance, setBalance] = useState(0);
  const [silverBalance, setSilverBalance] = useState(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    setSilverBalance(user.silverCoins || 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await coinsApi.getPackages() as {
          data?: CoinPackage[];
          pricingContext?: PricingContext;
          paymentChannels?: Partial<Record<PaymentProvider, PaymentChannel>>;
        };
        const pkgs = (res.data || [])
          .map((item) => ({ ...item, _id: String(item._id || item.id || "") }))
          .filter((item) => item._id);
        setPackages(pkgs);
        setPricingContext(res.pricingContext || null);
        setPaymentChannels(res.paymentChannels || {});
        if (pkgs.length > 0) setSelectedPkg(pkgs[1]?._id || pkgs[0]._id);
      } catch {
        setPricingContext(null);
        setPaymentChannels({
          stripe: { provider: "stripe", paymentOptions: ["card"] },
          airwallex: { provider: "airwallex", paymentOptions: ["card"] },
        });
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

  const selected = packages.find((pkg) => pkg._id === selectedPkg);
  const availableProviders = useMemo(
    () => (Object.keys(paymentChannels) as PaymentProvider[]).filter((provider) => {
      const channel = paymentChannels[provider];
      return Boolean(channel && channel.paymentOptions.length > 0);
    }),
    [paymentChannels],
  );
  const effectiveSelectedProvider = availableProviders.includes(selectedProvider)
    ? selectedProvider
    : availableProviders[0] || selectedProvider;
  const activeMethods = useMemo(
    () => toPaymentOptionDefinitions(t, effectiveSelectedProvider, paymentChannels[effectiveSelectedProvider]?.paymentOptions || []),
    [effectiveSelectedProvider, paymentChannels, t],
  );

  useEffect(() => {
    if (availableProviders.length === 0) return;
    if (!availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  useEffect(() => {
    setProviderSelections((current) => {
      const next = { ...current };
      (Object.keys(paymentChannels) as PaymentProvider[]).forEach((provider) => {
        const methods = toPaymentOptionDefinitions(t, provider, paymentChannels[provider]?.paymentOptions || []);
        const currentSelection = current[provider];
        if (!currentSelection || !methods.some((item) => item.id === currentSelection)) {
          next[provider] = methods[0]?.id || null;
        }
      });
      return next;
    });
  }, [paymentChannels, t]);

  const selectedMethodDefinition = useMemo(() => {
    const optionId = providerSelections[effectiveSelectedProvider];
    return activeMethods.find((item) => item.id === optionId) || null;
  }, [activeMethods, effectiveSelectedProvider, providerSelections]);

  const startCheckout = async (provider: PaymentProvider, paymentOption: PaymentOption) => {
    if (!selected || !token) return;
    setPaying(true);
    try {
      const query = new URLSearchParams({
        packageId: selected._id,
        coins: String(selected.coins),
        bonus: String(selected.bonus),
        price: String(selected.price),
        paymentOption,
      });
      window.location.href = localizePath(`/user/coins/checkout/${provider}?${query.toString()}`, locale);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : t.toasts.paymentFailed, "error");
    } finally {
      setPaying(false);
      setIsMethodModalOpen(false);
    }
  };

  const openMethodModal = () => {
    if (!selected) {
      toast(t.toasts.selectPackageFirst, "error");
      return;
    }
    if (!paymentChannels[effectiveSelectedProvider]) {
      toast(t.toasts.selectProviderFirst, "error");
      return;
    }
    const defaultMethod = providerSelections[effectiveSelectedProvider] || activeMethods[0]?.id || null;
    if (!defaultMethod) {
      toast(t.toasts.selectPaymentMethod, "error");
      return;
    }
    setModalSelection(defaultMethod);
    setIsMethodModalOpen(true);
  };

  const confirmMethodSelection = async () => {
    if (!modalSelection) {
      toast(t.toasts.selectPaymentMethod, "error");
      return;
    }
    setProviderSelections((current) => ({
      ...current,
      [effectiveSelectedProvider]: modalSelection,
    }));
    await startCheckout(effectiveSelectedProvider, modalSelection);
  };

  const selectedProviderLabel = paymentChannels[effectiveSelectedProvider]
    ? t.providerLabels[effectiveSelectedProvider]
    : t.noPaymentChannels;

  const handleRedeem = async () => {
    if (!token || !redeemCode.trim()) return;
    try {
      const res = await coinsApi.redeem(token, redeemCode.trim());
      const data = res.data;
      toast(data.message || t.toasts.redeemSuccess(data.coins), "success");
      setRedeemCode("");
      setShowRedeem(false);
      await refreshUser();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.toasts.genericError;
      toast(message || t.toasts.invalidCode, "error");
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            <span className="bg-[length:200%_auto] bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)] bg-clip-text text-transparent animate-shine">
              {t.title}
            </span>
          </h1>
          <p className="mt-2 text-gray-400">{t.subtitle}</p>
        </div>

        <div className="relative mb-12 overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 p-6 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.1),transparent_70%)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm text-yellow-200/70">{t.currentBalance}</p>
              <div className="flex items-center gap-3">
                <svg className="h-10 w-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" />
                  <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text>
                  <defs>
                    <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="bg-[length:200%_auto] bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)] bg-clip-text text-4xl font-bold text-transparent animate-shine">
                  {balance.toLocaleString()}
                </span>
                <span className="text-lg text-yellow-300/60">{t.coinsUnit}</span>
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

            <Link
              href={localizePath("/user/purchases", locale)}
              className="flex items-center gap-2 text-sm text-yellow-300/70 transition hover:text-yellow-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.transactionHistory}
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-5 text-xl font-semibold">{t.selectPackage}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => {
              const isSelected = selectedPkg === pkg._id;
              const tagText = pkg.tag === "Popular" ? t.tagPopular : pkg.tag === "Best Value" ? t.tagBestValue : pkg.tag;

              return (
                <button
                  key={pkg._id}
                  onClick={() => setSelectedPkg(pkg._id)}
                  aria-pressed={isSelected}
                  className={`relative rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                    isSelected
                      ? "border-2 border-yellow-500/70 bg-gradient-to-b from-yellow-900/30 to-yellow-950/20 shadow-[0_0_24px_rgba(255,215,0,0.14)]"
                      : "border border-white/10 bg-zinc-900/70 hover:border-white/20"
                  }`}
                >
                  {pkg.tag && (
                    <span className={`absolute -top-2.5 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      pkg.tag === "Popular" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                    }`}>
                      {tagText}
                    </span>
                  )}

                  {isSelected && (
                    <div className="absolute left-3 top-3">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-2">
                    <CoinBadge />
                    <span className={`text-2xl font-bold ${isSelected ? "text-yellow-300" : "text-white"}`}>
                      {pkg.coins.toLocaleString()}
                    </span>
                  </div>

                  {pkg.bonus > 0 && (
                    <p className="mb-2 text-xs font-medium text-red-400">+{pkg.bonus.toLocaleString()} {t.bonus}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{formatUsd(pkg.price)}</span>
                    {pkg.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">{formatUsd(pkg.originalPrice)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-6 shadow-[inset_0_1px_0_rgba(255,215,0,0.08)]">
            <h3 className="text-xl font-semibold">{t.orderSummary}</h3>
            {selected ? (
              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <CoinBadge />
                    <span className="text-sm text-gray-100">{t.selectedCoins(selected.coins)}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{formatUsd(selected.price)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400">{t.bonusCoins}</span>
                  <span className="font-medium text-green-400">+{selected.bonus.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-semibold text-white">{t.total}</span>
                  <span className="text-3xl font-bold text-yellow-400">{formatUsd(selected.price)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-gray-500">{t.selectPackageHint}</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t.providerTitle}</h3>
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-400">
                {t.selectedProvider}: <span className="font-semibold text-white">{selectedProviderLabel}</span>
                {selectedMethodDefinition && (
                  <>
                    {" · "}
                    {t.selectedMethod}: <span className="font-semibold text-white">{selectedMethodDefinition.label}</span>
                  </>
                )}
              </div>
            </div>

            {availableProviders.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {availableProviders.map((providerId) => {
                const provider = PROVIDER_CARD_META[providerId];
                const isActive = effectiveSelectedProvider === providerId;
                return (
                  <button
                    key={providerId}
                    onClick={() => setSelectedProvider(providerId)}
                    aria-pressed={isActive}
                    className={`flex min-h-[152px] items-center justify-center rounded-3xl border bg-black/30 text-white transition hover:-translate-y-1 hover:border-white/20 ${
                      isActive ? `${provider.border} ${provider.glow}` : "border-white/10"
                    }`}
                  >
                    <div className="relative">
                      {provider.logo}
                      {isActive && (
                        <span className="absolute -right-3 -top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-black">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 10.5 18l9-13.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center text-sm text-gray-400">
                {t.noPaymentChannels}
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-yellow-500/15 bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(12,10,9,0.6))] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-200/70">{t.paymentChannel}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {selectedProviderLabel}
                    {selectedMethodDefinition ? ` · ${selectedMethodDefinition.label}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    {selectedMethodDefinition?.description || (availableProviders.length > 0 ? t.chooseMethodHint : t.noPaymentMethods)}
                  </p>
                </div>

                <button
                  onClick={openMethodModal}
                  disabled={!selected || paying || activeMethods.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-3.5 text-sm font-bold text-black transition hover:from-yellow-500 hover:to-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                >
                  {paying ? (
                    <div className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      {t.continueToCheckout} {selected ? formatUsd(selected.price) : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div className="space-y-1 text-sm text-gray-400">
                {t.notes.map((note) => <p key={note}>{note}</p>)}
                {pricingContext && <p>{checkoutContextHint(pricingContext.countryCode, pricingContext.currencyCode)}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
            <div className="text-center">
              <button
                onClick={() => setShowRedeem(!showRedeem)}
                className="inline-flex items-center gap-1 text-sm text-yellow-400/70 transition hover:text-yellow-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {t.haveRedeemCode}
              </button>

              {showRedeem && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
                    placeholder={t.enterCode}
                    aria-label={t.enterCode}
                    className="flex-1 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode.trim()}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {t.redeem}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              {t.securedBy}
            </div>
          </div>
        </section>
      </div>

      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-[#111114] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-300/75">{t.paymentChannel}</p>
                <h3 className="mt-3 text-2xl font-semibold">{t.modalTitle(selectedProviderLabel)}</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">{t.modalSubtitle}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
                  {t.availableInRegion(pricingContext?.countryCode || "US")}
                </p>
              </div>
              <button
                onClick={() => setIsMethodModalOpen(false)}
                className="rounded-full border border-white/10 p-2 text-gray-400 transition hover:border-white/20 hover:text-white"
                aria-label={t.actions.cancel}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {activeMethods.length > 0 ? activeMethods.map((method) => {
                const isSelected = modalSelection === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setModalSelection(method.id)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-yellow-500/60 bg-gradient-to-r from-yellow-900/20 to-zinc-900"
                        : "border-white/10 bg-zinc-900/70 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold text-white">{method.label}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            isSelected ? "bg-yellow-500/15 text-yellow-200" : "bg-white/5 text-gray-400"
                          }`}>
                            {method.pill}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-400">{method.description}</p>
                      </div>
                      <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-yellow-500" : "border-gray-600"}`}>
                        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-5 py-8 text-center text-sm text-gray-400">
                  {t.noPaymentMethods}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
              {t.modalNotice}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsMethodModalOpen(false)}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/5"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={confirmMethodSelection}
                className="rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:from-yellow-500 hover:to-yellow-400"
              >
                {t.actions.continue}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
