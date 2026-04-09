"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { coinsApi, subscriptionApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

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

interface VipPlan {
  _id: string;
  name?: string;
  price: number;
  period?: string;
  duration?: number;
  durationDays?: number;
  sortOrder?: number;
  recommended?: boolean;
  features?: string[];
}

type PaymentProvider = "stripe" | "airwallex";
type PaymentOption = string;

type PaymentChannel = {
  provider: PaymentProvider;
  paymentOptions: PaymentOption[];
};

type RechargeTab = "coins" | "vip";

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
  paymentMethodsTitle: string;
  serviceFee: string;
  supportedMethodsHint: string;
  standardPack: string;
  silverCoins: string;
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
  selectedPackageLabel: string;
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
  securedByProvider: (provider: string) => string;
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

const EXPRESS_WALLET_LABELS: FlexibleRecord<SupportedLocale, string> = {
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

const COPY: FlexibleRecord<SupportedLocale, CoinsCopy> = {
  en: {
    title: "Gold Recharge",
    subtitle: "Choose your package, then pick a payment channel and the checkout method available in your region.",
    currentBalance: "Current Balance",
    paymentMethodsTitle: "Payment Methods",
    serviceFee: "Service Fee",
    supportedMethodsHint: "Supported checkout methods depend on your billing region.",
    standardPack: "Standard Pack",
    silverCoins: "Silver Coins",
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
    selectedPackageLabel: "Selected Package",
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
    securedByProvider: (provider) => `Secured by ${provider}`,
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
        label: EXPRESS_WALLET_LABELS.en,
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
    paymentMethodsTitle: "支付方式",
    serviceFee: "服务费",
    supportedMethodsHint: "支持的结账方式取决于你的账单地区。",
    standardPack: "标准套餐",
    silverCoins: "银币",
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
    selectedPackageLabel: "已选套餐",
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
    securedByProvider: (provider) => `由 ${provider} 安全托管结账`,
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
        label: EXPRESS_WALLET_LABELS.zh,
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

const EN_CATALOG = COPY.en.paymentOptionCatalog;

COPY.ja = {
  ...COPY.en,
  title: "コインチャージ",
  subtitle: "パッケージを選択し、支払いチャネルとお住まいの地域で利用できる決済方法を選んでください。",
  currentBalance: "現在の残高",
  paymentMethodsTitle: "支払い方法",
  serviceFee: "手数料",
  supportedMethodsHint: "利用可能な決済方法は請求先の地域によって異なります。",
  standardPack: "標準パック",
  silverCoins: "シルバーコイン",
  coinsUnit: "コイン",
  transactionHistory: "取引履歴",
  selectPackage: "パッケージを選択",
  tagPopular: "人気",
  tagBestValue: "おすすめ",
  notes: [
    "購入したコインは返金できません。",
    "ボーナスコインは購入日から30日間有効です。",
    "最終的な決済方法と表示通貨は、チェックアウト時の提供会社の条件によって異なります。",
  ],
  orderSummary: "注文概要",
  selectedCoins: (coins) => `${coins.toLocaleString()} コイン`,
  bonusCoins: "ボーナスコイン",
  total: "合計",
  selectPackageHint: "続行するにはパッケージを選択してください",
  selectedPackageLabel: "選択中のパッケージ",
  noPaymentChannels: "現在の地域では利用可能な支払いチャネルがありません。",
  noPaymentMethods: "このチャネルでは現在利用可能な支払い方法がありません。",
  continueToCheckout: "チェックアウトへ進む",
  haveRedeemCode: "交換コードがありますか？",
  enterCode: "コードを入力",
  redeem: "交換",
  securedBy: "決済プロバイダーのホスト型チェックアウトと 256-bit SSL で保護されています",
  securedByProvider: (provider) => `${provider} による安全なホスト型チェックアウト`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "クレジット / デビットカード" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.ja },
    fpx: { ...EN_CATALOG.fpx, label: "FPX オンラインバンキング" },
    local_bank: { ...EN_CATALOG.local_bank, label: "現地銀行振込" },
    konbini: { ...EN_CATALOG.konbini, label: "コンビニ決済" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / 銀行リダイレクト" },
  },
  toasts: {
    selectPackageFirst: "先にチャージパッケージを選択してください",
    selectProviderFirst: "先に支払いチャネルを選択してください",
    selectPaymentMethod: "先に支払い方法を選択してください",
    paymentFailed: "支払いに失敗しました",
    redeemSuccess: (coins) => `${coins} コインを交換しました！`,
    invalidCode: "コードが無効か有効期限切れです",
    genericError: "エラーが発生しました",
  },
};

COPY.es = {
  ...COPY.en,
  title: "Recarga de monedas",
  subtitle: "Elige tu paquete, luego el canal de pago y el método disponible en tu región.",
  currentBalance: "Saldo actual",
  paymentMethodsTitle: "Métodos de pago",
  serviceFee: "Tarifa de servicio",
  supportedMethodsHint: "Los métodos de checkout disponibles dependen de tu región de facturación.",
  standardPack: "Paquete estándar",
  silverCoins: "Monedas de plata",
  coinsUnit: "monedas",
  transactionHistory: "Historial de transacciones",
  selectPackage: "Selecciona un paquete",
  tagPopular: "Más popular",
  tagBestValue: "Mejor valor",
  notes: [
    "Las monedas no son reembolsables una vez compradas.",
    "Las monedas de bonificación son válidas durante 30 días desde la compra.",
    "Los métodos de pago y la moneda final dependen de la elegibilidad del proveedor en el checkout.",
  ],
  orderSummary: "Resumen del pedido",
  selectedCoins: (coins) => `${coins.toLocaleString()} monedas`,
  bonusCoins: "Monedas de bonificación",
  total: "Total",
  selectPackageHint: "Selecciona un paquete para continuar",
  selectedPackageLabel: "Paquete seleccionado",
  noPaymentChannels: "No hay canales de pago disponibles para tu región.",
  noPaymentMethods: "No hay métodos de pago disponibles para este canal en este momento.",
  continueToCheckout: "Continuar al checkout",
  haveRedeemCode: "¿Tienes un código de canje?",
  enterCode: "Ingresa el código",
  redeem: "Canjear",
  securedBy: "Protegido por checkout alojado por el proveedor y cifrado SSL de 256 bits",
  securedByProvider: (provider) => `Checkout seguro alojado por ${provider}`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "Tarjeta de crédito / débito" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.es },
    fpx: { ...EN_CATALOG.fpx, label: "FPX banca en línea" },
    local_bank: { ...EN_CATALOG.local_bank, label: "Transferencia bancaria local" },
    konbini: { ...EN_CATALOG.konbini, label: "Konbini" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / Redirección bancaria" },
  },
  toasts: {
    selectPackageFirst: "Primero selecciona un paquete de recarga",
    selectProviderFirst: "Primero elige un canal de pago",
    selectPaymentMethod: "Primero elige un método de pago",
    paymentFailed: "Pago fallido",
    redeemSuccess: (coins) => `¡Canjeaste ${coins} monedas!`,
    invalidCode: "Código inválido o vencido",
    genericError: "Ocurrió un error",
  },
};

COPY.pt = {
  ...COPY.en,
  title: "Recarga de moedas",
  subtitle: "Escolha seu pacote, depois o canal de pagamento e o método disponível na sua região.",
  currentBalance: "Saldo atual",
  paymentMethodsTitle: "Métodos de pagamento",
  serviceFee: "Taxa de serviço",
  supportedMethodsHint: "Os métodos de checkout disponíveis dependem da sua região de cobrança.",
  standardPack: "Pacote padrão",
  silverCoins: "Moedas de prata",
  coinsUnit: "moedas",
  transactionHistory: "Histórico de transações",
  selectPackage: "Selecione um pacote",
  tagPopular: "Mais popular",
  tagBestValue: "Melhor valor",
  notes: [
    "As moedas não são reembolsáveis após a compra.",
    "As moedas bônus valem por 30 dias a partir da data da compra.",
    "Os métodos de pagamento e a moeda final ainda dependem da elegibilidade do provedor no checkout.",
  ],
  orderSummary: "Resumo do pedido",
  selectedCoins: (coins) => `${coins.toLocaleString()} moedas`,
  bonusCoins: "Moedas bônus",
  total: "Total",
  selectPackageHint: "Selecione um pacote para continuar",
  selectedPackageLabel: "Pacote selecionado",
  noPaymentChannels: "No momento não há canais de pagamento disponíveis para sua região.",
  noPaymentMethods: "Não há métodos de pagamento disponíveis para este canal agora.",
  continueToCheckout: "Continuar para o checkout",
  haveRedeemCode: "Tem um código de resgate?",
  enterCode: "Digite o código",
  redeem: "Resgatar",
  securedBy: "Protegido por checkout hospedado pelo provedor e criptografia SSL de 256 bits",
  securedByProvider: (provider) => `Checkout seguro hospedado por ${provider}`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "Cartão de crédito / débito" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.pt },
    fpx: { ...EN_CATALOG.fpx, label: "FPX Internet Banking" },
    local_bank: { ...EN_CATALOG.local_bank, label: "Transferência bancária local" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / Redirecionamento bancário" },
  },
  toasts: {
    selectPackageFirst: "Selecione primeiro um pacote de recarga",
    selectProviderFirst: "Escolha primeiro um canal de pagamento",
    selectPaymentMethod: "Escolha primeiro um método de pagamento",
    paymentFailed: "Falha no pagamento",
    redeemSuccess: (coins) => `Você resgatou ${coins} moedas!`,
    invalidCode: "Código inválido ou expirado",
    genericError: "Ocorreu um erro",
  },
};

