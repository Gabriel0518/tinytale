"use client";

import React from "react";

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount?: number;
  coins?: number;
  transactionId?: string;
  newBalance?: number;
  type?: "coins" | "subscription";
  onNavigate?: (target: "player" | "store") => void;
}

export function PaymentSuccessModal({
  open,
  onClose,
  amount,
  coins,
  transactionId,
  newBalance,
  type = "coins",
  onNavigate,
}: PaymentSuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Glass Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-xl p-8 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
        <style jsx>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes strokeDraw { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
          @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 35px rgba(34,197,94,0.5); } }
        `}</style>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Success Icon with Glow */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20" style={{ animation: "glowPulse 2s ease-in-out infinite" }}>
            <svg className="h-10 w-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "strokeDraw 0.6s ease-out" }} />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>

          {/* Description */}
          {type === "coins" ? (
            <p className="text-gray-400">
              <span className="font-semibold text-yellow-400">{coins?.toLocaleString()}</span> gold coins have been added to your account
            </p>
          ) : (
            <p className="text-gray-400">Your VIP subscription is now active. Enjoy premium content!</p>
          )}

          {/* Amount */}
          {amount != null && (
            <p className="mt-2 text-sm text-gray-500">Amount paid: <span className="text-white font-medium">${amount.toFixed(2)}</span></p>
          )}

          {/* Transaction ID */}
          {transactionId && (
            <div className="mt-3 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-xs text-gray-500">Transaction ID</p>
              <p className="font-mono text-sm text-gray-300 select-all">{transactionId}</p>
            </div>
          )}

          {/* Balance Card */}
          {newBalance != null && (
            <div className="group mt-4 w-full px-5 py-4 rounded-xl bg-white/5 backdrop-blur border border-white/5 hover:border-yellow-500/30 transition-colors">
              <p className="text-xs text-gray-500 mb-1">Updated Balance</p>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#scGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="scGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                <span className="text-2xl font-bold text-yellow-400">{newBalance.toLocaleString()}</span>
                <span className="text-sm text-gray-500">coins</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex w-full gap-3">
            <button
              onClick={() => onNavigate?.("store")}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white hover:bg-white/5 transition"
            >
              Back to Store
            </button>
            <button
              onClick={() => onNavigate?.("player")}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-sm font-bold text-black hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Start Watching
            </button>
          </div>
        </div>

        {/* Bottom Gold Accent Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
      </div>
    </div>
  );
}