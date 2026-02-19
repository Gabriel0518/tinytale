"use client";

import { useState, useMemo, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";

type ConsumptionType = "episode_unlock" | "vip_purchase" | "gift" | "subscription";

interface CoinRecord {
  id: string;
  userName: string;
  userId: string;
  type: ConsumptionType;
  dramaTitle: string;
  episodeLabel: string;
  coins: number;
  time: string;
}

const MOCK_DATA: CoinRecord[] = [
  { id: "CR-20231024-001", userName: "Sarah Jenkins", userId: "88293", type: "episode_unlock", dramaTitle: "Love in Seoul", episodeLabel: "Ep 12", coins: 30, time: "Oct 24, 2023 14:32" },
  { id: "CR-20231024-002", userName: "Michael Chen", userId: "77312", type: "vip_purchase", dramaTitle: "-", episodeLabel: "-", coins: 200, time: "Oct 24, 2023 13:15" },
  { id: "CR-20231024-003", userName: "Emma Wilson", userId: "55218", type: "gift", dramaTitle: "Dark Secrets", episodeLabel: "Ep 5", coins: 50, time: "Oct 24, 2023 12:45" },
  { id: "CR-20231023-004", userName: "James Smith", userId: "44102", type: "episode_unlock", dramaTitle: "CEO's Heart", episodeLabel: "Ep 8", coins: 30, time: "Oct 23, 2023 22:10" },
  { id: "CR-20231023-005", userName: "Olivia Brown", userId: "33205", type: "episode_unlock", dramaTitle: "Midnight Romance", episodeLabel: "Ep 3", coins: 30, time: "Oct 23, 2023 19:30" },
  { id: "CR-20231023-006", userName: "Liam Garcia", userId: "22108", type: "subscription", dramaTitle: "Monthly Plan", episodeLabel: "-", coins: 0, time: "Oct 23, 2023 18:00" },
  { id: "CR-20231022-007", userName: "Sophia Martinez", userId: "11305", type: "episode_unlock", dramaTitle: "Love in Seoul", episodeLabel: "Ep 11", coins: 30, time: "Oct 22, 2023 15:20" },
  { id: "CR-20231022-008", userName: "Noah Davis", userId: "99401", type: "gift", dramaTitle: "Night City", episodeLabel: "Ep 7", coins: 100, time: "Oct 22, 2023 14:05" },
  { id: "CR-20231022-009", userName: "Sarah Jenkins", userId: "88293", type: "episode_unlock", dramaTitle: "Dark Secrets", episodeLabel: "Ep 6", coins: 30, time: "Oct 22, 2023 11:30" },
  { id: "CR-20231021-010", userName: "Michael Chen", userId: "77312", type: "vip_purchase", dramaTitle: "-", episodeLabel: "-", coins: 200, time: "Oct 21, 2023 09:15" },
];

const TYPE_CONFIG: Record<ConsumptionType, { label: string; cls: string }> = {
  episode_unlock: { label: "Episode Unlock", cls: "bg-blue-500/20 text-blue-400" },
  vip_purchase: { label: "VIP Purchase", cls: "bg-purple-500/20 text-purple-400" },
  gift: { label: "Gift", cls: "bg-pink-500/20 text-pink-400" },
  subscription: { label: "Subscription", cls: "bg-green-500/20 text-green-400" },
};

const DRAMA_OPTIONS = ["All Dramas", "Love in Seoul", "Dark Secrets", "CEO's Heart", "Midnight Romance", "Night City"];
const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "episode_unlock", label: "Episode Unlock" },
  { value: "vip_purchase", label: "VIP Purchase" },
  { value: "gift", label: "Gift" },
  { value: "subscription", label: "Subscription" },
];

export default function CoinRecordsPage() {
  const [records, setRecords] = useState<CoinRecord[]>(MOCK_DATA);
  const [userSearch, setUserSearch] = useState("");
  const [dramaFilter, setDramaFilter] = useState("All Dramas");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    adminApi
      .getTransactions()
      .then((res: any) => {
        if (res?.data?.length) setRecords(res.data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (userSearch) {
        const q = userSearch.toLowerCase();
        if (!r.userName.toLowerCase().includes(q) && !r.userId.includes(q)) return false;
      }
      if (dramaFilter !== "All Dramas" && r.dramaTitle !== dramaFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (dateFrom && r.time < dateFrom) return false;
      if (dateTo && r.time > dateTo) return false;
      return true;
    });
  }, [records, userSearch, dramaFilter, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalCoins = useMemo(() => filtered.reduce((s, r) => s + r.coins, 0), [filtered]);

  const handleReset = () => {
    setUserSearch("");
    setDramaFilter("All Dramas");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const exportCSV = () => {
    const header = "Record ID,User,User ID,Type,Drama,Episode,Coins Spent,Time\n";
    const rows = filtered
      .map((r) => `${r.id},${r.userName},${r.userId},${TYPE_CONFIG[r.type].label},${r.dramaTitle},${r.episodeLabel},${r.coins},${r.time}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coin-consumption-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const startRecord = (page - 1) * perPage + 1;
  const endRecord = Math.min(page * perPage, filtered.length);

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-100">
      <h1 className="mb-6 text-2xl font-bold text-white">Consumption Records</h1>

      {/* Filter Bar */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setPage(1); }}
              placeholder="Search User..."
              className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <select
            value={dramaFilter}
            onChange={(e) => { setDramaFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DRAMA_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <span className="text-gray-500">to</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button onClick={() => setPage(1)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">Filter</button>
          <button onClick={handleReset} className="rounded-lg border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/30">Reset</button>
        </div>
      </div>

      {/* Summary + Export */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.38 5.38 0 01-.491-.921H10a1 1 0 100-2H8.003a7.395 7.395 0 010-1H10a1 1 0 100-2H8.245c.155-.347.335-.665.491-.921z" />
          </svg>
          <span className="text-sm text-gray-400">Total Consumption (Period):</span>
          <span className="text-lg font-bold text-yellow-400">{totalCoins.toLocaleString()}</span>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Record ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Content</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Coins Spent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No records found</td></tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-400">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                          {getInitials(r.userName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{r.userName}</div>
                          <div className="text-xs text-gray-500">#{r.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CONFIG[r.type].cls}`}>
                        {TYPE_CONFIG[r.type].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-200">{r.dramaTitle}</div>
                      {r.episodeLabel !== "-" && <div className="text-xs text-gray-500">{r.episodeLabel}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.38 5.38 0 01-.491-.921H10a1 1 0 100-2H8.003a7.395 7.395 0 010-1H10a1 1 0 100-2H8.245c.155-.347.335-.665.491-.921z" />
                        </svg>
                        <span className="text-sm font-semibold text-yellow-400">{r.coins}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">{r.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-700/50 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing {filtered.length > 0 ? startRecord : 0} to {endRecord} of {filtered.length} records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-700/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  page === i + 1
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-700/30"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-700/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
