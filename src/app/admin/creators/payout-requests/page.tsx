"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HandCoins, Search, X, Wallet, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminPayoutRequestItem, CreatorAdminSettlementStatus, CreatorWithdrawalItem } from "@/types/creator";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorSettlementStatusMeta,
  mockCreatorPayoutRequests,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type PayoutDecision = "hold" | "confirm" | "mark_paid" | "reject_payout";
type PayoutDecisionDraft = {
  decision: PayoutDecision;
  note: string;
  transferReference: string;
};

function getDefaultDecision(status: CreatorAdminSettlementStatus): PayoutDecision {
  if (status === "paid" || status === "processing") return "mark_paid";
  if (status === "rejected") return "reject_payout";
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
  const [rejectedItems, setRejectedItems] = useState<CreatorAdminPayoutRequestItem[]>([]);
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
        const nextRejected = response?.data?.rejectedItems || [];
        if (!cancelled && Array.isArray(next)) {
          setItems(next);
          setDrafts(Object.fromEntries(next.map((item: CreatorAdminPayoutRequestItem) => [item.id, buildDraft(item)])));
          setRejectedItems(Array.isArray(nextRejected) ? nextRejected : []);
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorPayoutRequests);
          setDrafts(Object.fromEntries(mockCreatorPayoutRequests.map((item) => [item.id, buildDraft(item)])));
          setRejectedItems([]);
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
      const haystack = [
        item.creatorName,
        item.creatorEmail,
        item.statementNo,
        item.transferReference,
        item.payoutId,
        item.holdReason,
        item.bankName || "",
        item.maskedAccountNumber || "",
        item.stripeAccountId || "",
        item.stripeEmail || "",
        item.airwallexBeneficiaryId || "",
        item.airwallexVerificationResolvedBankName || "",
        item.airwallexVerificationResolvedAccountName || "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    return true;
  }), [items, search, status]);

  const filteredRejected = useMemo(() => rejectedItems.filter((item) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [
        item.creatorName,
        item.creatorEmail,
        item.statementNo,
        item.rejectionReason || "",
        item.note,
        item.bankName || "",
        item.maskedAccountNumber || "",
        item.airwallexBeneficiaryId || "",
        item.stripeAccountId || "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && status !== "rejected") return false;
    return item.status === "rejected";
  }), [rejectedItems, search, status]);

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
    if ((draft.decision === "hold" || draft.decision === "reject_payout") && !draft.note.trim()) {
      toast("A payout note is required.", "info");
      return;
    }

    setSubmittingId(item.id);
    try {
      const response: any = await adminApi.reviewCreatorPayoutRequest(item.creatorId, item.statementId, {
        decision: draft.decision,
        note: draft.note,
      });
      const nextStatus: CreatorAdminSettlementStatus =
        response?.data?.status
        || (draft.decision === "mark_paid"
          ? "processing"
          : draft.decision === "reject_payout"
            ? "rejected"
          : draft.decision === "confirm"
            ? "confirmed"
            : "held");
      const nextTransferReference = response?.data?.transferReference || item.transferReference || "";
      const nextPayoutId = response?.data?.payoutId || item.payoutId || "";

      if (nextStatus === "rejected") {
        const rejectedItem: CreatorAdminPayoutRequestItem = {
          ...item,
          status: "rejected",
          note: draft.note || item.note,
          holdReason: "",
          rejectionReason: response?.data?.rejectionReason || draft.note || item.rejectionReason || "",
          rejectedAt: response?.data?.rejectedAt || new Date().toISOString(),
          rejectionHistory: response?.data?.rejectionHistory || item.rejectionHistory || [],
          transferReference: nextTransferReference,
          payoutId: nextPayoutId,
        };
        setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
        setRejectedItems((current) => [rejectedItem, ...current.filter((currentItem) => currentItem.id !== item.id)]);
      } else {
        setItems((current) => current.map((currentItem) => currentItem.id === item.id ? {
          ...currentItem,
          status: nextStatus,
          note: draft.note || currentItem.note,
          holdReason: draft.decision === "hold" ? (draft.note || currentItem.holdReason) : "",
          rejectionReason: "",
          rejectedAt: null,
          rejectionHistory: currentItem.rejectionHistory || [],
          transferReference: nextTransferReference,
          payoutId: nextPayoutId,
          payoutStatus: nextStatus === "paid" ? "paid" : nextStatus === "processing" ? "pending" : currentItem.payoutStatus,
          paidAt: nextStatus === "paid" ? new Date().toISOString() : currentItem.paidAt,
        } : currentItem));
      }
      setDrafts((current) => ({
        ...current,
        [item.id]: {
          decision: getDefaultDecision(nextStatus),
          note: draft.note,
          transferReference: nextTransferReference,
        },
      }));
      setActiveModalId(null);
      toast(
        nextStatus === "processing"
          ? `${item.bankProvider === "airwallex" ? "Airwallex transfer" : "Stripe payout"} submitted.`
          : nextStatus === "paid"
            ? `${item.bankProvider === "airwallex" ? "Airwallex transfer" : "Stripe payout"} completed.`
            : nextStatus === "rejected"
              ? "Payout request rejected and moved to history."
            : "Payout request updated.",
        "success",
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update payout request.", "error");
    } finally {
      setSubmittingId(null);
    }
  }

  const stats = useMemo(() => ({
    queued: items.filter((item) => item.status === "generated").length,
    confirmed: items.filter((item) => item.status === "confirmed").length,
    processing: items.filter((item) => item.status === "processing").length,
    paid: items.filter((item) => item.status === "paid").length,
    held: items.filter((item) => item.status === "held" || item.status === "disputed").length,
    rejected: rejectedItems.length,
  }), [items, rejectedItems]);

  // ─── Creator Withdrawals (New System) ──────────────────────────────────
  const [withdrawals, setWithdrawals] = useState<CreatorWithdrawalItem[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(true);
  const [withdrawalAction, setWithdrawalAction] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getCreatorWithdrawals({ limit: 100 })
      .then((res: any) => {
        if (res?.success && Array.isArray(res.data?.items)) setWithdrawals(res.data.items);
      })
      .catch(() => {})
      .finally(() => setWithdrawalLoading(false));
  }, []);

  const handleWithdrawalApprove = async (id: string) => {
    if (!confirm("Approve this withdrawal and execute Airwallex transfer?")) return;
    setWithdrawalAction(id);
    try {
      const res: any = await adminApi.approveCreatorWithdrawal(id);
      if (res?.success) {
        toast("Withdrawal approved and transfer executed", "info");
        setWithdrawals((prev) => prev.map((w) => w._id === id ? { ...w, ...res.data } : w));
      } else {
        toast(res?.error?.message || "Failed to approve", "error");
      }
    } catch (err: any) {
      toast(err?.message || "Transfer failed", "error");
    } finally {
      setWithdrawalAction(null);
    }
  };

  const handleWithdrawalReject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    setWithdrawalAction(id);
    try {
      const res: any = await adminApi.rejectCreatorWithdrawal(id, { note: reason });
      if (res?.success) {
        toast("Withdrawal rejected, balance refunded", "info");
        setWithdrawals((prev) => prev.map((w) => w._id === id ? { ...w, ...res.data } : w));
      }
    } catch (err: any) {
      toast(err?.message || "Failed to reject", "error");
    } finally {
      setWithdrawalAction(null);
    }
  };

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Finance</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator payout request queue</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Review payout-ready statements, apply provider-based payout blocks, and execute real Airwallex transfers or Stripe payouts from the finance queue.
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
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Processing</p><p className="mt-3 text-3xl font-bold text-sky-300">{stats.processing}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Paid</p><p className="mt-3 text-3xl font-bold text-green-300">{stats.paid}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Held</p><p className="mt-3 text-3xl font-bold text-red-300">{stats.held}</p></article>
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Rejected</p><p className="mt-3 text-3xl font-bold text-slate-300">{stats.rejected}</p></article>
      </section>

      {/* ─── Creator Withdrawals (New Airwallex System) ─────────────────── */}
      <section className={panelClassName}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-gray-100">Creator Withdrawal Requests</h2>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
              {withdrawals.filter((w) => w.status === "pending").length} pending
            </span>
          </div>
          <Link
            href="/admin/creators/fee-config"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Manage Fee Rates →
          </Link>
        </div>

        {withdrawalLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No withdrawal requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-2">Creator</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Fee</th>
                  <th className="px-3 py-2">Net</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-gray-800/50 hover:bg-[#1a1a2e]/50">
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-200">{w.creatorName || "—"}</p>
                      <p className="text-xs text-gray-500">{w.creatorEmail || ""}</p>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-200">${w.amount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-red-400">
                      -${w.airwallexFeeAmount.toFixed(2)}
                      <span className="ml-1 text-xs text-gray-500">({(w.airwallexFeeRate * 100).toFixed(1)}%)</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-green-400">${w.netAmount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-gray-400">{w.currency}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.status === "paid" ? "bg-green-500/20 text-green-300" :
                        w.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                        w.status === "processing" ? "bg-sky-500/20 text-sky-300" :
                        w.status === "failed" ? "bg-red-500/20 text-red-300" :
                        w.status === "rejected" ? "bg-red-500/20 text-red-300" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleWithdrawalApprove(w._id)}
                            disabled={withdrawalAction === w._id}
                            className="flex items-center gap-1 rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {withdrawalAction === w._id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleWithdrawalReject(w._id)}
                            disabled={withdrawalAction === w._id}
                            className="flex items-center gap-1 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : w.status === "paid" ? (
                        <span className="text-xs text-gray-500" title={w.airwallexTransferId || ""}>
                          Ref: {w.airwallexTransferRef || w.airwallexTransferId?.slice(0, 12) || "—"}
                        </span>
                      ) : w.status === "failed" ? (
                        <span className="text-xs text-red-400" title={w.failureReason}>{w.failureReason?.slice(0, 30) || "Failed"}</span>
                      ) : w.status === "rejected" ? (
                        <span className="text-xs text-gray-500">{w.adminNote || "Rejected"}</span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Legacy Settlement-based Payout Queue ──────────────────────── */}

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by creator, statement number, beneficiary/account id, transfer reference, or hold note"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All payout states</option>
            <option value="generated">Generated</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="held">Held</option>
            <option value="disputed">Disputed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <article className={panelClassName}>
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
                      {item.payoutId ? <p className="mt-1 text-xs text-sky-300">Payout {item.payoutId}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{formatUsd(item.amountUsd)}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-300">
                      {item.payoutMethodLabel}
                      <p className="mt-1 text-xs text-gray-500">{item.bankProviderLabel || "Airwallex Beneficiary"}</p>
                      {item.bankName || item.maskedAccountNumber ? (
                        <p className="mt-1 text-xs text-gray-400">{item.bankName || "No bank attached"} {item.maskedAccountNumber || ""}</p>
                      ) : null}
                      {item.airwallexVerificationCode ? (
                        <p className="mt-1 text-xs text-amber-300">{item.airwallexVerificationCode}{item.airwallexVerificationAccountNameMatchResult ? ` · ${item.airwallexVerificationAccountNameMatchResult}` : ""}</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                      </div>
                      {item.bankVerificationLabel ? <p className="mt-2 text-xs text-indigo-300">{item.bankVerificationLabel}</p> : null}
                      {item.stripeRequirementsCurrentlyDue?.length ? (
                        <p className="mt-1 text-xs text-amber-300">{item.stripeRequirementsCurrentlyDue.length} Stripe item(s) due</p>
                      ) : null}
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
        </article>

        <div className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Payout handling notes</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Confirm</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Use confirm when the settlement is released, the bank method is valid, and the request is ready for finance execution.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Hold</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Use hold for reserve disputes, account mismatches, compliance review, or any payout blocker that still needs follow-up.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Execute payout</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">This creates a real provider-side payout action. Airwallex beneficiaries will create transfers, while legacy Stripe accounts will continue to create Stripe payouts.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Reject payout</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Reject removes the request from the active payout queue and keeps an auditable rejection record with the finance note.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Rejected payout records</h2>
            <p className="mt-1 text-sm text-gray-400">These requests were intentionally removed from the active payout queue by finance.</p>
          </div>
          <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300">{filteredRejected.length}</span>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-500">Loading rejection history...</div>
          ) : filteredRejected.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-500">No rejected payout records match the current filters.</div>
          ) : filteredRejected.map((item) => (
            <div key={`${item.id}-rejected`} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.creatorName} · {item.statementNo}</p>
                  <p className="mt-1 text-sm text-gray-400">{item.bankProviderLabel || "Payout profile"} · {item.bankName || item.maskedAccountNumber || "No bank attached"}</p>
                </div>
                <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300">Rejected</span>
              </div>
              <p className="mt-3 text-sm text-gray-300">{item.rejectionReason || item.note || "No rejection note recorded."}</p>
              <p className="mt-2 text-xs text-gray-500">Rejected {item.rejectedAt ? formatAdminDate(item.rejectedAt, true) : "recently"}</p>
            </div>
          ))}
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
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Payout profile</p>
                          <p className="mt-1 text-sm text-white">{activeModalItem.bankProviderLabel || "Airwallex Beneficiary"}</p>
                          <p className="mt-1 text-xs text-gray-400">{activeModalItem.bankName || "No bank attached"} {activeModalItem.maskedAccountNumber || ""}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{activeModalItem.bankProvider === "airwallex" ? "Airwallex beneficiary" : "Stripe account"}</p>
                          <p className="mt-1 text-sm text-white">{activeModalItem.airwallexBeneficiaryId || activeModalItem.stripeAccountId || "Not available"}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {activeModalItem.bankProvider === "airwallex"
                              ? `${activeModalItem.airwallexVerificationCode || "Not verified"}${activeModalItem.airwallexVerificationAccountNameMatchResult ? ` · ${activeModalItem.airwallexVerificationAccountNameMatchResult}` : ""}`
                              : activeModalItem.stripeEmail || activeModalItem.bankVerificationLabel || "No Stripe email available"}
                          </p>
                        </div>
                      </div>
                      {activeModalItem.airwallexVerificationResolvedBankName ? (
                        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-sky-100">Airwallex resolved details</p>
                          <p className="mt-2 text-sm leading-6 text-sky-50">
                            {activeModalItem.airwallexVerificationResolvedBankName}
                            {activeModalItem.airwallexVerificationResolvedAccountName ? ` · ${activeModalItem.airwallexVerificationResolvedAccountName}` : ""}
                          </p>
                        </div>
                      ) : null}
                      {activeModalItem.stripeRequirementsCurrentlyDue?.length ? (
                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-amber-200">Stripe currently due</p>
                          <p className="mt-2 text-sm leading-6 text-amber-100">{activeModalItem.stripeRequirementsCurrentlyDue.join(", ")}</p>
                        </div>
                      ) : null}
                      {activeModalItem.stripeDisabledReason ? (
                        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-rose-200">Stripe disabled reason</p>
                          <p className="mt-2 text-sm leading-6 text-rose-100">{activeModalItem.stripeDisabledReason}</p>
                        </div>
                      ) : null}
                      {activeModalItem.payoutFailureMessage ? (
                        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-rose-200">Latest Stripe payout error</p>
                          <p className="mt-2 text-sm leading-6 text-rose-100">{activeModalItem.payoutFailureMessage}</p>
                        </div>
                      ) : null}
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
                        <option value="reject_payout">Reject payout request</option>
                        <option value="mark_paid">{activeModalItem.bankProvider === "airwallex" ? "Execute Airwallex transfer" : "Execute Stripe payout"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Finance note</label>
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, note: event.target.value } }))}
                        placeholder={`Explain why the payout is confirmed, held, rejected, or submitted to ${activeModalItem.bankProvider === "airwallex" ? "Airwallex" : "Stripe"}.`}
                        className="min-h-[140px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>
                    {(activeModalItem.transferReference || activeModalItem.payoutId) ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Transfer reference</p>
                          <p className="mt-2 break-all text-sm text-white">{activeModalItem.transferReference || "Not created yet"}</p>
                        </div>
                        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{activeModalItem.bankProvider === "airwallex" ? "Provider payout id" : "Stripe payout id"}</p>
                          <p className="mt-2 break-all text-sm text-white">{activeModalItem.payoutId || `Pending ${activeModalItem.bankProvider === "airwallex" ? "Airwallex" : "Stripe"} response`}</p>
                        </div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => handleReview(activeModalItem)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving..." : draft.decision === "mark_paid" ? (activeModalItem.bankProvider === "airwallex" ? "Execute Airwallex transfer" : "Execute Stripe payout") : "Save payout decision"}
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
