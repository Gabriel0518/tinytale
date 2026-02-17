"use client";

import React, { useState } from "react";

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

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Glass Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-xl p-8 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
        <style jsx>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes errorPulse { 0%,100% { box-shadow: 0 0 20px rgba(220,38,38,0.3); } 50% { box-shadow: 0 0 35px rgba(220,38,38,0.5); } }
          @keyframes shake { 0%,100% { transform: translateX(0); } 10%,30%,50%,70%,90% { transform: translateX(-2px); } 20%,40%,60%,80% { transform: translateX(2px); } }
        `}</style>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Error Icon with Red Glow */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 border border-red-500/20" style={{ animation: "errorPulse 2s ease-in-out infinite" }}>
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>

          {/* Error Message */}
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            {errorMessage || "Something went wrong with your payment. Please check your payment details and try again."}
          </p>

          {/* Transaction ID with Copy */}
          {transactionId && (
            <div className="mt-4 w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-red-950/30 border border-red-500/10">
              <div className="text-left min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Error Reference</p>
                <p className="font-mono text-sm text-gray-300 truncate select-all">{transactionId}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="group flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                Try Again
              </button>
            )}
          </div>

          {/* Contact Support */}
          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="mt-3 w-full py-2.5 rounded-xl border border-white/5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              Contact Support
            </button>
          )}
        </div>

        {/* Bottom Red Accent Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      </div>
    </div>
  );
}