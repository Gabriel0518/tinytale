"use client";

import { useState } from "react";
import AdminLayout from "../layout";

const rankingTypes = [
  { title: "Hot Rankings", frequency: "Updated every 1 hour", lastUpdate: "2026-02-17 14:00" },
  { title: "New Releases", frequency: "Updated every 6 hours", lastUpdate: "2026-02-17 12:00" },
  { title: "Trending", frequency: "Updated every 30 min", lastUpdate: "2026-02-17 14:30" },
];

type Status = "Active" | "Scheduled" | "Expired";

const mockData: {
  id: number; position: number; title: string; thumb: string;
  category: string; status: Status; effectiveDate: string; expiryDate: string;
}[] = [
  { id: 1, position: 1, title: "Love in the Shadows", thumb: "LS", category: "Romance", status: "Active", effectiveDate: "2026-01-15", expiryDate: "2026-03-15" },
  { id: 2, position: 2, title: "CEO's Secret Wife", thumb: "CS", category: "Romance", status: "Active", effectiveDate: "2026-02-01", expiryDate: "2026-04-01" },
  { id: 3, position: 3, title: "Dragon's Heir", thumb: "DH", category: "Fantasy", status: "Scheduled", effectiveDate: "2026-03-01", expiryDate: "2026-05-01" },
  { id: 4, position: 4, title: "Revenge of the Bride", thumb: "RB", category: "Thriller", status: "Active", effectiveDate: "2026-01-20", expiryDate: "2026-03-20" },
  { id: 5, position: 5, title: "My Billionaire Ex", thumb: "MB", category: "Romance", status: "Expired", effectiveDate: "2025-11-01", expiryDate: "2026-01-31" },
  { id: 6, position: 6, title: "Werewolf Academy", thumb: "WA", category: "Fantasy", status: "Scheduled", effectiveDate: "2026-03-10", expiryDate: "2026-06-10" },
];

const statusStyles: Record<Status, string> = {
  Active: "bg-green-100 text-green-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Expired: "bg-gray-100 text-gray-500",
};

export default function AdminRankingsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Rankings &amp; Curation</h1>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Add Recommendation
          </button>
        </div>

        {/* Ranking Type Cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {rankingTypes.map((r) => (
            <div key={r.title} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{r.frequency}</p>
              <p className="mt-2 text-xs text-gray-400">Last update: {r.lastUpdate}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Data Table */}
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Drama</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Effective Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">#{item.position}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-gray-200 text-xs font-bold text-gray-600">
                        {item.thumb}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.category}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.effectiveDate}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.expiryDate}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button className="mr-3 text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Remove</button>
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
