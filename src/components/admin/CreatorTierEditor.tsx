"use client";

import { useState } from "react";
import { TrendingUp, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorTier } from "@/types/creator";

interface CreatorTierEditorProps {
  creatorId: string;
  creatorName: string;
  currentTier: CreatorTier;
  onUpdate?: (newTier: CreatorTier) => void;
  onClose?: () => void;
}

const tierConfig = {
  bronze: {
    label: "Bronze Tier",
    emoji: "🥉",
    color: "amber",
    shareRate: "50%",
    description: "New creators",
  },
  silver: {
    label: "Silver Tier",
    emoji: "🥈",
    color: "gray",
    shareRate: "60%",
    description: "Established creators",
  },
  gold: {
    label: "Gold Tier",
    emoji: "🥇",
    color: "yellow",
    shareRate: "70%",
    description: "Top performers",
  },
};

export function CreatorTierEditor({
  creatorId,
  creatorName,
  currentTier,
  onUpdate,
  onClose,
}: CreatorTierEditorProps) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<CreatorTier>(currentTier);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (selectedTier === currentTier) {
      toast("No changes to save", "info");
      onClose?.();
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateCreatorTier(creatorId, {
        tier: selectedTier,
        notes: notes.trim(),
      });

      toast(`Creator tier updated to ${tierConfig[selectedTier].label}`, "success");
      onUpdate?.(selectedTier);
      onClose?.();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to update creator tier",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Update Creator Tier</h2>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Adjust revenue share for <span className="font-semibold text-white">{creatorName}</span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-700/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Current Tier */}
      <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Current Tier
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl">{tierConfig[currentTier].emoji}</span>
          <div>
            <p className="text-lg font-bold text-white">
              {tierConfig[currentTier].label}
            </p>
            <p className="text-sm text-gray-400">
              {tierConfig[currentTier].shareRate} revenue share
            </p>
          </div>
        </div>
      </div>

      {/* Tier Selection */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-300">Select New Tier</p>
        <div className="space-y-3">
          {(["bronze", "silver", "gold"] as CreatorTier[]).map((tier) => {
            const config = tierConfig[tier];
            const isSelected = selectedTier === tier;
            const isCurrent = currentTier === tier;

            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-white">
                          {config.label}
                        </p>
                        {isCurrent && (
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        {config.shareRate} revenue share • {config.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact Preview */}
      {selectedTier !== currentTier && (
        <div className="rounded-xl border border-blue-700/50 bg-blue-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Impact Preview
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Current revenue share:</span>
              <span className="font-mono font-semibold text-white">
                {tierConfig[currentTier].shareRate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">New revenue share:</span>
              <span className="font-mono font-semibold text-blue-300">
                {tierConfig[selectedTier].shareRate}
              </span>
            </div>
            <div className="mt-3 rounded-lg bg-[#0f0f17] p-3">
              <p className="text-xs text-gray-400">
                Example: On $1,000 gross revenue (after 5% payment fees)
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-300">Current payout:</span>
                <span className="font-mono text-white">
                  ${(950 * parseFloat(tierConfig[currentTier].shareRate) / 100 - 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">New payout:</span>
                <span className="font-mono font-semibold text-blue-300">
                  ${(950 * parseFloat(tierConfig[selectedTier].shareRate) / 100 - 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-300">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for tier change..."
          className="min-h-[100px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none focus:border-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onClose && (
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e] disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || selectedTier === currentTier}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:Claude Code-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Tier"}
        </button>
      </div>
    </div>
  );
}
