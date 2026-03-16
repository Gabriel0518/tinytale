"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminSettlementItem, CreatorAdminSettlementStatus } from "@/types/creator";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorSettlementStatusMeta,
  mockCreatorSettlements,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type SettlementDecision = "confirm" | "hold" | "mark_paid" | "mark_disputed";

export default function CreatorSettlementsAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminSettlementItem[]>(mockCreatorSettlements);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(mockCreatorSettlements[0]?.id || "");
  const [decision, setDecision] = useState<SettlementDecision>("confirm");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorSettlements();
        const next = response?.data?.items || response?.data?.settlements || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setSelectedId(String(next[0]?.id || ""));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorSettlements);
          setSelectedId(mockCreatorSettlements[0]?.id || "");
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
      const haystack = [item.creatorName, item.statementNo, item.periodLabel, item.note].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    return true;
  }), [items, search, status]);

  const selected = useMemo(() => filtered.find((item) => item.id === selectedId) || filtered[0] || null, [filtered, selectedId]);

  async function handleReview() {
    if (!selected) return;
    if (!note.trim()) {
      toast("A settlement note is required.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorSettlement(selected.creatorId, selected.statementId, { decision, note });
    } catch {
      // Preserve local workflow while real finance integration is still deferred.
    } finally {
      setSubmitting(false);
    }

    const nextStatus: CreatorAdminSettlementStatus =
      decision === "mark_paid"
        ? "paid"
        : decision === "mark_disputed"
          ? "disputed"
          : decision === "hold"
            ? "held"
            : "confirmed";
    setItems((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      status: nextStatus,
      note,
    } : item));
    toast("Settlement updated.", "success");
    setNote("");
  }

  const stats = useMemo(() => ({
    generated: items.filter((item) => item.status === "generated").length,
    confirmed: items.filter((item) => item.status === "confirmed").length,
    paid: items.filter((item) => item.status === "paid").length,
    heldOrDisputed: items.filter((item) => item.status === "held" || item.status === "disputed").length,
  }), [items]);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Finance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator settlement management</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Review the deduction chain from gross revenue to net creator payout, resolve disputes, and control statement release into the payout queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/bank-accounts" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Bank accounts
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Generated</p><p className="mt-3 text-3xl font-bold text-indigo-300">{stats.generated}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Confirmed</p><p className="mt-3 text-3xl font-bold text-emerald-300">{stats.confirmed}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Paid</p><p className="mt-3 text-3xl font-bold text-green-300">{stats.paid}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Held / Disputed</p><p className="mt-3 text-3xl font-bold text-red-300">{stats.heldOrDisputed}</p></article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator, statement no, period, or note"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All statement states</option>
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
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settlement list</h2>
              <p className="text-sm text-gray-400">Statement-level revenue and payout readiness.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading settlements...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No settlements match the current filters.</div>
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
                      <p className="mt-1 text-sm text-gray-400">{item.statementNo} · {item.periodLabel}</p>
                      <p className="mt-2 text-xs text-gray-500">{item.unlockCount.toLocaleString()} unlocks · Net {formatUsd(item.netPayoutUsd)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                    </div>
                  </div>
                  {item.note && <p className="mt-3 text-sm text-gray-400">{item.note}</p>}
                </button>
              );
            })}
          </div>
        </article>
        <article className={panelClassName}>
          <h2 className="text-lg font-semibold text-white">Settlement action</h2>
          {!selected ? (
            <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">Select a settlement to review it.</div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                <p className="font-medium text-white">{selected.statementNo}</p>
                <p className="mt-1 text-sm text-gray-400">{selected.creatorName} · {selected.periodLabel}</p>
                <div className="mt-4 grid gap-3">
                  <div><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Gross</p><p className="mt-1 text-sm text-white">{formatUsd(selected.grossRevenueUsd)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Net payout</p><p className="mt-1 text-sm text-white">{formatUsd(selected.netPayoutUsd)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Platform fees</p><p className="mt-1 text-sm text-gray-300">{formatUsd(selected.channelFeesUsd)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Reserve</p><p className="mt-1 text-sm text-gray-300">{formatUsd(selected.reserveUsd)}</p></div>
                </div>
                <p className="mt-4 text-xs text-gray-500">{selected.payoutDate ? `Planned payout ${formatAdminDate(selected.payoutDate, true)}` : "No payout date assigned"}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                <select value={decision} onChange={(event) => setDecision(event.target.value as SettlementDecision)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
                  <option value="confirm">Confirm statement</option>
                  <option value="hold">Place hold</option>
                  <option value="mark_disputed">Mark disputed</option>
                  <option value="mark_paid">Mark paid</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Settlement note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Record the reason for confirmation, hold, dispute, or payment."
                  className="min-h-[150px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleReview}
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save settlement action"}
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
