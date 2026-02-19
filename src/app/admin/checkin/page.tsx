"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/adminApi";

type BonusItem = "None" | "Extra Coins" | "VIP Trial" | "Mystery Chest (Gold)";

type DayConfig = {
  day: number;
  coins: number;
  bonus: BonusItem;
  active: boolean;
};

const defaultDays: DayConfig[] = [
  { day: 1, coins: 10, bonus: "None", active: true },
  { day: 2, coins: 20, bonus: "None", active: true },
  { day: 3, coins: 30, bonus: "Extra Coins", active: true },
  { day: 4, coins: 50, bonus: "None", active: true },
  { day: 5, coins: 75, bonus: "VIP Trial", active: true },
  { day: 6, coins: 100, bonus: "None", active: true },
  { day: 7, coins: 1000, bonus: "Mystery Chest (Gold)", active: true },
];

const bonusOptions: BonusItem[] = [
  "None",
  "Extra Coins",
  "VIP Trial",
  "Mystery Chest (Gold)",
];

export default function AdminCheckinPage() {
  const [days, setDays] = useState<DayConfig[]>(defaultDays);
  const [autoReset, setAutoReset] = useState(true);
  const [missedPolicy, setMissedPolicy] = useState<"reset" | "retro">("reset");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get("/api/admin/activities/checkin");
        if (res?.data) {
          if (res.data.days) setDays(res.data.days);
          if (typeof res.data.autoReset === "boolean")
            setAutoReset(res.data.autoReset);
          if (res.data.missedPolicy) setMissedPolicy(res.data.missedPolicy);
        }
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateDay = (index: number, field: keyof DayConfig, value: any) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/activities/checkin", {
        days,
        autoReset,
        missedPolicy,
      });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDays(defaultDays);
    setAutoReset(true);
    setMissedPolicy("reset");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
        <span>Activity Config</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-300">P6-01 Daily Rewards</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Daily Rewards Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Configure the 7-day reward cycle and logic rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDiscard}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#1a1a2e]"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* LEFT COLUMN */}
        <div className="space-y-6 xl:col-span-3">
          {/* Reward Schedule Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-100">Reward Schedule</h2>
              <span className="rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400">
                DAYS 1-7 ONLY
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Day</th>
                    <th className="px-6 py-3">Icon Preview</th>
                    <th className="px-6 py-3">Reward Amount (Coins)</th>
                    <th className="px-6 py-3">Bonus Item</th>
                    <th className="px-6 py-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d, i) => (
                    <tr
                      key={d.day}
                      className={`border-b border-gray-700/50 last:border-0 ${
                        d.day === 7 ? "bg-amber-900/10" : "hover:bg-[#1a1a2e]/50"
                      }`}
                    >
                      <td className="px-6 py-3">
                        <span className={`font-medium ${d.day === 7 ? "text-amber-400" : "text-gray-200"}`}>
                          Day {d.day}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                            d.day === 7 ? "bg-amber-500" : "bg-yellow-500"
                          }`}
                        >
                          {d.day === 7 ? "\u2605" : "\u25CF"}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            value={d.coins}
                            onChange={(e) => updateDay(i, "coins", Number(e.target.value))}
                            className="w-28 rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 pr-8 text-gray-200 focus:border-indigo-500 focus:outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-500">
                            &#9679;
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={d.bonus}
                          onChange={(e) => updateDay(i, "bonus", e.target.value)}
                          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 text-gray-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {bonusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => updateDay(i, "active", !d.active)}
                          className={`relative h-6 w-11 rounded-full transition ${
                            d.active ? "bg-blue-600" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                              d.active ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logic Configuration Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-100">
              Logic Configuration
            </h2>

            {/* Auto-Reset Cycle */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Auto-Reset Cycle</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Automatically reset the user&apos;s progress to Day 1 after they
                  claim the Day 7 reward.
                </p>
              </div>
              <button
                onClick={() => setAutoReset(!autoReset)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  autoReset ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    autoReset ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Missed Check-In Handling */}
            <div>
              <p className="mb-3 text-sm font-medium text-gray-200">
                Missed Check-In Handling
              </p>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-3 transition hover:border-gray-600">
                  <input
                    type="radio"
                    name="missedPolicy"
                    value="reset"
                    checked={missedPolicy === "reset"}
                    onChange={() => setMissedPolicy("reset")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-200">
                    Reset progress to Day 1 immediately
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-3 transition hover:border-gray-600">
                  <input
                    type="radio"
                    name="missedPolicy"
                    value="retro"
                    checked={missedPolicy === "retro"}
                    onChange={() => setMissedPolicy("retro")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-200">
                    Allow &quot;Retro-Claim&quot; (User pays gems)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Live Preview */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Live Preview</h2>
              <span className="rounded-full bg-gray-700/50 px-3 py-1 text-xs text-gray-400">
                iPhone 14 Pro
              </span>
            </div>

            {/* Phone Mockup */}
            <div className="mx-auto w-[280px]">
              <div className="rounded-[2rem] border-2 border-gray-700 bg-[#0a0a12] p-3">
                {/* Notch */}
                <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-gray-800" />

                {/* Screen Content */}
                <div className="rounded-2xl bg-[#12121e] px-4 py-5">
                  <h3 className="mb-1 text-center text-base font-bold text-white">
                    Daily Check-in
                  </h3>
                  <div className="mx-auto mb-4 w-fit rounded-full bg-indigo-600/30 px-3 py-0.5 text-[10px] font-medium text-indigo-300">
                    7-Day Streak
                  </div>

                  {/* Day list */}
                  <div className="space-y-2">
                    {days.filter((d) => d.active).map((d) => (
                      <div
                        key={d.day}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                          d.day === 7
                            ? "border border-amber-500/30 bg-amber-900/20"
                            : "bg-[#1a1a2e]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white ${
                              d.day === 7 ? "bg-amber-500" : "bg-yellow-500"
                            }`}
                          >
                            {d.day === 7 ? "\u2605" : "\u25CF"}
                          </div>
                          <div>
                            <p className={`text-[11px] font-medium ${d.day === 7 ? "text-amber-400" : "text-gray-300"}`}>
                              {d.day === 7 ? "GRAND PRIZE" : `Day ${d.day}`}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold ${d.day === 7 ? "text-amber-400" : "text-yellow-400"}`}>
                          {d.coins} coins
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Claim Button */}
                  <button className="mt-4 w-full rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white">
                    Claim Reward
                  </button>
                </div>

                {/* Home indicator */}
                <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gray-700" />
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              Preview updates automatically when values change
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
