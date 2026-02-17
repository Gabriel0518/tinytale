"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type CampaignType = "Rebate" | "Flash Sale" | "First Recharge";
type CampaignStatus = "Active" | "Upcoming" | "Ended";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  targetTiers: string[];
}

const mockCampaigns: Campaign[] = [
  { id: "C001", name: "Spring Rebate Festival", type: "Rebate", status: "Active", startDate: "2026-02-10", endDate: "2026-03-10", targetTiers: ["VIP1", "VIP2", "VIP3"] },
  { id: "C002", name: "Weekend Flash Sale", type: "Flash Sale", status: "Active", startDate: "2026-02-15", endDate: "2026-02-17", targetTiers: ["VIP2", "VIP3"] },
  { id: "C003", name: "New User Welcome Bonus", type: "First Recharge", status: "Upcoming", startDate: "2026-03-01", endDate: "2026-03-31", targetTiers: ["VIP0"] },
  { id: "C004", name: "Valentine Coin Rebate", type: "Rebate", status: "Ended", startDate: "2026-02-01", endDate: "2026-02-14", targetTiers: ["VIP1", "VIP2"] },
  { id: "C005", name: "March Madness Flash", type: "Flash Sale", status: "Upcoming", startDate: "2026-03-15", endDate: "2026-03-20", targetTiers: ["VIP1", "VIP2", "VIP3"] },
];

const typeBadge: Record<CampaignType, string> = {
  Rebate: "bg-blue-100 text-blue-700",
  "Flash Sale": "bg-orange-100 text-orange-700",
  "First Recharge": "bg-green-100 text-green-700",
};

const statusBadge: Record<CampaignStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Upcoming: "bg-blue-100 text-blue-700",
  Ended: "bg-gray-100 text-gray-500",
};

const PAGE_SIZE = 3;

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = mockCampaigns.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (typeFilter !== "All" && c.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Campaign
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          >
            <option>All</option>
            <option>Active</option>
            <option>Upcoming</option>
            <option>Ended</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          >
            <option>All</option>
            <option>Rebate</option>
            <option>Flash Sale</option>
            <option>First Recharge</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Campaign Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date Range</th>
                  <th className="px-6 py-3">Target VIP Tiers</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{c.id}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge[c.type]}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[c.status]}`}>
                        {c.status === "Active" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-gray-600">{c.startDate} ~ {c.endDate}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.targetTiers.map((t) => (
                          <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-indigo-600 hover:underline">Edit</button>
                        {c.status === "Active" && (
                          <button className="text-xs text-red-600 hover:underline">End Early</button>
                        )}
                        {c.status === "Upcoming" && (
                          <button className="text-xs text-red-600 hover:underline">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400">No campaigns found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-xs text-gray-500">{filtered.length} campaign{filtered.length !== 1 ? "s" : ""} total</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`rounded px-2.5 py-1 text-xs ${page === i + 1 ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
