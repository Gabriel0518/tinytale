"use client";

import { useState } from "react";
import AdminLayout from "../../layout";

interface Question {
  id: string;
  text: string;
}

const initialQuestions: Question[] = [
  { id: "q1", text: "How do you plan to promote TinyTale to your audience?" },
  { id: "q2", text: "What social media platforms do you actively use?" },
  { id: "q3", text: "How many followers do you have across all platforms?" },
];

export default function PromotionSettingsPage() {
  const [standardCoins, setStandardCoins] = useState(50);
  const [proCommission, setProCommission] = useState(15);
  const [minWithdrawal, setMinWithdrawal] = useState(100);
  const [settlementDays, setSettlementDays] = useState(7);
  const [approvalMode, setApprovalMode] = useState<"auto" | "manual">("manual");
  const [followerThreshold, setFollowerThreshold] = useState(1000);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addQuestion = () => {
    const id = `q${Date.now()}`;
    setQuestions([...questions, { id, text: "New question?" }]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
  };

  const saveEdit = () => {
    setQuestions(questions.map((q) => (q.id === editingId ? { ...q, text: editText } : q)));
    setEditingId(null);
  };

  return (
    <AdminLayout>
      <div className="pb-24">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Promotion Settings</h1>

        {/* Two-column cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Card - Commission Rules */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Commission Rules</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Standard Coins Reward</span>
                <input type="number" value={standardCoins} onChange={(e) => setStandardCoins(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Pro Commission (%)</span>
                <input type="number" value={proCommission} onChange={(e) => setProCommission(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Min Withdrawal Amount</span>
                <input type="number" value={minWithdrawal} onChange={(e) => setMinWithdrawal(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Settlement Days</span>
                <input type="number" value={settlementDays} onChange={(e) => setSettlementDays(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </label>
            </div>
          </div>

          {/* Right Card - Approval Settings */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Approval Settings</h2>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-gray-700">Approval Mode</legend>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" name="approval" checked={approvalMode === "auto"} onChange={() => setApprovalMode("auto")} className="accent-red-600" />
                    Auto Approve
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" name="approval" checked={approvalMode === "manual"} onChange={() => setApprovalMode("manual")} className="accent-red-600" />
                    Manual Review
                  </label>
                </div>
              </fieldset>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Follower Threshold</span>
                <input type="number" value={followerThreshold} onChange={(e) => setFollowerThreshold(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </label>
            </div>
          </div>
        </div>

        {/* Application Questions */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Application Questions</h2>
            <button onClick={addQuestion} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Add Question</button>
          </div>
          <ul className="space-y-3">
            {questions.map((q, idx) => (
              <li key={q.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                {/* Drag handle */}
                <span className="cursor-grab text-gray-400" title="Drag to reorder">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                </span>
                <span className="mr-1 text-xs font-medium text-gray-400">{idx + 1}.</span>
                {editingId === q.id ? (
                  <input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-500 focus:outline-none" autoFocus />
                ) : (
                  <span className="flex-1 text-sm text-gray-700">{q.text}</span>
                )}
                <div className="flex gap-2">
                  {editingId === q.id ? (
                    <button onClick={saveEdit} className="text-sm text-green-600 hover:text-green-800">Save</button>
                  ) : (
                    <button onClick={() => startEdit(q)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  )}
                  <button onClick={() => deleteQuestion(q.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
              </li>
            ))}
            {questions.length === 0 && (
              <li className="py-6 text-center text-sm text-gray-400">No questions added yet.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-64 right-0 border-t border-gray-200 bg-white px-8 py-4">
        <div className="flex justify-end">
          <button className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700">Save Configuration</button>
        </div>
      </div>
    </AdminLayout>
  );
}
