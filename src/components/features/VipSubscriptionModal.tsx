"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Crown, Check, Sparkles, Tv, Zap, Download, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VipPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  monthlyEquivalent?: string;
  features: string[];
  bestValue?: boolean;
  savings?: string;
}

interface VipSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => void;
}

const plans: VipPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 9.99,
    period: "/month",
    features: ["Unlimited access to all dramas", "Ad-free experience", "HD quality streaming"],
  },
  {
    id: "annual",
    name: "Annual",
    price: 99.99,
    period: "/year",
    bestValue: true,
    savings: "Save 16%",
    monthlyEquivalent: "$8.33/month",
    features: [
      "Everything in Monthly",
      "Early access to new releases",
      "Download for offline",
      "Exclusive VIP content",
      "500 bonus coins/month",
    ],
  },
];

const perks = [
  { icon: Tv, label: "Ad-free viewing" },
  { icon: Sparkles, label: "4K quality streaming" },
  { icon: Zap, label: "Early access to new releases" },
  { icon: Download, label: "Download for offline" },
  { icon: Star, label: "Exclusive VIP content" },
  { icon: Shield, label: "Priority customer support" },
];

export function VipSubscriptionModal({ open, onClose, onSubscribe }: VipSubscriptionModalProps) {
  const [selected, setSelected] = useState("annual");

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
          <Crown size={28} className="text-black" />
        </div>
        <h2 className="text-xl font-bold text-white">Upgrade to VIP</h2>
        <p className="mt-1 text-sm text-gray-400">Unlock premium content and features</p>
      </div>

      {/* Perks List */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        {perks.map((perk) => (
          <div key={perk.label} className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
            <perk.icon size={16} className="shrink-0 text-yellow-500" />
            <span className="text-xs text-gray-300">{perk.label}</span>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="mb-6 space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={cn(
              "relative w-full rounded-xl border p-4 text-left transition",
              selected === plan.id
                ? plan.bestValue
                  ? "border-yellow-500 bg-yellow-500/5 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "border-yellow-500 bg-yellow-500/5"
                : "border-white/10 bg-gray-800/30 hover:border-white/20"
            )}
          >
            {plan.bestValue && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-0.5 text-xs font-semibold text-black">
                Best Value
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{plan.name}</span>
                  {plan.savings && (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                {plan.monthlyEquivalent && (
                  <p className="mt-0.5 text-xs text-gray-500">Equivalent to {plan.monthlyEquivalent}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2",
                  selected === plan.id ? "border-yellow-500 bg-yellow-500" : "border-white/20"
                )}
              >
                {selected === plan.id && <Check size={14} className="text-black" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>Stripe</span>
        <span>PayPal</span>
        <span>Apple Pay</span>
      </div>

      <button
        onClick={() => onSubscribe?.(selected)}
        className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 font-semibold text-black transition hover:opacity-90"
      >
        Subscribe Now
      </button>
      <p className="mt-3 text-center text-xs text-gray-500">
        Cancel anytime. By subscribing you agree to our Terms of Service and Privacy Policy.
      </p>
    </Modal>
  );
}