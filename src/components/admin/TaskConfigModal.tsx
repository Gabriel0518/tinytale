"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/adminApi";

interface TaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  task: {
    _id?: string;
    name: string;
    type: string;
    triggerEvent: string;
    completionTarget: number;
    reward: number;
    description: string;
    sortOrder: number;
    active: boolean;
  } | null;
}

const TASK_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "newbie", label: "Newbie" },
  { value: "achievement", label: "Achievement" },
];

const TRIGGER_EVENTS = [
  { value: "watch", label: "Watch" },
  { value: "share", label: "Share" },
  { value: "favorite", label: "Favorite" },
  { value: "invite", label: "Invite" },
  { value: "recharge", label: "Recharge" },
  { value: "rate", label: "Rate" },
  { value: "complete_profile", label: "Complete Profile" },
];

export default function TaskConfigModal({
  open,
  onClose,
  onSave,
  task,
}: TaskConfigModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("");
  const [completionTarget, setCompletionTarget] = useState(1);
  const [reward, setReward] = useState(0);
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setName(task.name);
      setType(task.type);
      setTriggerEvent(task.triggerEvent);
      setCompletionTarget(task.completionTarget);
      setReward(task.reward);
      setDescription(task.description);
      setSortOrder(task.sortOrder);
      setActive(task.active);
    } else {
      setName("");
      setType("");
      setTriggerEvent("");
      setCompletionTarget(1);
      setReward(0);
      setDescription("");
      setSortOrder(0);
      setActive(true);
    }
    setSaving(false);
  }, [open, task]);

  if (!open) return null;

  const canSubmit = name.trim() !== "" && type !== "" && triggerEvent !== "" && !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const formData = {
      name: name.trim(),
      type,
      triggerEvent,
      completionTarget,
      reward,
      description: description.trim(),
      sortOrder,
      active,
    };
    try {
      let result;
      if (task?._id) {
        result = await api.put(`/api/admin/activities/tasks/${task._id}`, formData);
      } else {
        result = await api.post("/api/admin/activities/tasks", formData);
      }
      onSave(result);
      onClose();
    } catch {
      // allow UI to recover
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0f0f17]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-700/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Task Configuration</h2>
              <p className="text-sm text-gray-400">Configure task details, rewards, and conditions.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-700/50 hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-5 space-y-5">
          {/* Task Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Task Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Check-in"
              className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Type + Trigger row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Task Type <span className="text-red-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Select type</option>
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Trigger Event <span className="text-red-400">*</span>
              </label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Select trigger</option>
                {TRIGGER_EVENTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Completion Target + Reward card */}
          <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e]/50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Completion Target (Times)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={completionTarget}
                    onChange={(e) => setCompletionTarget(Number(e.target.value) || 1)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 pr-14 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    times
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Number of times user must perform action.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Reward Amount (Coins)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                    S
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={reward}
                    onChange={(e) => setReward(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-10 pr-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Coins awarded upon completion.</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Task Description <span className="text-xs font-normal text-gray-500">(Visible to users)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the task clearly for the user..."
              className="w-full resize-none rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Weight + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Sort Weight</label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Task Status</label>
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Enable or disable this task immediately</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => setActive(!active)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      active ? "bg-indigo-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        active ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {saving ? "Saving..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