COPY.hi = {
  ...COPY.en,
  title: "कॉइन रिचार्ज",
  subtitle: "पहले पैकेज चुनें, फिर पेमेंट चैनल और अपने क्षेत्र में उपलब्ध checkout तरीका चुनें।",
  currentBalance: "वर्तमान बैलेंस",
  paymentMethodsTitle: "भुगतान तरीके",
  serviceFee: "सेवा शुल्क",
  supportedMethodsHint: "उपलब्ध checkout तरीके आपके बिलिंग क्षेत्र पर निर्भर करते हैं।",
  standardPack: "मानक पैक",
  silverCoins: "सिल्वर कॉइन",
  coinsUnit: "कॉइन",
  transactionHistory: "लेनदेन इतिहास",
  selectPackage: "पैकेज चुनें",
  tagPopular: "सबसे लोकप्रिय",
  tagBestValue: "सबसे बेहतर मूल्य",
  notes: [
    "खरीदे गए कॉइन वापस नहीं किए जा सकते।",
    "बोनस कॉइन खरीद की तारीख से 30 दिनों तक मान्य रहते हैं।",
    "अंतिम भुगतान तरीके और मुद्रा checkout पर प्रदाता की उपलब्धता पर निर्भर करते हैं।",
  ],
  orderSummary: "ऑर्डर सारांश",
  selectedCoins: (coins) => `${coins.toLocaleString()} कॉइन`,
  bonusCoins: "बोनस कॉइन",
  total: "कुल",
  selectPackageHint: "जारी रखने के लिए पैकेज चुनें",
  selectedPackageLabel: "चुना गया पैकेज",
  noPaymentChannels: "आपके क्षेत्र के लिए अभी कोई भुगतान चैनल उपलब्ध नहीं है।",
  noPaymentMethods: "इस चैनल के लिए अभी कोई भुगतान तरीका उपलब्ध नहीं है।",
  continueToCheckout: "Checkout पर जाएँ",
  haveRedeemCode: "क्या आपके पास रिडीम कोड है?",
  enterCode: "कोड दर्ज करें",
  redeem: "रिडीम करें",
  securedBy: "प्रदाता-होस्टेड checkout और 256-bit SSL एन्क्रिप्शन द्वारा सुरक्षित",
  securedByProvider: (provider) => `${provider} द्वारा सुरक्षित hosted checkout`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "क्रेडिट / डेबिट कार्ड" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.hi },
    fpx: { ...EN_CATALOG.fpx, label: "FPX ऑनलाइन बैंकिंग" },
    local_bank: { ...EN_CATALOG.local_bank, label: "स्थानीय बैंक ट्रांसफर" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / बैंक रीडायरेक्ट" },
  },
  toasts: {
    selectPackageFirst: "पहले रिचार्ज पैकेज चुनें",
    selectProviderFirst: "पहले भुगतान चैनल चुनें",
    selectPaymentMethod: "पहले भुगतान तरीका चुनें",
    paymentFailed: "भुगतान विफल",
    redeemSuccess: (coins) => `${coins} कॉइन सफलतापूर्वक रिडीम हुए!`,
    invalidCode: "कोड अमान्य है या समाप्त हो चुका है",
    genericError: "एक त्रुटि हुई",
  },
};

