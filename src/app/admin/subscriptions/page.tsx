"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type Plan = "Monthly" | "Quarterly" | "Yearly";
type Status = "Active" | "Expired" | "Canceled";

interface Subscription {
  id: string;
  userName: string;
  avatar: string;
  plan: Plan;
  price: number;
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  status: Status;
}

const mockData: Subscription[] = [
  { id: "SUB-001", userName: "Alice Johnson", avatar: "AJ", plan: "Yearly", price: 79.99, autoRenew: true, startDate: "2025-06-01", endDate: "2026-06-01", status: "Active" },
  { id: "SUB-002", userName: "Bob Smith", avatar: "BS", plan: "Monthly", price: 9.99, autoRenew: true, startDate: "2026-01-15", endDate: "2026-02-15", status: "Active" },
  { id: "SUB-003", userName: "Carol Lee", avatar: "CL", plan: "Quarterly", price: 24.99, autoRenew: false, startDate: "2025-09-01", endDate: "2025-12-01", status: "Expired" },
  { id: "SUB-004", userName: "David Kim", avatar: "DK", plan: "Monthly", price: 9.99, autoRenew: false, startDate: "2025-11-10", endDate: "2025-12-10", status: "Canceled" },
  { id: "SUB-005", userName: "Eva Chen", avatar: "EC", plan: "Yearly", price: 79.99, autoRenew: true, startDate: "2025-08-20", endDate: "2026-08-20", status: "Active" },
  { id: "SUB-006", userName: "Frank Wu", avatar: "FW", plan: "Quarterly", price: 24.99, autoRenew: false, startDate: "2025-05-01", endDate: "2025-08-01", status: "Expired" },
];

const planDot: Record<Plan, string> = { Monthly: "bg-blue-500", Quarterly: "bg-purple-500", Yearly: "bg-yellow-500" };
const statusBadge: Record<Status, string> = { Active: "bg-green-100 text-green-700", Expired: "bg-gray-100 text-gray-600", Canceled: "bg-red-100 text-red-700" };

export default function SubscriptionsPage() {
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = mockData.filter((s) => {
    if (planFilter !== "All" && s.plan !== planFilter) return false;
    if (statusFilter !== "All" && s.status !== statusFilter) return false;
    if (dateFrom && s.startDate < dateFrom) return false;
    if (dateTo && s.endDate > dateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const exportCsv = () => {
    const header = "Order ID,User,Plan,Price,Auto-Renew,Start Date,End Date,Status";
    const rows = filtered.map((s) =>
      `${s.id},${s.userName},${s.plan},${s.price},${s.autoRenew},${s.startDate},${s.endDate},${s.status}`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Orders</h1>
          <button onClick={exportCsv} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            <option>All</option>
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Yearly</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            <option>All</option>
            <option>Active</option>
            <option>Expired</option>
            <option>Canceled</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700" />
          <span className="text-sm text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Order ID", "User", "Plan", "Price", "Auto-Renew", "Start Date", "End Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No subscriptions found</td></tr>
              ) : (
                paged.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500">{s.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{s.avatar}</div>
                        <span className="text-sm font-medium text-gray-900">{s.userName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${planDot[s.plan]}`} />
                        {s.plan}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">${s.price.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {s.autoRenew ? (
                        <svg className="mx-auto h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      ) : (
                        <svg className="mx-auto h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{s.startDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{s.endDate}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button className="text-sm text-indigo-600 hover:text-indigo-800">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`rounded-lg border px-3 py-1 ${page === i + 1 ? "bg-indigo-600 text-white" : "hover:bg-gray-50"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
