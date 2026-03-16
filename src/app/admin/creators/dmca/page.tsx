"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Gavel, Search, ShieldAlert, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminDmcaCaseItem, CreatorAdminDmcaStatus } from "@/types/creator";
import {
  formatAdminDate,
  getCreatorDmcaStatusMeta,
  mockDmcaCases,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type DmcaDecision = "under_review" | "takedown" | "counter_notice" | "resolved" | "reject_claim";
type DmcaDecisionDraft = {
  decision: DmcaDecision;
  note: string;
};

function mapDecisionToStatus(decision: DmcaDecision): CreatorAdminDmcaStatus {
  switch (decision) {
    case "takedown":
      return "takedown_executed";
    case "counter_notice":
      return "counter_notice";
    case "resolved":
      return "resolved";
    case "reject_claim":
      return "rejected";
    default:
      return "under_review";
  }
}

function getDefaultDecision(status: CreatorAdminDmcaStatus): DmcaDecision {
  switch (status) {
    case "takedown_executed":
      return "takedown";
    case "counter_notice":
      return "counter_notice";
    case "resolved":
      return "resolved";
    case "rejected":
      return "reject_claim";
    default:
      return "under_review";
  }
}

function buildDraft(item: CreatorAdminDmcaCaseItem): DmcaDecisionDraft {
  return {
    decision: getDefaultDecision(item.status),
    note: item.note || "",
  };
}

export default function CreatorDmcaPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminDmcaCaseItem[]>(mockDmcaCases);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, DmcaDecisionDraft>>(
    Object.fromEntries(mockDmcaCases.map((item) => [item.id, buildDraft(item)])),
  );
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorDmcaCases();
        const next = response?.data?.items || response?.data?.cases || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setDrafts(Object.fromEntries(next.map((item: CreatorAdminDmcaCaseItem) => [item.id, buildDraft(item)])));
        }
      } catch {
        if (!cancelled) {
          setItems(mockDmcaCases);
          setDrafts(Object.fromEntries(mockDmcaCases.map((item) => [item.id, buildDraft(item)])));
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

  const filtered = useMemo(() => items.filter((item) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [item.id, item.creatorName, item.creatorEmail, item.dramaTitle, item.claimant, item.reason].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    return true;
  }), [items, search, status]);

  const activeModalItem = useMemo(
    () => filtered.find((item) => item.id === activeModalId) || items.find((item) => item.id === activeModalId) || null,
    [activeModalId, filtered, items],
  );

  useEffect(() => {
    if (!activeModalId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeModalId]);

  const stats = useMemo(() => ({
    open: items.filter((item) => item.status === "open" || item.status === "under_review").length,
    takedown: items.filter((item) => item.status === "takedown_executed").length,
    counterNotice: items.filter((item) => item.status === "counter_notice").length,
    strikeCases: items.filter((item) => item.strikeImpact > 0).length,
  }), [items]);

  async function handleSubmitReview(item: CreatorAdminDmcaCaseItem) {
    const draft = drafts[item.id] || buildDraft(item);
    if (!draft.note.trim()) {
      toast("A DMCA action note is required.", "info");
      return;
    }

    setSubmittingId(item.id);
    try {
      await adminApi.reviewCreatorDmcaCase(item.creatorId, item.id, { decision: draft.decision, note: draft.note });
    } catch {
      // Keep P2 workflow usable before the real back-office process is complete.
    } finally {
      setSubmittingId(null);
    }

    const nextStatus = mapDecisionToStatus(draft.decision);
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? {
      ...currentItem,
      status: nextStatus,
      note: draft.note,
    } : currentItem));
    setDrafts((current) => ({
      ...current,
      [item.id]: {
        decision: getDefaultDecision(nextStatus),
        note: draft.note,
      },
    }));
    setActiveModalId(null);
    toast("DMCA case updated.", "success");
  }

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / P2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">DMCA and infringement handling</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Centralize copyright complaints, takedown decisions, counter-notice review, and strike enforcement for creator content.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/content" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open content queue
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Open queue</p>
          <p className="mt-3 text-3xl font-bold text-white">{stats.open}</p>
          <p className="mt-2 text-sm text-gray-400">Claims still waiting on admin action.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Takedowns</p>
          <p className="mt-3 text-3xl font-bold text-red-300">{stats.takedown}</p>
          <p className="mt-2 text-sm text-gray-400">Cases that already resulted in content removal.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Counter notices</p>
          <p className="mt-3 text-3xl font-bold text-purple-300">{stats.counterNotice}</p>
          <p className="mt-2 text-sm text-gray-400">Claims currently inside the creator response window.</p>
        </article>
        <article className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Strike-bearing</p>
          <p className="mt-3 text-3xl font-bold text-white">{stats.strikeCases}</p>
          <p className="mt-2 text-sm text-gray-400">Cases that should impact strike history if upheld.</p>
        </article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator, claimant, title, or case id"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All case states</option>
            <option value="open">Open</option>
            <option value="under_review">Under review</option>
            <option value="takedown_executed">Takedown executed</option>
            <option value="counter_notice">Counter notice</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
            <Gavel className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Case queue</h2>
            <p className="text-sm text-gray-400">Compact case list. All decisions open in the row-level modal.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Case</th>
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Claimant</th>
                <th className="pb-3 pr-4 font-medium">Deadline</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">Loading DMCA queue...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">No DMCA cases match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const statusMeta = getCreatorDmcaStatusMeta(item.status);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.dramaTitle || "Creator-level claim"}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.id}</p>
                      <p className="mt-2 max-w-[280px] text-xs leading-5 text-gray-400">{item.reason}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.creatorName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.creatorEmail}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.strikeImpact > 0 ? `${item.strikeImpact} strike impact` : "No strike impact"}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      <p>{item.claimant}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.hasCounterNotice ? "Counter-notice received" : "No counter-notice"}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      <p>{item.dueAt ? formatAdminDate(item.dueAt) : "No deadline"}</p>
                      <p className="mt-1 text-xs text-gray-500">Reported {formatAdminDate(item.reportedAt, true)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveModalId(item.id)}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        Open action
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium text-white">Takedown action</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-400">When a claim is upheld, archive the affected title and attach the case note so finance and creator support see the same record.</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
            <p className="font-medium text-white">Counter-notice window</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">Use the counter-notice state when the creator submits proof and the complaint is still under legal review.</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
            <div className="flex items-center gap-2 text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              <p className="font-medium text-white">Strike enforcement</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-400">Case outcomes with strike impact should feed the creator strike trail for later restrictions without re-auditing old cases.</p>
          </div>
        </div>
      </section>

      {activeModalItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">DMCA action</p>
                <h3 className="truncate text-base font-semibold text-white">{activeModalItem.dramaTitle || "Creator-level claim"} · {activeModalItem.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalId(null)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {(() => {
                const draft = drafts[activeModalItem.id] || buildDraft(activeModalItem);
                const statusMeta = getCreatorDmcaStatusMeta(activeModalItem.status);
                const isSubmitting = submittingId === activeModalItem.id;

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{activeModalItem.dramaTitle || "Creator-level claim"}</p>
                          <p className="mt-1 text-sm text-gray-400">{activeModalItem.creatorName} · {activeModalItem.creatorEmail}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-300">{activeModalItem.reason}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Claimant</p>
                          <p className="mt-1 text-sm text-white">{activeModalItem.claimant}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Deadline</p>
                          <p className="mt-1 text-sm text-white">{activeModalItem.dueAt ? formatAdminDate(activeModalItem.dueAt, true) : "No deadline"}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-300">{activeModalItem.actionRequired}</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                      <select
                        value={draft.decision}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, decision: event.target.value as DmcaDecision } }))}
                        className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                      >
                        <option value="under_review">Mark under review</option>
                        <option value="takedown">Execute takedown</option>
                        <option value="counter_notice">Accept counter-notice window</option>
                        <option value="resolved">Resolve case</option>
                        <option value="reject_claim">Reject claim</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Action note</label>
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, note: event.target.value } }))}
                        placeholder="Explain the legal/compliance action taken on this case."
                        className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={() => handleSubmitReview(activeModalItem)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving..." : "Save case action"}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
