"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/adminApi";
import TaskConfigModal from "@/components/admin/TaskConfigModal";

// ── Types ────────────────────────────────────────────────────────────────────
type TabType = "daily" | "newbie" | "achievement";

interface Task {
  _id?: string;
  id: number;
  name: string;
  subtitle: string;
  condition: string;
  conditionLabel: string;
  reward: number;
  sortOrder: number;
  active: boolean;
  tab: TabType;
  iconColor: string;
  triggerEvent?: string;
  completionTarget?: number;
  description?: string;
  type?: string;
}

type SortDir = "asc" | "desc";

// ── Condition badge colours ──────────────────────────────────────────────────
const conditionBadge: Record<string, string> = {
  watch: "bg-blue-500/20 text-blue-400",
  share: "bg-green-500/20 text-green-400",
  rate: "bg-pink-500/20 text-pink-400",
  complete_profile: "bg-purple-500/20 text-purple-400",
  favorite: "bg-purple-500/20 text-purple-400",
  invite: "bg-orange-500/20 text-orange-400",
  recharge: "bg-yellow-500/20 text-yellow-400",
};

const iconColors = ["bg-blue-500", "bg-green-500", "bg-pink-500", "bg-purple-500", "bg-amber-500", "bg-cyan-500"];

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_TASKS: Task[] = [
  { id: 1001, name: "Casual Viewer", subtitle: "Basic engagement", condition: "watch", conditionLabel: "Watch 1 Episode", reward: 20, sortOrder: 1, active: true, tab: "daily", iconColor: "bg-blue-500" },
  { id: 1002, name: "Binge Master", subtitle: "Extended viewing", condition: "watch", conditionLabel: "Watch 60 Mins", reward: 50, sortOrder: 2, active: true, tab: "daily", iconColor: "bg-purple-500" },
  { id: 1003, name: "Social Butterfly", subtitle: "Community sharing", condition: "share", conditionLabel: "Share 1 Story", reward: 100, sortOrder: 3, active: true, tab: "daily", iconColor: "bg-green-500" },
  { id: 1004, name: "Reviewer", subtitle: "Content feedback", condition: "rate", conditionLabel: "Rate 3 Stories", reward: 30, sortOrder: 4, active: false, tab: "daily", iconColor: "bg-pink-500" },
  { id: 1005, name: "Daily Explorer", subtitle: "Browse content", condition: "watch", conditionLabel: "Watch 3 Episodes", reward: 25, sortOrder: 5, active: true, tab: "daily", iconColor: "bg-cyan-500" },
  { id: 1006, name: "Daily Sharer", subtitle: "Share daily", condition: "share", conditionLabel: "Share 2 Stories", reward: 40, sortOrder: 6, active: true, tab: "daily", iconColor: "bg-amber-500" },
  { id: 1007, name: "Quick Rater", subtitle: "Rate content", condition: "rate", conditionLabel: "Rate 1 Story", reward: 15, sortOrder: 7, active: true, tab: "daily", iconColor: "bg-pink-500" },
  { id: 1008, name: "Binge Watcher", subtitle: "Watch marathon", condition: "watch", conditionLabel: "Watch 90 Mins", reward: 60, sortOrder: 8, active: true, tab: "daily", iconColor: "bg-blue-500" },
  { id: 1009, name: "Super Sharer", subtitle: "Share widely", condition: "share", conditionLabel: "Share 5 Stories", reward: 80, sortOrder: 9, active: false, tab: "daily", iconColor: "bg-green-500" },
  { id: 1010, name: "Critic", subtitle: "Detailed reviews", condition: "rate", conditionLabel: "Rate 5 Stories", reward: 45, sortOrder: 10, active: true, tab: "daily", iconColor: "bg-pink-500" },
  { id: 1011, name: "Night Owl", subtitle: "Late viewing", condition: "watch", conditionLabel: "Watch 2 Episodes", reward: 20, sortOrder: 11, active: true, tab: "daily", iconColor: "bg-purple-500" },
  { id: 1012, name: "Trend Setter", subtitle: "Share trending", condition: "share", conditionLabel: "Share 3 Stories", reward: 55, sortOrder: 12, active: true, tab: "daily", iconColor: "bg-green-500" },
  // Newbie tasks
  { id: 2001, name: "First Watch", subtitle: "Start your journey", condition: "watch", conditionLabel: "Watch 1 Episode", reward: 30, sortOrder: 1, active: true, tab: "newbie", iconColor: "bg-blue-500" },
  { id: 2002, name: "Profile Setup", subtitle: "Complete your profile", condition: "complete_profile", conditionLabel: "Complete Profile", reward: 50, sortOrder: 2, active: true, tab: "newbie", iconColor: "bg-purple-500" },
  { id: 2003, name: "First Share", subtitle: "Share with friends", condition: "share", conditionLabel: "Share 1 Story", reward: 40, sortOrder: 3, active: true, tab: "newbie", iconColor: "bg-green-500" },
  // Achievement tasks
  { id: 3001, name: "Marathon Viewer", subtitle: "Dedicated watcher", condition: "watch", conditionLabel: "Watch 50 Episodes", reward: 200, sortOrder: 1, active: true, tab: "achievement", iconColor: "bg-blue-500" },
  { id: 3002, name: "Social Star", subtitle: "Sharing champion", condition: "share", conditionLabel: "Share 20 Stories", reward: 150, sortOrder: 2, active: true, tab: "achievement", iconColor: "bg-green-500" },
];

