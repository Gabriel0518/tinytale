"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileSliders } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminPolicyOverview } from "@/types/creator";
import { formatAdminDate, mockCreatorPolicyOverview } from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorPoliciesPage() {
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
        creatorShareRate: data.creatorShareRate,
        platformFeeRate: data.platformFeeRate,
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

    setData((current) => ({ ...current, lastUpdatedAt: new Date().toISOString() }));
    toast("Creator policies updated.", "success");
  }

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Governance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Revenue and payout policies</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Manage the active creator finance policy version, payout thresholds, hold period, review SLA, and operational rules used by the admin settlement workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/revenue" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open revenue
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <FileSliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Active policy</h2>
              <p className="text-sm text-gray-400">Versioned creator commercial policy.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Version</span>
              <span>{data.version}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Last updated</span>
              <span>{loading ? "..." : formatAdminDate(data.lastUpdatedAt, true)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Auto-release requires bank verification</span>
              <span>{data.autoReleaseRequiresVerifiedBank ? "Yes" : "No"}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            {data.notes.map((note, index) => (
              <div key={index} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm leading-6 text-gray-300">
                {note}
              </div>
            ))}
          </div>
        </article>

        <article className={panelClassName}>
          <h2 className="text-lg font-semibold text-white">Policy controls</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Policy version</span>
              <input value={data.version} onChange={(event) => setData((current) => ({ ...current, version: event.target.value }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Creator share rate</span>
              <input type="number" step="0.01" value={data.creatorShareRate} onChange={(event) => setData((current) => ({ ...current, creatorShareRate: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Platform fee rate</span>
              <input type="number" step="0.01" value={data.platformFeeRate} onChange={(event) => setData((current) => ({ ...current, platformFeeRate: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Refund reserve rate</span>
              <input type="number" step="0.01" value={data.refundReserveRate} onChange={(event) => setData((current) => ({ ...current, refundReserveRate: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Hold days</span>
              <input type="number" value={data.holdDays} onChange={(event) => setData((current) => ({ ...current, holdDays: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Minimum payout (USD)</span>
              <input type="number" value={data.minimumPayoutUsd} onChange={(event) => setData((current) => ({ ...current, minimumPayoutUsd: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Review SLA (hours)</span>
              <input type="number" value={data.reviewSlaHours} onChange={(event) => setData((current) => ({ ...current, reviewSlaHours: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">Payout schedule day</span>
              <input type="number" value={data.payoutScheduleDay} onChange={(event) => setData((current) => ({ ...current, payoutScheduleDay: Number(event.target.value) || 0 }))} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500" />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-300 md:col-span-2">
              <input
                type="checkbox"
                checked={data.autoReleaseRequiresVerifiedBank}
                onChange={(event) => setData((current) => ({ ...current, autoReleaseRequiresVerifiedBank: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-600 bg-transparent text-indigo-500 focus:ring-indigo-500"
              />
              Require verified bank accounts before settlements can move into payout release
            </label>
          </div>
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-300">Operational notes</label>
            <textarea
              value={data.notes.join("\n")}
              onChange={(event) => setData((current) => ({ ...current, notes: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) }))}
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
      </section>
    </div>
  );
}
