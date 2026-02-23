"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";

interface CoinRecord {
  _id: string;
  userId: { _id: string; email: string; nickname: string; avatar?: string } | null;
  episodeId: {
    _id: string;
    title: string;
    episodeNumber: number;
    dramaId: { _id: string; title: string } | null;
    unlockPrice: number;
  } | null;
  price: number;
  createdAt: string;
}

const PER_PAGE = 10;

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getInitials(name: string) {
  if (!name || name.length === 0) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function CoinRecordsPage() {
  const [records, setRecords] = useState<CoinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: PER_PAGE };
      if (appliedSearch) params.search = appliedSearch;
      const res: any = await adminApi.getCoinRecords(params);
      if (res?.success && res.data) {
        setRecords(res.data.records || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setAppliedSearch(search); setPage(1); };
  const handleReset = () => { setSearch(""); setAppliedSearch(""); setPage(1); };

  const totalCoins = records.reduce((s, r) => s + (r.price || 0), 0);

  const exportCSV = () => {
    const header = "Record ID,User,Email,Drama,Episode,Coins Spent,Time\n";
    const rows = records.map((r) =>
      `${r._id},${r.userId?.nickname || ""},${r.userId?.email || ""},${r.episodeId?.dramaId?.title || "-"},Ep ${r.episodeId?.episodeNumber || "-"},${r.price},${formatDate(r.createdAt)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "coin-records.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-100">
      <h1 className="mb-6 text-2xl font-bold text-white">Coin Consumption Records</h1>

      {/* Filter Bar */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search user name or email..."
              className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button onClick={handleSearch} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">Search</button>
          <button onClick={handleReset} className="rounded-lg border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/30">Reset</button>
        </div>
      </div>

      {/* Summary + Export */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.38 5.38 0 01-.491-.921H10a1 1 0 100-2H8.003a7.395 7.395 0 010-1H10a1 1 0 100-2H8.245c.155-.347.335-.665.491-.921z" />
          </svg>
          <span className="text-sm text-gray-400">Page Total:</span>
          <span className="text-lg font-bold text-yellow-400">{totalCoins.toLocaleString()} coins</span>
          <span className="ml-4 rounded-full bg-indigo-600/20 px-3 py-0.5 text-xs font-medium text-indigo-400">Total Records: {total}</span>
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Drama</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Coins Spent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No records found</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                          {getInitials(r.userId?.nickname || "")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{r.userId?.nickname || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{r.userId?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200">{r.episodeId?.dramaId?.title || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {r.episodeId ? `Ep ${r.episodeId.episodeNumber} - ${r.episodeId.title}` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.38 5.38 0 01-.491-.921H10a1 1 0 100-2H8.003a7.395 7.395 0 010-1H10a1 1 0 100-2H8.245c.155-.347.335-.665.491-.921z" />
                        </svg>
                        <span className="text-sm font-semibold text-yellow-400">{r.price}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">{formatDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-700/50 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing {total > 0 ? (page - 1) * PER_PAGE + 1 : 0} to {Math.min(page * PER_PAGE, total)} of {total} records
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-700/30 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${page === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-700/30"}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-700/30 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