const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
  {
    key: "daily",
    label: "Daily Tasks",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "newbie",
    label: "Newbie Tasks",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: "achievement",
    label: "Achievement Tasks",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const PAGE_SIZE = 4;

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Fetch tasks from API on mount / tab change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await api.get("/api/admin/activities/tasks", { type: activeTab } as any);
        if (!cancelled) {
          const list = res.data?.tasks ?? res.data ?? [];
          if (list.length > 0) {
            setTasks((prev) => {
              const otherTabs = prev.filter((t) => t.tab !== activeTab);
              const mapped = list.map((t: any, i: number) => ({
                _id: t._id ?? t.id,
                id: t.id ?? 1001 + i,
                name: t.name ?? "",
                subtitle: t.description ?? "",
                condition: t.triggerEvent ?? "watch",
                conditionLabel: t.conditionLabel ?? t.name ?? "",
                reward: t.reward ?? 0,
                sortOrder: t.sortOrder ?? i + 1,
                active: t.active ?? true,
                tab: activeTab,
                iconColor: iconColors[i % iconColors.length],
                triggerEvent: t.triggerEvent,
                completionTarget: t.completionTarget,
                description: t.description,
                type: t.type,
              }));
              return [...otherTabs, ...mapped];
            });
          }
        }
      } catch {
        // keep mock data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  // Filtered + sorted + paginated
  const filtered = useMemo(() => {
    const list = tasks.filter(
      (t) =>
        t.tab === activeTab &&
        (t.name.toLowerCase().includes(search.toLowerCase()) ||
          String(t.id).includes(search))
    );
    list.sort((a, b) => (sortDir === "asc" ? a.sortOrder - b.sortOrder : b.sortOrder - a.sortOrder));
    return list;
  }, [tasks, activeTab, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Reset page on tab/search change
  useEffect(() => { setCurrentPage(1); }, [activeTab, search, sortDir]);

  // Toggle active
  const toggleActive = async (task: Task) => {
    const newActive = !task.active;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, active: newActive } : t)));
    try {
      const id = task._id ?? String(task.id);
      await api.put(`/api/admin/activities/tasks/${id}`, { active: newActive });
    } catch {
      // revert on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, active: !newActive } : t)));
    }
  };

  // Delete task
  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.name}"?`)) return;
    const backup = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      const id = task._id ?? String(task.id);
      await api.delete(`/api/admin/activities/tasks/${id}`);
    } catch {
      setTasks(backup);
    }
  };

  // Open modal for create
  const openCreate = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  // Open modal for edit
  const openEdit = (task: Task) => {
    setEditingTask({
      _id: task._id ?? String(task.id),
      name: task.name,
      type: task.tab,
      triggerEvent: task.condition,
      completionTarget: task.completionTarget ?? 1,
      reward: task.reward,
      description: task.subtitle,
      sortOrder: task.sortOrder,
      active: task.active,
    });
    setTaskModalOpen(true);
  };

  // Save from modal
  const handleSave = async (taskData: any) => {
    try {
      if (editingTask?._id) {
        await api.put(`/api/admin/activities/tasks/${editingTask._id}`, taskData);
      } else {
        await api.post("/api/admin/activities/tasks", taskData);
      }
    } catch {
      // fallback: update local state
    }
    // Refresh local state
    if (editingTask?._id) {
      setTasks((prev) =>
        prev.map((t) =>
          (t._id === editingTask._id || String(t.id) === editingTask._id)
            ? { ...t, name: taskData.name, subtitle: taskData.description ?? t.subtitle, reward: taskData.reward, sortOrder: taskData.sortOrder, active: taskData.active ?? t.active, condition: taskData.triggerEvent ?? t.condition }
            : t
        )
      );
    } else {
      const newId = Math.max(...tasks.map((t) => t.id), 0) + 1;
      setTasks((prev) => [
        ...prev,
        {
          id: newId,
          name: taskData.name,
          subtitle: taskData.description ?? "",
          condition: taskData.triggerEvent ?? "watch",
          conditionLabel: taskData.name,
          reward: taskData.reward ?? 0,
          sortOrder: taskData.sortOrder ?? prev.filter((t) => t.tab === activeTab).length + 1,
          active: taskData.active ?? true,
          tab: (taskData.type as TabType) ?? activeTab,
          iconColor: iconColors[newId % iconColors.length],
          triggerEvent: taskData.triggerEvent,
          completionTarget: taskData.completionTarget,
          description: taskData.description,
          type: taskData.type,
        },
      ]);
    }
    setTaskModalOpen(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engagement Tasks</h1>
          <p className="mt-1 text-sm text-gray-400">Manage daily, newbie, and achievement tasks for user retention.</p>
        </div>
        <button
          onClick={openCreate}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition sm:mt-0"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks by ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-80"
          />
        </div>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as SortDir)}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none sm:w-52"
        >
          <option value="asc">Order (Ascending)</option>
          <option value="desc">Order (Descending)</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/50 bg-[#13131d]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Task Name</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Reward</th>
              <th className="px-4 py-3">Sort Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-700/40" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                  No tasks found.
                </td>
              </tr>
            ) : (
              paginated.map((task) => (
                <tr key={task.id} className="hover:bg-[#1a1a2e]/60 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-400">#{task.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${task.iconColor} text-white text-sm font-bold`}>
                        {task.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{task.name}</div>
                        <div className="text-xs text-gray-500">{task.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${conditionBadge[task.condition] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {task.conditionLabel}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.2" />
                        <circle cx="10" cy="10" r="5" fill="currentColor" />
                      </svg>
                      {task.reward} Coins
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">{task.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => toggleActive(task)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        task.active ? "bg-blue-600" : "bg-gray-600"
                      }`}
                      aria-label={task.active ? "Deactivate task" : "Activate task"}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          task.active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(task)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-700/40 hover:text-indigo-400 transition"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-700/40 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {pageNumbers(currentPage, totalPages).map((n, i) =>
              n === "..." ? (
                <span key={`dot-${i}`} className="px-2 text-gray-600">...</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n as number)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    currentPage === n
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-700/50 text-gray-400 hover:bg-[#1a1a2e]"
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Task Config Modal */}
      <TaskConfigModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