COPY.id = {
  ...COPY.en,
  title: "Isi ulang koin",
  subtitle: "Pilih paketmu, lalu pilih channel pembayaran dan metode checkout yang tersedia di wilayahmu.",
  currentBalance: "Saldo saat ini",
  paymentMethodsTitle: "Metode pembayaran",
  serviceFee: "Biaya layanan",
  supportedMethodsHint: "Metode checkout yang didukung bergantung pada wilayah penagihanmu.",
  standardPack: "Paket standar",
  silverCoins: "Koin perak",
  coinsUnit: "koin",
  transactionHistory: "Riwayat transaksi",
  selectPackage: "Pilih paket",
  tagPopular: "Paling populer",
  tagBestValue: "Paling hemat",
  notes: [
    "Koin tidak dapat dikembalikan setelah dibeli.",
    "Koin bonus berlaku selama 30 hari sejak tanggal pembelian.",
    "Metode pembayaran dan mata uang akhir tetap bergantung pada kelayakan provider saat checkout.",
  ],
  orderSummary: "Ringkasan pesanan",
  selectedCoins: (coins) => `${coins.toLocaleString()} koin`,
  bonusCoins: "Koin bonus",
  total: "Total",
  selectPackageHint: "Pilih paket untuk melanjutkan",
  selectedPackageLabel: "Paket terpilih",
  noPaymentChannels: "Tidak ada channel pembayaran yang tersedia untuk wilayahmu saat ini.",
  noPaymentMethods: "Tidak ada metode pembayaran yang tersedia untuk channel ini saat ini.",
  continueToCheckout: "Lanjut ke checkout",
  haveRedeemCode: "Punya kode redeem?",
  enterCode: "Masukkan kode",
  redeem: "Redeem",
  securedBy: "Diamankan oleh checkout yang dihosting provider dan enkripsi SSL 256-bit",
  securedByProvider: (provider) => `Checkout aman yang dihosting oleh ${provider}`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "Kartu kredit / debit" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.id },
    fpx: { ...EN_CATALOG.fpx, label: "FPX Perbankan Online" },
    local_bank: { ...EN_CATALOG.local_bank, label: "Transfer bank lokal" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / Pengalihan bank" },
  },
  toasts: {
    selectPackageFirst: "Silakan pilih paket isi ulang terlebih dahulu",
    selectProviderFirst: "Silakan pilih channel pembayaran terlebih dahulu",
    selectPaymentMethod: "Silakan pilih metode pembayaran terlebih dahulu",
    paymentFailed: "Pembayaran gagal",
    redeemSuccess: (coins) => `Berhasil menukarkan ${coins} koin!`,
    invalidCode: "Kode tidak valid atau sudah kedaluwarsa",
    genericError: "Terjadi kesalahan",
  },
};

