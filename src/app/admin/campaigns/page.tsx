"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/adminApi";
import RechargeActivityModal from "@/components/admin/RechargeActivityModal";

type ActivityType = "Rebate" | "Flash Sale" | "First Recharge";
type ActivityStatus = "Active" | "Upcoming" | "Ended";

interface Activity {
  id: string;
  name: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  startDate: string;
  endDate: string;
  targetTiers: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "ACT-892",
    name: "Summer Kickoff Bonus",
    description: "Get 20% bonus gems on any recharge over $49.99 duri...",
    type: "Rebate",
    status: "Active",
    startDate: "Oct 24, 2023",
    endDate: "Nov 05, 2023",
    targetTiers: "All Users",
  },
  {
    id: "ACT-895",
    name: "New User Flash Sale",
    description: "Limited time offer for first-time purchasers. 500 Gems to...",
    type: "Flash Sale",
    status: "Upcoming",
    startDate: "Nov 10, 2023",
    endDate: "Nov 12, 2023",
    targetTiers: "VIP 0 Only",
  },
  {
    id: "ACT-799",
    name: "Autumn Moon Festival",
    description: "Double rewards on all rebate packs for the festival.",
    type: "First Recharge",
    status: "Ended",
    startDate: "Sep 15, 2023",
    endDate: "Sep 25, 2023",
    targetTiers: "VIP 1+",
  },
  {
    id: "ACT-893",
    name: "Whale Tier Appreciation",
    description: "Exclusive rebate for high tier VIPs. 10% instant cashback.",
    type: "Rebate",
    status: "Active",
    startDate: "Oct 20, 2023",
    endDate: "Nov 30, 2023",
    targetTiers: "VIP 8-10",
  },
  {
    id: "ACT-894",
    name: "Weekend Warrior Pack",
    description: "Special items included in the $20 pack this weekend only.",
    type: "Flash Sale",
    status: "Active",
    startDate: "Oct 27, 2023",
    endDate: "Oct 29, 2023",
    targetTiers: "All Users",
  },
];

const TYPE_BADGE: Record<ActivityType, string> = {
  Rebate: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "Flash Sale": "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  "First Recharge": "bg-teal-500/10 text-teal-400 border border-teal-500/20",
};

const STATUS_CONFIG: Record<ActivityStatus, { dot: string; badge: string }> = {
  Active: {
    dot: "bg-green-400 animate-pulse",
    badge: "bg-green-500/10 text-green-400 border border-green-500/20",
  },
  Upcoming: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  Ended: {
    dot: "bg-gray-500",
    badge: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
  },
};

const PAGE_SIZE = 5;
const TOTAL_MOCK = 42;

export default function CampaignsPage() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await api.get<{ data: Activity[] }>("/api/admin/activities/campaigns");
      if (res?.data?.length) setActivities(res.data);
    } catch {
      setActivities(MOCK_ACTIVITIES);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filtered = activities.filter((a) => {
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.id.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    if (typeFilter !== "All" && a.type !== typeFilter) return false;
    return true;
  });

  const totalResults = Math.max(filtered.length, TOTAL_MOCK);
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleEndEarly = async (activity: Activity) => {
    try {
      await api.put(`/api/admin/activities/campaigns/${activity.id}`, { status: "Ended" });
    } catch { /* fallback to local */ }
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, status: "Ended" as ActivityStatus } : a))
    );
  };

  const handleDelete = async (activity: Activity) => {
    try {
      await api.delete(`/api/admin/activities/campaigns/${activity.id}`);
    } catch { /* fallback to local */ }
    setActivities((prev) => prev.filter((a) => a.id !== activity.id));
  };

  const handleCreateOrUpdate = async (data: Partial<Activity>) => {
    if (editingActivity) {
      try {
        await api.put(`/api/admin/activities/campaigns/${editingActivity.id}`, data);
      } catch { /* fallback */ }
      setActivities((prev) =>
        prev.map((a) => (a.id === editingActivity.id ? { ...a, ...data } as Activity : a))
      );
    } else {
      const newActivity: Activity = {
        id: `ACT-${Math.floor(Math.random() * 900) + 100}`,
        name: data.name || "",
        description: data.description || "",
        type: (data.type as ActivityType) || "Rebate",
        status: (data.status as ActivityStatus) || "Upcoming",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        targetTiers: data.targetTiers || "All Users",
      };
      try {
        await api.post("/api/admin/activities/campaigns", newActivity);
      } catch { /* fallback */ }
      setActivities((prev) => [newActivity, ...prev]);
    }
    setActivityModalOpen(false);
    setEditingActivity(null);
  };

  const openCreate = () => {
    setEditingActivity(null);
    setActivityModalOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityModalOpen(true);
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const showStart = (page - 1) * PAGE_SIZE + 1;
  const showEnd = Math.min(page * PAGE_SIZE, totalResults);

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        <span className="mx-2">&gt;</span>
        <span className="hover:text-gray-300 cursor-pointer">Promotions</span>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-300">Sales Activities</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-200">Recharge Promo Activities</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Activity
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search Activity Name or ID"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-72 rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm text-gray-200 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ended">Ended</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm text-gray-200 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
        >
          <option value="All">All Types</option>
          <option value="Rebate">Rebate</option>
          <option value="Flash Sale">Flash Sale</option>
          <option value="First Recharge">First Recharge</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Activity ID</th>
                <th className="px-6 py-4">Name / Description</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Time Range</th>
                <th className="px-6 py-4">Target Tiers</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-700/50 last:border-0 hover:bg-[#1a1a2e]/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">#{a.id}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-200">{a.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">{a.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_BADGE[a.type]}`}>
                      {a.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                    {a.startDate} <span className="text-gray-600">to</span> {a.endDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{a.targetTiers}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[a.status].badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[a.status].dot}`} />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Edit
                      </button>
                      {a.status === "Active" && (
                        <button
                          onClick={() => handleEndEarly(a)}
                          className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          End Early
                        </button>
                      )}
                      {a.status !== "Active" && (
                        <button
                          onClick={() => handleDelete(a)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                    No activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-700/50 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing {showStart} to {showEnd} of {totalResults} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {renderPageNumbers().map((p, i) =>
              typeof p === "string" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-600">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-[#1a1a2e]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <RechargeActivityModal
        open={activityModalOpen}
        onClose={() => { setActivityModalOpen(false); setEditingActivity(null); }}
        onSave={handleCreateOrUpdate}
        activity={editingActivity as any}
      />
    </div>
  );
}