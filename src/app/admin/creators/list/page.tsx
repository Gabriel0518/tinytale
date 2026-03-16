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

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorListPage() {
  const [items, setItems] = useState<CreatorAdminCreatorListItem[]>(mockCreators);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [bankStatus, setBankStatus] = useState("all");

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

      <section className={panelClassName}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Creator</th>
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
                  <td colSpan={8} className="py-10 text-center text-gray-500">Loading creators...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">No creators match the current filters.</td>
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
      </section>
    </div>
  );
}
