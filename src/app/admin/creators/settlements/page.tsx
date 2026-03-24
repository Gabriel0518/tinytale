"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Search, X } from "lucide-react";
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
type SettlementDecisionDraft = {
  decision: SettlementDecision;
  note: string;
};

function getDefaultDecision(status: CreatorAdminSettlementStatus): SettlementDecision {
  if (status === "paid" || status === "processing") return "mark_paid";
  if (status === "disputed") return "mark_disputed";
  if (status === "held") return "hold";
  return "confirm";
}

function buildDraft(item: CreatorAdminSettlementItem): SettlementDecisionDraft {
  return {
    decision: getDefaultDecision(item.status),
    note: item.note || "",
  };
}

export default function CreatorSettlementsAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminSettlementItem[]>(mockCreatorSettlements);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, SettlementDecisionDraft>>(
    Object.fromEntries(mockCreatorSettlements.map((item) => [item.id, buildDraft(item)])),
  );
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorSettlements();
        const next = response?.data?.items || response?.data?.settlements || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setDrafts(Object.fromEntries(next.map((item: CreatorAdminSettlementItem) => [item.id, buildDraft(item)])));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorSettlements);
          setDrafts(Object.fromEntries(mockCreatorSettlements.map((item) => [item.id, buildDraft(item)])));
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
        item.statementNo,
        item.periodLabel,
        item.note,
        item.transferReference || "",
        item.payoutId || "",
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

  async function handleReview(item: CreatorAdminSettlementItem) {
    const draft = drafts[item.id] || buildDraft(item);
    if (!draft.note.trim()) {
      toast("A settlement note is required.", "info");
      return;
    }

    setSubmittingId(item.id);
    try {
      const response: any = await adminApi.reviewCreatorSettlement(item.creatorId, item.statementId, { decision: draft.decision, note: draft.note });
      const nextStatus: CreatorAdminSettlementStatus =
        response?.data?.status
        || (draft.decision === "mark_disputed"
          ? "disputed"
          : draft.decision === "hold"
            ? "held"
            : draft.decision === "mark_paid"
              ? "processing"
              : "confirmed");
      const nextTransferReference = response?.data?.transferReference || item.transferReference || "";
      const nextPayoutId = response?.data?.payoutId || item.payoutId || "";
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? {
        ...currentItem,
        status: nextStatus,
        note: draft.note,
        transferReference: nextTransferReference,
        payoutId: nextPayoutId,
        payoutStatus: nextStatus === "paid" ? "paid" : nextStatus === "processing" ? "pending" : currentItem.payoutStatus,
        paidAt: nextStatus === "paid" ? new Date().toISOString() : currentItem.paidAt,
      } : currentItem));
      setDrafts((current) => ({
        ...current,
        [item.id]: {
          decision: getDefaultDecision(nextStatus),
          note: draft.note,
        },
      }));
      setActiveModalId(null);
      toast(
        nextStatus === "processing"
          ? `${item.bankProvider === "airwallex" ? "Airwallex transfer" : "Stripe payout"} submitted.`
          : nextStatus === "paid"
            ? `${item.bankProvider === "airwallex" ? "Airwallex transfer" : "Stripe payout"} completed.`
            : "Settlement updated.",
        "success",
      );
      return;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update settlement.", "error");
      return;
    } finally {
      setSubmittingId(null);
    }
  }

  const stats = useMemo(() => ({
    generated: items.filter((item) => item.status === "generated").length,
    confirmed: items.filter((item) => item.status === "confirmed").length,
    processing: items.filter((item) => item.status === "processing").length,
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
        <article className={panelClassName}><p className="text-xs uppercase tracking-[0.12em] text-gray-500">Processing</p><p className="mt-3 text-3xl font-bold text-sky-300">{stats.processing}</p></article>
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
              placeholder="Search by creator, statement no, bank, beneficiary/account id, or note"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All statement states</option>
            <option value="generated">Generated</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="held">Held</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settlement list</h2>
              <p className="text-sm text-gray-400">Use the row action modal to review statement math and release decisions.</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                <th className="pb-3 pr-4 font-medium">Statement</th>
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Revenue</th>
                <th className="pb-3 pr-4 font-medium">Bank</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">Loading settlements...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">No settlements match the current filters.</td>
                </tr>
              ) : filtered.map((item) => {
                const settlementMeta = getCreatorSettlementStatusMeta(item.status);
                const bankMeta = getCreatorBankStatusMeta(item.bankStatus);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{item.statementNo}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.periodLabel}</p>
                      <p className="mt-2 text-xs text-gray-400">{item.unlockCount.toLocaleString()} unlocks</p>
                      {item.transferReference ? <p className="mt-1 text-xs text-gray-400">Ref {item.transferReference}</p> : null}
                      {item.payoutId ? <p className="mt-1 text-xs text-sky-300">Payout {item.payoutId}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-200">{item.creatorName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.payoutDate ? `Payout ${formatAdminDate(item.payoutDate)}` : "No payout date"}</p>
                      {item.note ? <p className="mt-2 max-w-[240px] text-xs leading-5 text-gray-400">{item.note}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">{formatUsd(item.netPayoutUsd)}</p>
                      <p className="mt-1 text-xs text-gray-500">Gross {formatUsd(item.grossRevenueUsd)}</p>
                      <p className="mt-1 text-xs text-gray-500">Fees {formatUsd(item.channelFeesUsd)} · Reserve {formatUsd(item.reserveUsd)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                      <p className="mt-2 text-xs text-gray-500">{item.bankProviderLabel || "Airwallex Beneficiary"}</p>
                      {item.bankVerificationLabel ? <p className="mt-1 text-xs text-indigo-300">{item.bankVerificationLabel}</p> : null}
                      {item.bankName || item.maskedAccountNumber ? (
                        <p className="mt-1 text-xs text-gray-400">{item.bankName || "No bank attached"} {item.maskedAccountNumber || ""}</p>
                      ) : null}
                      {item.airwallexVerificationCode ? (
                        <p className="mt-1 text-xs text-amber-300">{item.airwallexVerificationCode}{item.airwallexVerificationAccountNameMatchResult ? ` · ${item.airwallexVerificationAccountNameMatchResult}` : ""}</p>
                      ) : null}
                      {item.stripeRequirementsCurrentlyDue?.length ? (
                        <p className="mt-1 text-xs text-amber-300">{item.stripeRequirementsCurrentlyDue.length} Stripe item(s) due</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
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
            <h2 className="text-lg font-semibold text-white">Settlement review guide</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Confirm statements</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Confirm when gross revenue, fees, reserve, and release timing are aligned with the creator commercial policy.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Hold or dispute</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Use hold or disputed status when the revenue chain is incomplete, reserve logic is contested, or downstream payout must stop.</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Execute payout</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">Execute the provider payout only after the statement is released and the payout profile is fully verified.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {activeModalItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Settlement action</p>
                <h3 className="truncate text-base font-semibold text-white">{activeModalItem.statementNo} · {activeModalItem.creatorName}</h3>
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
                const settlementMeta = getCreatorSettlementStatusMeta(activeModalItem.status);
                const bankMeta = getCreatorBankStatusMeta(activeModalItem.bankStatus);
                const isSubmitting = submittingId === activeModalItem.id;

                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{activeModalItem.statementNo}</p>
                          <p className="mt-1 text-sm text-gray-400">{activeModalItem.creatorName} · {activeModalItem.periodLabel}</p>
                          <p className="mt-2 text-xs text-gray-500">{activeModalItem.payoutDate ? `Planned payout ${formatAdminDate(activeModalItem.payoutDate, true)}` : "No payout date assigned"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${settlementMeta.className}`}>{settlementMeta.label}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Gross</p>
                          <p className="mt-1 text-sm text-white">{formatUsd(activeModalItem.grossRevenueUsd)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Net payout</p>
                          <p className="mt-1 text-sm text-white">{formatUsd(activeModalItem.netPayoutUsd)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Platform fees</p>
                          <p className="mt-1 text-sm text-gray-300">{formatUsd(activeModalItem.channelFeesUsd)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Reserve</p>
                          <p className="mt-1 text-sm text-gray-300">{formatUsd(activeModalItem.reserveUsd)}</p>
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
                      {(activeModalItem.transferReference || activeModalItem.payoutId) ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Transfer reference</p>
                            <p className="mt-2 break-all text-sm text-white">{activeModalItem.transferReference || "Not created yet"}</p>
                          </div>
                          <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{activeModalItem.bankProvider === "airwallex" ? "Provider payout id" : "Stripe payout id"}</p>
                            <p className="mt-2 break-all text-sm text-white">{activeModalItem.payoutId || `Pending ${activeModalItem.bankProvider === "airwallex" ? "Airwallex" : "Stripe"} response`}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                      <select
                        value={draft.decision}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, decision: event.target.value as SettlementDecision } }))}
                        className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
                      >
                        <option value="confirm">Confirm statement</option>
                        <option value="hold">Place hold</option>
                        <option value="mark_disputed">Mark disputed</option>
                        <option value="mark_paid">{activeModalItem.bankProvider === "airwallex" ? "Execute Airwallex transfer" : "Execute Stripe payout"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Settlement note</label>
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeModalItem.id]: { ...draft, note: event.target.value } }))}
                        placeholder={`Record the reason for confirmation, hold, dispute, or ${activeModalItem.bankProvider === "airwallex" ? "Airwallex transfer" : "Stripe payout"} execution.`}
                        className="min-h-[150px] w-full rounded-xl border border-gray-700/50 bg-[#13131d] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={() => handleReview(activeModalItem)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving..." : draft.decision === "mark_paid" ? (activeModalItem.bankProvider === "airwallex" ? "Execute Airwallex transfer" : "Execute Stripe payout") : "Save settlement action"}
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