COPY.ko = {
  ...COPY.en,
  title: "코인 충전",
  subtitle: "패키지를 선택한 뒤 결제 채널과 현재 지역에서 사용할 수 있는 결제 방법을 선택하세요.",
  currentBalance: "현재 잔액",
  paymentMethodsTitle: "결제 수단",
  serviceFee: "서비스 수수료",
  supportedMethodsHint: "지원되는 체크아웃 방식은 청구 지역에 따라 달라집니다.",
  standardPack: "기본 패키지",
  silverCoins: "실버 코인",
  coinsUnit: "코인",
  transactionHistory: "거래 내역",
  selectPackage: "패키지 선택",
  tagPopular: "가장 인기",
  tagBestValue: "가성비 추천",
  notes: [
    "구매한 코인은 환불되지 않습니다.",
    "보너스 코인은 구매일로부터 30일 동안 유효합니다.",
    "최종 결제 수단과 표시 통화는 체크아웃 시 프로바이더 조건에 따라 달라질 수 있습니다.",
  ],
  orderSummary: "주문 요약",
  selectedCoins: (coins) => `${coins.toLocaleString()} 코인`,
  bonusCoins: "보너스 코인",
  total: "합계",
  selectPackageHint: "계속하려면 패키지를 선택하세요",
  selectedPackageLabel: "선택한 패키지",
  noPaymentChannels: "현재 지역에서는 이용 가능한 결제 채널이 없습니다.",
  noPaymentMethods: "이 채널에서 현재 이용 가능한 결제 방식이 없습니다.",
  continueToCheckout: "체크아웃으로 계속",
  haveRedeemCode: "리딤 코드가 있나요?",
  enterCode: "코드 입력",
  redeem: "리딤",
  securedBy: "프로바이더 호스팅 체크아웃과 256-bit SSL 암호화로 보호됩니다",
  securedByProvider: (provider) => `${provider} 보안 호스팅 체크아웃`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "신용 / 체크카드" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.ko },
    fpx: { ...EN_CATALOG.fpx, label: "FPX 온라인 뱅킹" },
    local_bank: { ...EN_CATALOG.local_bank, label: "현지 은행 송금" },
    konbini: { ...EN_CATALOG.konbini, label: "편의점 결제" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / 은행 리디렉션" },
  },
  toasts: {
    selectPackageFirst: "먼저 충전 패키지를 선택하세요",
    selectProviderFirst: "먼저 결제 채널을 선택하세요",
    selectPaymentMethod: "먼저 결제 방식을 선택하세요",
    paymentFailed: "결제에 실패했습니다",
    redeemSuccess: (coins) => `${coins} 코인을 교환했습니다!`,
    invalidCode: "코드가 유효하지 않거나 만료되었습니다",
    genericError: "오류가 발생했습니다",
  },
};

COPY.fr = {
  ...COPY.en,
  title: "Recharge de pièces",
  subtitle: "Choisissez votre forfait, puis le canal de paiement et la méthode de checkout disponible dans votre région.",
  currentBalance: "Solde actuel",
  paymentMethodsTitle: "Méthodes de paiement",
  serviceFee: "Frais de service",
  supportedMethodsHint: "Les méthodes de checkout prises en charge dépendent de votre région de facturation.",
  standardPack: "Pack standard",
  silverCoins: "Pièces d'argent",
  coinsUnit: "pièces",
  transactionHistory: "Historique des transactions",
  selectPackage: "Choisir un forfait",
  tagPopular: "Le plus populaire",
  tagBestValue: "Meilleur rapport",
  notes: [
    "Les pièces achetées ne sont pas remboursables.",
    "Les pièces bonus sont valables 30 jours à partir de la date d'achat.",
    "Les méthodes de paiement et la devise finale dépendent toujours de l'éligibilité du prestataire au checkout.",
  ],
  orderSummary: "Récapitulatif de la commande",
  selectedCoins: (coins) => `${coins.toLocaleString()} pièces`,
  bonusCoins: "Pièces bonus",
  total: "Total",
  selectPackageHint: "Choisissez un forfait pour continuer",
  selectedPackageLabel: "Forfait sélectionné",
  noPaymentChannels: "Aucun canal de paiement n'est actuellement disponible pour votre région.",
  noPaymentMethods: "Aucune méthode de paiement n'est disponible pour ce canal pour le moment.",
  continueToCheckout: "Continuer vers le checkout",
  haveRedeemCode: "Vous avez un code d'échange ?",
  enterCode: "Entrer le code",
  redeem: "Échanger",
  securedBy: "Sécurisé par un checkout hébergé par le prestataire et un chiffrement SSL 256-bit",
  securedByProvider: (provider) => `Checkout sécurisé hébergé par ${provider}`,
  paymentOptionCatalog: {
    ...EN_CATALOG,
    card: { ...EN_CATALOG.card, label: "Carte bancaire" },
    wallet: { ...EN_CATALOG.wallet, label: EXPRESS_WALLET_LABELS.fr },
    fpx: { ...EN_CATALOG.fpx, label: "FPX banque en ligne" },
    local_bank: { ...EN_CATALOG.local_bank, label: "Virement bancaire local" },
    sofort: { ...EN_CATALOG.sofort, label: "Sofort / Redirection bancaire" },
  },
  toasts: {
    selectPackageFirst: "Veuillez d'abord sélectionner un forfait de recharge",
    selectProviderFirst: "Veuillez d'abord choisir un canal de paiement",
    selectPaymentMethod: "Veuillez d'abord choisir une méthode de paiement",
    paymentFailed: "Le paiement a échoué",
    redeemSuccess: (coins) => `${coins} pièces échangées !`,
    invalidCode: "Code invalide ou expiré",
    genericError: "Une erreur s'est produite",
  },
};

const CHECKOUT_CONTEXT_COPY: FlexibleRecord<SupportedLocale, (countryCode: string, currencyCode: string) => string> = {
  en: (countryCode, currencyCode) => `Checkout region: ${countryCode}, settlement display currency may be ${currencyCode}.`,
  zh: (countryCode, currencyCode) => `结账地区：${countryCode}，最终展示货币可能为 ${currencyCode}。`,
  ja: (countryCode, currencyCode) => `チェックアウト地域：${countryCode}。表示通貨は ${currencyCode} になる場合があります。`,
  es: (countryCode, currencyCode) => `Región de checkout: ${countryCode}; la moneda mostrada puede ser ${currencyCode}.`,
  pt: (countryCode, currencyCode) => `Região do checkout: ${countryCode}; a moeda exibida pode ser ${currencyCode}.`,
  hi: (countryCode, currencyCode) => `Checkout क्षेत्र: ${countryCode}; प्रदर्शित मुद्रा ${currencyCode} हो सकती है।`,
  id: (countryCode, currencyCode) => `Wilayah checkout: ${countryCode}; mata uang yang ditampilkan bisa berupa ${currencyCode}.`,
  ko: (countryCode, currencyCode) => `체크아웃 지역: ${countryCode}, 표시 통화는 ${currencyCode} 일 수 있습니다.`,
  fr: (countryCode, currencyCode) => `Région de checkout : ${countryCode} ; la devise affichée peut être ${currencyCode}.`,
};

