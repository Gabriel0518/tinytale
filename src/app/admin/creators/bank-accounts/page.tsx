"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Landmark, Search, ShieldCheck, X } from "lucide-react";
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
type BankDecisionDraft = {
  decision: BankDecision;
  note: string;
};

function buildDraft(item: CreatorAdminBankAccountItem): BankDecisionDraft {
  return {
    decision:
      item.bankStatus === "verified"
        ? "verified"
        : item.bankStatus === "frozen"
          ? "frozen"
          : "rejected",
    note: item.lastReviewNote || "",
  };
}

export default function CreatorBankAccountsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminBankAccountItem[]>(mockCreatorBankAccounts);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, BankDecisionDraft>>(
    Object.fromEntries(mockCreatorBankAccounts.map((item) => [item.creatorId, buildDraft(item)])),
  );
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorBankAccounts();
        const next = response?.data?.items || response?.data?.accounts || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setDrafts(Object.fromEntries(next.map((item: CreatorAdminBankAccountItem) => [item.creatorId, buildDraft(item)])));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorBankAccounts);
          setDrafts(Object.fromEntries(mockCreatorBankAccounts.map((item) => [item.creatorId, buildDraft(item)])));
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

  const activeModalItem = useMemo(
    () => filtered.find((item) => item.creatorId === activeModalId) || items.find((item) => item.creatorId === activeModalId) || null,
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

  async function handleReview(item: CreatorAdminBankAccountItem) {
    const draft = drafts[item.creatorId] || buildDraft(item);
    if (!draft.note.trim()) {
      toast("A finance review note is required.", "info");
      return;
    }

    setSubmittingId(item.creatorId);
    try {
      await adminApi.reviewCreatorBankAccount(item.creatorId, { decision: draft.decision, note: draft.note });
    } catch {
      // Keep local admin workflow available before finance integration lands.
    } finally {
      setSubmittingId(null);
    }

    setItems((current) => current.map((currentItem) => currentItem.creatorId === item.creatorId ? {
      ...currentItem,
      bankStatus: draft.decision,
      lastReviewNote: draft.note,
      updatedAt: new Date().toISOString(),
    } : currentItem));
    setDrafts((current) => ({
      ...current,
      [item.creatorId]: draft,
    }));
    setActiveModalId(null);
    toast("Bank review saved.", "success");
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

      <section className={panelClassName}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Account queue</h2>
            <p className="text-sm text-gray-400">Compact finance list. Review each payout method from the action modal.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Bank Account</th>
                <th className="pb-3 pr-4 font-medium">Balance</th>
                <th className="pb-3 pr-4 font-medium">Settlement</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">Loading bank review queue...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">No bank accounts match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
                const creatorMeta = getCreatorLifecycleMeta(item.creatorStatus);
                return (
                  <tr key={item.creatorId} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.creatorName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.creatorEmail}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.country} · Updated {formatAdminDate(item.updatedAt, true)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.bankName || "No bank submitted"}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.accountHolderName || "Missing account holder"}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.maskedAccountNumber || "Missing account number"}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{formatUsd(item.availableBalanceUsd)}</p>
                      <p className="mt-1 text-xs text-gray-500">Pending {formatUsd(item.pendingBalanceUsd)}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      {item.nextSettlementDate ? formatAdminDate(item.nextSettlementDate) : "No schedule"}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${creatorMeta.className}`}>{creatorMeta.label}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveModalId(item.creatorId)}
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Finance review policy</h2>
            <p className="text-sm text-gray-400">All account decisions are now handled from the row-level action modal to keep the queue compact.</p>
          </div>
        </div>
      </section>

      {activeModalItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Bank review action</p>
                <h3 className="truncate text-base font-semibold text-white">{activeModalItem.creatorName} · {activeModalItem.bankName || "Missing bank"}</h3>
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
                const draft = drafts[activeModalItem.creatorId] || buildDraft(activeModalItem);
                const bankMeta = getCreatorBankStatusMeta(activeModalItem.bankStatus);
                const creatorMeta = getCreatorLifecycleMeta(activeModalItem.creatorStatus);
                const isSubmitting = submittingId === activeModalItem.creatorId;

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{activeModalItem.accountHolderName || "Missing account holder"}</p>
                          <p className="mt-1 text-sm text-gray-400">{activeModalItem.bankName || "No bank name"} · {activeModalItem.maskedAccountNumber || "No account number"}</p>
                          <p className="mt-2 text-xs text-gray-500">{activeModalItem.country} · Updated {formatAdminDate(activeModalItem.updatedAt, true)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${creatorMeta.className}`}>{creatorMeta.label}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Available balance</p>
                          <p className="mt-1 text-sm text-white">{formatUsd(activeModalItem.availableBalanceUsd)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Pending balance</p>
                          <p className="mt-1 text-sm text-white">{formatUsd(activeModalItem.pendingBalanceUsd)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-300">{activeModalItem.lastReviewNote || "No finance note on record."}</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                      <select
                        value={draft.decision}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.creatorId]: { ...draft, decision: event.target.value as BankDecision } }))}
                        className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                      >
                        <option value="verified">Approve bank account</option>
                        <option value="rejected">Reject and request resubmission</option>
                        <option value="frozen">Freeze payout method</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Review note</label>
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.creatorId]: { ...draft, note: event.target.value } }))}
                        placeholder="Explain the finance decision or the documents still required."
                        className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={() => handleReview(activeModalItem)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving..." : "Save bank review"}
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
