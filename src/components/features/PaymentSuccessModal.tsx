"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";

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
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center py-4 text-center">
        {/* Animated Success Icon */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <svg
            className="h-10 w-10 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M20 6L9 17l-5-5"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: 0,
                animation: "stroke-draw 0.6s ease-out",
              }}
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">Payment Successful!</h2>

        {type === "coins" ? (
          <p className="text-gray-400">
            <span className="font-semibold text-yellow-500">{coins}</span> coins have been added to your account
          </p>
        ) : (
          <p className="text-gray-400">Your VIP subscription is now active</p>
        )}

        {amount != null && (
          <p className="mt-1 text-sm text-gray-500">Amount paid: ${amount.toFixed(2)}</p>
        )}

        {transactionId && (
          <p className="mt-2 text-xs text-gray-500">
            Transaction ID: <span className="font-mono text-gray-400">{transactionId}</span>
          </p>
        )}

        {newBalance != null && (
          <div className="mt-3 rounded-lg bg-gray-800/50 px-4 py-2">
            <p className="text-sm text-gray-400">
              New Balance: <span className="font-bold text-yellow-500">{newBalance} coins</span>
            </p>
          </div>
        )}

        <div className="mt-6 flex w-full gap-3">
          <button
            onClick={() => onNavigate?.("store")}
            className="flex-1 rounded-lg border border-white/10 bg-transparent py-3 font-medium text-white transition hover:bg-white/5"
          >
            Back to Store
          </button>
          <button
            onClick={() => onNavigate?.("player")}
            className="flex-1 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Start Watching
          </button>
        </div>
      </div>
    </Modal>
  );
}