"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileSearch,
  Search,
  ShieldAlert,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  getCreatorApplicationStatusMeta,
  getCreatorRiskMeta,
  mockCreatorApplications,
} from "../_lib/mockData";
import type { CreatorAdminApplicationListItem } from "@/types/creator";

const panelClassName =
  "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,29,0.96),rgba(10,10,16,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur";

function compactMissingItems(items: string[]) {
  if (items.length <= 2) return items;
  return [...items.slice(0, 2), `+${items.length - 2} more`];
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8 text-center">
      <p className="text-base font-semibold text-gray-100">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-400">{description}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
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

  const summary = useMemo(
    () => ({
      total: items.length,
      underReview: items.filter((item) => item.status === "under_review").length,
      needMoreInfo: items.filter((item) => item.status === "need_more_info").length,
      approved: items.filter((item) => item.status === "approved").length,
      highRisk: items.filter((item) => item.riskLevel === "high").length,
      unassigned: items.filter((item) => !item.assignedReviewer).length,
      company: items.filter((item) => item.creatorType === "company").length,
      missingDocs: items.filter((item) => item.missingItems.length > 0).length,
    }),
    [items],
  );

  const queueLanes = [
    {
      label: "Review now",
      value: summary.underReview,
      helper: "Applications already in active review and most likely to breach first.",
      icon: FileSearch,
      accent: "from-indigo-500/35 to-fuchsia-500/12",
    },
    {
      label: "Need applicant follow-up",
      value: summary.needMoreInfo,
      helper: "Recoverable submissions waiting on identity, agreement, or portfolio proof.",
      icon: UserRoundSearch,
      accent: "from-amber-500/30 to-orange-500/12",
    },
    {
      label: "Risk attention",
      value: summary.highRisk,
      helper: "Applications flagged for fraud, ownership, or authenticity review.",
      icon: ShieldAlert,
      accent: "from-rose-500/35 to-red-500/12",
    },
  ];

  return (
    <div className="space-y-6 text-gray-200">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#090910] px-6 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.42)] sm:px-7 xl:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.20),transparent_28%),linear-gradient(135deg,rgba(249,115,22,0.10),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-indigo-200">Admin</span>
              <span>/</span>
              <span className="text-white">Creator management</span>
              <span>/</span>
              <span className="text-rose-200">Applications</span>
            </div>

            <div className="mt-5 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100">
                <Sparkles className="h-3.5 w-3.5" />
                UI Pro Max refresh
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:text-[38px] xl:text-[44px]">
                Creator application review, rebuilt as a fast-scanning moderation queue.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300 sm:text-[15px]">
                Review identity, portfolio quality, agreement acceptance, and authenticity risk from one surface. This version is optimized for triage:
                what needs an operator now, what is recoverable, and what should be escalated before approval.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin/creators/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-100 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
              >
                Back to dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Total queue</p>
                <p className="mt-2 text-2xl font-bold text-white">{loading ? "..." : summary.total.toLocaleString()}</p>
                <p className="mt-2 text-xs leading-5 text-gray-400">Applications currently visible to the review team.</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Missing docs</p>
                <p className="mt-2 text-2xl font-bold text-white">{loading ? "..." : summary.missingDocs.toLocaleString()}</p>
                <p className="mt-2 text-xs leading-5 text-gray-400">Applications with incomplete identity, agreement, or proof files.</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Unassigned</p>
                <p className="mt-2 text-2xl font-bold text-white">{loading ? "..." : summary.unassigned.toLocaleString()}</p>
                <p className="mt-2 text-xs leading-5 text-gray-400">Applications still without a reviewer owner.</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,24,0.94),rgba(12,12,18,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Queue pulse</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Application health</h2>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Live
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "Approved", value: summary.approved.toLocaleString(), helper: "Cleared and ready for creator access." },
                { label: "Need more info", value: summary.needMoreInfo.toLocaleString(), helper: "Recoverable, but currently blocked." },
                { label: "Companies / studios", value: summary.company.toLocaleString(), helper: "Applications from business entities." },
              ].map((item) => (
                <div key={item.label} className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-gray-200">{item.label}</p>
                    <p className="text-lg font-bold text-white">{loading ? "..." : item.value}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[20px] border border-amber-400/15 bg-amber-500/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-amber-200" />
                <div>
                  <p className="text-sm font-semibold text-amber-50">Operator note</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/75">
                    Prioritize high-risk and unassigned applications first. Those are the two states most likely to create hidden approval delays.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${panelClassName} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-400/80 via-fuchsia-400/30 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Under review</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">{loading ? "..." : summary.underReview.toLocaleString()}</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">Active operator review queue.</p>
        </article>
        <article className={`${panelClassName} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/80 via-orange-400/30 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Need info</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-amber-200">{loading ? "..." : summary.needMoreInfo.toLocaleString()}</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">Applications waiting on applicant follow-up.</p>
        </article>
        <article className={`${panelClassName} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/80 via-teal-400/30 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Approved</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-emerald-200">{loading ? "..." : summary.approved.toLocaleString()}</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">Cleared for creator onboarding completion.</p>
        </article>
        <article className={`${panelClassName} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-rose-400/80 via-red-400/30 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">High risk</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-rose-200">{loading ? "..." : summary.highRisk.toLocaleString()}</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">Require fraud, ownership, or compliance attention.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(340px,0.94fr)]">
        <article className={panelClassName}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Workstreams</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Queue lanes</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                The review queue is split into the three decisions operators make most often: active review, applicant follow-up, and trust escalation.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {queueLanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <div key={lane.label} className={`rounded-[22px] border border-white/10 bg-gradient-to-br ${lane.accent} p-[1px]`}>
                  <div className="h-full rounded-[21px] bg-[#0d0d14] p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{lane.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{loading ? "..." : lane.value.toLocaleString()}</p>
                    <p className="mt-3 text-sm leading-6 text-gray-400">{lane.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Operator rules</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Review guidance</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <p className="font-medium text-gray-100">Approve only when the legal identity trail is complete</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">Identity, agreement, and portfolio proof should all align before granting creator access.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <UserRoundSearch className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <p className="font-medium text-gray-100">Use “need more info” for recoverable submissions</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">Missing ID files, agreement details, or portfolio references should usually route back for completion, not rejection.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-300" />
                <div>
                  <p className="font-medium text-gray-100">Escalate high-risk and authenticity concerns quickly</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">Ownership mismatch, suspicious documents, or rights concerns should be routed before an approval decision is made.</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className={panelClassName}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Filters</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Review queue</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Scan the full application table, then jump into the detail review flow for a final decision.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-300">
            {loading ? "Loading..." : `${filtered.length} visible`}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_190px_190px]">
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
                    <EmptyState
                      title="Loading creator applications"
                      description="The review queue is being loaded from the creator admin API."
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      title="No applications match the current filters"
                      description="Try clearing the search, status, or risk filters to widen the queue again."
                    />
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
                          <p className="mt-1 text-xs text-gray-500">{item.applicationSummary.contactPhone || "No phone provided"}</p>
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
                              ? `Business type: ${item.applicationSummary.businessType || "Missing"} · Registration ID: ${item.applicationSummary.identityReference || "Missing"}`
                              : `Age ${item.applicationSummary.age || "Missing"} · ID ${item.applicationSummary.identityReference || "Missing"}`}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">{item.genres.join(", ") || "No genres"} · {item.primaryLanguage || "No language"}</p>
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
                              {item.applicationSummary.secondaryDocumentLabel}: {item.applicationSummary.secondaryDocumentName || "Missing"}
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
                          ) : (
                            <p className="mt-3 text-xs text-gray-500">No missing items flagged.</p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                      </td>

                      <td className="py-4 pr-4">
                        <div className="min-w-[120px]">
                          <p className="text-sm text-gray-300">{item.assignedReviewer || "Unassigned"}</p>
                          {!item.assignedReviewer ? (
                            <p className="mt-1 text-xs text-amber-300">Needs owner</p>
                          ) : null}
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
