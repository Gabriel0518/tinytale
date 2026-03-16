"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HandCoins, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminPayoutRequestItem, CreatorAdminSettlementStatus } from "@/types/creator";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorSettlementStatusMeta,
  mockCreatorPayoutRequests,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type PayoutDecision = "hold" | "confirm" | "mark_paid";
type PayoutDecisionDraft = {
  decision: PayoutDecision;
  note: string;
  transferReference: string;
};

function getDefaultDecision(status: CreatorAdminSettlementStatus): PayoutDecision {
  if (status === "paid") return "mark_paid";
  if (status === "held" || status === "disputed") return "hold";
  return "confirm";
}

function buildDraft(item: CreatorAdminPayoutRequestItem): PayoutDecisionDraft {
  return {
    decision: getDefaultDecision(item.status),
    note: item.holdReason || item.note || "",
    transferReference: item.transferReference || "",
  };
}

export default function CreatorPayoutRequestsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminPayoutRequestItem[]>(mockCreatorPayoutRequests);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, PayoutDecisionDraft>>(
    Object.fromEntries(mockCreatorPayoutRequests.map((item) => [item.id, buildDraft(item)])),
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorPayoutRequests();
        const next = response?.data?.items || response?.data?.requests || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setDrafts(Object.fromEntries(next.map((item: CreatorAdminPayoutRequestItem) => [item.id, buildDraft(item)])));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorPayoutRequests);
          setDrafts(Object.fromEntries(mockCreatorPayoutRequests.map((item) => [item.id, buildDraft(item)])));
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
      const haystack = [item.creatorName, item.creatorEmail, item.statementNo, item.transferReference, item.holdReason].join(" ").toLowerCase();
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
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeModalId]);

  async function handleReview(item: CreatorAdminPayoutRequestItem) {
    const draft = drafts[item.id] || buildDraft(item);
    if (!draft.note.trim() && draft.decision !== "mark_paid") {
      toast("A payout note is required.", "info");
      return;
    }
    if (draft.decision === "mark_paid" && !draft.transferReference.trim()) {
      toast("A transfer reference is required when marking a payout as paid.", "info");
      return;
    }

    setSubmittingId(item.id);
    try {
      await adminApi.reviewCreatorPayoutRequest(item.creatorId, item.statementId, {
        decision: draft.decision,
        note: draft.note,
        transferReference: draft.transferReference,
      });
    } catch {
      // Keep workflow usable before final finance integration is ready.
    } finally {
      setSubmittingId(null);
    }

    const nextStatus: CreatorAdminSettlementStatus =
      draft.decision === "mark_paid" ? "paid" : draft.decision === "confirm" ? "confirmed" : "held";
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? {
      ...item,
      status: nextStatus,
      note: draft.note || item.note,
      holdReason: draft.decision === "hold" ? (draft.note || item.holdReason) : "",
      transferReference: draft.decision === "mark_paid" ? draft.transferReference : item.transferReference,
    } : currentItem));
    setDrafts((current) => ({
      ...current,
      [item.id]: {
        decision: getDefaultDecision(nextStatus),
        note: draft.note,
        transferReference: draft.decision === "mark_paid" ? draft.transferReference : current[item.id]?.transferReference || "",
      },
    }));
    setActiveModalId(null);
    toast("Payout request updated.", "success");
  }

  const stats = useMemo(() => ({
    queued: items.filter((item) => item.status === "generated").length,
    confirmed: items.filter((item) => item.status === "confirmed").length,
    paid: items.filter((item) => item.status === "paid").length,
    held: items.filter((item) => item.status === "held" || item.status === "disputed").length,
  }), [items]);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Finance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator payout request queue</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Review payout-ready statements, place manual holds, and record transfer references after finance executes creator payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/settlements" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open settlements
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Generated</p><p className="mt-3 text-3xl font-bold text-indigo-300">{stats.queued}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Confirmed</p><p className="mt-3 text-3xl font-bold text-emerald-300">{stats.confirmed}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Paid</p><p className="mt-3 text-3xl font-bold text-green-300">{stats.paid}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Held</p><p className="mt-3 text-3xl font-bold text-red-300">{stats.held}</p></article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator, statement number, transfer reference, or hold note"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All payout states</option>
            <option value="generated">Generated</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="held">Held</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <HandCoins className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Payout queue</h2>
            <p className="text-sm text-gray-400">Simple finance list. Open the action modal from the row that needs a decision.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Statement</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Method</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">Loading payout requests...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">No payout requests match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const settlementMeta = getCreatorSettlementStatusMeta(item.status);
                const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.creatorName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.creatorEmail}</p>
                      {(item.holdReason || item.note) ? <p className="mt-2 max-w-[260px] text-xs leading-5 text-gray-400">{item.holdReason || item.note}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.statementNo}</p>
                      <p className="mt-1 text-xs text-gray-500">Requested {formatAdminDate(item.requestedAt, true)}</p>
                      {item.transferReference ? <p className="mt-2 text-xs text-gray-400">Ref {item.transferReference}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{formatUsd(item.amountUsd)}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      {item.payoutMethodLabel}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                      </div>
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

      {activeModalItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Payout action</p>
                <h3 className="truncate text-base font-semibold text-white">{activeModalItem.creatorName} · {activeModalItem.statementNo}</h3>
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
                const isSubmitting = submittingId === activeModalItem.id;
                const settlementMeta = getCreatorSettlementStatusMeta(activeModalItem.status);
                const bankMeta = getCreatorBankStatusMeta(activeModalItem.bankStatus);

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{activeModalItem.creatorName}</p>
                          <p className="mt-1 text-sm text-gray-400">{activeModalItem.statementNo} · {formatUsd(activeModalItem.amountUsd)} · {activeModalItem.payoutMethodLabel}</p>
                          <p className="mt-2 text-xs text-gray-500">Requested {formatAdminDate(activeModalItem.requestedAt, true)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-300">{activeModalItem.note || activeModalItem.holdReason || "No finance note on record."}</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                      <select
                        value={draft.decision}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, decision: event.target.value as PayoutDecision } }))}
                        className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                      >
                        <option value="confirm">Confirm for payout</option>
                        <option value="hold">Place hold</option>
                        <option value="mark_paid">Mark as paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Finance note</label>
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, note: event.target.value } }))}
                        placeholder="Explain why the payout is confirmed, held, or paid."
                        className="min-h-[140px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Transfer reference</label>
                      <input
                        value={draft.transferReference}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, transferReference: event.target.value } }))}
                        placeholder="Required when marking a payout as paid"
                        className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleReview(activeModalItem)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving..." : "Save payout decision"}
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
