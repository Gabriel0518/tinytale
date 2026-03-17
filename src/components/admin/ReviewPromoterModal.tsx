"use client";

import { useState } from "react";
import { formatAdminCurrency, formatAdminNumber, useAdminLocale } from "@/lib/admin-i18n";

interface ReviewPromoterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { action: "approve" | "reject"; reason?: string }) => void;
  promoter: {
    id: string;
    name: string;
    initials: string;
    email: string;
    joinDate: string;
    totalPromoted: number;
    effectiveUsers: number;
    totalCommission: number;
  } | null;
}

export default function ReviewPromoterModal({ open, onClose, onConfirm, promoter }: ReviewPromoterModalProps) {
  const { locale } = useAdminLocale();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open || !promoter) return null;

  const handleSubmit = async () => {
    if (!action) return;
    if (action === "reject" && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm({ action, reason: reason.trim() || undefined });
    } finally {
      setSubmitting(false);
      setAction(null);
      setReason("");
    }
  };

  const handleClose = () => {
    setAction(null);
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-gray-700/50 bg-[#13131d] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400">
              {promoter.initials}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Review Application</h3>
              <p className="text-sm text-gray-400">{promoter.name} ({promoter.id})</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20">
            Applying
          </span>
        </div>

        {/* User Details */}
        <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4 mb-5">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Applicant Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Email</p>
              <p className="text-gray-200">{promoter.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Applied Date</p>
              <p className="text-gray-200">{promoter.joinDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Promoted</p>
              <p className="text-gray-200">{formatAdminNumber(promoter.totalPromoted, locale)}</p>
            </div>
            <div>
              <p className="text-gray-500">Effective Users</p>
              <p className="text-gray-200">{formatAdminNumber(promoter.effectiveUsers, locale)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Commission</p>
              <p className="text-gray-200">{formatAdminCurrency(promoter.totalCommission, locale)}</p>
            </div>
          </div>
        </div>

        {/* Action Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
          <div className="flex gap-3">
            <button
              onClick={() => setAction("approve")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                action === "approve"
                  ? "border-green-500 bg-green-500/10 text-green-400"
                  : "border-gray-700/50 text-gray-400 hover:border-green-500/50 hover:text-green-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Approve
              </div>
            </button>
            <button
              onClick={() => setAction("reject")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                action === "reject"
                  ? "border-red-500 bg-red-500/10 text-red-400"
                  : "border-gray-700/50 text-gray-400 hover:border-red-500/50 hover:text-red-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </div>
            </button>
          </div>
        </div>

        {/* Reason (required for reject) */}
        {action === "reject" && (
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        )}

        {action === "approve" && (
          <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <p className="text-sm text-green-400">
              Approving this application will grant the user access to the affiliate system. They can start earning commissions immediately.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || (action === "reject" && !reason.trim()) || submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
              action === "reject" ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {submitting ? "Processing..." : action === "reject" ? "Reject Application" : "Approve Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
