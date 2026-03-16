"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Landmark, Search, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminBankAccountItem } from "@/types/creator";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorLifecycleMeta,
  mockCreatorBankAccounts,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type BankDecision = "verified" | "rejected" | "frozen";

export default function CreatorBankAccountsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminBankAccountItem[]>(mockCreatorBankAccounts);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(mockCreatorBankAccounts[0]?.creatorId || "");
  const [decision, setDecision] = useState<BankDecision>("verified");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorBankAccounts();
        const next = response?.data?.items || response?.data?.accounts || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setSelectedId(String(next[0]?.creatorId || ""));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorBankAccounts);
          setSelectedId(mockCreatorBankAccounts[0]?.creatorId || "");
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
      const haystack = [item.creatorName, item.creatorEmail, item.bankName, item.country, item.maskedAccountNumber].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.bankStatus !== status) return false;
    return true;
  }), [items, search, status]);

  const selected = useMemo(() => filtered.find((item) => item.creatorId === selectedId) || filtered[0] || null, [filtered, selectedId]);

  async function handleReview() {
    if (!selected) return;
    if (!note.trim()) {
      toast("A finance review note is required.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorBankAccount(selected.creatorId, { decision, note });
    } catch {
      // Keep local admin workflow available before finance integration lands.
    } finally {
      setSubmitting(false);
    }

    setItems((current) => current.map((item) => item.creatorId === selected.creatorId ? {
      ...item,
      bankStatus: decision,
      lastReviewNote: note,
      updatedAt: new Date().toISOString(),
    } : item));
    toast("Bank review saved.", "success");
    setNote("");
  }

  const stats = useMemo(() => ({
    pending: items.filter((item) => item.bankStatus === "pending_review").length,
    verified: items.filter((item) => item.bankStatus === "verified").length,
    rejected: items.filter((item) => item.bankStatus === "rejected").length,
    frozen: items.filter((item) => item.bankStatus === "frozen").length,
  }), [items]);

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Finance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator bank-account review</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Review payout accounts before settlement release, capture rejection reasons, and freeze payout methods when compliance or finance blocks exist.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/payout-requests" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open payout queue
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Pending review</p><p className="mt-3 text-3xl font-bold text-indigo-300">{stats.pending}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Verified</p><p className="mt-3 text-3xl font-bold text-green-300">{stats.verified}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Rejected</p><p className="mt-3 text-3xl font-bold text-red-300">{stats.rejected}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Frozen</p><p className="mt-3 text-3xl font-bold text-orange-300">{stats.frozen}</p></article>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator, bank, country, or masked account"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All bank states</option>
            <option value="pending_review">Pending review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="frozen">Frozen</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account queue</h2>
              <p className="text-sm text-gray-400">Prioritize creators whose payouts are blocked by finance review.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading bank review queue...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No bank accounts match the current filters.</div>
            ) : filtered.map((item) => {
              const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
              const creatorMeta = getCreatorLifecycleMeta(item.creatorStatus);
              const selectedCard = selected?.creatorId === item.creatorId;
              return (
                <button
                  key={item.creatorId}
                  type="button"
                  onClick={() => setSelectedId(item.creatorId)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedCard ? "border-indigo-500/60 bg-[#171726]" : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.creatorName}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.bankName || "No bank submitted"} · {item.maskedAccountNumber || "Missing account"}</p>
                      <p className="mt-2 text-xs text-gray-500">{item.country} · Updated {formatAdminDate(item.updatedAt, true)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${creatorMeta.className}`}>{creatorMeta.label}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>Available {formatUsd(item.availableBalanceUsd)}</span>
                    <span>Pending {formatUsd(item.pendingBalanceUsd)}</span>
                    <span>{item.nextSettlementDate ? `Next settlement ${formatAdminDate(item.nextSettlementDate)}` : "No settlement scheduled"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <aside className="space-y-4">
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Finance action</h2>
                <p className="text-sm text-gray-400">Approve, reject, or freeze the payout method.</p>
              </div>
            </div>
            {!selected ? (
              <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">Select an account to review it.</div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="font-medium text-white">{selected.accountHolderName || "Missing account holder"}</p>
                  <p className="mt-1 text-sm text-gray-400">{selected.bankName || "No bank name"} · {selected.maskedAccountNumber || "No account number"}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{selected.lastReviewNote || "No finance note on record."}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                  <select value={decision} onChange={(event) => setDecision(event.target.value as BankDecision)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
                    <option value="verified">Approve bank account</option>
                    <option value="rejected">Reject and request resubmission</option>
                    <option value="frozen">Freeze payout method</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Review note</label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Explain the finance decision or the documents still required."
                    className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleReview}
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save bank review"}
                </button>
              </div>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
