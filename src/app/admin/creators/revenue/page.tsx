"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminRevenueOverview } from "@/types/creator";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorSettlementStatusMeta,
  mockCreatorRevenueOverview,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorRevenuePage() {
  const [data, setData] = useState<CreatorAdminRevenueOverview>(mockCreatorRevenueOverview);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorRevenueOverview();
        const next = response?.data?.overview || response?.data || response;
        if (!cancelled && next?.kpis) {
          setData(next);
        }
      } catch {
        if (!cancelled) setData(mockCreatorRevenueOverview);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCreators = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.creatorRows;
    return data.creatorRows.filter((item) => {
      const haystack = [item.creatorName, item.creatorEmail, item.creatorLevel].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [data.creatorRows, search]);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Finance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator revenue overview</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Track gross creator revenue, net payout exposure, payout backlog, and finance watch items from the same settlement data used by the admin payout workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/settlements" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open settlements
            </Link>
            <Link href="/admin/creators/payout-requests" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Open payout queue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((item) => (
          <article key={item.key} className={panelClassName}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              item.tone === "emerald"
                ? "bg-emerald-500/10 text-emerald-300"
                : item.tone === "amber"
                  ? "bg-amber-500/10 text-amber-300"
                  : item.tone === "rose"
                    ? "bg-rose-500/10 text-rose-300"
                    : "bg-indigo-500/10 text-indigo-300"
            }`}>
              <Wallet className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{loading ? "..." : formatUsd(item.valueUsd)}</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Creator earnings ranking</h2>
              <p className="mt-1 text-sm text-gray-400">Top creators by current net payout exposure.</p>
            </div>
            <label className="block w-full max-w-xs">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search creator"
                className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
              />
            </label>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Creator</th>
                  <th className="pb-3 pr-4 font-medium">Gross</th>
                  <th className="pb-3 pr-4 font-medium">Net</th>
                  <th className="pb-3 pr-4 font-medium">Available</th>
                  <th className="pb-3 pr-4 font-medium">Pending</th>
                  <th className="pb-3 pr-4 font-medium">Titles</th>
                  <th className="pb-3 pr-4 font-medium">Bank</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreators.map((item) => {
                  const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
                  return (
                    <tr key={item.creatorId} className="border-b border-gray-800/60 align-top">
                      <td className="py-4 pr-4">
                        <p className="font-medium text-white">{item.creatorName}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.creatorEmail}</p>
                        <p className="mt-2 text-xs text-gray-400">{item.creatorLevel}</p>
                      </td>
                      <td className="py-4 pr-4 text-white">{formatUsd(item.grossRevenueUsd)}</td>
                      <td className="py-4 pr-4 font-semibold text-white">{formatUsd(item.netPayoutUsd)}</td>
                      <td className="py-4 pr-4 text-gray-300">{formatUsd(item.availableBalanceUsd)}</td>
                      <td className="py-4 pr-4 text-gray-300">{formatUsd(item.pendingBalanceUsd)}</td>
                      <td className="py-4 pr-4 text-gray-300">{item.publishedTitles}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                      </td>
                      <td className="py-4 text-right">
                        <Link href={`/admin/creators/${item.creatorId}`} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-300 hover:text-indigo-200">
                          Detail
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className={panelClassName}>
          <h2 className="text-lg font-semibold text-white">Finance watchlist</h2>
          <p className="mt-1 text-sm text-gray-400">Statements and creators that need manual intervention.</p>
          <div className="mt-5 space-y-3">
            {data.watchlist.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{item.creatorName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.severity === "high" ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20"}`}>
                    {item.severity === "high" ? "High" : "Watch"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.issue}</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatUsd(item.amountUsd)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={panelClassName}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent settlement ledger</h2>
            <p className="mt-1 text-sm text-gray-400">Latest creator statements flowing through finance.</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Statement</th>
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Gross</th>
                <th className="pb-3 pr-4 font-medium">Fees</th>
                <th className="pb-3 pr-4 font-medium">Reserve</th>
                <th className="pb-3 pr-4 font-medium">Net</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody>
              {data.recentStatements.map((item) => {
                const settlementMeta = getCreatorSettlementStatusMeta(item.status);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.statementNo}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.periodLabel}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">{item.creatorName}</td>
                    <td className="py-4 pr-4 text-white">{formatUsd(item.grossRevenueUsd)}</td>
                    <td className="py-4 pr-4 text-gray-300">{formatUsd(item.channelFeesUsd)}</td>
                    <td className="py-4 pr-4 text-gray-300">{formatUsd(item.reserveUsd)}</td>
                    <td className="py-4 pr-4 font-semibold text-white">{formatUsd(item.netPayoutUsd)}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                    </td>
                    <td className="py-4 text-gray-400">{item.payoutDate ? formatAdminDate(item.payoutDate, true) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
