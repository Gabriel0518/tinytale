"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { formatAdminCurrency, formatAdminDate, formatAdminDateTime, useAdminLocale } from "@/lib/admin-i18n";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  recharge: { label: "Recharge", cls: "bg-green-500/15 text-green-400 border border-green-500/20" },
  vip: { label: "VIP", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
  unlock: { label: "Unlock", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  refund: { label: "Refund", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
  task_reward: { label: "Task Reward", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
  promotion: { label: "Promotion", cls: "bg-pink-500/15 text-pink-400 border border-pink-500/20" },
};

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-red-500/15 text-red-400",
  refunded: "bg-gray-500/15 text-gray-400",
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

function formatDate(dateStr: string, locale: "zh" | "en") {
  if (!dateStr) return "-";
  return formatAdminDate(dateStr, locale, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(dateStr: string | null, locale: "zh" | "en") {
  if (!dateStr) return "-";
  return formatAdminDateTime(dateStr, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, locale: "zh" | "en", currencyCode = "USD") {
  return formatAdminCurrency(amount, locale, currencyCode);
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

export default function AdminFinancePage() {
  const { locale } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [rolloutWindowDays, setRolloutWindowDays] = useState(7);
  const [trendDays, setTrendDays] = useState(90);
  const [trendBucket, setTrendBucket] = useState<"weekly" | "monthly">("weekly");
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureMessage, setCaptureMessage] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByTypeItem[]>([]);
  const [presentmentRevenueByCurrency, setPresentmentRevenueByCurrency] = useState<CurrencyRevenueItem[]>([]);
  const [integrationRevenueByCurrency, setIntegrationRevenueByCurrency] = useState<IntegrationRevenueItem[]>([]);
  const [adaptivePricing, setAdaptivePricing] = useState<AdaptivePricingSummary>({ totalCount: 0, appliedCount: 0, nonAppliedCount: 0, appliedRate: 0 });
  const [pricingTierBreakdown, setPricingTierBreakdown] = useState<TierItem[]>([]);
  const [topCountries, setTopCountries] = useState<CountryItem[]>([]);
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
            setTotalRevenue(Number(res.data.totalRevenue || 0));
            setTotalTransactions(Number(res.data.totalTransactions || 0));
            setTotalRefunds(Number(res.data.totalRefunds || 0));
            setRecentTransactions(Array.isArray(res.data.recentTransactions) ? res.data.recentTransactions : []);
            setRevenueByType(Array.isArray(res.data.revenueByType) ? res.data.revenueByType : []);
            setPresentmentRevenueByCurrency(Array.isArray(res.data.presentmentRevenueByCurrency) ? res.data.presentmentRevenueByCurrency : []);
            setIntegrationRevenueByCurrency(Array.isArray(res.data.integrationRevenueByCurrency) ? res.data.integrationRevenueByCurrency : []);
            setAdaptivePricing(res.data.adaptivePricing || { totalCount: 0, appliedCount: 0, nonAppliedCount: 0, appliedRate: 0 });
            setPricingTierBreakdown(Array.isArray(res.data.pricingTierBreakdown) ? res.data.pricingTierBreakdown : []);
            setTopCountries(Array.isArray(res.data.topCountries) ? res.data.topCountries : []);
          }
        }

        if (rolloutResult.status === "fulfilled") {
          const res: any = rolloutResult.value;
          if (res?.success && res.data) {
            setRolloutReadiness(res.data as RolloutReadiness);
          } else {
            setRolloutReadiness(null);
          }
        } else {
          setRolloutReadiness(null);
        }

        if (trendResult.status === "fulfilled") {
          const res: any = trendResult.value;
          if (res?.success && res.data) {
            setRolloutTrends(res.data as RolloutTrendData);
          } else {
            setRolloutTrends(null);
          }
        } else {
          setRolloutTrends(null);
        }
      } catch {
        // API unavailable
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
        setCaptureMessage("Snapshot captured successfully.");
      } else {
        setCaptureMessage("Snapshot capture failed.");
      }
    } catch {
      setCaptureMessage("Snapshot capture failed.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <h1 className="mb-8 text-2xl font-bold text-gray-200">Finance Overview</h1>
        <div className="text-center text-gray-500 py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      <h1 className="mb-8 text-2xl font-bold text-white">Finance Overview</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Revenue (USD Base)</p>
          <p className="mt-2 text-3xl font-bold text-green-400">{formatCurrency(totalRevenue, locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">Recharge + VIP</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Coin Recharges</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{formatCurrency(getRevenueForType("recharge"), locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">Base currency settlement</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">VIP Subscriptions</p>
          <p className="mt-2 text-3xl font-bold text-purple-400">{formatCurrency(getRevenueForType("vip"), locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">Base currency settlement</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Refunds</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{formatCurrency(totalRefunds, locale, "USD")}</p>
          <p className="mt-1 text-xs text-gray-500">{totalTransactions} completed transactions</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Adaptive Pricing Coverage</p>
          <p className="mt-2 text-3xl font-bold text-indigo-300">{Number(adaptivePricing.appliedRate || 0).toFixed(2)}%</p>
          <p className="mt-1 text-xs text-gray-500">{adaptivePricing.appliedCount} / {adaptivePricing.totalCount} orders</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Rollout Readiness Monitor</h2>
            <p className="mt-1 text-xs text-gray-500">Tier1/2/3 launch health based on country catalog + payment traffic.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Window</span>
            <select
              value={String(rolloutWindowDays)}
              onChange={(e) => setRolloutWindowDays(Number(e.target.value) || 7)}
              className="rounded-md border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-xs text-gray-200"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <button
              onClick={triggerCaptureSnapshot}
              disabled={captureLoading}
              className="rounded-md border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {captureLoading ? "Capturing..." : "Capture Snapshot"}
            </button>
          </div>
        </div>

        {!rolloutReadiness ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Rollout readiness data is unavailable.</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Global Failed Rate</p>
                <p className="mt-1 text-2xl font-semibold text-red-300">{rolloutReadiness.global.failedRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Unknown Country Rate</p>
                <p className="mt-1 text-2xl font-semibold text-amber-300">{rolloutReadiness.global.unresolvedCountryRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Adaptive Applied Rate</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">{rolloutReadiness.global.adaptiveAppliedRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Last Completed Order</p>
                <p className="mt-1 text-sm font-medium text-gray-200">{formatDateTime(rolloutReadiness.global.lastTransactionAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {rolloutReadiness.global.hoursSinceLastTx === null ? "-" : `${rolloutReadiness.global.hoursSinceLastTx.toFixed(2)}h ago`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-[#161625]">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Tier</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Enabled Countries</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Failed Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Adaptive Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">USD Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {rolloutReadiness.tiers.map((item) => (
                    <tr key={item.tier} className="hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-200">Tier {item.tier}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">
                        {item.coverage.enabledCountries}/{item.coverage.totalCountries}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">
                        {item.traffic.totalOrders.toLocaleString()} ({item.traffic.completedOrders.toLocaleString()} completed)
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
                <h3 className="mb-3 text-sm font-semibold text-white">Operational Alerts</h3>
                {rolloutReadiness.alerts.length === 0 ? (
                  <p className="text-sm text-green-300">No active alerts.</p>
                ) : (
                  <div className="space-y-2">
                    {rolloutReadiness.alerts.map((alert) => (
                      <div key={alert.code} className="rounded-md border border-gray-700/50 bg-[#151523] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-100">{alert.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${alert.severity === "critical" ? "bg-red-500/20 text-red-300" : alert.severity === "warning" ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{alert.detail}</p>
                        <p className="mt-1 text-xs text-indigo-300">Action: {alert.action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Go-live Checklist</h3>
                <div className="space-y-2">
                  {rolloutReadiness.checklist.map((item) => (
                    <div key={item.key} className="rounded-md border border-gray-700/50 bg-[#151523] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-100">{item.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${item.status === "pass" ? "bg-green-500/20 text-green-300" : item.status === "warn" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {captureMessage ? (
              <p className={`text-xs ${captureMessage.includes("success") ? "text-green-300" : "text-red-300"}`}>{captureMessage}</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Rollout Trends</h2>
            <p className="mt-1 text-xs text-gray-500">Daily snapshots aggregated into weekly/monthly trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={String(trendDays)}
              onChange={(e) => setTrendDays(Number(e.target.value) || 90)}
              className="rounded-md border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-xs text-gray-200"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>
            <div className="inline-flex rounded-md border border-gray-700/50 bg-[#1a1a2e] p-0.5 text-xs">
              <button
                onClick={() => setTrendBucket("weekly")}
                className={`rounded px-2 py-1 ${trendBucket === "weekly" ? "bg-indigo-500/30 text-indigo-200" : "text-gray-400"}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTrendBucket("monthly")}
                className={`rounded px-2 py-1 ${trendBucket === "monthly" ? "bg-indigo-500/30 text-indigo-200" : "text-gray-400"}`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {!rolloutTrends || trendSeries.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">No trend snapshots yet. Capture snapshots to build trends.</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Data Buckets</p>
                <p className="mt-1 text-2xl font-semibold text-gray-100">{trendSeries.length}</p>
                <p className="mt-1 text-xs text-gray-500">From {formatDate(rolloutTrends.startDate, locale)}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Latest Failed Rate</p>
                <p className="mt-1 text-2xl font-semibold text-red-300">{Number(trendSeries[trendSeries.length - 1]?.failedRate || 0).toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500">Latest Adaptive Rate</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-300">{Number(trendSeries[trendSeries.length - 1]?.adaptiveAppliedRate || 0).toFixed(2)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="mb-2 text-sm font-medium text-gray-100">Failed Rate Trend (%)</p>
                <svg viewBox="0 0 560 180" className="h-44 w-full rounded bg-[#121220]">
                  <path d={failedRatePath} fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="mb-2 text-sm font-medium text-gray-100">Adaptive Applied Trend (%)</p>
                <svg viewBox="0 0 560 180" className="h-44 w-full rounded bg-[#121220]">
                  <path d={adaptiveRatePath} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-[#161625]">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Bucket</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Failed Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Adaptive Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Critical/Warning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {trendSeries.map((item) => (
                    <tr key={item.bucket} className="hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-200">{item.bucket}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">{item.totalOrders.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-red-300">{item.failedRate.toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-indigo-300">{item.adaptiveAppliedRate.toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-300">{item.criticalCount}/{item.warningCount}</td>
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
          <h2 className="text-lg font-semibold text-white">Presentment Currency Breakdown</h2>
          <p className="mt-1 text-xs text-gray-500">Local currency totals are grouped by actual checkout presentment currency.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Presentment Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">USD Base Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {presentmentRevenueByCurrency.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No currency data found</td></tr>
              ) : (
                presentmentRevenueByCurrency.map((item) => {
                  const currency = String(item._id || "usd").toUpperCase();
                  return (
                    <tr key={currency} className="transition-colors hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-200">{currency}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-400">{item.count.toLocaleString()}</td>
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
          <h2 className="mb-4 text-lg font-semibold text-white">Pricing Tier Distribution</h2>
          <div className="space-y-3">
            {pricingTierBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No tier data found</p>
            ) : (
              pricingTierBreakdown.map((item) => (
                <div key={String(item._id)} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">Tier {item._id || "-"}</p>
                    <p className="text-xs text-gray-500">{item.count.toLocaleString()} orders</p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-300">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Top Countries</h2>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-sm text-gray-500">No country data found</p>
            ) : (
              topCountries.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item._id}</p>
                    <p className="text-xs text-gray-500">{item.count.toLocaleString()} orders</p>
                  </div>
                  <p className="text-sm font-semibold text-green-300">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Integration Currency Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {integrationRevenueByCurrency.length === 0 ? (
            <p className="text-sm text-gray-500">No integration currency data found</p>
          ) : (
            integrationRevenueByCurrency.map((item) => (
              <div key={item._id} className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2">
                <p className="text-xs text-gray-500">{String(item._id || "usd").toUpperCase()} · {item.count}</p>
                <p className="text-sm font-semibold text-gray-200">{formatCurrency(item.totalUsdAmount || 0, locale, "USD")}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="border-b border-gray-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Presentment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Base</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Region</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                recentTransactions.map((tx: any) => {
                  const user = tx.userId && typeof tx.userId === "object" ? tx.userId : null;
                  const typeCfg = TYPE_BADGE[tx.type] || { label: tx.type, cls: "bg-gray-500/15 text-gray-400" };
                  const baseCurrency = String(tx.integrationCurrency || "usd").toLowerCase();
                  const presentmentCurrency = String(tx.presentmentCurrency || tx.integrationCurrency || "usd").toLowerCase();
                  const presentmentAmount = Number(tx.presentmentAmount || 0) > 0 ? Number(tx.presentmentAmount) : Number(tx.amount || 0);
                  return (
                    <tr key={tx._id} className="transition-colors hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCfg.cls}`}>
                            {typeCfg.label}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${tx.adaptivePricingApplied ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-700/50 text-gray-400"}`}>
                            {tx.adaptivePricingApplied ? "Adaptive" : "Fixed"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-200">
                        {formatCurrency(presentmentAmount, locale, presentmentCurrency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {formatCurrency(Number(tx.amount || 0), locale, baseCurrency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {(tx.countryCode || "UNKNOWN").toUpperCase()} · Tier {tx.pricingTier || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {user?.nickname || user?.email || "Unknown"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {formatDate(tx.createdAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[tx.status] || "bg-gray-500/15 text-gray-400"}`}>
                          {tx.status}
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
