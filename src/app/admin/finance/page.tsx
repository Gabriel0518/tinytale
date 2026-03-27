"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminNumber,
  useAdminLocale,
} from "@/lib/admin-i18n";

type AdminLocale = "zh" | "en";
type LocaleLabel = Record<AdminLocale, string>;

const TYPE_BADGE: Record<string, { label: LocaleLabel; cls: string }> = {
  recharge: {
    label: { zh: "充值", en: "Recharge" },
    cls: "bg-green-500/15 text-green-400 border border-green-500/20",
  },
  vip: {
    label: { zh: "VIP 订阅", en: "VIP" },
    cls: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  },
  unlock: {
    label: { zh: "解锁", en: "Unlock" },
    cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  refund: {
    label: { zh: "退款", en: "Refund" },
    cls: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
  task_reward: {
    label: { zh: "任务奖励", en: "Task Reward" },
    cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  },
  promotion: {
    label: { zh: "营销奖励", en: "Promotion" },
    cls: "bg-pink-500/15 text-pink-400 border border-pink-500/20",
  },
};

const STATUS_BADGE: Record<string, { label: LocaleLabel; cls: string }> = {
  completed: {
    label: { zh: "已完成", en: "Completed" },
    cls: "bg-green-500/15 text-green-400",
  },
  pending: {
    label: { zh: "处理中", en: "Pending" },
    cls: "bg-yellow-500/15 text-yellow-400",
  },
  failed: {
    label: { zh: "失败", en: "Failed" },
    cls: "bg-red-500/15 text-red-400",
  },
  refunded: {
    label: { zh: "已退款", en: "Refunded" },
    cls: "bg-gray-500/15 text-gray-300",
  },
};

const SEVERITY_BADGE: Record<string, { label: LocaleLabel; cls: string }> = {
  critical: {
    label: { zh: "严重", en: "Critical" },
    cls: "bg-red-500/20 text-red-300",
  },
  warning: {
    label: { zh: "警告", en: "Warning" },
    cls: "bg-amber-500/20 text-amber-300",
  },
  info: {
    label: { zh: "提示", en: "Info" },
    cls: "bg-blue-500/20 text-blue-300",
  },
};

const CHECKLIST_STATUS_BADGE: Record<string, { label: LocaleLabel; cls: string }> = {
  pass: {
    label: { zh: "通过", en: "Pass" },
    cls: "bg-green-500/20 text-green-300",
  },
  warn: {
    label: { zh: "关注", en: "Warn" },
    cls: "bg-amber-500/20 text-amber-300",
  },
  fail: {
    label: { zh: "失败", en: "Fail" },
    cls: "bg-red-500/20 text-red-300",
  },
};

type RevenueByTypeItem = { _id: string; total: number; count: number };
type CurrencyRevenueItem = {
  _id: string;
  totalPresentmentAmount: number;
  totalUsdAmount: number;
  count: number;
};
type IntegrationRevenueItem = { _id: string; totalUsdAmount: number; count: number };
type TierItem = { _id: number; count: number; totalUsdAmount: number };
type CountryItem = { _id: string; count: number; totalUsdAmount: number };
type MonthlyRevenueItem = {
  _id: { year: number; month: number };
  total: number;
  count: number;
};
type StatusBreakdownItem = { _id: string; count: number; totalAmount: number };
type PaymentMethodBreakdownItem = { _id: string; count: number; totalAmount: number };

type AdaptivePricingSummary = {
  totalCount: number;
  appliedCount: number;
  nonAppliedCount: number;
  appliedRate: number;
};

type RolloutTierSnapshot = {
  tier: number;
  coverage: {
    totalCountries: number;
    enabledCountries: number;
    disabledCountries: number;
    currencyCodes: string[];
  };
  traffic: {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    failedRate: number;
    unresolvedCountryOrders: number;
    unresolvedCountryRate: number;
    adaptiveAppliedCompletedOrders: number;
    adaptiveAppliedRate: number;
    usdVolumeCompleted: number;
    presentmentVolumeCompleted: number;
    lastTransactionAt: string | null;
  };
};

type RolloutAlert = {
  severity: "info" | "warning" | "critical";
  code: string;
  title: string;
  detail: string;
  action: string;
};

type RolloutChecklist = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type RolloutReadiness = {
  generatedAt: string;
  windowDays: number;
  windowStart: string;
  configFlags: {
    stripeAdaptivePricingEnabled: boolean;
    stripeAdaptivePricingSubscriptionEnabled: boolean;
  };
  tiers: RolloutTierSnapshot[];
  global: {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    failedRate: number;
    unresolvedCountryOrders: number;
    unresolvedCountryRate: number;
    adaptiveAppliedCompletedOrders: number;
    adaptiveAppliedRate: number;
    usdVolumeCompleted: number;
    presentmentVolumeCompleted: number;
    lastTransactionAt: string | null;
    hoursSinceLastTx: number | null;
  };
  alerts: RolloutAlert[];
  checklist: RolloutChecklist[];
};

type RolloutTrendPoint = {
  bucket: string;
  snapshotCount: number;
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  unresolvedCountryOrders: number;
  adaptiveAppliedCompletedOrders: number;
  usdVolumeCompleted: number;
  presentmentVolumeCompleted: number;
  failedRate: number;
  unresolvedCountryRate: number;
  adaptiveAppliedRate: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
};

type RolloutTrendData = {
  days: number;
  startDate: string;
  daily: RolloutTrendPoint[];
  weekly: RolloutTrendPoint[];
  monthly: RolloutTrendPoint[];
};

function formatDate(dateStr: string, locale: AdminLocale) {
  if (!dateStr) return "-";
  return formatAdminDate(dateStr, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null, locale: AdminLocale) {
  if (!dateStr) return "-";
  return formatAdminDateTime(dateStr, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonthBucket(item: MonthlyRevenueItem, locale: AdminLocale) {
  const { year, month } = item._id || {};
  if (!year || !month) return "-";
  return formatAdminDate(new Date(Date.UTC(year, month - 1, 1)).toISOString(), locale, {
    year: "numeric",
    month: "short",
  });
}

function formatCurrency(amount: number, locale: AdminLocale, currencyCode = "USD") {
  return formatAdminCurrency(amount, locale, currencyCode);
}

function formatNumber(value: number, locale: AdminLocale) {
  return formatAdminNumber(value, locale);
}

function buildLinePath(values: number[], width: number, height: number, padding = 8) {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const y = height / 2;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }

  const safeValues = values.map((value) => Number(value || 0));
  const minVal = Math.min(...safeValues);
  const maxVal = Math.max(...safeValues);
  const range = maxVal - minVal || 1;
  const stepX = (width - padding * 2) / (safeValues.length - 1);

  return safeValues
    .map((value, index) => {
      const x = padding + index * stepX;
      const normalized = (value - minVal) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getPaymentMethodLabel(method: string, locale: AdminLocale) {
  const normalized = String(method || "").toLowerCase();
  const labels: Record<string, LocaleLabel> = {
    credit_card: { zh: "信用卡", en: "Credit Card" },
    paypal: { zh: "PayPal", en: "PayPal" },
    apple_pay: { zh: "Apple Pay", en: "Apple Pay" },
    google_pay: { zh: "Google Pay", en: "Google Pay" },
    coins: { zh: "金币", en: "Coins" },
    system: { zh: "系统", en: "System" },
    stripe: { zh: "Stripe", en: "Stripe" },
    airwallex: { zh: "Airwallex", en: "Airwallex" },
  };
  return labels[normalized]?.[locale] || method || "-";
}

function translateRolloutText(value: string, locale: AdminLocale) {
  if (locale === "en" || !value) return value;

  const exactMap = new Map<string, string>([
    ["Stripe Adaptive Pricing is disabled", "Stripe 自适应定价未启用"],
    ["Checkout adaptive pricing is turned off globally.", "全局结账自适应定价当前处于关闭状态。"],
    ["Enable STRIPE_ADAPTIVE_PRICING_ENABLED and redeploy backend.", "请启用 STRIPE_ADAPTIVE_PRICING_ENABLED 并重新部署后端。"],
    ["Subscription adaptive pricing is disabled", "订阅自适应定价未启用"],
    ["VIP subscriptions are not using adaptive pricing.", "VIP 订阅当前未启用自适应定价。"],
    ["Enable STRIPE_ADAPTIVE_PRICING_SUBSCRIPTION_ENABLED if subscription localization is required.", "如需本地化订阅定价，请启用 STRIPE_ADAPTIVE_PRICING_SUBSCRIPTION_ENABLED。"],
    ["Inspect Stripe payment failures and perform immediate incident handling.", "请立即排查 Stripe 支付失败原因并执行故障处理。"],
    ["Investigate failure reasons and optimize retry/fallback flows.", "请排查失败原因并优化重试/降级流程。"],
    ["Check checkout session adaptive_pricing configuration and fallback paths.", "请检查 checkout session 的 adaptive_pricing 配置及降级路径。"],
    ["Unknown country mapping rate is high", "未知国家映射比例过高"],
    ["Update country catalog alpha2 coverage and verify upstream IP geolocation headers.", "请补齐国家目录 alpha2 覆盖并核对上游 IP 地理定位请求头。"],
    ["No completed rollout transaction in the last 24 hours", "最近 24 小时没有完成的 rollout 交易"],
    ["Check payment funnel health, traffic allocation, and Stripe webhook processing.", "请检查支付漏斗健康度、流量分配以及 Stripe webhook 处理。"],
    ["Tier1/Tier2/Tier3 country catalog coverage", "Tier1 / Tier2 / Tier3 国家目录覆盖"],
    ["Adaptive pricing switches enabled", "自适应定价开关状态"],
    ["Global payment failure rate < 5%", "全局支付失败率 < 5%"],
    ["Unknown country mapping rate < 5%", "未知国家映射比例 < 5%"],
  ]);

  const exact = exactMap.get(value);
  if (exact) return exact;

  const matchers: Array<[RegExp, (...args: string[]) => string]> = [
    [/^Tier (\d+) has no enabled countries$/i, (tier) => `Tier ${tier} 暂无启用国家`],
    [/^Tier (\d+) cannot receive localized pricing traffic because no country is enabled\.$/i, (tier) => `由于没有启用国家，Tier ${tier} 当前无法接收本地化定价流量。`],
    [/^Enable at least one Tier (\d+) country in Country Catalog\.$/i, (tier) => `请在国家目录中至少启用一个 Tier ${tier} 国家。`],
    [/^Tier (\d+) has no recent traffic$/i, (tier) => `Tier ${tier} 最近没有流量`],
    [/^No recharge\/VIP orders were recorded in the last (\d+) day\(s\)\.$/i, (days) => `最近 ${days} 天没有记录到充值 / VIP 订单。`],
    [/^Validate Tier (\d+) rollout campaigns, routing and checkout funnel\.$/i, (tier) => `请检查 Tier ${tier} 的投放活动、路由和结账漏斗。`],
    [/^Tier (\d+) has critical payment failure rate$/i, (tier) => `Tier ${tier} 支付失败率已达严重级别`],
    [/^Failure rate reached ([\d.]+)% in the last (\d+) day\(s\)\.$/i, (rate, days) => `最近 ${days} 天失败率已达到 ${rate}%。`],
    [/^Tier (\d+) payment failure rate is elevated$/i, (tier) => `Tier ${tier} 支付失败率偏高`],
    [/^Failure rate is ([\d.]+)% in the last (\d+) day\(s\)\.$/i, (rate, days) => `最近 ${days} 天失败率为 ${rate}%。`],
    [/^Tier (\d+) adaptive pricing coverage is low$/i, (tier) => `Tier ${tier} 自适应定价覆盖率偏低`],
    [/^Adaptive pricing applied rate is ([\d.]+)%\.$/i, (rate) => `自适应定价应用比例为 ${rate}%。`],
    [/^([\d.]+)% of orders could not be mapped to country catalog entries\.$/i, (rate) => `${rate}% 的订单无法映射到国家目录条目。`],
    [/^Last completed transaction happened ([\d.]+) hour\(s\) ago\.$/i, (hours) => `最近一次完成交易发生在 ${hours} 小时前。`],
    [/^Traffic observed in last (\d+) day\(s\)$/i, (days) => `最近 ${days} 天流量观测`],
    [/^Checkout:(on|off) · Subscription:(on|off)$/i, (checkout, subscription) => `结账：${checkout === "on" ? "开启" : "关闭"} · 订阅：${subscription === "on" ? "开启" : "关闭"}`],
  ];

  for (const [pattern, formatter] of matchers) {
    const match = value.match(pattern);
    if (match) return formatter(...match.slice(1));
  }

  return value;
}

function getFinanceCopy(locale: AdminLocale) {
  if (locale === "zh") {
    return {
      pageTitle: "财务概览",
      loading: "加载中...",
      grossRevenue: "毛收入（USD）",
      grossRevenueHint: "充值 + VIP 总收入，包含已退款原订单。",
      netRevenue: "净收入（USD）",
      netRevenueHint: "毛收入减去已退款金额后的净值。",
      rechargeRevenue: "充值收入",
      rechargeRevenueHint: "金币充值收入汇总。",
      vipRevenue: "VIP 订阅收入",
      vipRevenueHint: "VIP 订阅收入汇总。",
      totalRefunds: "退款总额",
      refundHint: (count: number) => `${formatNumber(count, "zh")} 笔收入订单`,
      adaptiveCoverage: "自适应定价覆盖率",
      adaptiveCoverageHint: (applied: number, total: number) => `${formatNumber(applied, "zh")} / ${formatNumber(total, "zh")} 笔收入订单`,
      statusOverview: "交易状态概览",
      statusOverviewHint: "按交易状态查看数量与金额，便于快速发现漏斗异常。",
      monthlyRevenue: "近 6 个月收入趋势",
      monthlyRevenueHint: "按月查看收入和订单量变化。",
      noMonthlyRevenue: "暂无月度收入数据",
      revenueByType: "交易类型分布",
      revenueByTypeHint: "展示各交易类型的笔数与金额汇总。",
      noTypeData: "暂无类型数据",
      paymentMethod: "支付方式分布",
      paymentMethodHint: "收入订单按支付方式的分布情况。",
      noPaymentData: "暂无支付方式数据",
      rolloutReadiness: "Rollout 健康监控",
      rolloutReadinessHint: "基于国家目录和支付流量，跟踪 Tier1 / Tier2 / Tier3 上线状态。",
      window: "窗口",
      captureSnapshot: "抓取快照",
      capturing: "抓取中...",
      captureSuccess: "快照抓取成功。",
      captureFail: "快照抓取失败。",
      rolloutUnavailable: "暂无 rollout 健康数据。",
      globalFailedRate: "全局失败率",
      unknownCountryRate: "未知国家比例",
      adaptiveAppliedRate: "自适应应用率",
      lastCompletedOrder: "最近完成订单",
      hoursAgo: (hours: number | null) => (hours === null ? "-" : `${hours.toFixed(2)} 小时前`),
      tier: "层级",
      enabledCountries: "启用国家",
      orders: "订单",
      failedRate: "失败率",
      adaptiveRate: "自适应比例",
      usdVolume: "USD 金额",
      completedOrders: (count: number) => `${formatNumber(count, "zh")} 已完成`,
      operationalAlerts: "运营告警",
      noActiveAlerts: "当前没有活动告警。",
      action: "处理建议",
      goLiveChecklist: "上线检查清单",
      rolloutTrends: "Rollout 趋势",
      rolloutTrendsHint: "将每日快照聚合为周 / 月趋势。",
      noTrends: "暂无趋势快照，请先抓取快照。",
      dataBuckets: "数据桶数量",
      from: "起始于",
      latestFailedRate: "最新失败率",
      latestAdaptiveRate: "最新自适应比例",
      failedRateTrend: "失败率趋势（%）",
      adaptiveTrend: "自适应比例趋势（%）",
      bucket: "时间桶",
      criticalWarning: "严重 / 警告",
      presentmentBreakdown: "结算币种分布",
      presentmentBreakdownHint: "按实际支付币种统计本地货币金额与 USD 基础金额。",
      currency: "币种",
      orderCount: "订单数",
      presentmentTotal: "本地币种金额",
      baseTotal: "USD 基础金额",
      noCurrencyData: "暂无币种数据",
      pricingTier: "定价层级分布",
      noTierData: "暂无层级数据",
      topCountries: "重点国家",
      noCountryData: "暂无国家数据",
      integrationBreakdown: "集成币种分布",
      noIntegrationData: "暂无集成币种数据",
      recentTransactions: "最近交易",
      recentTransactionsHint: "展示最新财务流水，便于快速核对订单状态、区域和用户信息。",
      type: "类型",
      presentment: "支付金额",
      base: "基础金额（USD）",
      region: "区域",
      user: "用户",
      date: "日期",
      status: "状态",
      noTransactions: "暂无交易记录",
      adaptive: "自适应",
      fixed: "固定",
      unknownUser: "未知用户",
      unknownCountry: "未知地区",
      tierValue: (value: string | number) => `第 ${value} 层`,
    };
  }

  return {
    pageTitle: "Finance Overview",
    loading: "Loading...",
    grossRevenue: "Gross Revenue (USD)",
    grossRevenueHint: "Recharge + VIP gross revenue, including refunded source orders.",
    netRevenue: "Net Revenue (USD)",
    netRevenueHint: "Gross revenue minus refunded amount.",
    rechargeRevenue: "Recharge Revenue",
    rechargeRevenueHint: "Coin recharge revenue total.",
    vipRevenue: "VIP Subscription Revenue",
    vipRevenueHint: "VIP subscription revenue total.",
    totalRefunds: "Total Refunds",
    refundHint: (count: number) => `${formatNumber(count, "en")} revenue orders`,
    adaptiveCoverage: "Adaptive Pricing Coverage",
    adaptiveCoverageHint: (applied: number, total: number) => `${formatNumber(applied, "en")} / ${formatNumber(total, "en")} revenue orders`,
    statusOverview: "Transaction Status Overview",
    statusOverviewHint: "Track counts and amounts by transaction status.",
    monthlyRevenue: "6-Month Revenue Trend",
    monthlyRevenueHint: "Monthly revenue and order count movement.",
    noMonthlyRevenue: "No monthly revenue data",
    revenueByType: "Revenue by Type",
    revenueByTypeHint: "Volume and amount grouped by transaction type.",
    noTypeData: "No type data",
    paymentMethod: "Payment Method Breakdown",
    paymentMethodHint: "Revenue order distribution by payment method.",
    noPaymentData: "No payment method data",
    rolloutReadiness: "Rollout Readiness Monitor",
    rolloutReadinessHint: "Tier1 / Tier2 / Tier3 launch health based on country catalog and payment traffic.",
    window: "Window",
    captureSnapshot: "Capture Snapshot",
    capturing: "Capturing...",
    captureSuccess: "Snapshot captured successfully.",
    captureFail: "Snapshot capture failed.",
    rolloutUnavailable: "Rollout readiness data is unavailable.",
    globalFailedRate: "Global Failed Rate",
    unknownCountryRate: "Unknown Country Rate",
    adaptiveAppliedRate: "Adaptive Applied Rate",
    lastCompletedOrder: "Last Completed Order",
    hoursAgo: (hours: number | null) => (hours === null ? "-" : `${hours.toFixed(2)}h ago`),
    tier: "Tier",
    enabledCountries: "Enabled Countries",
    orders: "Orders",
    failedRate: "Failed Rate",
    adaptiveRate: "Adaptive Rate",
    usdVolume: "USD Volume",
    completedOrders: (count: number) => `${formatNumber(count, "en")} completed`,
    operationalAlerts: "Operational Alerts",
    noActiveAlerts: "No active alerts.",
    action: "Action",
    goLiveChecklist: "Go-live Checklist",
    rolloutTrends: "Rollout Trends",
    rolloutTrendsHint: "Daily snapshots aggregated into weekly / monthly trends.",
    noTrends: "No trend snapshots yet. Capture snapshots to build trends.",
    dataBuckets: "Data Buckets",
    from: "From",
    latestFailedRate: "Latest Failed Rate",
    latestAdaptiveRate: "Latest Adaptive Rate",
    failedRateTrend: "Failed Rate Trend (%)",
    adaptiveTrend: "Adaptive Applied Trend (%)",
    bucket: "Bucket",
    criticalWarning: "Critical / Warning",
    presentmentBreakdown: "Presentment Currency Breakdown",
    presentmentBreakdownHint: "Local currency totals grouped by actual checkout presentment currency.",
    currency: "Currency",
    orderCount: "Orders",
    presentmentTotal: "Presentment Total",
    baseTotal: "USD Base Total",
    noCurrencyData: "No currency data found",
    pricingTier: "Pricing Tier Distribution",
    noTierData: "No tier data found",
    topCountries: "Top Countries",
    noCountryData: "No country data found",
    integrationBreakdown: "Integration Currency Breakdown",
    noIntegrationData: "No integration currency data found",
    recentTransactions: "Recent Transactions",
    recentTransactionsHint: "Latest finance activity across order status, geography, and user records.",
    type: "Type",
    presentment: "Presentment",
    base: "Base (USD)",
    region: "Region",
    user: "User",
    date: "Date",
    status: "Status",
    noTransactions: "No transactions found",
    adaptive: "Adaptive",
    fixed: "Fixed",
    unknownUser: "Unknown",
    unknownCountry: "Unknown Region",
    tierValue: (value: string | number) => `Tier ${value}`,
  };
}

function getBreakdownCount(items: StatusBreakdownItem[], status: string) {
  return Number(items.find((item) => item._id === status)?.count || 0);
}

function getBreakdownAmount(items: StatusBreakdownItem[], status: string) {
  return Number(items.find((item) => item._id === status)?.totalAmount || 0);
}

export default function AdminFinancePage() {
  const { locale } = useAdminLocale();
  const text = getFinanceCopy(locale);
  const [loading, setLoading] = useState(true);
  const [rolloutWindowDays, setRolloutWindowDays] = useState(7);
  const [trendDays, setTrendDays] = useState(90);
  const [trendBucket, setTrendBucket] = useState<"weekly" | "monthly">("weekly");
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<"" | "success" | "failed">("");
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByTypeItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [presentmentRevenueByCurrency, setPresentmentRevenueByCurrency] = useState<CurrencyRevenueItem[]>([]);
  const [integrationRevenueByCurrency, setIntegrationRevenueByCurrency] = useState<IntegrationRevenueItem[]>([]);
  const [adaptivePricing, setAdaptivePricing] = useState<AdaptivePricingSummary>({
    totalCount: 0,
    appliedCount: 0,
    nonAppliedCount: 0,
    appliedRate: 0,
  });
  const [pricingTierBreakdown, setPricingTierBreakdown] = useState<TierItem[]>([]);
  const [topCountries, setTopCountries] = useState<CountryItem[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownItem[]>([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<PaymentMethodBreakdownItem[]>([]);
  const [rolloutReadiness, setRolloutReadiness] = useState<RolloutReadiness | null>(null);
  const [rolloutTrends, setRolloutTrends] = useState<RolloutTrendData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [financeResult, rolloutResult, trendResult] = await Promise.allSettled([
          adminApi.getFinanceOverview(),
          adminApi.getRolloutReadiness(rolloutWindowDays),
          adminApi.getRolloutTrends(trendDays),
        ]);

        if (financeResult.status === "fulfilled") {
          const res: any = financeResult.value;
          if (res?.success && res.data) {
            const gross = Number(res.data.grossRevenue ?? res.data.totalRevenue ?? 0);
            const refunds = Number(res.data.totalRefunds || 0);
            setGrossRevenue(gross);
            setNetRevenue(Number(res.data.netRevenue ?? gross - refunds));
            setTotalTransactions(Number(res.data.totalTransactions || 0));
            setTotalRefunds(refunds);
            setRecentTransactions(Array.isArray(res.data.recentTransactions) ? res.data.recentTransactions : []);
            setRevenueByType(Array.isArray(res.data.revenueByType) ? res.data.revenueByType : []);
            setMonthlyRevenue(Array.isArray(res.data.monthlyRevenue) ? res.data.monthlyRevenue : []);
            setPresentmentRevenueByCurrency(Array.isArray(res.data.presentmentRevenueByCurrency) ? res.data.presentmentRevenueByCurrency : []);
            setIntegrationRevenueByCurrency(Array.isArray(res.data.integrationRevenueByCurrency) ? res.data.integrationRevenueByCurrency : []);
            setAdaptivePricing(res.data.adaptivePricing || {
              totalCount: 0,
              appliedCount: 0,
              nonAppliedCount: 0,
              appliedRate: 0,
            });
            setPricingTierBreakdown(Array.isArray(res.data.pricingTierBreakdown) ? res.data.pricingTierBreakdown : []);
            setTopCountries(Array.isArray(res.data.topCountries) ? res.data.topCountries : []);
            setStatusBreakdown(Array.isArray(res.data.statusBreakdown) ? res.data.statusBreakdown : []);
            setPaymentMethodBreakdown(Array.isArray(res.data.paymentMethodBreakdown) ? res.data.paymentMethodBreakdown : []);
          }
        }

        if (rolloutResult.status === "fulfilled") {
          const res: any = rolloutResult.value;
          setRolloutReadiness(res?.success && res.data ? (res.data as RolloutReadiness) : null);
        } else {
          setRolloutReadiness(null);
        }

        if (trendResult.status === "fulfilled") {
          const res: any = trendResult.value;
          setRolloutTrends(res?.success && res.data ? (res.data as RolloutTrendData) : null);
        } else {
          setRolloutTrends(null);
        }
      } catch {
        // ignore transient API errors and render fallbacks
      } finally {
        setLoading(false);
      }
    })();
  }, [rolloutWindowDays, trendDays]);

  const triggerCaptureSnapshot = async () => {
    try {
      setCaptureLoading(true);
      setCaptureMessage("");
      const res: any = await adminApi.captureRolloutSnapshot(rolloutWindowDays);
      if (res?.success) {
        const [refreshReadiness, refreshTrends]: any = await Promise.all([
          adminApi.getRolloutReadiness(rolloutWindowDays),
          adminApi.getRolloutTrends(trendDays),
        ]);
        if (refreshReadiness?.success && refreshReadiness.data) {
          setRolloutReadiness(refreshReadiness.data as RolloutReadiness);
        }
        if (refreshTrends?.success && refreshTrends.data) {
          setRolloutTrends(refreshTrends.data as RolloutTrendData);
        }
        setCaptureMessage("success");
      } else {
        setCaptureMessage("failed");
      }
    } catch {
      setCaptureMessage("failed");
    } finally {
      setCaptureLoading(false);
    }
  };

  const getRevenueForType = (type: string) => {
    const item = revenueByType.find((r) => r._id === type);
    return Number(item?.total || 0);
  };

  const trendSeries = trendBucket === "monthly"
    ? (rolloutTrends?.monthly || [])
    : (rolloutTrends?.weekly || []);

  const failedRatePath = buildLinePath(trendSeries.map((item) => Number(item.failedRate || 0)), 560, 180);
  const adaptiveRatePath = buildLinePath(trendSeries.map((item) => Number(item.adaptiveAppliedRate || 0)), 560, 180);
  const localizedAlerts = rolloutReadiness?.alerts.map((alert) => ({
    ...alert,
    title: translateRolloutText(alert.title, locale),
    detail: translateRolloutText(alert.detail, locale),
    action: translateRolloutText(alert.action, locale),
  })) || [];
  const localizedChecklist = rolloutReadiness?.checklist.map((item) => ({
    ...item,
    label: translateRolloutText(item.label, locale),
    detail: translateRolloutText(item.detail, locale),
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <h1 className="mb-8 text-2xl font-bold text-gray-200">{text.pageTitle}</h1>
        <div className="py-20 text-center text-gray-500">{text.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      <h1 className="mb-8 text-2xl font-bold text-white">{text.pageTitle}</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.grossRevenue}</p>
          <p className="mt-2 text-3xl font-bold text-green-400">{formatCurrency(grossRevenue, locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{text.grossRevenueHint}</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.netRevenue}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{formatCurrency(netRevenue, locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{text.netRevenueHint}</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.rechargeRevenue}</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{formatCurrency(getRevenueForType("recharge"), locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{text.rechargeRevenueHint}</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.vipRevenue}</p>
          <p className="mt-2 text-3xl font-bold text-purple-400">{formatCurrency(getRevenueForType("vip"), locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{text.vipRevenueHint}</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.totalRefunds}</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{formatCurrency(totalRefunds, locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{text.refundHint(totalTransactions)}</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">{text.adaptiveCoverage}</p>
          <p className="mt-2 text-3xl font-bold text-indigo-300">{Number(adaptivePricing.appliedRate || 0).toFixed(2)}%</p>
          <p className="mt-1 text-xs text-gray-500">{text.adaptiveCoverageHint(adaptivePricing.appliedCount || 0, adaptivePricing.totalCount || 0)}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{text.statusOverview}</h2>
          <p className="mt-1 text-xs text-gray-500">{text.statusOverviewHint}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["completed", "pending", "failed", "refunded"] as const).map((status) => {
            const cfg = STATUS_BADGE[status];
            return (
              <div key={status} className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
                    {cfg.label[locale]}
                  </span>
                  <span className="text-xs text-gray-500">{formatNumber(getBreakdownCount(statusBreakdown, status), locale)}</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-gray-100">
                  {formatCurrency(getBreakdownAmount(statusBreakdown, status), locale, "USD")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">{text.monthlyRevenue}</h2>
            <p className="mt-1 text-xs text-gray-500">{text.monthlyRevenueHint}</p>
          </div>
          <div className="space-y-3">
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-gray-500">{text.noMonthlyRevenue}</p>
            ) : (
              monthlyRevenue.map((item) => (
                <div key={`${item._id?.year}-${item._id?.month}`} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{formatMonthBucket(item, locale)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.count, locale)} {text.orderCount}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-300">{formatCurrency(item.total || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">{text.revenueByType}</h2>
            <p className="mt-1 text-xs text-gray-500">{text.revenueByTypeHint}</p>
          </div>
          <div className="space-y-3">
            {revenueByType.length === 0 ? (
              <p className="text-sm text-gray-500">{text.noTypeData}</p>
            ) : (
              revenueByType.map((item) => {
                const typeCfg = TYPE_BADGE[item._id] || {
                  label: { zh: item._id, en: item._id },
                  cls: "bg-gray-500/15 text-gray-300 border border-gray-500/20",
                };
                return (
                  <div key={item._id} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                    <div>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCfg.cls}`}>
                        {typeCfg.label[locale]}
                      </span>
                      <p className="mt-2 text-xs text-gray-500">{formatNumber(item.count, locale)} {text.orderCount}</p>
                    </div>
                    <p className={`text-sm font-semibold ${item.total >= 0 ? "text-indigo-300" : "text-red-300"}`}>
                      {formatCurrency(item.total || 0, locale, "USD")}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">{text.paymentMethod}</h2>
            <p className="mt-1 text-xs text-gray-500">{text.paymentMethodHint}</p>
          </div>
          <div className="space-y-3">
            {paymentMethodBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">{text.noPaymentData}</p>
            ) : (
              paymentMethodBreakdown.map((item) => (
                <div key={item._id || "unknown"} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{getPaymentMethodLabel(item._id, locale)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.count, locale)} {text.orderCount}</p>
                  </div>
                  <p className="text-sm font-semibold text-cyan-300">{formatCurrency(item.totalAmount || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{text.rolloutReadiness}</h2>
            <p className="mt-1 text-xs text-gray-500">{text.rolloutReadinessHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{text.window}</span>
            <select
              value={String(rolloutWindowDays)}
              onChange={(e) => setRolloutWindowDays(Number(e.target.value) || 7)}
              className="rounded-md border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-xs text-gray-200"
            >
              <option value="1">{locale === "zh" ? "1 天" : "1 day"}</option>
              <option value="3">{locale === "zh" ? "3 天" : "3 days"}</option>
              <option value="7">{locale === "zh" ? "7 天" : "7 days"}</option>
              <option value="14">{locale === "zh" ? "14 天" : "14 days"}</option>
              <option value="30">{locale === "zh" ? "30 天" : "30 days"}</option>
            </select>
            <button
              onClick={triggerCaptureSnapshot}
              disabled={captureLoading}
              className="rounded-md border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {captureLoading ? text.capturing : text.captureSnapshot}
            </button>
          </div>
        </div>

        {!rolloutReadiness ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">{text.rolloutUnavailable}</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.globalFailedRate}</p>
                <p className="mt-1 text-2xl font-semibold text-red-300">{rolloutReadiness.global.failedRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.unknownCountryRate}</p>
                <p className="mt-1 text-2xl font-semibold text-amber-300">{rolloutReadiness.global.unresolvedCountryRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.adaptiveAppliedRate}</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">{rolloutReadiness.global.adaptiveAppliedRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.lastCompletedOrder}</p>
                <p className="mt-1 text-sm font-medium text-gray-200">{formatDateTime(rolloutReadiness.global.lastTransactionAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">{text.hoursAgo(rolloutReadiness.global.hoursSinceLastTx)}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-[#161625]">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.tier}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.enabledCountries}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.orders}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.failedRate}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.adaptiveRate}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.usdVolume}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {rolloutReadiness.tiers.map((item) => (
                    <tr key={item.tier} className="hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-200">{text.tierValue(item.tier)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">
                        {item.coverage.enabledCountries}/{item.coverage.totalCountries}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">
                        {formatNumber(item.traffic.totalOrders, locale)} ({text.completedOrders(item.traffic.completedOrders)})
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2 text-sm ${item.traffic.failedRate >= 15 ? "text-red-300" : item.traffic.failedRate >= 5 ? "text-amber-300" : "text-green-300"}`}>
                        {item.traffic.failedRate.toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-indigo-300">{item.traffic.adaptiveAppliedRate.toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">{formatCurrency(item.traffic.usdVolumeCompleted, locale, "USD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">{text.operationalAlerts}</h3>
                {localizedAlerts.length === 0 ? (
                  <p className="text-sm text-green-300">{text.noActiveAlerts}</p>
                ) : (
                  <div className="space-y-2">
                    {localizedAlerts.map((alert) => {
                      const cfg = SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.info;
                      return (
                        <div key={alert.code} className="rounded-md border border-gray-700/50 bg-[#151523] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-100">{alert.title}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${cfg.cls}`}>
                              {cfg.label[locale]}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">{alert.detail}</p>
                          <p className="mt-1 text-xs text-indigo-300">{text.action}: {alert.action}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">{text.goLiveChecklist}</h3>
                <div className="space-y-2">
                  {localizedChecklist.map((item) => {
                    const cfg = CHECKLIST_STATUS_BADGE[item.status] || CHECKLIST_STATUS_BADGE.warn;
                    return (
                      <div key={item.key} className="rounded-md border border-gray-700/50 bg-[#151523] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-100">{item.label}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${cfg.cls}`}>
                            {cfg.label[locale]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{item.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {captureMessage ? (
              <p className={`text-xs ${captureMessage === "success" ? "text-green-300" : "text-red-300"}`}>
                {captureMessage === "success" ? text.captureSuccess : text.captureFail}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{text.rolloutTrends}</h2>
            <p className="mt-1 text-xs text-gray-500">{text.rolloutTrendsHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={String(trendDays)}
              onChange={(e) => setTrendDays(Number(e.target.value) || 90)}
              className="rounded-md border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-xs text-gray-200"
            >
              <option value="30">{locale === "zh" ? "30 天" : "30 days"}</option>
              <option value="60">{locale === "zh" ? "60 天" : "60 days"}</option>
              <option value="90">{locale === "zh" ? "90 天" : "90 days"}</option>
              <option value="180">{locale === "zh" ? "180 天" : "180 days"}</option>
            </select>
            <div className="inline-flex rounded-md border border-gray-700/50 bg-[#1a1a2e] p-0.5 text-xs">
              <button
                onClick={() => setTrendBucket("weekly")}
                className={`rounded px-2 py-1 ${trendBucket === "weekly" ? "bg-indigo-500/30 text-indigo-200" : "text-gray-400"}`}
              >
                {locale === "zh" ? "周" : "Weekly"}
              </button>
              <button
                onClick={() => setTrendBucket("monthly")}
                className={`rounded px-2 py-1 ${trendBucket === "monthly" ? "bg-indigo-500/30 text-indigo-200" : "text-gray-400"}`}
              >
                {locale === "zh" ? "月" : "Monthly"}
              </button>
            </div>
          </div>
        </div>

        {!rolloutTrends || trendSeries.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">{text.noTrends}</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.dataBuckets}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-100">{formatNumber(trendSeries.length, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">{text.from} {formatDate(rolloutTrends.startDate, locale)}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.latestFailedRate}</p>
                <p className="mt-1 text-2xl font-semibold text-red-300">{Number(trendSeries[trendSeries.length - 1]?.failedRate || 0).toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">{text.latestAdaptiveRate}</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">{Number(trendSeries[trendSeries.length - 1]?.adaptiveAppliedRate || 0).toFixed(2)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="mb-2 text-sm font-medium text-gray-100">{text.failedRateTrend}</p>
                <svg viewBox="0 0 560 180" className="h-44 w-full rounded bg-[#121220]">
                  <path d={failedRatePath} fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="mb-2 text-sm font-medium text-gray-100">{text.adaptiveTrend}</p>
                <svg viewBox="0 0 560 180" className="h-44 w-full rounded bg-[#121220]">
                  <path d={adaptiveRatePath} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-[#161625]">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.bucket}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.orders}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.failedRate}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.adaptiveRate}</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.criticalWarning}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {trendSeries.map((item) => (
                    <tr key={item.bucket} className="hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-200">{item.bucket}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">{formatNumber(item.totalOrders, locale)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-red-300">{item.failedRate.toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-indigo-300">{item.adaptiveAppliedRate.toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">{formatNumber(item.criticalCount, locale)}/{formatNumber(item.warningCount, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="border-b border-gray-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{text.presentmentBreakdown}</h2>
          <p className="mt-1 text-xs text-gray-500">{text.presentmentBreakdownHint}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.currency}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.orderCount}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.presentmentTotal}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.baseTotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {presentmentRevenueByCurrency.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">{text.noCurrencyData}</td></tr>
              ) : (
                presentmentRevenueByCurrency.map((item) => {
                  const currency = String(item._id || "usd").toUpperCase();
                  return (
                    <tr key={currency} className="transition-colors hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-200">{currency}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-400">{formatNumber(item.count, locale)}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-200">{formatCurrency(item.totalPresentmentAmount || 0, locale, currency)}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-400">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">{text.pricingTier}</h2>
          <div className="space-y-3">
            {pricingTierBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">{text.noTierData}</p>
            ) : (
              pricingTierBreakdown.map((item) => (
                <div key={String(item._id)} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{text.tierValue(item._id || "-")}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.count, locale)} {text.orderCount}</p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-300">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">{text.topCountries}</h2>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-sm text-gray-500">{text.noCountryData}</p>
            ) : (
              topCountries.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item._id || text.unknownCountry}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.count, locale)} {text.orderCount}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-300">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{text.integrationBreakdown}</h2>
        <div className="flex flex-wrap gap-3">
          {integrationRevenueByCurrency.length === 0 ? (
            <p className="text-sm text-gray-500">{text.noIntegrationData}</p>
          ) : (
            integrationRevenueByCurrency.map((item) => (
              <div key={item._id} className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2">
                <p className="text-xs text-gray-500">{String(item._id || "usd").toUpperCase()} · {formatNumber(item.count, locale)}</p>
                <p className="text-sm font-semibold text-gray-200">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="border-b border-gray-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{text.recentTransactions}</h2>
          <p className="mt-1 text-xs text-gray-500">{text.recentTransactionsHint}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.type}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.presentment}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.base}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.region}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.user}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.date}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{text.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">{text.noTransactions}</td></tr>
              ) : (
                recentTransactions.map((tx: any) => {
                  const user = tx.userId && typeof tx.userId === "object" ? tx.userId : null;
                  const typeCfg = TYPE_BADGE[tx.type] || {
                    label: { zh: tx.type || "-", en: tx.type || "-" },
                    cls: "bg-gray-500/15 text-gray-300 border border-gray-500/20",
                  };
                  const statusCfg = STATUS_BADGE[tx.status] || {
                    label: { zh: tx.status || "-", en: tx.status || "-" },
                    cls: "bg-gray-500/15 text-gray-300",
                  };
                  const presentmentCurrency = String(tx.presentmentCurrency || tx.integrationCurrency || "usd").toLowerCase();
                  const presentmentAmount = Number(tx.presentmentAmount || 0) > 0
                    ? Number(tx.presentmentAmount)
                    : Number(tx.amount || 0);
                  const countryLabel = tx.countryCode ? String(tx.countryCode).toUpperCase() : text.unknownCountry;
                  return (
                    <tr key={tx._id} className="transition-colors hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCfg.cls}`}>
                            {typeCfg.label[locale]}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${tx.adaptivePricingApplied ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-700/50 text-gray-400"}`}>
                            {tx.adaptivePricingApplied ? text.adaptive : text.fixed}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-200">
                        {formatCurrency(presentmentAmount, locale, presentmentCurrency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {formatCurrency(Number(tx.amount || 0), locale, "USD")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {countryLabel} · {text.tierValue(tx.pricingTier || "-")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {user?.nickname || user?.email || text.unknownUser}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {formatDate(tx.createdAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.cls}`}>
                          {statusCfg.label[locale]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
