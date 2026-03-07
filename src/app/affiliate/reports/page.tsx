export const dynamic = 'force-dynamic';
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

interface Commission {
  _id: string;
  date: string;
  dramaName: string;
  referralLink: string;
  userId: string;
  orderAmount: number;
  commissionRate: number;
  commission: number;
  status: "confirmed" | "pending" | "rejected";
}

interface CommissionsResponse {
  commissions: Commission[];
  total: number;
  totalCommission: number;
  commissionChange: number;
  page: number;
  totalPages: number;
}

const STATUS_TABS = ["all", "confirmed", "pending", "rejected"] as const;

function StatusBadge({ status }: { status: Commission["status"] }) {
  const styles: Record<string, string> = {
    confirmed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    rejected: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export default function CommissionReportsPage() {
  const { token } = useAuth();

  const [data, setData] = useState<CommissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 10;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit };
    if (status !== "all") params.status = status;
    if (search.trim()) params.search = search.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    promoterApi
      .getCommissions(token, params as Parameters<typeof promoterApi.getCommissions>[1])
      .then((res: { data: CommissionsResponse }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token, page, status, search, startDate, endDate]);

  const handleExport = () => {
    if (!token) return;
    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const url = promoterApi.exportCommissions(
      token,
      params as Parameters<typeof promoterApi.exportCommissions>[1]
    );
    window.open(url as unknown as string, "_blank");
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200 p-6 md:p-10">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6">Commission Reports</h1>

      {/* Total Commission Summary */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5 mb-6 max-w-sm">
        <p className="text-gray-400 text-sm mb-1">Total Commission</p>
        <p className="text-3xl font-bold">
          ${data?.totalCommission?.toFixed(2) ?? "0.00"}
        </p>
        {data?.commissionChange !== undefined && (
          <p
            className={`text-sm mt-1 ${
              data.commissionChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {data.commissionChange >= 0 ? "+" : ""}
            {data.commissionChange.toFixed(1)}% vs last period
          </p>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
        />
        <input
          type="text"
          placeholder="Search by drama name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500 min-w-[200px]"
        />
        <button
          onClick={handleExport}
          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatus(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === tab
                ? "bg-purple-600 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800/30">
              {["Date", "Drama Name", "Referral Link", "User ID", "Order Amount", "Rate", "Commission", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-gray-400 text-xs uppercase font-medium px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800/30 animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 bg-gray-700/40 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.commissions?.length ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-12">
                  No commission records found.
                </td>
              </tr>
            ) : (
              data.commissions.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-gray-800/30 hover:bg-[#1a1a2e]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(c.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">{c.dramaName}</td>
                  <td className="px-4 py-3 text-sm text-gray-400" title={c.referralLink}>
                    {truncate(c.referralLink, 24)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400" title={c.userId}>
                    {truncate(c.userId, 10)}
                  </td>
                  <td className="px-4 py-3 text-sm">${c.orderAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{c.commissionRate}%</td>
                  <td className="px-4 py-3 text-sm font-medium">${c.commission.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5">
        <p className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1.5 rounded-lg text-sm bg-[#1a1a2e] text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1.5 rounded-lg text-sm bg-[#1a1a2e] text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
