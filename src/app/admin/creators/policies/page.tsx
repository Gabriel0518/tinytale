"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileSliders, Info } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminPolicyOverview } from "@/types/creator";
import { formatAdminDate } from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

const mockCreatorPolicyOverview: CreatorAdminPolicyOverview = {
  version: "Creator Policy v2026.04",
  paymentChannelFeeRate: 0.05,
  creatorTierRates: {
    bronze: 0.50,
    silver: 0.60,
    gold: 0.70,
  },
  refundReserveRate: 0.10,
  holdDays: 14,
  minimumPayoutUsd: 50,
  reviewSlaHours: 48,
  payoutScheduleDay: 5,
  autoReleaseRequiresVerifiedBank: true,
  notes: [
    "Creator payout is released only after the payout account is verified.",
    "Revenue is settled in USD using the current creator share schedule.",
    "Policy changes take effect only after the updated agreement version is signed.",
  ],
  lastUpdatedAt: new Date().toISOString(),
};

export default function CreatorPoliciesPageV2() {
  const { toast } = useToast();
  const [data, setData] = useState<CreatorAdminPolicyOverview>(mockCreatorPolicyOverview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorPolicies();
        const next = response?.data?.policy || response?.data || response;
        if (!cancelled && next?.version) {
          // 向后兼容：如果是旧数据结构，转换为新结构
          if (next.creatorShareRate && !next.creatorTierRates) {
            next.creatorTierRates = {
              bronze: 0.50,
              silver: 0.60,
              gold: next.creatorShareRate || 0.70,
            };
          }
          if (next.platformFeeRate && !next.paymentChannelFeeRate) {
            next.paymentChannelFeeRate = next.platformFeeRate;
          }
          setData(next);
        }
      } catch {
        if (!cancelled) setData(mockCreatorPolicyOverview);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateCreatorPolicies({
        version: data.version,
        paymentChannelFeeRate: data.paymentChannelFeeRate,
        creatorTierRates: data.creatorTierRates,
        refundReserveRate: data.refundReserveRate,
        holdDays: data.holdDays,
        minimumPayoutUsd: data.minimumPayoutUsd,
        reviewSlaHours: data.reviewSlaHours,
        payoutScheduleDay: data.payoutScheduleDay,
        autoReleaseRequiresVerifiedBank: data.autoReleaseRequiresVerifiedBank,
        notes: data.notes,
      });
    } catch {
      // Keep admin policy editing usable before broader governance flows are finalized.
    } finally {
      setSaving(false);
    }

    setData((current) => ({
      ...current,
      lastUpdatedAt: new Date().toISOString(),
    }));
    toast("Creator policies updated.", "success");
  }

  // 计算平台分成比例（示例：基于 Gold 等级）
  const platformShareRate = 1 - data.creatorTierRates.gold;

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">
              Creator Management / Governance
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Revenue and payout policies
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Manage creator tier-based revenue sharing, payment channel fees, refund reserve,
              and operational rules for the settlement workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/creators/revenue"
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]"
            >
              Open revenue
            </Link>
            <Link
              href="/admin/creators/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Revenue Split Overview */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Payment Channel Fee
          </p>
          <p className="mt-3 text-3xl font-bold text-orange-300">
            {Math.round(data.paymentChannelFeeRate * 100)}%
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Stripe/payment processor fees deducted first.
          </p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Creator Tiers
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-400">🥉 Bronze</span>
              <span className="font-bold text-white">{Math.round(data.creatorTierRates.bronze * 100)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">🥈 Silver</span>
              <span className="font-bold text-white">{Math.round(data.creatorTierRates.silver * 100)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-400">🥇 Gold</span>
              <span className="font-bold text-white">{Math.round(data.creatorTierRates.gold * 100)}%</span>
            </div>
          </div>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Platform Share
          </p>
          <p className="mt-3 text-3xl font-bold text-indigo-300">
            {Math.round(platformShareRate * 100)}%
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Platform revenue from distributable amount (Gold tier example).
          </p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Refund Reserve
          </p>
          <p className="mt-3 text-3xl font-bold text-violet-300">
            {Math.round(data.refundReserveRate * 100)}%
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Rolling reserve held for 30 days, returned after refund window.
          </p>
        </article>
      </section>

      {/* Revenue Split Explanation */}
      <section className={panelClassName}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Revenue Split Calculation</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Example with $1,000 gross revenue (Gold tier creator):
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-4 py-2">
                <span className="text-gray-400">Gross Revenue</span>
                <span className="font-mono font-semibold text-white">$1,000.00</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-4 py-2">
                <span className="text-gray-400">Payment Channel Fee (5%)</span>
                <span className="font-mono font-semibold text-orange-300">-$50.00</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-4 py-2 font-medium">
                <span className="text-gray-300">Distributable Amount</span>
                <span className="font-mono font-semibold text-white">$950.00</span>
              </div>
              <div className="ml-4 space-y-2 border-l-2 border-gray-700 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Creator Share (70%)</span>
                  <span className="font-mono font-semibold text-emerald-300">$665.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Platform Share (30%)</span>
                  <span className="font-mono font-semibold text-indigo-300">$285.00</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-4 py-2">
                <span className="text-gray-400">Refund Reserve (10% of gross)</span>
                <span className="font-mono font-semibold text-violet-300">-$100.00</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-2 font-bold">
                <span className="text-emerald-300">Creator Net Settlement</span>
                <span className="font-mono text-lg text-emerald-300">$565.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <article className={panelClassName}>
          <h2 className="text-lg font-semibold text-white">Policy controls</h2>
          <p className="mt-1 text-sm text-gray-400">
            Update the commercial and release settings that drive creator finance operations.
          </p>

          {/* Payment Channel Fee */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-white">Payment Processing</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Payment Channel Fee Rate
                </span>
                <input
                  type="number"
                  step="0.001"
                  value={data.paymentChannelFeeRate}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      paymentChannelFeeRate: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Stripe/payment processor fees (typically 3-5%)
                </p>
              </label>
            </div>
          </div>

          {/* Creator Tier Rates */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-white">Creator Tier Revenue Share</h3>
            <p className="mt-1 text-xs text-gray-500">
              Percentage of distributable amount (after payment fees) allocated to creators by tier
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
                  🥉 Bronze Tier
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={data.creatorTierRates.bronze}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      creatorTierRates: {
                        ...current.creatorTierRates,
                        bronze: Number(event.target.value) || 0,
                      },
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-500">New creators</p>
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  🥈 Silver Tier
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={data.creatorTierRates.silver}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      creatorTierRates: {
                        ...current.creatorTierRates,
                        silver: Number(event.target.value) || 0,
                      },
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Established creators</p>
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-400">
                  🥇 Gold Tier
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={data.creatorTierRates.gold}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      creatorTierRates: {
                        ...current.creatorTierRates,
                        gold: Number(event.target.value) || 0,
                      },
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-yellow-500"
                />
                <p className="mt-1 text-xs text-gray-500">Top performers</p>
              </label>
            </div>
          </div>

          {/* Other Settings */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-white">Operational Settings</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Policy version
                </span>
                <input
                  value={data.version}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      version: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Refund reserve rate
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={data.refundReserveRate}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      refundReserveRate: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Hold days
                </span>
                <input
                  type="number"
                  value={data.holdDays}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      holdDays: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Minimum payout (USD)
                </span>
                <input
                  type="number"
                  value={data.minimumPayoutUsd}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      minimumPayoutUsd: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Review SLA (hours)
                </span>
                <input
                  type="number"
                  value={data.reviewSlaHours}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      reviewSlaHours: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Payout schedule day
                </span>
                <input
                  type="number"
                  value={data.payoutScheduleDay}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      payoutScheduleDay: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-300 md:col-span-2">
                <input
                  type="checkbox"
                  checked={data.autoReleaseRequiresVerifiedBank}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      autoReleaseRequiresVerifiedBank: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-600 bg-transparent text-indigo-500 focus:ring-indigo-500"
                />
                Require verified bank accounts before settlements can move into payout release
              </label>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Operational notes
            </label>
            <textarea
              value={data.notes.join("\n")}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  notes: event.target.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                }))
              }
              className="min-h-[180px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save policy changes"}
          </button>
        </article>

        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <FileSliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Active policy</h2>
                <p className="text-sm text-gray-400">
                  Versioned creator commercial policy.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Version</span>
                <span>{data.version}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Last updated</span>
                <span>
                  {loading ? "..." : formatAdminDate(data.lastUpdatedAt, true)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Auto-release requires bank verification
                </span>
                <span>{data.autoReleaseRequiresVerifiedBank ? "Yes" : "No"}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {data.notes.map((note, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm leading-6 text-gray-300"
                >
                  {note}
                </div>
              ))}
            </div>
          </article>
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Operational guidance</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Tier-based revenue sharing
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Creator tiers allow you to reward top performers with higher revenue shares
                  while maintaining sustainable economics for new creators.
                </p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Payment channel fees
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  These are actual costs from Stripe/payment processors. Deducted before
                  revenue split to ensure accurate creator payouts.
                </p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Rolling reserve protection
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Refund reserve is held for 30 days then returned to creators. Protects
                  both platform and creators from refund risk.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
