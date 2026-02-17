"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { XCircle, RefreshCw, Copy, Check } from "lucide-react";

interface PaymentFailedModalProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage?: string;
  transactionId?: string;
  onContactSupport?: () => void;
}

export function PaymentFailedModal({
  open,
  onClose,
  onRetry,
  errorMessage,
  transactionId,
  onContactSupport,
}: PaymentFailedModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!transactionId) return;
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center py-4 text-center">
        {/* Error Icon with Glow */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          <XCircle size={36} className="text-red-500" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">Payment Failed</h2>
        <p className="text-gray-400">
          {errorMessage || "Something went wrong with your payment. Please try again."}
        </p>

        {transactionId && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
            <span className="text-xs text-gray-500">ID:</span>
            <span className="font-mono text-xs text-gray-400">{transactionId}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 text-gray-500 transition hover:text-gray-300"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3">
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-transparent py-3 font-medium text-white transition hover:bg-white/5"
            >
              Cancel
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-medium text-white transition hover:bg-red-700"
              >
                <RefreshCw size={16} className="transition-transform duration-300 group-hover:rotate-180" />
                Try Again
              </button>
            )}
          </div>
          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Contact Support
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}