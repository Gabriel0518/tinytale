"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Banknote, FileClock, ShieldAlert, UserCheck } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorLifecycleMeta,
  mockCreatorAdminDashboard,
} from "../_lib/mockData";
import type { CreatorAdminDashboardOverview } from "@/types/creator";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

function kpiIcon(key: string) {
  switch (key) {
    case "pendingApplications":
      return <FileClock className="h-5 w-5" />;
    case "activeCreators":
      return <UserCheck className="h-5 w-5" />;
    case "restrictedCreators":
      return <ShieldAlert className="h-5 w-5" />;
    default:
      return <Banknote className="h-5 w-5" />;
  }
}

export default function CreatorAdminDashboardPage() {
  const [data, setData] = useState<CreatorAdminDashboardOverview>(mockCreatorAdminDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorAdminDashboard();
        const next = response?.data?.dashboard || response?.data || response;
        if (!cancelled && next?.kpis) {
          setData(next);
        }
      } catch {
        if (!cancelled) setData(mockCreatorAdminDashboard);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Operational dashboard for creator onboarding and lifecycle management</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              This dashboard follows the latest Creator Management spec and centralizes application review, bank-account blockers, risk watch items, and the first-wave management KPIs required in P1.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/applications" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Review Applications
            </Link>
            <Link href="/admin/creators/list" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open Creator List
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((item) => (
          <article key={item.key} className={panelClassName}>
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                item.tone === "emerald"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : item.tone === "amber"
                    ? "bg-amber-500/10 text-amber-300"
                    : item.tone === "rose"
                      ? "bg-rose-500/10 text-rose-300"
                      : "bg-indigo-500/10 text-indigo-300"
              }`}>
                {kpiIcon(item.key)}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.delta >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
              }`}>
                {item.delta >= 0 ? "+" : ""}
                {item.delta}%
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{loading ? "..." : item.value.toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Application funnel</h2>
              <p className="mt-1 text-sm text-gray-400">A quick read on the creator review queue and where the queue is currently stalling.</p>
            </div>
            <Link href="/admin/creators/applications" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-300 hover:text-indigo-200">
              Open queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {data.applicationFunnel.map((item) => {
              const max = Math.max(...data.applicationFunnel.map((entry) => entry.value), 1);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-gray-200">{item.label}</span>
                    <span className="text-gray-400">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1a2e]">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.value / max) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{item.helper}</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">SLA alerts</h2>
              <p className="text-sm text-gray-400">Review items that are close to or over the documented SLA threshold.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {data.slaAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-100">{alert.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    alert.status === "breach" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"
                  }`}>
                    {alert.status === "breach" ? "Breached" : "Watch"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{alert.helper}</p>
                <div className="mt-3 flex items-center justify-between gap-4 text-xs text-gray-500">
                  <span>Owner: {alert.owner}</span>
                  <span>Due {formatAdminDate(alert.dueAt, true)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Creator highlights</h2>
              <p className="mt-1 text-sm text-gray-400">Top active creators by current monthly revenue and title output.</p>
            </div>
            <Link href="/admin/creators/list" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">View all</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {data.creatorHighlights.map((item) => {
              const statusMeta = getCreatorLifecycleMeta(item.status);
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div>
                    <p className="font-medium text-gray-100">{item.name}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.level} · {item.publishedTitles} published titles</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatUsd(item.monthlyRevenueUsd)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Finance watchlist</h2>
              <p className="mt-1 text-sm text-gray-400">Creators whose payouts still have unresolved blockers from banking or risk flows.</p>
            </div>
            <Link href="/admin/creators/bank-accounts" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">Bank review</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {data.financeWatchlist.map((item) => {
              const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
              return (
                <div key={item.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-gray-100">{item.creatorName}</p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-400">{item.payoutHoldReason}</span>
                    <span className="font-semibold text-white">{formatUsd(item.availableBalanceUsd)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={panelClassName}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent activity</h2>
            <p className="mt-1 text-sm text-gray-400">Recent review, compliance, and finance events touching the Creator module.</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Time</th>
                <th className="pb-3 pr-4 font-medium">Actor</th>
                <th className="pb-3 pr-4 font-medium">Action</th>
                <th className="pb-3 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((item) => (
                <tr key={item.id} className="border-b border-gray-800/60 align-top">
                  <td className="py-4 pr-4 text-gray-400">{formatAdminDate(item.at, true)}</td>
                  <td className="py-4 pr-4 text-gray-300">{item.actor}</td>
                  <td className="py-4 pr-4 text-white">{item.action}</td>
                  <td className="py-4 text-gray-400">{item.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
