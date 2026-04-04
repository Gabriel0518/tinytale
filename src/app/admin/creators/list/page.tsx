"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorLifecycleMeta,
  mockCreators,
} from "../_lib/mockData";
import type { CreatorAdminCreatorListItem } from "@/types/creator";
import type { CreatorTier } from "@/types/creator";
import { CreatorTierEditor } from "@/components/admin/CreatorTierEditor";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorListPage() {
  const [items, setItems] = useState<CreatorAdminCreatorListItem[]>(mockCreators);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [bankStatus, setBankStatus] = useState("all");
  const [editingCreator, setEditingCreator] = useState<CreatorAdminCreatorListItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreators();
        const next = response?.data?.creators || response?.data?.items || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
        }
      } catch {
        if (!cancelled) setItems(mockCreators);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [item.id, item.displayName, item.legalName, item.email, item.country].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    if (bankStatus !== "all" && item.bankStatus !== bankStatus) return false;
    return true;
  }), [bankStatus, items, search, status]);

  const summary = useMemo(() => ({
    active: items.filter((item) => item.status === "active").length,
    restricted: items.filter((item) => item.status === "restricted" || item.status === "suspended").length,
    pendingBank: items.filter((item) => item.bankStatus === "pending_review" || item.bankStatus === "missing").length,
    highRiskLoad: items.filter((item) => item.openTickets > 0 || item.dmcaStrikes > 0).length,
  }), [items]);

  const handleTierUpdate = (creatorId: string, newTier: CreatorTier) => {
    setItems((current) =>
      current.map((item) =>
        item.id === creatorId ? { ...item, tier: newTier } : item
      )
    );
    setEditingCreator(null);
  };

  const getTierDisplay = (tier?: CreatorTier) => {
    const tierConfig = {
      bronze: { emoji: "🥉", label: "Bronze", color: "text-amber-400" },
      silver: { emoji: "🥈", label: "Silver", color: "text-gray-300" },
      gold: { emoji: "🥇", label: "Gold", color: "text-yellow-400" },
    };
    const config = tierConfig[tier || "bronze"];
    return (
      <span className={`flex items-center gap-1.5 ${config.color}`}>
        <span>{config.emoji}</span>
        <span className="text-xs font-semibold">{config.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / P1</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator account directory</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">Monitor creator tier, status, bank readiness, work output, and open operational risks. This list is the backbone for the admin-side creator lifecycle workflow.</p>
          </div>
          <Link href="/admin/creators/dashboard" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Active</p><p className="mt-3 text-3xl font-bold text-emerald-300">{summary.active}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Restricted / Suspended</p><p className="mt-3 text-3xl font-bold text-rose-300">{summary.restricted}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Bank blockers</p><p className="mt-3 text-3xl font-bold text-amber-300">{summary.pendingBank}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Ops watchlist</p><p className="mt-3 text-3xl font-bold text-white">{summary.highRiskLoad}</p></article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px_190px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator name, legal entity, email, or country"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All lifecycle states</option>
            <option value="active">Active</option>
            <option value="under_review">Under review</option>
            <option value="restricted">Restricted</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <select value={bankStatus} onChange={(event) => setBankStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All bank states</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending review</option>
            <option value="rejected">Rejected</option>
            <option value="frozen">Frozen</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <article className={panelClassName}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Tier</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Bank</th>
                <th className="pb-3 pr-4 font-medium">Titles / Episodes</th>
                <th className="pb-3 pr-4 font-medium">Monthly Revenue</th>
                <th className="pb-3 pr-4 font-medium">Open Tickets</th>
                <th className="pb-3 pr-4 font-medium">DMCA</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">Loading creators...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">No creators match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const statusMeta = getCreatorLifecycleMeta(item.status);
                const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.displayName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.legalName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.email}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.creatorType === "company" ? "Company / Studio" : "Individual"} · {item.country} · Joined {formatAdminDate(item.joinedAt)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      {getTierDisplay(item.tier)}
                      <button
                        onClick={() => setEditingCreator(item)}
                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Edit tier
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      <p className="mt-2 text-xs text-gray-400">{item.level}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">{item.publishedTitles} titles · {item.totalEpisodes} episodes</td>
                    <td className="py-4 pr-4 font-semibold text-white">{formatUsd(item.monthlyRevenueUsd)}</td>
                    <td className="py-4 pr-4 text-gray-300">{item.openTickets}</td>
                    <td className="py-4 pr-4 text-gray-300">{item.dmcaStrikes}</td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/creators/${item.id}`} className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                        Open detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Lifecycle management</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Directory purpose</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Use this page as the operational index for creator health before jumping into individual detail, finance, or compliance flows.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Watch bank readiness</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Creators with blocked bank states should usually be triaged before payout release or settlement confirmation.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Escalate risk</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Open tickets and DMCA strikes are the fastest signal that a creator needs deeper review in support or trust workflows.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Tier Editor Modal */}
      {editingCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setEditingCreator(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
            <CreatorTierEditor
              creatorId={editingCreator.id}
              creatorName={editingCreator.displayName}
              currentTier={editingCreator.tier || "bronze"}
              onUpdate={(newTier) => handleTierUpdate(editingCreator.id, newTier)}
              onClose={() => setEditingCreator(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
