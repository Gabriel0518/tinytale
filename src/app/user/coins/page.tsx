"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const PROVIDER_TOGGLE_META: Record<PaymentProvider, { label: string; border: string; glow: string; tint: string; dot: string }> = {
  stripe: {
    label: "STRIPE",
    border: "border-[#635bff]/40",
    glow: "shadow-[0_0_32px_rgba(99,91,255,0.12)]",
    tint: "from-[#635bff]/18 via-[#635bff]/8 to-transparent",
    dot: "bg-[#635bff]",
  },
  airwallex: {
    label: "AIRWALLEX",
    border: "border-teal-400/35",
    glow: "shadow-[0_0_32px_rgba(45,212,191,0.12)]",
    tint: "from-teal-400/16 via-teal-400/8 to-transparent",
    dot: "bg-teal-300",
  },
};

const PAYMENT_METHOD_BUTTON_LABELS: Partial<Record<PaymentOption, string>> = {
  card: "Cards",
  wallet: "Apple Pay / Google Pay",
  paynow: "PayNow",
  grabpay: "GrabPay",
  fpx: "FPX",
  tng: "Touch 'n Go",
  qris: "QRIS",
  local_bank: "Bank Transfer",
  promptpay: "PromptPay",
  truemoney: "TrueMoney",
  fps: "FPS",
  alipayhk: "AlipayHK",
  wechatpayhk: "WeChat Pay HK",
  konbini: "Konbini",
  ideal: "iDEAL",
  blik: "BLIK",
  sofort: "Sofort",
};

