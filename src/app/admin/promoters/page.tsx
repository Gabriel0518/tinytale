"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "../layout";

type Level = "Standard" | "Pro" | "Elite";
type Status = "Active" | "Banned";

interface Promoter {
  id: string;
  name: string;
  avatar: string;
  level: Level;
  referredUsers: number;
  effectiveRecharges: number;
  totalCommission: number;
  withdrawn: number;
  pending: number;
  status: Status;
}

const mockPromoters: Promoter[] = [
  { id: "P001", name: "Alice Wang", avatar: "AW", level: "Elite", referredUsers: 342, effectiveRecharges: 218, totalCommission: 8640, withdrawn: 7200, pending: 1440, status: "Active" },
  { id: "P002", name: "Bob Chen", avatar: "BC", level: "Pro", referredUsers: 185, effectiveRecharges: 97, totalCommission: 3820, withdrawn: 3000, pending: 820, status: "Active" },
  { id: "P003", name: "Carol Davis", avatar: "CD", level: "Standard", referredUsers: 46, effectiveRecharges: 21, totalCommission: 630, withdrawn: 500, pending: 130, status: "Active" },
  { id: "P004", name: "David Kim", avatar: "DK", level: "Pro", referredUsers: 210, effectiveRecharges: 134, totalCommission: 5360, withdrawn: 4800, pending: 560, status: "Banned" },
  { id: "P005", name: "Eva Martinez", avatar: "EM", level: "Elite", referredUsers: 520, effectiveRecharges: 389, totalCommission: 15560, withdrawn: 14000, pending: 1560, status: "Active" },
  { id: "P006", name: "Frank Liu", avatar: "FL", level: "Standard", referredUsers: 28, effectiveRecharges: 9, totalCommission: 270, withdrawn: 200, pending: 70, status: "Active" },
];

const PAGE_SIZE = 5;

const levelBadge = (level: Level) => {
  const styles: Record<Level, string> = {
    Standard: "bg-gray-100 text-gray-700",
    Pro: "bg-blue-100 text-blue-700",
    Elite: "bg-purple-100 text-purple-700 ring-1 ring-yellow-400",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}>{level}</span>;
};

export default function PromoterManagementPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"All" | Level>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [page, setPage] = useState(1);

  const filtered = mockPromoters.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== "All" && p.level !== levelFilter) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Promoter Management</h1>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Export CSV</button>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value as "All" | Level); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="All">All Levels</option>
            <option value="Standard">Standard</option>
            <option value="Pro">Pro</option>
            <option value="Elite">Elite</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as "All" | Status); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Banned">Banned</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Level</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Referred</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Eff. Recharges</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Commission</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Withdrawn</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{p.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">{p.avatar}</div>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{levelBadge(p.level)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{p.referredUsers}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{p.effectiveRecharges}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">${p.totalCommission.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">${p.withdrawn.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">${p.pending.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`inline-block h-2 w-2 rounded-full ${p.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/promoters/${p.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
                      <button className="text-sm text-gray-600 hover:text-gray-900">Adjust Level</button>
                      <button className={`text-sm ${p.status === "Active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}>
                        {p.status === "Active" ? "Ban" : "Unban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No promoters found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`rounded-lg border px-3 py-1 ${page === i + 1 ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
