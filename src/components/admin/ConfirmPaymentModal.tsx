"use client";

import { useState, useEffect, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import { formatAdminCurrency, useAdminLocale } from "@/lib/admin-i18n";

interface ConfirmPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { paymentTime: string; paymentProof: string; remark: string }) => void;
  withdrawal: {
    id: string;
    amount: number;
    recipientName: string;
    recipientId: string;
    method: string;
    account: string;
    bankName: string;
  } | null;
}

export default function ConfirmPaymentModal({
  open,
  onClose,
  onConfirm,
  withdrawal,
}: ConfirmPaymentModalProps) {
  const { locale } = useAdminLocale();
  const [paymentTime, setPaymentTime] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [fileName, setFileName] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPaymentTime("");
      setPaymentProof("");
      setFileName("");
      setRemark("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !withdrawal) return null;

  const formatCurrency = (value: number) => formatAdminCurrency(value, locale);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProof(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileName("");
    setPaymentProof("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!paymentTime || !paymentProof) return;

    setSubmitting(true);
    try {
      await adminApi.confirmWithdrawalPayment(withdrawal.id, {
        paymentTime,
        paymentProof,
        remark,
      });
    } catch (error) {
      console.error("Failed to confirm payment:", error);
    } finally {
      setSubmitting(false);
      onConfirm({ paymentTime, paymentProof, remark });
    }
  };

  const isFormValid = paymentTime.trim() !== "" && paymentProof !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f17]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-700/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Confirm Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700/50 hover:text-gray-200"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Payment Summary Card */}
          <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e]/50">
            {/* Withdrawal Amount Row */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-4 py-3">
              <span className="text-sm text-gray-400">Withdrawal Amount</span>
              <span className="text-lg font-bold text-green-400">{formatCurrency(withdrawal.amount)}</span>
            </div>
            {/* Info Rows */}
            <div className="space-y-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Recipient</span>
                <span className="text-sm font-semibold text-gray-200">
                  {withdrawal.recipientName} (ID: {withdrawal.recipientId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Method</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {withdrawal.method}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Account</span>
                <span className="text-sm font-semibold text-gray-200">{withdrawal.account}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Bank Name</span>
                <span className="text-sm font-semibold text-gray-200">{withdrawal.bankName}</span>
              </div>
            </div>
          </div>

          {/* Payment Time */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Payment Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={paymentTime}
              onChange={(e) => setPaymentTime(e.target.value)}
              className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Payment Proof <span className="text-red-400">*</span>
            </label>
            {fileName ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate max-w-[280px]">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded p-1 text-gray-400 transition hover:bg-gray-700/50 hover:text-red-400"
                  aria-label="Remove file"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-700/50 bg-[#1a1a2e]/50 px-4 py-6 transition hover:border-gray-600 hover:bg-[#1a1a2e]"
              >
                <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.495A3.001 3.001 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">Click to upload screenshot</span>
                <span className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Remark <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add any notes about this transaction..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
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
            disabled={!isFormValid || submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            )}
            {submitting ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