function PaymentMethodText({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <span
        className={`text-center font-semibold uppercase text-white/90 ${
          compact ? "text-[11px] tracking-[0.22em]" : "text-[12px] tracking-[0.24em]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

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

  const selectedMethodId = providerSelections[effectiveSelectedProvider] || null;
  const selectedProviderMeta = PROVIDER_TOGGLE_META[effectiveSelectedProvider];
  const pricingCountryCode = pricingContext?.countryCode || "US";
  const paymentMethodsTitle = locale === "zh" ? "支付方式" : "Payment Methods";
  const serviceFeeLabel = locale === "zh" ? "服务费" : "Service Fee";
  const supportedMethodsHint = locale === "zh"
    ? "支持的结账方式取决于你的账单地区。"
    : "Supported checkout methods depend on your billing region.";
  const securedByProviderLabel = locale === "zh"
    ? `由 ${selectedProviderMeta.label} 安全托管结账`
    : `Secured by ${selectedProviderMeta.label}`;

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
    }
  };

  const continueWithSelectedMethod = async () => {
    if (!selected) {
      toast(t.toasts.selectPackageFirst, "error");
      return;
    }
    if (!paymentChannels[effectiveSelectedProvider]) {
      toast(t.toasts.selectProviderFirst, "error");
      return;
    }
    if (!selectedMethodId) {
      toast(t.toasts.selectPaymentMethod, "error");
      return;
    }
    await startCheckout(effectiveSelectedProvider, selectedMethodId);
  };

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

        <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-12">
          <section className="xl:col-span-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.selectPackage}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => {
                const isSelected = selectedPkg === pkg._id;
                const tagText = pkg.tag === "Popular" ? t.tagPopular : pkg.tag === "Best Value" ? t.tagBestValue : pkg.tag;

                return (
                  <button
                    key={pkg._id}
                    onClick={() => setSelectedPkg(pkg._id)}
                    aria-pressed={isSelected}
                    className={`relative flex min-h-[188px] flex-col justify-between rounded-3xl border p-6 text-left transition-all duration-200 active:scale-[0.99] ${
                      isSelected
                        ? "border-yellow-500/70 bg-[linear-gradient(180deg,rgba(255,215,0,0.12),rgba(39,31,7,0.18))] shadow-[0_0_24px_rgba(255,215,0,0.12)]"
                        : "border-white/8 bg-zinc-900/70 hover:border-white/15 hover:bg-zinc-900"
                    }`}
                  >
                    {pkg.tag && (
                      <span className={`absolute -top-3 right-5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                        pkg.tag === "Popular"
                          ? "border border-blue-500/30 bg-blue-500/20 text-blue-300"
                          : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {tagText}
                      </span>
                    )}

                    {isSelected && (
                      <div className="absolute -top-3 right-5 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-500/20">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 00-1.408-1.42l-6.21 6.158-2.39-2.37a1 1 0 10-1.41 1.418l3.095 3.067a1 1 0 001.408 0l6.915-6.855z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div>
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/12 text-yellow-300">
                        <CoinBadge />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{pkg.coins.toLocaleString()} Coins</h3>
                      <p className="mt-2 text-sm font-medium text-zinc-400">
                        {pkg.bonus > 0 ? `+${pkg.bonus.toLocaleString()} ${t.bonus}` : "Standard Pack"}
                      </p>
                    </div>

                    <div className="mt-8 flex items-end gap-2">
                      <span className="text-3xl font-black text-white">{formatUsd(pkg.price)}</span>
                      {pkg.originalPrice && (
                        <span className="pb-1 text-xs text-gray-500 line-through">{formatUsd(pkg.originalPrice)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="xl:col-span-4 xl:flex xl:flex-col">
            <div className="hidden xl:block h-[3.25rem]" />
            <div className="flex flex-1 flex-col rounded-3xl border border-white/5 bg-zinc-900/80 p-8 shadow-2xl">
              <h3 className="text-2xl font-bold">{t.orderSummary}</h3>
              {selected ? (
                <div className="mt-8 flex flex-1 flex-col">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <p className="text-sm font-medium text-zinc-400">Selected Package</p>
                        <p className="mt-1 text-lg font-bold text-white">{t.selectedCoins(selected.coins)}</p>
                      </div>
                      <span className="text-sm text-zinc-400">{formatUsd(selected.price)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span className="font-medium">{t.bonusCoins}</span>
                      <span className="font-medium text-yellow-300">+{selected.bonus.toLocaleString()} Coins</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span className="font-medium">{serviceFeeLabel}</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-yellow-400/15 pt-6">
                    <div className="mb-8 flex items-end justify-between">
                      <span className="text-xl font-bold text-white">{t.total}</span>
                      <span className="text-4xl font-black text-yellow-400">{formatUsd(selected.price)}</span>
                    </div>

                    <button
                      onClick={continueWithSelectedMethod}
                      disabled={!selected || paying || activeMethods.length === 0}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-4 text-lg font-bold text-[#3a3000] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {paying ? (
                        <div className="h-5 w-5 rounded-full border-2 border-[#3a3000] border-t-transparent animate-spin" />
                      ) : (
                        t.continueToCheckout
                      )}
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      {securedByProviderLabel}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-gray-500">{t.selectPackageHint}</p>
              )}
            </div>
          </aside>

          <section className="xl:col-span-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 className="text-2xl font-bold text-white">{paymentMethodsTitle}</h2>

              <div className="inline-flex rounded-xl border border-white/5 bg-zinc-900 p-1">
                {availableProviders.map((providerId) => {
                  const isActive = effectiveSelectedProvider === providerId;
                  return (
                    <button
                      key={providerId}
                      onClick={() => setSelectedProvider(providerId)}
                      aria-pressed={isActive}
                      className={`rounded-lg px-7 py-2.5 text-sm font-bold transition-all ${
                        isActive
                          ? "bg-yellow-400 text-[#3a3000] shadow-lg shadow-yellow-500/20"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {t.providerLabels[providerId]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
              {activeMethods.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {activeMethods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setProviderSelections((current) => ({
                          ...current,
                          [effectiveSelectedProvider]: method.id,
                        }))}
                        aria-pressed={isSelected}
                        className={`relative flex min-h-[96px] items-center justify-center rounded-2xl border p-6 transition-all ${
                          isSelected
                            ? "border-yellow-400 ring-4 ring-yellow-400/10 bg-zinc-900"
                            : "border-white/10 bg-zinc-900 hover:border-white/20"
                        }`}
                      >
                        <PaymentMethodText
                          label={PAYMENT_METHOD_BUTTON_LABELS[method.id] || method.label}
                        />
                        {isSelected && (
                          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-900 bg-yellow-400 text-[#3a3000]">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.704 5.29a1 1 0 00-1.408-1.42l-6.21 6.158-2.39-2.37a1 1 0 10-1.41 1.418l3.095 3.067a1 1 0 001.408 0l6.915-6.855z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-5 py-8 text-center text-sm text-gray-400">
                  {t.noPaymentMethods}
                </div>
              )}

              <p className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {supportedMethodsHint}
                <span className="uppercase tracking-[0.16em]">{pricingCountryCode}</span>
              </p>
            </div>
          </section>
        </div>

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

      <Footer />
    </div>
  );
}
