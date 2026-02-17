"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type BonusItem = "None" | "Extra Coins" | "VIP Trial" | "Mystery Box";

type DayConfig = {
  day: number;
  coins: number;
  bonus: BonusItem;
  active: boolean;
};

const initialDays: DayConfig[] = [
  { day: 1, coins: 10, bonus: "None", active: true },
  { day: 2, coins: 15, bonus: "None", active: true },
  { day: 3, coins: 20, bonus: "None", active: true },
  { day: 4, coins: 25, bonus: "None", active: true },
  { day: 5, coins: 30, bonus: "None", active: true },
  { day: 6, coins: 40, bonus: "None", active: true },
  { day: 7, coins: 100, bonus: "Mystery Box", active: true },
];

const bonusOptions: BonusItem[] = ["None", "Extra Coins", "VIP Trial", "Mystery Box"];

export default function AdminCheckinPage() {
  const [days, setDays] = useState<DayConfig[]>(initialDays);
  const [autoReset, setAutoReset] = useState(true);
  const [missedPolicy, setMissedPolicy] = useState<"skip" | "retro">("skip");
  const [saving, setSaving] = useState(false);

  const updateDay = (index: number, field: keyof DayConfig, value: any) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      alert("Configuration saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="pb-20">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Daily Check-in Configuration</h1>

        <div className="space-y-6">
          {/* Auto-Reset Toggle */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-Reset Cycle</p>
                <p className="text-xs text-gray-500">Automatically restart the 7-day cycle after completion</p>
              </div>
              <button
                onClick={() => setAutoReset(!autoReset)}
                className={`relative h-6 w-11 rounded-full transition ${autoReset ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${autoReset ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Missed Day Policy */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-gray-900">Missed Day Handling</p>
            <div className="flex gap-6">
              {([["skip", "Skip", "User loses the missed day reward"], ["retro", "Allow Retro-claim", "User can claim missed rewards later"]] as const).map(
                ([value, label, desc]) => (
                  <label key={value} className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="missedPolicy"
                      value={value}
                      checked={missedPolicy === value}
                      onChange={() => setMissedPolicy(value)}
                      className="mt-1 accent-indigo-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          {/* 7-Day Reward Table */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">7-Day Rewards</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Day</th>
                    <th className="px-6 py-3">Coins Reward</th>
                    <th className="px-6 py-3">Bonus Item</th>
                    <th className="px-6 py-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d, i) => (
                    <tr key={d.day} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-3 font-medium text-gray-900">Day {d.day}</td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min={0}
                          value={d.coins}
                          onChange={(e) => updateDay(i, "coins", Number(e.target.value))}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={d.bonus}
                          onChange={(e) => updateDay(i, "bonus", e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 focus:border-indigo-500 focus:outline-none"
                        >
                          {bonusOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => updateDay(i, "active", !d.active)}
                          className={`relative h-6 w-11 rounded-full transition ${d.active ? "bg-indigo-600" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${d.active ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sticky Save Button */}
        <div className="fixed bottom-0 left-64 right-0 border-t border-gray-200 bg-white px-8 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
