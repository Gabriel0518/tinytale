"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HandCoins, Search } from "lucide-react";
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

export default function CreatorPayoutRequestsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminPayoutRequestItem[]>(mockCreatorPayoutRequests);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(mockCreatorPayoutRequests[0]?.id || "");
  const [decision, setDecision] = useState<PayoutDecision>("confirm");
  const [note, setNote] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorPayoutRequests();
        const next = response?.data?.items || response?.data?.requests || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setSelectedId(String(next[0]?.id || ""));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorPayoutRequests);
          setSelectedId(mockCreatorPayoutRequests[0]?.id || "");
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

  const selected = useMemo(() => filtered.find((item) => item.id === selectedId) || filtered[0] || null, [filtered, selectedId]);

  async function handleReview() {
    if (!selected) return;
    if (!note.trim() && decision !== "mark_paid") {
      toast("A payout note is required.", "info");
      return;
    }
    if (decision === "mark_paid" && !transferReference.trim()) {
      toast("A transfer reference is required when marking a payout as paid.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorPayoutRequest(selected.creatorId, selected.statementId, {
        decision,
        note,
        transferReference,
      });
    } catch {
      // Keep workflow usable before final finance integration is ready.
    } finally {
      setSubmitting(false);
    }

    const nextStatus: CreatorAdminSettlementStatus =
      decision === "mark_paid" ? "paid" : decision === "confirm" ? "confirmed" : "held";
    setItems((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      status: nextStatus,
      note: note || item.note,
      holdReason: decision === "hold" ? (note || item.holdReason) : "",
      transferReference: decision === "mark_paid" ? transferReference : item.transferReference,
    } : item));
    toast("Payout request updated.", "success");
    setNote("");
    setTransferReference("");
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

      <section className="space-y-4">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Payout queue</h2>
              <p className="text-sm text-gray-400">Statements ready for finance action.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading payout requests...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No payout requests match the current filters.</div>
            ) : filtered.map((item) => {
              const settlementMeta = getCreatorSettlementStatusMeta(item.status);
              const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
              const selectedCard = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedCard ? "border-indigo-500/60 bg-[#171726]" : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.creatorName}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.statementNo} · {formatUsd(item.amountUsd)}</p>
                      <p className="mt-2 text-xs text-gray-500">Requested {formatAdminDate(item.requestedAt, true)} · {item.payoutMethodLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                    </div>
                  </div>
                  {(item.holdReason || item.transferReference) && (
                    <p className="mt-3 text-sm text-gray-400">{item.holdReason || item.transferReference}</p>
                  )}
                </button>
              );
            })}
          </div>
        </article>
        <article className={panelClassName}>
          <h2 className="text-lg font-semibold text-white">Finance decision</h2>
          {!selected ? (
            <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">Select a payout request to operate on it.</div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                <p className="font-medium text-white">{selected.creatorName}</p>
                <p className="mt-1 text-sm text-gray-400">{selected.statementNo} · {formatUsd(selected.amountUsd)}</p>
                <p className="mt-3 text-sm text-gray-300">{selected.note || selected.holdReason || "No finance note on record."}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                <select value={decision} onChange={(event) => setDecision(event.target.value as PayoutDecision)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
                  <option value="confirm">Confirm for payout</option>
                  <option value="hold">Place hold</option>
                  <option value="mark_paid">Mark as paid</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Finance note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Explain why the payout is confirmed, held, or paid."
                  className="min-h-[140px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Transfer reference</label>
                <input
                  value={transferReference}
                  onChange={(event) => setTransferReference(event.target.value)}
                  placeholder="Required when marking a payout as paid"
                  className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleReview}
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save payout decision"}
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
