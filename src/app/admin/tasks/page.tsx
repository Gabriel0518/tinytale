"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type Condition = "Watch" | "Share" | "Favorite" | "Invite" | "Recharge";
type TabType = "daily" | "newbie" | "achievement";

type Task = {
  id: number;
  name: string;
  condition: Condition;
  reward: number;
  sortOrder: number;
  active: boolean;
  tab: TabType;
};

const conditionColors: Record<Condition, string> = {
  Watch: "bg-blue-100 text-blue-700",
  Share: "bg-green-100 text-green-700",
  Favorite: "bg-purple-100 text-purple-700",
  Invite: "bg-orange-100 text-orange-700",
  Recharge: "bg-yellow-100 text-yellow-700",
};

const initialTasks: Task[] = [
  { id: 1, name: "Watch 3 Episodes", condition: "Watch", reward: 20, sortOrder: 1, active: true, tab: "daily" },
  { id: 2, name: "Share a Drama", condition: "Share", reward: 15, sortOrder: 2, active: true, tab: "daily" },
  { id: 3, name: "Add to Favorites", condition: "Favorite", reward: 10, sortOrder: 3, active: true, tab: "daily" },
  { id: 4, name: "Invite a Friend", condition: "Invite", reward: 50, sortOrder: 4, active: false, tab: "daily" },
  { id: 5, name: "Recharge 100 Coins", condition: "Recharge", reward: 30, sortOrder: 5, active: true, tab: "daily" },
  { id: 6, name: "Watch 10 Episodes", condition: "Watch", reward: 60, sortOrder: 6, active: true, tab: "daily" },
  { id: 7, name: "Watch First Episode", condition: "Watch", reward: 30, sortOrder: 1, active: true, tab: "newbie" },
  { id: 8, name: "Share with 3 Friends", condition: "Share", reward: 40, sortOrder: 2, active: true, tab: "newbie" },
  { id: 9, name: "Favorite 3 Dramas", condition: "Favorite", reward: 25, sortOrder: 3, active: true, tab: "newbie" },
  { id: 10, name: "First Recharge", condition: "Recharge", reward: 100, sortOrder: 4, active: true, tab: "newbie" },
  { id: 11, name: "Invite 1 Friend", condition: "Invite", reward: 80, sortOrder: 5, active: true, tab: "newbie" },
  { id: 12, name: "Watch 50 Episodes", condition: "Watch", reward: 200, sortOrder: 1, active: true, tab: "achievement" },
  { id: 13, name: "Share 20 Times", condition: "Share", reward: 150, sortOrder: 2, active: true, tab: "achievement" },
  { id: 14, name: "Favorite 20 Dramas", condition: "Favorite", reward: 100, sortOrder: 3, active: false, tab: "achievement" },
  { id: 15, name: "Invite 10 Friends", condition: "Invite", reward: 500, sortOrder: 4, active: true, tab: "achievement" },
  { id: 16, name: "Recharge 1000 Coins", condition: "Recharge", reward: 300, sortOrder: 5, active: true, tab: "achievement" },
  { id: 17, name: "Watch 100 Episodes", condition: "Watch", reward: 500, sortOrder: 6, active: true, tab: "achievement" },
];

const tabs: { key: TabType; label: string }[] = [
  { key: "daily", label: "Daily Tasks" },
  { key: "newbie", label: "Newbie Tasks" },
  { key: "achievement", label: "Achievement Tasks" },
];

export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");

  const filtered = tasks.filter(
    (t) => t.tab === activeTab && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Configuration</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.key
                  ? "bg-white text-red-600 border border-gray-200 border-b-white -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Add Task
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Task Name</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{task.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{task.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionColors[task.condition]}`}>
                      {task.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-medium">{task.reward} coins</td>
                  <td className="px-4 py-3 text-gray-500">{task.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(task.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                        task.active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          task.active ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                      <button className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
