"use client";

import { useState } from "react";

interface BanPromoterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string }) => void;
  promoter: {
    id: string;
    name: string;
    initials: string;
    status: string;
  } | null;
}

export default function BanPromoterModal({ open, onClose, onConfirm, promoter }: BanPromoterModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open || !promoter) return null;

  const isBanned = promoter.status === "Banned";
  const title = isBanned ? "Unban Promoter" : "Ban Promoter";
  const description = isBanned
    ? "This will restore the promoter's access to the affiliate system."
    : "This will suspend the promoter's access to the affiliate system. They will not be able to earn commissions or withdraw funds.";

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm({ reason: reason.trim() });
    } finally {
      setSubmitting(false);
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-700/50 bg-[#13131d] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isBanned ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {isBanned ? (
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
            <p className="text-sm text-gray-400">{promoter.name} ({promoter.id})</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">{description}</p>

        {/* Reason */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isBanned ? "Reason for unbanning..." : "Reason for banning..."}
            className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

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
            disabled={!reason.trim() || submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
              isBanned ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {submitting ? "Processing..." : isBanned ? "Unban Promoter" : "Ban Promoter"}
          </button>
        </div>
      </div>
    </div>
  );
}
