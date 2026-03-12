"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface SubscriptionUser {
  _id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface Subscription {
  _id: string;
  userId: SubscriptionUser;
  planId: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  autoRenew: boolean;
  stripeSubscriptionId: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/20",
  expired: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Canceled",
};

const PER_PAGE = 10;

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function getPlanLabel(plan: SubscriptionPlan | null) {
  if (!plan) return "Unknown";
  if (plan.durationDays <= 31) return "Monthly";
  if (plan.durationDays <= 93) return "Quarterly";
  return "Yearly";
}

function getPlanDot(plan: SubscriptionPlan | null) {
  if (!plan) return "bg-gray-400";
  if (plan.durationDays <= 31) return "bg-blue-400";
  if (plan.durationDays <= 93) return "bg-purple-400";
  return "bg-yellow-400";
}

function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function SubscriptionsPage() {
  const confirmDialog = useConfirm();
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filter state
  const [filterUser, setFilterUser] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({ user: "", status: "all" });

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: PER_PAGE };
      if (appliedFilters.status !== "all") params.status = appliedFilters.status;
      if (appliedFilters.user) params.search = appliedFilters.user;

      const res: any = await adminApi.getSubscriptions(params);
      if (res?.success && res.data) {
        setData(res.data.subscriptions || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApplyFilters = () => {
    setAppliedFilters({ user: filterUser, status: filterStatus });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterUser("");
    setFilterStatus("all");
    setAppliedFilters({ user: "", status: "all" });
    setPage(1);
  };

  const handleCancel = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Cancel Subscription",
      message: "Are you sure you want to cancel this subscription?",
      confirmText: "Cancel Subscription",
      tone: "danger",
    });
    if (!confirmed) return;
    setCancellingId(id);
    try {
      await adminApi.cancelSubscription(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel subscription");
    } finally {
      setCancellingId(null);
    }
  };

  const allPageSelected = data.length > 0 && data.every((s) => selectedRows.has(s._id));
  const toggleSelectAll = () => {
    const next = new Set(selectedRows);
    if (allPageSelected) { data.forEach((s) => next.delete(s._id)); }
    else { data.forEach((s) => next.add(s._id)); }
    setSelectedRows(next);
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRows(next);
  };

  const exportCsv = () => {
    const header = "Subscription ID,User,Email,Plan,Amount,Status,Start Date,End Date,Auto-Renew";
    const rows = data.map((s) =>
      `${s._id},${s.userId?.nickname || ""},${s.userId?.email || ""},${getPlanLabel(s.planId)},${s.planId?.price?.toFixed(2) || "0.00"},${STATUS_LABEL[s.status] || s.status},${formatDate(s.startDate)},${formatDate(s.endDate)},${s.autoRenew ? "ON" : "OFF"}`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscriptions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const selectClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none";

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      <h1 className="mb-6 text-2xl font-bold text-white">VIP Subscriptions</h1>

      {/* Collapsible Filter Panel */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-300 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters
          </span>
          <svg className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {filtersOpen && (
          <div className="border-t border-gray-700/50 px-5 pb-5 pt-4">
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">User</label>
                <input type="text" placeholder="Name or email..." value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Canceled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleResetFilters} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors">Reset</button>
              <button onClick={handleApplyFilters} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Apply Filters</button>
            </div>
          </div>
        )}
      </div>

      {/* List Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Subscription List</h2>
          <span className="rounded-full bg-indigo-600/20 px-3 py-0.5 text-xs font-medium text-indigo-400">Total: {total}</span>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/50 bg-[#13131d]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Period</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Auto-Renew</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-500">No subscriptions found.</td></tr>
            ) : (
              data.map((s) => (
                <tr key={s._id} className="transition-colors hover:bg-[#1a1a2e]/60">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedRows.has(s._id)} onChange={() => toggleSelect(s._id)} className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400">
                        {getInitials(s.userId?.nickname || "")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{s.userId?.nickname || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{s.userId?.email || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-gray-300">
                      <span className={`inline-block h-2 w-2 rounded-full ${getPlanDot(s.planId)}`} />
                      {s.planId?.name || getPlanLabel(s.planId)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-200">
                    ${s.planId?.price?.toFixed(2) || "0.00"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status] || STATUS_BADGE.expired}`}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                    {formatDate(s.startDate)} <span className="text-gray-600">&rarr;</span> {formatDate(s.endDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.autoRenew ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}`}>
                      {s.autoRenew ? "ON" : "OFF"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.status === "active" && (
                      <button
                        onClick={() => handleCancel(s._id)}
                        disabled={cancellingId === s._id}
                        className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Cancel subscription"
                      >
                        {cancellingId === s._id ? "..." : "Cancel"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Showing {total === 0 ? 0 : (page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, total)} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-700/50 bg-[#13131d] px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors">Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2;
            if (p < 1 || p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${page === p ? "bg-indigo-600 text-white" : "border border-gray-700/50 bg-[#13131d] text-gray-400 hover:border-gray-600 hover:text-white"}`}>{p}</button>
            );
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-700/50 bg-[#13131d] px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
