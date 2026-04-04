"use client";

import { TrendingUp } from "lucide-react";
import type { CreatorTier } from "@/types/creator";

interface CreatorTierBadgeProps {
  tier: CreatorTier;
  showDetails?: boolean;
}

const tierConfig = {
  bronze: {
    label: "Bronze Tier",
    emoji: "🥉",
    shareRate: "50%",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
    description: "New creator",
  },
  silver: {
    label: "Silver Tier",
    emoji: "🥈",
    shareRate: "60%",
    gradient: "from-gray-400/20 to-gray-500/20",
    border: "border-gray-400/30",
    text: "text-gray-300",
    description: "Established creator",
  },
  gold: {
    label: "Gold Tier",
    emoji: "🥇",
    shareRate: "70%",
    gradient: "from-yellow-400/20 to-orange-400/20",
    border: "border-yellow-400/30",
    text: "text-yellow-400",
    description: "Top performer",
  },
};

export function CreatorTierBadge({ tier, showDetails = false }: CreatorTierBadgeProps) {
  const config = tierConfig[tier];

  if (!showDetails) {
    // 简洁版本 - 只显示图标和名称
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-gray-700/50 bg-[#0f0f17] px-3 py-1.5">
        <span className="text-lg">{config.emoji}</span>
        <span className={`text-sm font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>
    );
  }

  // 详细版本 - 显示完整信息
  return (
    <div
      className={`rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} p-5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f0f17]">
            <span className="text-2xl">{config.emoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${config.text}`} />
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Your Tier
              </p>
            </div>
            <p className={`mt-1 text-xl font-bold ${config.text}`}>
              {config.label}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-3 py-2">
          <span className="text-gray-400">Revenue share</span>
          <span className={`font-mono font-bold ${config.text}`}>
            {config.shareRate}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-3 py-2">
          <span className="text-gray-400">Status</span>
          <span className="font-semibold text-gray-300">{config.description}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[#0f0f17] p-3">
        <p className="text-xs text-gray-400">
          Your tier determines your revenue share percentage. Keep creating quality content to maintain or improve your tier.
        </p>
      </div>
    </div>
  );
}
