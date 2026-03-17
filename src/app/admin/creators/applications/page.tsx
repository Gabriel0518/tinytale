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

function compactMissingItems(items: string[]) {
  if (items.length <= 2) return items;
  return [...items.slice(0, 2), `+${items.length - 2} more`];
}

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
    highRisk: items.filter((item) => item.riskLevel === "high").length,
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
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Under review</p><p className="mt-3 text-3xl font-bold text-white">{summary.underReview}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Need info</p><p className="mt-3 text-3xl font-bold text-amber-300">{summary.needMoreInfo}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Approved</p><p className="mt-3 text-3xl font-bold text-emerald-300">{summary.approved}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">High risk</p><p className="mt-3 text-3xl font-bold text-rose-300">{summary.highRisk}</p></article>
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <article className={panelClassName}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Applicant</th>
                <th className="pb-3 pr-4 font-medium">Application Profile</th>
                <th className="pb-3 pr-4 font-medium">Verification</th>
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
                  <td colSpan={8} className="py-10 text-center text-gray-500">Loading applications...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">No applications match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const statusMeta = getCreatorApplicationStatusMeta(item.status);
                const riskMeta = getCreatorRiskMeta(item.riskLevel);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.applicantName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.email}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.applicationSummary.contactPhone || "No phone provided"}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.applicationSummary.legalEntityName || item.displayName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.creatorType === "company" ? "Company / Studio" : "Individual"} · {item.country}
                        {item.creatorType === "company" && item.applicationSummary.region ? ` · ${item.applicationSummary.region}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {item.creatorType === "company"
                          ? `Registration ID: ${item.applicationSummary.identityReference || "Missing"}`
                          : `Age ${item.applicationSummary.age || "Missing"} · ID ${item.applicationSummary.identityReference || "Missing"}`}
                      </p>
                      {item.creatorType === "company" && item.applicationSummary.companyAddress ? (
                        <p className="mt-1 max-w-[280px] text-xs leading-5 text-gray-500">{item.applicationSummary.companyAddress}</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.applicationSummary.verificationLabel}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.applicationSummary.primaryDocumentLabel}: {item.applicationSummary.primaryDocumentName || "Missing"}
                      </p>
                      {item.applicationSummary.secondaryDocumentRequired ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.applicationSummary.secondaryDocumentLabel}: {item.applicationSummary.secondaryDocumentName || "Missing"}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-gray-400">{item.genres.join(", ") || "No genres"} · {item.primaryLanguage || "No language"}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      {item.missingItems.length > 0 ? (
                        <p className="mt-2 max-w-[220px] text-xs leading-5 text-amber-300">{compactMissingItems(item.missingItems).join(" • ")}</p>
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
        </article>

        <div className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Queue priorities</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Review first</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Prioritize high-risk applications and those already in `under_review` so onboarding does not stall in the middle state.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Request more info</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Use `need more info` when identity files, portfolio proof, or agreement details are incomplete but still recoverable.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Reject</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Reject only for clear risk, rights, or authenticity failures that should stop creator access rather than trigger resubmission.</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
