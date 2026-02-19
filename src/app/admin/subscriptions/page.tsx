"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

type Plan = "Monthly" | "Quarterly" | "Yearly";
type Status = "Active" | "Expired" | "Canceled";

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  plan: Plan;
  amount: number;
  status: Status;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

const MOCK_DATA: Subscription[] = [
  { id: "SUB-20231024-001", userId: "88293", userName: "Sarah Jenkins", plan: "Yearly", amount: 79.99, status: "Active", startDate: "2023-10-24", endDate: "2024-10-24", autoRenew: true },
  { id: "SUB-20231020-002", userId: "77312", userName: "Michael Chen", plan: "Monthly", amount: 9.99, status: "Active", startDate: "2023-10-20", endDate: "2023-11-20", autoRenew: true },
  { id: "SUB-20231015-003", userId: "55218", userName: "Emma Wilson", plan: "Quarterly", amount: 24.99, status: "Expired", startDate: "2023-07-15", endDate: "2023-10-15", autoRenew: false },
  { id: "SUB-20231010-004", userId: "44102", userName: "James Smith", plan: "Monthly", amount: 9.99, status: "Canceled", startDate: "2023-10-10", endDate: "2023-11-10", autoRenew: false },
  { id: "SUB-20231005-005", userId: "33205", userName: "Olivia Brown", plan: "Yearly", amount: 79.99, status: "Active", startDate: "2023-10-05", endDate: "2024-10-05", autoRenew: true },
  { id: "SUB-20230928-006", userId: "22108", userName: "Liam Garcia", plan: "Quarterly", amount: 24.99, status: "Active", startDate: "2023-09-28", endDate: "2023-12-28", autoRenew: true },
  { id: "SUB-20230920-007", userId: "11305", userName: "Sophia Martinez", plan: "Monthly", amount: 9.99, status: "Expired", startDate: "2023-09-20", endDate: "2023-10-20", autoRenew: false },
  { id: "SUB-20230915-008", userId: "99401", userName: "Noah Davis", plan: "Yearly", amount: 79.99, status: "Active", startDate: "2023-09-15", endDate: "2024-09-15", autoRenew: true },
];

const PLAN_DOT: Record<Plan, string> = {
  Monthly: "bg-blue-400",
  Quarterly: "bg-purple-400",
  Yearly: "bg-yellow-400",
};

const STATUS_BADGE: Record<Status, string> = {
  Active: "bg-green-500/15 text-green-400 border border-green-500/20",
  Expired: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
  Canceled: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const PER_PAGE = 10;

export default function SubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>(MOCK_DATA);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filter state
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterPlan, setFilterPlan] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Applied filters (only applied on button click)
  const [appliedFilters, setAppliedFilters] = useState({
    orderId: "",
    user: "",
    plan: "All",
    status: "All",
    dateFrom: "",
    dateTo: "",
  });

  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [autoRenewState, setAutoRenewState] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      MOCK_DATA.forEach((s) => { map[s.id] = s.autoRenew; });
      return map;
    }
  );

  // Fetch data from API, fall back to mock
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await adminApi.getTransactions({ type: "subscription" });
        if (!cancelled && res?.data?.length) {
          setData(res.data);
        }
      } catch {
        // keep mock data
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({
      orderId: filterOrderId,
      user: filterUser,
      plan: filterPlan,
      status: filterStatus,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterOrderId("");
    setFilterUser("");
    setFilterPlan("All");
    setFilterStatus("All");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilters({ orderId: "", user: "", plan: "All", status: "All", dateFrom: "", dateTo: "" });
    setPage(1);
  };

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (appliedFilters.orderId && !s.id.toLowerCase().includes(appliedFilters.orderId.toLowerCase())) return false;
      if (appliedFilters.user && !s.userName.toLowerCase().includes(appliedFilters.user.toLowerCase()) && !s.userId.includes(appliedFilters.user)) return false;
      if (appliedFilters.plan !== "All" && s.plan !== appliedFilters.plan) return false;
      if (appliedFilters.status !== "All" && s.status !== appliedFilters.status) return false;
      if (appliedFilters.dateFrom && s.startDate < appliedFilters.dateFrom) return false;
      if (appliedFilters.dateTo && s.startDate > appliedFilters.dateTo) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const allPageSelected = paged.length > 0 && paged.every((s) => selectedRows.has(s.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedRows);
    if (allPageSelected) {
      paged.forEach((s) => next.delete(s.id));
    } else {
      paged.forEach((s) => next.add(s.id));
    }
    setSelectedRows(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAutoRenew = (id: string) => {
    setAutoRenewState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const exportCsv = () => {
    const header = "Order ID,User,User ID,Plan,Amount,Status,Start Date,End Date,Auto-Renew";
    const rows = filtered.map((s) =>
      `${s.id},${s.userName},${s.userId},${s.plan},${s.amount.toFixed(2)},${s.status},${s.startDate},${s.endDate},${autoRenewState[s.id] ? "ON" : "OFF"}`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscription-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const selectClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none";

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      {/* Page Title */}
      <h1 className="mb-6 text-2xl font-bold text-white">Subscription Orders</h1>

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
            {/* Row 1 */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Order ID</label>
                <input type="text" placeholder="Search order ID..." value={filterOrderId} onChange={(e) => setFilterOrderId(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">User</label>
                <input type="text" placeholder="Name or ID..." value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Subscription Plan</label>
                <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className={selectClass}>
                  <option value="All">All</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
            </div>
            {/* Row 2 */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Purchase Date From</label>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Purchase Date To</label>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={inputClass} />
              </div>
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button onClick={handleResetFilters} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors">
                Reset
              </button>
              <button onClick={handleApplyFilters} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order List Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Order List</h2>
          <span className="rounded-full bg-indigo-600/20 px-3 py-0.5 text-xs font-medium text-indigo-400">
            Total: {totalCount}
          </span>
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
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Paid Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Period</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Auto-Renew</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                  No subscription orders found.
                </td>
              </tr>
            ) : (
              paged.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-[#1a1a2e]/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-indigo-400">
                    {s.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400">
                        {getInitials(s.userName)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{s.userName}</div>
                        <div className="text-xs text-gray-500">#{s.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-gray-300">
                      <span className={`inline-block h-2 w-2 rounded-full ${PLAN_DOT[s.plan]}`} />
                      {s.plan}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-200">
                    ${s.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                    {s.startDate} <span className="text-gray-600">&rarr;</span> {s.endDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => toggleAutoRenew(s.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        autoRenewState[s.id] ? "bg-green-500" : "bg-gray-600"
                      }`}
                      role="switch"
                      aria-checked={autoRenewState[s.id]}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          autoRenewState[s.id] ? "translate-x-[18px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/subscriptions/${s.id}`}
                      className="text-gray-400 hover:text-indigo-400 transition-colors"
                      title="View details"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Link>
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
          Showing {totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, totalCount)} of {totalCount} orders
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-700/50 bg-[#13131d] px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                page === i + 1
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-700/50 bg-[#13131d] text-gray-400 hover:border-gray-600 hover:text-white"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-700/50 bg-[#13131d] px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
