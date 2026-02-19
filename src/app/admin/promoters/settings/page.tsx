"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/adminApi";

interface Question {
  id: string;
  text: string;
  typeLabel: string;
}

const defaultQuestions: Question[] = [
  { id: "q1", text: "Social Media Profile Link", typeLabel: "Text · Required" },
  { id: "q2", text: "Years of Experience", typeLabel: "Dropdown · Required" },
  { id: "q3", text: "Portfolio URL", typeLabel: "Text · Optional" },
];

const inputClass =
  "rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export default function PromotionSettingsPage() {
  const [standardReward, setStandardReward] = useState(100);
  const [proCommission, setProCommission] = useState(15);
  const [minWithdrawal, setMinWithdrawal] = useState("50.00");
  const [settlementDays, setSettlementDays] = useState(30);
  const [followerThreshold, setFollowerThreshold] = useState(500);
  const [approvalMode, setApprovalMode] = useState<"auto" | "manual">("auto");
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  // Fetch settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get("/api/promoter/admin/settings");
        if (res?.data) {
          const d = res.data;
          if (d.standardReward !== undefined) setStandardReward(d.standardReward);
          if (d.proCommission !== undefined) setProCommission(d.proCommission);
          if (d.minWithdrawal !== undefined) setMinWithdrawal(String(d.minWithdrawal));
          if (d.settlementDays !== undefined) setSettlementDays(d.settlementDays);
          if (d.followerThreshold !== undefined) setFollowerThreshold(d.followerThreshold);
          if (d.approvalMode) setApprovalMode(d.approvalMode);
          if (d.applicationQuestions?.length) setQuestions(d.applicationQuestions);
        }
      } catch {
        // Keep defaults
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/promoter/admin/settings", {
        standardReward,
        proCommission,
        minWithdrawal: parseFloat(minWithdrawal),
        settlementDays,
        followerThreshold,
        approvalMode,
        applicationQuestions: questions,
      });
      setLastUpdated(new Date().toLocaleString());
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const id = `q${Date.now()}`;
    setQuestions([...questions, { id, text: "New Question", typeLabel: "Text · Optional" }]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    )
      return;
    const newQuestions = [...questions];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  return (
    <div className="min-h-screen bg-[#0f0f17] pb-28">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-300">Home</Link>
        <span>/</span>
        <Link href="/admin/promoters" className="hover:text-gray-300">Promotion Management</Link>
        <span>/</span>
        <span className="text-gray-300">Global Config</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Promotion Settings (Global)</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage global reward logic, commissions, and professional application workflows.
          </p>
        </div>
        <Link
          href="/admin/logs"
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Audit Log
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT CARD - Global Rewards & Settlements */}
        <div className="rounded-xl border border-gray-700/50 border-l-indigo-500 border-l-4 bg-[#13131d] p-6">
          <h2 className="text-lg font-semibold text-gray-200">Global Rewards &amp; Settlements</h2>
          <p className="mt-1 mb-6 text-sm text-gray-400">
            Configure baseline financial parameters for all users.
          </p>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Standard User Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={standardReward}
                  onChange={(e) => setStandardReward(Number(e.target.value))}
                  className={`${inputClass} w-full pr-16`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Coins
                </span>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Reward for completing shared/referral link
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Pro Promoter Commission
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={proCommission}
                  onChange={(e) => setProCommission(Number(e.target.value))}
                  className={`${inputClass} w-full pr-10`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  %
                </span>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Default percentage for professional tier
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Minimum Withdrawal
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  className={`${inputClass} w-full pl-7 pr-12`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  USD
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Settlement Period
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settlementDays}
                  onChange={(e) => setSettlementDays(Number(e.target.value))}
                  className={`${inputClass} w-full pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Days
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Note */}
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed text-amber-300/80">
              Changing the settlement period will only affect new withdrawal requests. Existing requests will follow the previous schedule.
            </p>
          </div>
        </div>

        {/* RIGHT CARD - Professional Application Rules */}
        <div className="rounded-xl border border-gray-700/50 border-l-indigo-500 border-l-4 bg-[#13131d] p-6">
          <h2 className="text-lg font-semibold text-gray-200">Professional Application Rules</h2>
          <p className="mt-1 mb-6 text-sm text-gray-400">
            Define eligibility and application flow for pro promoters.
          </p>

          {/* Eligibility Threshold */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Eligibility Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                value={followerThreshold}
                onChange={(e) => setFollowerThreshold(Number(e.target.value))}
                className={`${inputClass} w-full pr-20`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                Followers
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Minimum followers required to apply
            </p>
          </div>

          {/* Approval Method */}
          <div className="mb-6">
            <label className="mb-2.5 block text-sm font-medium text-gray-300">
              Approval Method
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5">
                <input
                  type="radio"
                  name="approval"
                  checked={approvalMode === "auto"}
                  onChange={() => setApprovalMode("auto")}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-200">Auto-Approve</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5">
                <input
                  type="radio"
                  name="approval"
                  checked={approvalMode === "manual"}
                  onChange={() => setApprovalMode("manual")}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-200">Manual Review</span>
              </label>
            </div>
          </div>

          {/* Custom Application Questions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Custom Application Questions
              </label>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-[#1a1a2e]/80 hover:text-indigo-300"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Field
              </button>
            </div>

            <ul className="space-y-2">
              {questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-700/50 bg-[#1a1a2e]/50 px-3 py-2.5"
                >
                  {/* Grip / drag handle */}
                  <button
                    onClick={() => moveQuestion(idx, "up")}
                    className="cursor-grab text-gray-600 hover:text-gray-400"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="7" r="1.5" />
                      <circle cx="15" cy="7" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="17" r="1.5" />
                      <circle cx="15" cy="17" r="1.5" />
                    </svg>
                  </button>
                  {/* Number */}
                  <span className="text-xs font-semibold text-gray-500">{idx + 1}</span>
                  {/* Question text */}
                  <span className="flex-1 text-sm text-gray-200">{q.text}</span>
                  {/* Type label */}
                  <span className="text-xs text-gray-500">{q.typeLabel}</span>
                  {/* Delete */}
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-gray-600 hover:text-red-400"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
              {questions.length === 0 && (
                <li className="py-6 text-center text-sm text-gray-500">
                  No custom questions added yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="fixed bottom-0 left-64 right-0 z-10 border-t border-gray-700/50 bg-[#13131d] px-8 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {lastUpdated ? `Last updated ${lastUpdated}` : "Last updated by Admin_System on Oct 24, 2023"}
          </span>
          <div className="flex items-center gap-3">
            <Link href="/admin/promoters" className="rounded-lg border border-gray-700/50 px-5 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}