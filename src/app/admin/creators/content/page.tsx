"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Search, ShieldAlert } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminContentReviewListItem } from "@/types/creator";
import {
  formatAdminDate,
  getCreatorContentReviewStatusMeta,
  getCreatorSlaStatusMeta,
  mockContentReviews,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

export default function CreatorContentReviewPage() {
  const [items, setItems] = useState<CreatorAdminContentReviewListItem[]>(mockContentReviews);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [slaStatus, setSlaStatus] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorContentReviews();
        const next = response?.data?.items || response?.data?.reviews || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
        }
      } catch {
        if (!cancelled) setItems(mockContentReviews);
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
      const haystack = [item.dramaId, item.title, item.creatorName, item.creatorEmail, item.categories.join(" ")].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    if (slaStatus !== "all" && item.slaStatus !== slaStatus) return false;
    return true;
  }), [items, search, status, slaStatus]);

  const stats = useMemo(() => ({
    pending: items.filter((item) => item.status === "pending_review").length,
    dueSoon: items.filter((item) => item.slaStatus === "due_soon").length,
    breached: items.filter((item) => item.slaStatus === "breach").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  }), [items]);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / P2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator content review queue</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Review creator drama submissions, watch the 48-hour SLA, and route each title to publish or changes-requested with the five-item checklist workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/dmca" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open DMCA queue
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Pending review</p>
          <p className="mt-3 text-3xl font-bold text-white">{stats.pending}</p>
          <p className="mt-2 text-sm text-gray-400">Titles currently waiting for admin review.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Due soon</p>
          <p className="mt-3 text-3xl font-bold text-amber-300">{stats.dueSoon}</p>
          <p className="mt-2 text-sm text-gray-400">Items that will breach the SLA in the next few hours.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Breached</p>
          <p className="mt-3 text-3xl font-bold text-red-300">{stats.breached}</p>
          <p className="mt-2 text-sm text-gray-400">Submissions that already missed the 48-hour review target.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Changes requested</p>
          <p className="mt-3 text-3xl font-bold text-white">{stats.rejected}</p>
          <p className="mt-2 text-sm text-gray-400">Titles blocked pending creator revisions and resubmission.</p>
        </article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, creator, category, or review id"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All review states</option>
            <option value="pending_review">Pending review</option>
            <option value="published">Published</option>
            <option value="rejected">Changes requested</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
          <select value={slaStatus} onChange={(event) => setSlaStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All SLA states</option>
            <option value="breach">Breached</option>
            <option value="due_soon">Due soon</option>
            <option value="on_track">On track</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Queue</h2>
              <p className="mt-1 text-sm text-gray-400">Direct entry to the drama review detail and decision workflow.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Drama</th>
                  <th className="pb-3 pr-4 font-medium">Creator</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">SLA</th>
                  <th className="pb-3 pr-4 font-medium">Submitted</th>
                  <th className="pb-3 pr-4 font-medium">Review note</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">Loading content review queue...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">No submissions match the current filters.</td>
                  </tr>
                ) : filtered.map((item) => {
                  const statusMeta = getCreatorContentReviewStatusMeta(item.status);
                  const slaMeta = getCreatorSlaStatusMeta(item.slaStatus);
                  return (
                    <tr key={item.dramaId} className="border-b border-gray-800/60 align-top">
                      <td className="py-4 pr-4">
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.categories.join(" · ") || "Uncategorized"}</p>
                        <p className="mt-2 text-xs text-gray-400">{item.episodes} episodes · {item.viewCount.toLocaleString()} views</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-medium text-white">{item.creatorName}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.creatorEmail}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${slaMeta.className}`}>{slaMeta.label}</span>
                        <p className="mt-2 text-xs text-gray-500">{item.slaDeadlineAt ? `Due ${formatAdminDate(item.slaDeadlineAt, true)}` : "No active SLA"}</p>
                      </td>
                      <td className="py-4 pr-4 text-gray-300">{formatAdminDate(item.submittedAt, true)}</td>
                      <td className="py-4 pr-4 text-gray-400">{item.reviewNote || item.rejectionReason || "-"}</td>
                      <td className="py-4 text-right">
                        <Link href={`/admin/creators/content/${item.dramaId}`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                          Review
                          <ArrowRight className="h-3.5 w-3.5" />
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Operational reminders</h2>
              <p className="text-sm text-gray-400">P2 queue rules carried from the Creator spec.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
              <p className="font-medium text-white">48-hour SLA</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">Use the SLA chip to prioritize titles that are about to breach review targets. Breached items should be resolved before new submissions.</p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
              <p className="font-medium text-white">Five-item checklist</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">Every review detail page includes metadata, episode asset, pricing, rights, and policy checks so approval criteria stay consistent across admins.</p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                <p className="font-medium text-white">Rights issues escalate to DMCA</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-400">If a submission is blocked by copyright or infringement evidence, route it into the DMCA queue so strike enforcement and takedown records stay centralized.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
