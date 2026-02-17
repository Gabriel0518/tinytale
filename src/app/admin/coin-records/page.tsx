"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type RecordType = "episode_unlock" | "vip_purchase" | "gift";

interface CoinRecord {
  id: string;
  userName: string;
  userAvatar: string;
  dramaTitle: string;
  dramaThumbnail: string;
  episode: number;
  coins: number;
  type: RecordType;
  time: string;
}

const mockData: CoinRecord[] = [
  { id: "CR001", userName: "Alice Wang", userAvatar: "A", dramaTitle: "Love in Seoul", dramaThumbnail: "LS", episode: 12, coins: 30, type: "episode_unlock", time: "2026-02-17 14:23" },
  { id: "CR002", userName: "Bob Chen", userAvatar: "B", dramaTitle: "Dark Throne", dramaThumbnail: "DT", episode: 5, coins: 200, type: "vip_purchase", time: "2026-02-17 13:10" },
  { id: "CR003", userName: "Carol Li", userAvatar: "C", dramaTitle: "Sweet Trap", dramaThumbnail: "ST", episode: 8, coins: 50, type: "gift", time: "2026-02-17 11:45" },
  { id: "CR004", userName: "David Kim", userAvatar: "D", dramaTitle: "Love in Seoul", dramaThumbnail: "LS", episode: 13, coins: 30, type: "episode_unlock", time: "2026-02-16 22:30" },
  { id: "CR005", userName: "Eva Zhang", userAvatar: "E", dramaTitle: "Night City", dramaThumbnail: "NC", episode: 3, coins: 200, type: "vip_purchase", time: "2026-02-16 19:15" },
  { id: "CR006", userName: "Frank Wu", userAvatar: "F", dramaTitle: "Dark Throne", dramaThumbnail: "DT", episode: 20, coins: 30, type: "episode_unlock", time: "2026-02-16 17:00" },
  { id: "CR007", userName: "Grace Liu", userAvatar: "G", dramaTitle: "Sweet Trap", dramaThumbnail: "ST", episode: 15, coins: 100, type: "gift", time: "2026-02-15 09:20" },
  { id: "CR008", userName: "Alice Wang", userAvatar: "A", dramaTitle: "Night City", dramaThumbnail: "NC", episode: 7, coins: 30, type: "episode_unlock", time: "2026-02-15 08:05" },
];

const typeBadge: Record<RecordType, { label: string; cls: string }> = {
  episode_unlock: { label: "Episode Unlock", cls: "bg-blue-100 text-blue-700" },
  vip_purchase: { label: "VIP Purchase", cls: "bg-purple-100 text-purple-700" },
  gift: { label: "Gift", cls: "bg-pink-100 text-pink-700" },
};

export default function CoinRecordsPage() {
  const [userSearch, setUserSearch] = useState("");
  const [dramaSearch, setDramaSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = mockData.filter((r) => {
    if (userSearch && !r.userName.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (dramaSearch && !r.dramaTitle.toLowerCase().includes(dramaSearch.toLowerCase())) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (dateFrom && r.time < dateFrom) return false;
    if (dateTo && r.time > dateTo + " 23:59") return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalCoins = mockData.reduce((s, r) => s + r.coins, 0);
  const todayCoins = mockData.filter((r) => r.time.startsWith("2026-02-17")).reduce((s, r) => s + r.coins, 0);
  const uniqueUsers = new Set(mockData.map((r) => r.userName)).size;
  const topSpender = mockData.reduce<Record<string, number>>((acc, r) => { acc[r.userName] = (acc[r.userName] || 0) + r.coins; return acc; }, {});
  const topName = Object.entries(topSpender).sort((a, b) => b[1] - a[1])[0];

  const reset = () => { setUserSearch(""); setDramaSearch(""); setTypeFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); };

  const exportCSV = () => {
    const header = "Record ID,User,Drama,Episode,Coins,Type,Time\n";
    const rows = filtered.map((r) => `${r.id},${r.userName},${r.dramaTitle},${r.episode},${r.coins},${typeBadge[r.type].label},${r.time}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "coin-records.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: "Total Consumed", value: `${totalCoins.toLocaleString()} coins`, color: "text-yellow-600" },
    { label: "Today's Consumed", value: `${todayCoins.toLocaleString()} coins`, color: "text-green-600" },
    { label: "Avg per User", value: `${Math.round(totalCoins / uniqueUsers)} coins`, color: "text-blue-600" },
    { label: "Top Spender", value: topName ? `${topName[0]} (${topName[1]})` : "-", color: "text-purple-600" },
  ];

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Coin Consumption Records</h1>
          <button onClick={exportCSV} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Export CSV</button>
        </div>

        {/* Summary Ribbon */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <input value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setPage(1); }} placeholder="Search user..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <input value={dramaSearch} onChange={(e) => { setDramaSearch(e.target.value); setPage(1); }} placeholder="Search drama..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
            <option value="all">All Types</option>
            <option value="episode_unlock">Episode Unlock</option>
            <option value="vip_purchase">VIP Purchase</option>
            <option value="gift">Gift</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <button onClick={() => setPage(1)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
          <button onClick={reset} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-300">Reset</button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Record ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Drama</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Coins</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paged.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No records found</td></tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{r.userAvatar}</div>
                        <span className="text-sm font-medium text-gray-900">{r.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-12 items-center justify-center rounded bg-gray-200 text-[10px] font-bold text-gray-500">{r.dramaThumbnail}</div>
                        <span className="text-sm text-gray-900">{r.dramaTitle}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">Ep {r.episode}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-yellow-500">{r.coins}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[r.type].cls}`}>{typeBadge[r.type].label}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{r.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-500">{filtered.length} record(s) total</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`rounded px-3 py-1 text-sm ${page === i + 1 ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
