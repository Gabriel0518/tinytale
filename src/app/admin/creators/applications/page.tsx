"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Search,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  getCreatorApplicationStatusMeta,
  getCreatorRiskMeta,
  mockCreatorApplications,
} from "../_lib/mockData";
import type {
  CreatorAdminApplicationListItem,
  CreatorAdminApplicationSummary,
  CreatorAdminApplicationsResponse,
} from "@/types/creator";

const panelClassName =
  "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,29,0.96),rgba(10,10,16,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur";

function compactMissingItems(items: string[]) {
  if (items.length <= 2) return items;
  return [...items.slice(0, 2), `+${items.length - 2} more`];
}

function EmptyState({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8 text-center">
      <p className="text-base font-semibold text-gray-100">{title}</p>
    </div>
  );
}

const defaultSummary: CreatorAdminApplicationSummary = {
  underReview: 0,
  needMoreInfo: 0,
  approved: 0,
  highRisk: 0,
  unassigned: 0,
  company: 0,
};

export default function CreatorApplicationsPage() {
  const [items, setItems] = useState<CreatorAdminApplicationListItem[]>(mockCreatorApplications);
  const [summary, setSummary] = useState<CreatorAdminApplicationSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await adminApi.getCreatorApplications() as { data?: CreatorAdminApplicationsResponse } | CreatorAdminApplicationsResponse;
        const payload = "applications" in response
          ? response
          : response?.data;
        const next = payload?.applications || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
        }
        if (!cancelled) {
          setSummary(payload?.summary || defaultSummary);
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorApplications);
          setSummary(defaultSummary);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const query = search.trim().toLowerCase();
        if (query) {
          const haystack = [
            item.id,
            item.applicantName,
            item.displayName,
            item.email,
            item.country,
            item.applicationSummary.legalEntityName,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (status !== "all" && item.status !== status) return false;
        if (risk !== "all" && item.riskLevel !== risk) return false;
        return true;
      }),
    [items, risk, search, status],
  );

  return (
    <div className="space-y-6 text-gray-200">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Creator Applications</h1>
        <Link
          href="/admin/creators/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          Dashboard
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          ["Under review", summary.underReview, "from-indigo-400/80 via-fuchsia-400/30 to-transparent", "text-white"],
          ["Need info", summary.needMoreInfo, "from-amber-400/80 via-orange-400/30 to-transparent", "text-amber-200"],
          ["Approved", summary.approved, "from-emerald-400/80 via-teal-400/30 to-transparent", "text-emerald-200"],
          ["High risk", summary.highRisk, "from-rose-400/80 via-red-400/30 to-transparent", "text-rose-200"],
          ["Unassigned", summary.unassigned, "from-slate-400/70 via-slate-300/20 to-transparent", "text-white"],
          ["Companies", summary.company, "from-cyan-400/80 via-sky-400/30 to-transparent", "text-white"],
        ].map(([label, value, lineClass, valueClass]) => (
          <article key={String(label)} className={`${panelClassName} relative overflow-hidden`}>
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${lineClass}`} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
            <p className={`mt-4 text-3xl font-black tracking-[-0.04em] ${valueClass}`}>{loading ? "..." : Number(value).toLocaleString()}</p>
          </article>
        ))}
      </section>

      <section className={panelClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-300">
            {loading ? "Loading..." : `${filtered.length} visible`}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px_190px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by applicant, creator name, email, company, or country"
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0c0c13] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0c0c13] px-4 text-sm text-gray-200 outline-none focus:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              <option value="all">All statuses</option>
              <option value="under_review">Under review</option>
              <option value="need_more_info">Need more info</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Risk</span>
            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0c0c13] px-4 text-sm text-gray-200 outline-none focus:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              <option value="all">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.16em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Applicant</th>
                <th className="pb-3 pr-4 font-medium">Profile</th>
                <th className="pb-3 pr-4 font-medium">Verification</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Risk</th>
                <th className="pb-3 pr-4 font-medium">Reviewer</th>
                <th className="pb-3 pr-4 font-medium">Timeline</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState title="Loading" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState title="No applications" />
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const statusMeta = getCreatorApplicationStatusMeta(item.status);
                  const riskMeta = getCreatorRiskMeta(item.riskLevel);
                  const missingItems = compactMissingItems(item.missingItems);

                  return (
                    <tr key={item.id} className="border-b border-white/8 align-top transition hover:bg-white/[0.025]">
                      <td className="py-4 pr-4">
                        <div className="min-w-[180px]">
                          <p className="font-medium text-white">{item.applicantName}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.email}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.applicationSummary.contactPhone || "—"}</p>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[240px]">
                          <p className="font-medium text-gray-200">{item.applicationSummary.legalEntityName || item.displayName}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.creatorType === "company" ? "Company / Studio" : "Individual"} · {item.country}
                            {item.creatorType === "company" && item.applicationSummary.region ? ` · ${item.applicationSummary.region}` : ""}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-gray-400">
                            {item.creatorType === "company"
                              ? `Business type: ${item.applicationSummary.businessType || "—"} · Registration ID: ${item.applicationSummary.identityReference || "—"}`
                              : `Age ${item.applicationSummary.age || "—"} · ID ${item.applicationSummary.identityReference || "—"}`}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">{item.genres.join(", ") || "—"} · {item.primaryLanguage || "—"}</p>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[220px]">
                          <p className="font-medium text-gray-200">{item.applicationSummary.verificationLabel}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.applicationSummary.primaryDocumentLabel}: {item.applicationSummary.primaryDocumentName || "Missing"}
                          </p>
                          {item.applicationSummary.secondaryDocumentRequired ? (
                            <p className="mt-1 text-xs text-gray-500">
                              {item.applicationSummary.secondaryDocumentLabel}: {item.applicationSummary.secondaryDocumentName || "—"}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[180px]">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                          {missingItems.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {missingItems.map((entry) => (
                                <span key={entry} className="rounded-full border border-amber-400/15 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                                  {entry}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[120px]">
                          <p className="text-sm text-gray-300">{item.assignedReviewer || "—"}</p>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[140px]">
                          <p className="text-sm text-gray-300">{formatAdminDate(item.submittedAt)}</p>
                          <p className="mt-1 text-xs text-gray-500">Updated {formatAdminDate(item.updatedAt, true)}</p>
                        </div>
                      </td>

                      <td className="py-4 text-right">
                        <Link
                          href={`/admin/creators/applications/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition hover:scale-[1.01] hover:shadow-[0_16px_30px_rgba(236,72,153,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70"
                        >
                          Review
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
