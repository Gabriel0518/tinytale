"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type Status = "Pending" | "Processing" | "Paid" | "Rejected";

interface Withdrawal {
  id: string;
  promoter: { name: string; avatar: string };
  amount: number;
  method: string;
  account: string;
  status: Status;
  requestTime: string;
}

const mockData: Withdrawal[] = [
  { id: "W-1001", promoter: { name: "Alice Wang", avatar: "AW" }, amount: 520, method: "PayPal", account: "ali****@gmail.com", status: "Pending", requestTime: "2026-02-15 10:30" },
  { id: "W-1002", promoter: { name: "Bob Chen", avatar: "BC" }, amount: 1200, method: "Bank Transfer", account: "****7890", status: "Processing", requestTime: "2026-02-14 08:15" },
  { id: "W-1003", promoter: { name: "Carol Li", avatar: "CL" }, amount: 350, method: "PayPal", account: "car****@yahoo.com", status: "Paid", requestTime: "2026-02-13 14:20" },
  { id: "W-1004", promoter: { name: "David Kim", avatar: "DK" }, amount: 800, method: "Bank Transfer", account: "****4321", status: "Rejected", requestTime: "2026-02-12 16:45" },
  { id: "W-1005", promoter: { name: "Eva Zhang", avatar: "EZ" }, amount: 960, method: "PayPal", account: "eva****@outlook.com", status: "Pending", requestTime: "2026-02-11 09:00" },
  { id: "W-1006", promoter: { name: "Frank Liu", avatar: "FL" }, amount: 450, method: "Bank Transfer", account: "****5678", status: "Paid", requestTime: "2026-02-10 11:30" },
];

const statusColors: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Paid: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const cardColors: Record<Status, string> = {
  Pending: "border-l-yellow-500",
  Processing: "border-l-blue-500",
  Paid: "border-l-green-500",
  Rejected: "border-l-red-500",
};

function getStats(data: Withdrawal[]) {
  const stats: Record<Status, { count: number; total: number }> = {
    Pending: { count: 0, total: 0 },
    Processing: { count: 0, total: 0 },
    Paid: { count: 0, total: 0 },
    Rejected: { count: 0, total: 0 },
  };
  data.forEach((w) => { stats[w.status].count++; stats[w.status].total += w.amount; });
  return stats;
}

function exportCSV(data: Withdrawal[]) {
  const header = "Request ID,Promoter,Amount,Payment Method,Account,Status,Request Time\n";
  const rows = data.map((w) => `${w.id},${w.promoter.name},${w.amount},${w.method},${w.account},${w.status},${w.requestTime}`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "withdrawals.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data] = useState<Withdrawal[]>(mockData);

  const filtered = data.filter((w) => {
    if (statusFilter !== "All" && w.status !== statusFilter) return false;
    if (dateFrom && w.requestTime < dateFrom) return false;
    if (dateTo && w.requestTime > dateTo + " 23:59") return false;
    return true;
  });

  const stats = getStats(data);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
          <button onClick={() => exportCSV(filtered)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">
            Export CSV
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {(["Pending", "Processing", "Paid", "Rejected"] as Status[]).map((s) => (
            <div key={s} className={`rounded-lg border-l-4 bg-white p-4 shadow-sm ${cardColors[s]}`}>
              <p className="text-sm text-gray-500">{s}</p>
              <p className="text-2xl font-bold">{stats[s].count}</p>
              <p className="text-sm text-gray-400">${stats[s].total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border px-3 py-2 text-sm">
            <option>All</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Paid</option>
            <option>Rejected</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border px-3 py-2 text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border px-3 py-2 text-sm" />
          <button onClick={() => { setStatusFilter("All"); setDateFrom(""); setDateTo(""); }} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
            Search
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Promoter</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Request Time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{w.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">{w.promoter.avatar}</div>
                      {w.promoter.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">${w.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{w.method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{w.account}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[w.status]}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{w.requestTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {w.status === "Pending" && (
                        <>
                          <button className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-500">Approve</button>
                          <button className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500">Reject</button>
                        </>
                      )}
                      {w.status === "Processing" && (
                        <button className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500">Mark Paid</button>
                      )}
                      {w.status === "Paid" && (
                        <button className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500">Download Receipt</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