const MOBILE_RECHARGE_COPY: FlexibleRecord<SupportedLocale, {
  pageTitle: string;
  coinsTab: string;
  vipTab: string;
  confirmAndPay: (price: string) => string;
  choosePlan: string;
  vipActive: string;
  vipExpiresOn: (date: string) => string;
  vipPlanFallback: string;
  yearly: string;
  monthly: string;
  hot: string;
}> = {
  en: {
    pageTitle: "Recharge",
    coinsTab: "Coins",
    vipTab: "VIP Subscription",
    confirmAndPay: (price) => `Confirm & Pay ${price}`,
    choosePlan: "Select Package",
    vipActive: "VIP Active",
    vipExpiresOn: (date) => `Expires ${date}`,
    vipPlanFallback: "VIP Plan",
    yearly: "Yearly",
    monthly: "Monthly",
    hot: "Hot",
  },
  zh: {
    pageTitle: "充值",
    coinsTab: "金币",
    vipTab: "VIP 订阅",
    confirmAndPay: (price) => `确认支付 ${price}`,
    choosePlan: "选择套餐",
    vipActive: "VIP 生效中",
    vipExpiresOn: (date) => `${date} 到期`,
    vipPlanFallback: "VIP 套餐",
    yearly: "年付",
    monthly: "月付",
    hot: "热门",
  },
  ja: {
    pageTitle: "チャージ",
    coinsTab: "コイン",
    vipTab: "VIP サブスク",
    confirmAndPay: (price) => `${price}で支払う`,
    choosePlan: "プランを選択",
    vipActive: "VIP 有効",
    vipExpiresOn: (date) => `${date} まで`,
    vipPlanFallback: "VIP プラン",
    yearly: "年額",
    monthly: "月額",
    hot: "人気",
  },
  es: {
    pageTitle: "Recarga",
    coinsTab: "Monedas",
    vipTab: "Suscripción VIP",
    confirmAndPay: (price) => `Confirmar y pagar ${price}`,
    choosePlan: "Seleccionar plan",
    vipActive: "VIP activo",
    vipExpiresOn: (date) => `Vence ${date}`,
    vipPlanFallback: "Plan VIP",
    yearly: "Anual",
    monthly: "Mensual",
    hot: "Hot",
  },
  pt: {
    pageTitle: "Recarga",
    coinsTab: "Moedas",
    vipTab: "Assinatura VIP",
    confirmAndPay: (price) => `Confirmar e pagar ${price}`,
    choosePlan: "Selecionar plano",
    vipActive: "VIP ativo",
    vipExpiresOn: (date) => `Expira em ${date}`,
    vipPlanFallback: "Plano VIP",
    yearly: "Anual",
    monthly: "Mensal",
    hot: "Hot",
  },
  hi: {
    pageTitle: "रिचार्ज",
    coinsTab: "कॉइन्स",
    vipTab: "VIP सदस्यता",
    confirmAndPay: (price) => `${price} का भुगतान करें`,
    choosePlan: "प्लान चुनें",
    vipActive: "VIP सक्रिय",
    vipExpiresOn: (date) => `${date} तक`,
    vipPlanFallback: "VIP प्लान",
    yearly: "वार्षिक",
    monthly: "मासिक",
    hot: "हॉट",
  },
  id: {
    pageTitle: "Isi Ulang",
    coinsTab: "Koin",
    vipTab: "Langganan VIP",
    confirmAndPay: (price) => `Konfirmasi & bayar ${price}`,
    choosePlan: "Pilih paket",
    vipActive: "VIP aktif",
    vipExpiresOn: (date) => `Berakhir ${date}`,
    vipPlanFallback: "Paket VIP",
    yearly: "Tahunan",
    monthly: "Bulanan",
    hot: "Hot",
  },
  ko: {
    pageTitle: "충전",
    coinsTab: "코인",
    vipTab: "VIP 구독",
    confirmAndPay: (price) => `${price} 결제하기`,
    choosePlan: "플랜 선택",
    vipActive: "VIP 이용 중",
    vipExpiresOn: (date) => `${date} 만료`,
    vipPlanFallback: "VIP 플랜",
    yearly: "연간",
    monthly: "월간",
    hot: "인기",
  },
  fr: {
    pageTitle: "Recharger",
    coinsTab: "Pièces",
    vipTab: "Abonnement VIP",
    confirmAndPay: (price) => `Confirmer et payer ${price}`,
    choosePlan: "Choisir un forfait",
    vipActive: "VIP actif",
    vipExpiresOn: (date) => `Expire le ${date}`,
    vipPlanFallback: "Forfait VIP",
    yearly: "Annuel",
    monthly: "Mensuel",
    hot: "Hot",
  },
};

function GoldCoinIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#FFD400" />
      <circle cx="9.7" cy="8.8" r="5.2" fill="#FFF18A" opacity="0.72" />
      <circle cx="12" cy="12" r="10.2" stroke="#FFEE88" strokeWidth="0.8" opacity="0.55" />
      <path d="M12.05 7.2c-1.62 0-2.9.94-2.9 2.35 0 1.34 1.03 1.92 2.61 2.28l.54.12c1.14.26 1.65.51 1.65 1.09 0 .67-.65 1.09-1.72 1.09-1.09 0-1.78-.43-2.22-1.11L8.63 13.7c.49 1.19 1.59 1.96 3.02 2.11v1.02h1.18V15.8c1.73-.18 2.92-1.17 2.92-2.58 0-1.42-.94-2-2.76-2.42l-.61-.14c-1.05-.24-1.43-.48-1.43-1 0-.58.54-.95 1.43-.95.94 0 1.49.38 1.88.95l1.31-.69c-.53-1.01-1.4-1.59-2.59-1.76V6.18h-1.18V7.2Z" fill="#7A4700" />
    </svg>
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
  const mobileCopy = resolveLocaleCopy(MOBILE_RECHARGE_COPY, locale);
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
  const getRuntimeErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (locale === "en" && error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }, [locale]);

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
  const [activeTab, setActiveTab] = useState<RechargeTab>("coins");
  const [vipPlans, setVipPlans] = useState<VipPlan[]>([]);
  const [selectedVipPlan, setSelectedVipPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [prefersMobileLayout, setPrefersMobileLayout] = useState(false);
  const [vipStatus, setVipStatus] = useState<{ isActive: boolean; expiresAt: string | null }>({
    isActive: false,
    expiresAt: null,
  });
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

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    setSilverBalance(user.silverCoins || 0);
  }, [user]);

  useEffect(() => {
    const syncPreferredLayout = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth || window.visualViewport?.width || 0;
      const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|wv/i.test(window.navigator.userAgent || "");
      setPrefersMobileLayout(mobileUserAgent || width < 1024);
    };

    syncPreferredLayout();
    window.addEventListener("resize", syncPreferredLayout);
    return () => window.removeEventListener("resize", syncPreferredLayout);
  }, []);

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
        if (pkgs.length > 0) {
          const preferred = pkgs.find((item) => (item.tag || "").toLowerCase().includes("best")) || pkgs[2] || pkgs[0];
          setSelectedPkg(preferred._id);
        }
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
        setSelectedPkg("p4");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!token || !user) return;
    let cancelled = false;

    const loadVipData = async () => {
      try {
        const plansRes = await subscriptionApi.getPlans() as { data?: VipPlan[] };
        if (!cancelled) {
          const plans = (plansRes.data || [])
            .map((item) => ({ ...item, _id: String(item._id || "") }))
            .filter((item) => item._id)
            .sort((a, b) => {
              const orderA = Number(a.sortOrder || 0);
              const orderB = Number(b.sortOrder || 0);
              if (orderA !== orderB) return orderA - orderB;
              return Number(a.price || 0) - Number(b.price || 0);
            });
          setVipPlans(plans);
          if (plans.length > 0) {
            const recommended = plans.find((item) => item.recommended);
            setSelectedVipPlan((current) => current || recommended?._id || plans[0]._id);
          }
        }
      } catch {
        if (!cancelled) {
          setVipPlans([]);
          setSelectedVipPlan(null);
        }
      }

      try {
        const statusRes = await subscriptionApi.getStatus(token) as {
          data?: {
            status?: string;
            vipStatus?: string;
            expiresAt?: string;
            vipExpiresAt?: string;
            currentPeriodEnd?: string;
          };
        };
        const data = statusRes.data || {};
        const currentUser = user as { vipStatus?: string; vipExpiresAt?: string; subscriptionExpiresAt?: string };
        const normalizedStatus = String(data.vipStatus || data.status || currentUser.vipStatus || "").toLowerCase();
        const expiresAt = data.vipExpiresAt || data.expiresAt || data.currentPeriodEnd || currentUser.vipExpiresAt || currentUser.subscriptionExpiresAt || null;
        if (!cancelled) {
          setVipStatus({
            isActive: normalizedStatus === "active" || normalizedStatus === "trialing",
            expiresAt,
          });
        }
      } catch {
        const currentUser = user as { vipStatus?: string; vipExpiresAt?: string; subscriptionExpiresAt?: string };
        if (!cancelled) {
          setVipStatus({
            isActive: String(currentUser.vipStatus || "").toLowerCase() === "active",
            expiresAt: currentUser.vipExpiresAt || currentUser.subscriptionExpiresAt || null,
          });
        }
      }
    };

    loadVipData();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

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
  const mobileMethodChoices = useMemo(
    () =>
      availableProviders.flatMap((provider) =>
        toPaymentOptionDefinitions(t, provider, paymentChannels[provider]?.paymentOptions || []).map((method) => ({
          provider,
          method,
        })),
      ),
    [availableProviders, paymentChannels, t],
  );
  const mobileProviderPills = useMemo(
    () =>
      availableProviders.map((provider) => {
        const defaultPaymentOption =
          providerSelections[provider]
          || paymentChannels[provider]?.paymentOptions?.[0]
          || null;

        return {
          key: `${provider}-${defaultPaymentOption || "none"}`,
          provider,
          paymentOption: defaultPaymentOption,
          label: t.providerLabels[provider],
        };
      }),
    [availableProviders, paymentChannels, providerSelections, t],
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
  const securedByProviderLabel = t.securedByProvider(selectedProviderMeta.label);
  const selectedVipPlanData = vipPlans.find((plan) => plan._id === selectedVipPlan) || null;

  const vipPriceLabel = useCallback((plan: VipPlan) => {
    const period = String(plan.period || "").toLowerCase();
    if (period.includes("year")) return `${formatUsd(plan.price)}/${mobileCopy.yearly}`;
    if (period.includes("month")) return `${formatUsd(plan.price)}/${mobileCopy.monthly}`;
    if (period.includes("week")) return `${formatUsd(plan.price)}/wk`;
    return formatUsd(plan.price);
  }, [formatUsd, mobileCopy.monthly, mobileCopy.yearly]);

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
      toast(getRuntimeErrorMessage(error, t.toasts.paymentFailed), "error");
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

  const continueWithVipPlan = async () => {
    if (!token || !selectedVipPlan) {
      toast(t.toasts.selectPackageFirst, "error");
      return;
    }

    setSubscribing(true);
    try {
      const res = await subscriptionApi.subscribe(token, selectedVipPlan, "stripe") as {
        data?: { checkoutUrl?: string };
      };
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      toast(t.toasts.paymentFailed, "error");
    } catch (error: unknown) {
      toast(getRuntimeErrorMessage(error, t.toasts.paymentFailed), "error");
    } finally {
      setSubscribing(false);
    }
  };

  const handleRedeem = async () => {
    if (!token || !redeemCode.trim()) return;
    try {
      const res = await coinsApi.redeem(token, redeemCode.trim());
      const data = res.data;
      toast(t.toasts.redeemSuccess(data.coins), "success");
      setRedeemCode("");
      setShowRedeem(false);
      await refreshUser();
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message.toLowerCase() : "";
      const fallback = rawMessage.includes("invalid") || rawMessage.includes("expired")
        ? t.toasts.invalidCode
        : t.toasts.genericError;
      toast(getRuntimeErrorMessage(error, fallback), "error");
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
    <div className={`${plusJakartaSans.className} keyboard-safe-form min-h-screen bg-[#070b16] text-white`}>
      <Navbar mobileTitle={mobileCopy.pageTitle} />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        {prefersMobileLayout ? (
        <div className="mx-auto max-w-[360px]">
          <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#161821_0%,#14141d_48%,#17131b_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-[radial-gradient(110%_90%_at_86%_36%,rgba(255,59,92,0.24)_0%,rgba(255,59,92,0.08)_22%,transparent_64%)]" />
            <div className="absolute inset-y-0 left-[-16%] w-[65%] rotate-[28deg] bg-[repeating-linear-gradient(180deg,rgba(255,59,92,0.1)_0px,rgba(255,59,92,0.1)_2px,transparent_2px,transparent_18px)] opacity-60" />
            <div className="absolute inset-x-0 top-[42%] h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,59,92,0.06)_22%,rgba(255,59,92,0.45)_64%,transparent_100%)]" />
            <div className="relative flex aspect-[21/9] flex-col items-center justify-center gap-1 px-5">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">{t.currentBalance}</p>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <GoldCoinIcon className="h-8 w-8" />
                <span className="text-[48px] font-extrabold leading-none tracking-[-0.04em] text-white">{balance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-full border border-[#2a2f3f] bg-[#141928] p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setActiveTab("coins")}
                aria-pressed={activeTab === "coins"}
                className={`h-10 rounded-full px-4 text-[14px] font-bold transition ${
                  activeTab === "coins"
                    ? "bg-[#ff3b5c] text-white shadow-[0_10px_28px_rgba(255,59,92,0.35)]"
                    : "text-white/60"
                }`}
              >
                {mobileCopy.coinsTab}
              </button>
              <button
                onClick={() => setActiveTab("vip")}
                aria-pressed={activeTab === "vip"}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-bold transition ${
                  activeTab === "vip"
                    ? "bg-[#ff3b5c] text-white shadow-[0_10px_28px_rgba(255,59,92,0.35)]"
                    : "text-white/60"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                {mobileCopy.vipTab}
              </button>
            </div>
          </div>

          {activeTab === "coins" ? (
            <>
              <div className="mt-7 flex items-end justify-between">
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-white">{t.selectPackage}</h2>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ff3b5c]">{t.tagBestValue}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">
                {packages.map((pkg) => {
                  const isSelected = selectedPkg === pkg._id;
                  const hasHotTag = (pkg.tag || "").toLowerCase().includes("best") || (pkg.tag || "").toLowerCase().includes("popular");

                  return (
                    <button
                      key={pkg._id}
                      onClick={() => setSelectedPkg(pkg._id)}
                      aria-pressed={isSelected}
                      className={`relative min-h-[118px] rounded-[18px] px-2 py-3 text-center transition ${
                        isSelected
                          ? "border-2 border-[#ff3b5c] bg-[#0d1120] shadow-[0_0_28px_rgba(255,59,92,0.24)]"
                          : "border border-transparent bg-transparent"
                      }`}
                    >
                      {isSelected && hasHotTag && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-[#ff3b5c] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                          {mobileCopy.hot}
                        </span>
                      )}
                      <span className="mx-auto inline-flex h-5 w-5 items-center justify-center">
                        <GoldCoinIcon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-[16px] font-extrabold leading-none tracking-[-0.03em] text-white">{pkg.coins.toLocaleString()}</p>
                      <p className={`mt-2 text-[12px] font-bold ${isSelected ? "text-[#ff3b5c]" : "text-white/45"}`}>{formatUsd(pkg.price)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.24em] text-white/48">{t.paymentMethodsTitle}</p>
                {mobileProviderPills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mobileProviderPills.map((pill) => {
                      const isSelected = pill.provider === effectiveSelectedProvider && pill.paymentOption === selectedMethodId;
                      return (
                        <button
                          key={pill.key}
                          onClick={() => {
                            setSelectedProvider(pill.provider);
                            setProviderSelections((current) => ({ ...current, [pill.provider]: pill.paymentOption }));
                          }}
                          aria-pressed={isSelected}
                          className={`inline-flex h-12 items-center justify-center rounded-full px-5 text-[14px] font-bold transition ${
                            isSelected
                              ? "bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.12)]"
                              : "border border-[#2b3142] bg-[#171d2a] text-white/85"
                          }`}
                        >
                          {pill.label === "Stripe" ? (
                            <span className="text-[15px] font-black italic tracking-[-0.04em]">stripe</span>
                          ) : (
                            pill.label
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-center text-[14px] text-white/55">
                    {t.noPaymentChannels}
                  </div>
                )}

                {mobileMethodChoices.length > 1 ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {mobileMethodChoices.map(({ provider, method }) => {
                      const isSelected = provider === effectiveSelectedProvider && method.id === selectedMethodId;
                      const methodLabel = method.label.length > 16 ? t.providerLabels[provider] : method.label;
                      return (
                        <button
                          key={`${provider}-${method.id}`}
                          onClick={() => {
                            setSelectedProvider(provider);
                            setProviderSelections((current) => ({ ...current, [provider]: method.id }));
                          }}
                          aria-pressed={isSelected}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                            isSelected
                              ? "bg-[#ff3b5c] text-white"
                              : "border border-[#2b3142] bg-[#171d2a] text-white/70"
                          }`}
                        >
                          {methodLabel}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-center text-[16px] text-white/55">
                    {t.noPaymentMethods}
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between text-[15px] text-white/75">
                <span>Transaction Fee</span>
                <span className="font-bold text-white">$0.00</span>
              </div>

              <button
                onClick={continueWithSelectedMethod}
                disabled={!selected || paying || activeMethods.length === 0}
                className="mt-6 inline-flex h-[58px] w-full items-center justify-center rounded-full bg-[#ff3b5c] px-6 text-[17px] font-extrabold text-white shadow-[0_14px_36px_rgba(255,59,92,0.38)] transition disabled:cursor-not-allowed disabled:opacity-55"
              >
                {paying ? "Processing..." : mobileCopy.confirmAndPay(selected ? formatUsd(selected.price) : "$0.00")}
              </button>

              <p className="mt-4 px-7 text-center text-[10px] leading-4 text-white/45">
                By completing the purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          ) : (
            <>
              <div className="mt-7 flex items-center justify-between">
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-white">{mobileCopy.vipTab}</h2>
                {vipStatus.isActive && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300">{mobileCopy.vipActive}</span>}
              </div>

              {vipStatus.expiresAt && (
                <p className="mt-2 text-[13px] text-white/60">
                  {mobileCopy.vipExpiresOn(new Date(vipStatus.expiresAt).toLocaleDateString(localeTag))}
                </p>
              )}

              <div className="mt-4 space-y-3">
                {vipPlans.length > 0 ? (
                  vipPlans.map((plan) => {
                    const isSelected = selectedVipPlan === plan._id;
                    return (
                      <button
                        key={plan._id}
                        onClick={() => setSelectedVipPlan(plan._id)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-[18px] px-4 py-4 text-left transition ${
                          isSelected
                            ? "border-2 border-[#ff3b5c] bg-[#101525] shadow-[0_0_28px_rgba(255,59,92,0.24)]"
                            : "border border-[#2a2f3f] bg-[#111726]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[16px] font-bold text-white">{plan.name || mobileCopy.vipPlanFallback}</span>
                          <span className="text-[15px] font-bold text-[#ff3b5c]">{vipPriceLabel(plan)}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-center text-[14px] text-white/55">
                    No VIP plans available.
                  </div>
                )}
              </div>

              <button
                onClick={continueWithVipPlan}
                disabled={!selectedVipPlanData || subscribing}
                className="mt-6 inline-flex h-[58px] w-full items-center justify-center rounded-full bg-[#ff3b5c] px-6 text-[17px] font-extrabold text-white shadow-[0_14px_36px_rgba(255,59,92,0.38)] transition disabled:cursor-not-allowed disabled:opacity-55"
              >
                {subscribing ? "Processing..." : mobileCopy.confirmAndPay(selectedVipPlanData ? vipPriceLabel(selectedVipPlanData) : "")}
              </button>
            </>
          )}
        </div>
        ) : (
        <div>
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
                <span className="text-sm text-gray-400">{t.silverCoins}</span>
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
                      <h3 className="text-2xl font-bold text-white">{t.selectedCoins(pkg.coins)}</h3>
                      <p className="mt-2 text-sm font-medium text-zinc-400">
                        {pkg.bonus > 0 ? `+${pkg.bonus.toLocaleString()} ${t.coinsUnit}` : t.standardPack}
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
                        <p className="text-sm font-medium text-zinc-400">{t.selectedPackageLabel}</p>
                        <p className="mt-1 text-lg font-bold text-white">{t.selectedCoins(selected.coins)}</p>
                      </div>
                      <span className="text-sm text-zinc-400">{formatUsd(selected.price)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span className="font-medium">{t.bonusCoins}</span>
                      <span className="font-medium text-yellow-300">+{selected.bonus.toLocaleString()} {t.coinsUnit}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span className="font-medium">{t.serviceFee}</span>
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
              <h2 className="text-2xl font-bold text-white">{t.paymentMethodsTitle}</h2>

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
                        <PaymentMethodText label={method.label} />
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
                {t.supportedMethodsHint}
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
                    autoCapitalize="characters"
                    autoCorrect="off"
                    enterKeyHint="done"
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
        )}
      </div>

      <Footer />
    </div>
  );
}
