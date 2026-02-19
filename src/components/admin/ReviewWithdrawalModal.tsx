"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";

interface ReviewWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { action: "approve" | "reject"; remark: string }) => void;
  withdrawal: {
    id: string;
    amount: number;
    promoterName: string;
    promoterInitials: string;
    promoterId: string;
    promoterLevel: string;
    totalCommission: number;
    availableBalance: number;
    bankName: string;
    bankAccountName: string;
    bankAccount: string;
    routingNumber: string;
    bankAddress: string;
    requestDate: string;
  } | null;
}

export default function ReviewWithdrawalModal({
  open,
  onClose,
  onConfirm,
  withdrawal,
}: ReviewWithdrawalModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAction(null);
      setRemark("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open || !withdrawal) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const handleConfirm = async () => {
    if (!action) return;
    // Rejection reason is optional

    setSubmitting(true);
    try {
      await adminApi.reviewWithdrawal(withdrawal.id, {
        action,
        remark,
      });
    } catch (error) {
      console.error("Failed to review withdrawal:", error);
    } finally {
      setSubmitting(false);
      onConfirm({ action, remark });
    }
  };

  const maskAccount = (account: string) => {
    if (account.length <= 4) return account;
    const last4 = account.slice(-4);
    const masked = account.slice(0, -4).replace(/./g, "\u2022");
    return `${masked.replace(/(.{4})/g, "$1 ").trim()} ${last4}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f17]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-700/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Review Withdrawal Request</h2>
              <p className="text-sm text-gray-400">Request ID: #{withdrawal.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700/50 hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Promoter Details + Request Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Promoter Details */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e]/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Promoter Details</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {withdrawal.promoterInitials}
                </div>
                <div>
                  <p className="font-medium text-white">{withdrawal.promoterName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>ID: {withdrawal.promoterId}</span>
                    <span>&middot;</span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300">
                      {withdrawal.promoterLevel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total Commission</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(withdrawal.totalCommission)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Available Balance</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(withdrawal.availableBalance)}</p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Request Details</p>
              <div>
                <p className="text-xs font-medium text-green-400">Withdrawal Amount</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Request Date</p>
                <p className="text-sm text-gray-300">{withdrawal.requestDate}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Method</p>
              <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-400">
                Bank Transfer
              </span>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e]/50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="mt-0.5 text-sm text-gray-200">{withdrawal.bankName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Holder Name</p>
                  <p className="mt-0.5 text-sm text-gray-200">{withdrawal.bankAccountName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="mt-0.5 text-sm font-mono text-gray-200">{maskAccount(withdrawal.bankAccount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Routing Number / SWIFT</p>
                  <p className="mt-0.5 text-sm font-mono text-gray-200">{withdrawal.routingNumber}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Bank Address</p>
                  <p className="mt-0.5 text-sm text-gray-200">{withdrawal.bankAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review Result */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Review Result</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setAction("approve")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  action === "approve"
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-700/50 bg-[#1a1a2e]/50 hover:border-gray-600"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    action === "approve" ? "bg-green-500/20 text-green-400" : "bg-gray-700/50 text-gray-400"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className={`font-medium ${action === "approve" ? "text-green-400" : "text-gray-200"}`}>
                    Approve Request
                  </p>
                  <p className="text-xs text-gray-500">Verify and proceed to payment</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction("reject")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  action === "reject"
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-700/50 bg-[#1a1a2e]/50 hover:border-gray-600"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    action === "reject" ? "bg-red-500/20 text-red-400" : "bg-gray-700/50 text-gray-400"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className={`font-medium ${action === "reject" ? "text-red-400" : "text-gray-200"}`}>
                    Reject Request
                  </p>
                  <p className="text-xs text-gray-500">Return funds to balance</p>
                </div>
              </button>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Rejection Reason{" "}
              <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={remark}
                onChange={(e) => {
                  if (e.target.value.length <= 200) setRemark(e.target.value);
                }}
                placeholder="e.g., Incorrect bank account information provided..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-500">
                {remark.length}/200
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              The promoter will receive this reason in their notification.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!action || submitting}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              action === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {submitting ? "Processing..." : "Confirm Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
