"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  getCreatorApplicationStatusMeta,
  getCreatorRiskMeta,
  mockCreatorApplications,
} from "../_lib/mockData";
import type { CreatorAdminApplicationListItem } from "@/types/creator";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorApplicationsPage() {
  const [items, setItems] = useState<CreatorAdminApplicationListItem[]>(mockCreatorApplications);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorApplications();
        const next = response?.data?.applications || response?.data?.items || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
        }
      } catch {
        if (!cancelled) setItems(mockCreatorApplications);
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
      const haystack = [item.id, item.applicantName, item.displayName, item.email, item.country].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    if (risk !== "all" && item.riskLevel !== risk) return false;
    return true;
  }), [items, risk, search, status]);

  const summary = {
    underReview: items.filter((item) => item.status === "under_review").length,
    needMoreInfo: items.filter((item) => item.status === "need_more_info").length,
    approved: items.filter((item) => item.status === "approved").length,
  };

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / P1</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator application review queue</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">Review identity, portfolio quality, agreement acceptance, and risk checks before enabling creator access. This queue matches the spec-defined onboarding states and can attach to `/api/admin/applications/*` directly.</p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#0f0f17] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Under Review</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.underReview}</p>
            </div>
            <div className="rounded-xl bg-[#0f0f17] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Need Info</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.needMoreInfo}</p>
            </div>
            <div className="rounded-xl bg-[#0f0f17] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Approved</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.approved}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by applicant, creator name, email, or country"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All statuses</option>
            <option value="under_review">Under review</option>
            <option value="need_more_info">Need more info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Applicant</th>
                <th className="pb-3 pr-4 font-medium">Creator Profile</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Risk</th>
                <th className="pb-3 pr-4 font-medium">Assigned Reviewer</th>
                <th className="pb-3 pr-4 font-medium">Submitted</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">Loading applications...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">No applications match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const statusMeta = getCreatorApplicationStatusMeta(item.status);
                const riskMeta = getCreatorRiskMeta(item.riskLevel);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.applicantName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.displayName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.creatorType === "company" ? "Company / Studio" : "Individual"} · {item.country}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.genres.join(", ")} · {item.primaryLanguage}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      {item.missingItems.length > 0 ? (
                        <p className="mt-2 max-w-[220px] text-xs leading-5 text-amber-300">{item.missingItems.join(" • ")}</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">{item.assignedReviewer || "Unassigned"}</td>
                    <td className="py-4 pr-4 text-gray-400">
                      <p>{formatAdminDate(item.submittedAt)}</p>
                      <p className="mt-1 text-xs text-gray-500">Updated {formatAdminDate(item.updatedAt, true)}</p>
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/creators/applications/${item.id}`} className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                        Review
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
