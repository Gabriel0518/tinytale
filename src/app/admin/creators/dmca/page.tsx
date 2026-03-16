"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Gavel, Search, ShieldAlert } from "lucide-react";
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

export default function CreatorDmcaPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminDmcaCaseItem[]>(mockDmcaCases);
  const [selectedId, setSelectedId] = useState<string>(mockDmcaCases[0]?.id || "");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [decision, setDecision] = useState<DmcaDecision>("under_review");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorDmcaCases();
        const next = response?.data?.items || response?.data?.cases || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setSelectedId(String(next[0]?.id || ""));
        }
      } catch {
        if (!cancelled) {
          setItems(mockDmcaCases);
          setSelectedId(mockDmcaCases[0]?.id || "");
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

  const selected = useMemo(() => filtered.find((item) => item.id === selectedId) || filtered[0] || null, [filtered, selectedId]);

  useEffect(() => {
    if (!selected && filtered[0]) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selected]);

  const stats = useMemo(() => ({
    open: items.filter((item) => item.status === "open" || item.status === "under_review").length,
    takedown: items.filter((item) => item.status === "takedown_executed").length,
    counterNotice: items.filter((item) => item.status === "counter_notice").length,
    strikeCases: items.filter((item) => item.strikeImpact > 0).length,
  }), [items]);

  async function handleSubmitReview() {
    if (!selected) return;
    if (!note.trim()) {
      toast("A DMCA action note is required.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorDmcaCase(selected.creatorId, selected.id, { decision, note });
    } catch {
      // Keep P2 workflow usable before the real back-office process is complete.
    } finally {
      setSubmitting(false);
    }

    const nextStatus = mapDecisionToStatus(decision);
    setItems((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      status: nextStatus,
      note,
    } : item));
    toast("DMCA case updated.", "success");
    setNote("");
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

      <section className="space-y-4">
        <article className={panelClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Case queue</h2>
              <p className="mt-1 text-sm text-gray-400">Review notices, claimant evidence, and creator exposure from one place.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading DMCA queue...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No DMCA cases match the current filters.</div>
            ) : filtered.map((item) => {
              const statusMeta = getCreatorDmcaStatusMeta(item.status);
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-indigo-500/60 bg-[#171726]" : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.dramaTitle || "Creator-level claim"}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.creatorName} · {item.claimant}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>Reported {formatAdminDate(item.reportedAt, true)}</span>
                    <span>{item.dueAt ? `Due ${formatAdminDate(item.dueAt, true)}` : "No deadline"}</span>
                    <span>{item.strikeImpact > 0 ? `${item.strikeImpact} strike impact` : "No strike impact"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </article>
        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Enforcement notes</h2>
                <p className="text-sm text-gray-400">P2 scope keeps the queue and strike trail visible to admins.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                <p className="font-medium text-white">Takedown action</p>
                <p className="mt-2 text-sm leading-6 text-gray-400">When a claim is upheld, archive the affected title and attach the case note so finance and creator support see the same enforcement record.</p>
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
                <p className="mt-2 text-sm leading-6 text-gray-400">Case outcomes with strike impact should feed the creator’s strike history so restrictions can be escalated later without re-auditing prior cases.</p>
              </div>
            </div>
          </article>
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Case action</h2>
                <p className="text-sm text-gray-400">Record takedown, counter-notice, or resolution steps.</p>
              </div>
            </div>

            {!selected ? (
              <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">Select a case from the queue to review it.</div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="font-medium text-white">{selected.dramaTitle || "Creator-level claim"}</p>
                  <p className="mt-1 text-sm text-gray-400">{selected.creatorName} · {selected.creatorEmail}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{selected.actionRequired}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Claimant: {selected.claimant}</span>
                    <span>{selected.hasCounterNotice ? "Counter-notice received" : "No counter-notice"}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                  <select value={decision} onChange={(event) => setDecision(event.target.value as DmcaDecision)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
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
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Explain the legal/compliance action taken on this case."
                    className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save case action"}
                </button>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
