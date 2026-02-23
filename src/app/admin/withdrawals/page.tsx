"use client";

import { useState, useMemo, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import ReviewWithdrawalModal from "@/components/admin/ReviewWithdrawalModal";
import ConfirmPaymentModal from "@/components/admin/ConfirmPaymentModal";

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "Pending" | "Approved" | "Processing" | "Paid" | "Rejected";

interface Withdrawal {
  id: string;
  promoter: { name: string; avatar: string; id: string; level: string; totalCommission: number; availableBalance: number };
  amount: number;
  method: string;
  account: string;
  bankName: string;
  bankAccountName: string;
  routingNumber: string;
  bankAddress: string;
  status: Status;
  requestTime: string;
}

// ── Status badge colours ───────────────────────────────────────────────────────
const statusBadge: Record<Status, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400",
  Approved: "bg-green-500/20 text-green-400",
  Processing: "bg-blue-500/20 text-blue-400",
  Paid: "bg-green-500/20 text-green-400",
  Rejected: "bg-red-500/20 text-red-400",
};

const PAGE_SIZES = [10, 20, 50];

// ── Helpers ────────────────────────────────────────────────────────────────────
function exportCSV(data: Withdrawal[]) {
  const header = "Request ID,Promoter,Amount,Payment Method,Account,Status,Request Time\n";
  const rows = data.map((w) =>
    `${w.id},${w.promoter.name},${w.amount},${w.method},${w.account},${w.status},${w.requestTime}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "withdrawals.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Review");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Withdrawal | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Withdrawal | null>(null);

  // Fetch from API, fall back to mock
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await adminApi.getWithdrawals();
        if (!cancelled && res?.data) {
          const list = res.data.withdrawals ?? res.data ?? [];
          setWithdrawals(
            list.map((w: any) => ({
              id: w.id || w._id,
              promoter: {
                name: w.promoterName || w.promoter?.name || "Unknown",
                avatar: (w.promoterName || w.promoter?.name || "UN").split(" ").map((n: string) => n[0]).join(""),
                id: w.promoterId || w.promoter?.id || "",
                level: w.promoterLevel || "Standard",
                totalCommission: w.promoterTotalRevenue || 0,
                availableBalance: w.promoterAvailableBalance || 0,
              },
              amount: w.amount,
              method: w.method || w.paymentMethod || "PayPal",
              account: w.account || w.bankAccount || "****",
              bankName: w.bankName || "",
              bankAccountName: w.bankAccountName || w.promoterName || "",
              routingNumber: w.routingNumber || "",
              bankAddress: w.bankAddress || "",
              status: w.status?.charAt(0).toUpperCase() + w.status?.slice(1) || "Pending",
              requestTime: new Date(w.createdAt || w.requestTime).toLocaleString(),
            }))
          );
        }
      } catch {
        if (!cancelled) setWithdrawals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtered data
  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      if (search) {
        const q = search.toLowerCase();
        if (!w.id.toLowerCase().includes(q) && !w.promoter.name.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "All" && statusFilter !== "Pending Review") {
        if (w.status !== statusFilter) return false;
      }
      if (statusFilter === "Pending Review" && w.status !== "Pending") return false;
      if (dateFrom && w.requestTime < dateFrom) return false;
      if (dateTo && w.requestTime > dateTo + " 23:59") return false;
      return true;
    });
  }, [withdrawals, search, statusFilter, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(() => {
    const pending = withdrawals.filter((w) => w.status === "Pending").length;
    const processingItems = withdrawals.filter((w) => w.status === "Processing" || w.status === "Approved");
    const processingAmount = processingItems.reduce((s, w) => s + w.amount, 0);
    const paidAmount = withdrawals.filter((w) => w.status === "Paid").reduce((s, w) => s + w.amount, 0);
    const rejected = withdrawals.filter((w) => w.status === "Rejected").length;
    return { pending, processingAmount, processingCount: processingItems.length, paidAmount, rejected };
  }, [withdrawals]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }, [totalPages]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#0f0f17] p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Withdrawal Management</h1>
          <p className="mt-1 text-sm text-gray-400">Audit, approve, and track fund requests by promoters.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSV(filtered)}
            className="rounded-lg border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#1a1a2e]"
          >
            Export CSV
          </button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
            Manual Payout
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-700/50 border-l-4 border-l-amber-500 bg-[#13131d] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold text-gray-200">{stats.pending}</p>
              <p className="mt-1 text-xs text-gray-500">Require Action</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-[#13131d] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Processing Amount</p>
              <p className="mt-1 text-2xl font-bold text-gray-200">${stats.processingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-gray-500">{stats.processingCount} active payouts</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-[#13131d] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Paid This Month</p>
              <p className="mt-1 text-2xl font-bold text-gray-200">${stats.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-green-400">+24% since last month</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-[#13131d] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Rejected</p>
              <p className="mt-1 text-2xl font-bold text-gray-200">{stats.rejected}</p>
              <p className="mt-1 text-xs text-gray-500">This month</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-700/50 bg-[#13131d] p-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search by Request ID or Promoter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-10 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
        >
          <option>Pending Review</option>
          <option>All</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Paid</option>
          <option>Rejected</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
        />
        <span className="text-gray-500 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => setCurrentPage(1)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Apply Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700/50 bg-[#13131d]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700/50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">Promoter Info</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment Method</th>
              <th className="px-4 py-3">Account Info</th>
              <th className="px-4 py-3">Request Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No withdrawal requests found.</td></tr>
            ) : (
              paginated.map((w) => (
                <tr key={w.id} className="border-b border-gray-700/50 transition hover:bg-[#1a1a2e]">
                  <td className="px-4 py-3 font-medium text-gray-200">{w.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">{w.promoter.avatar}</div>
                      <span className="text-gray-200">{w.promoter.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-200">${w.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-gray-400">{w.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{w.account}</td>
                  <td className="px-4 py-3 text-gray-500">{w.requestTime}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[w.status]}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {w.status === "Pending" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setReviewTarget(w); setReviewModalOpen(true); }}
                          title="Review"
                          className="rounded-lg p-1.5 text-indigo-400 transition hover:bg-indigo-500/10"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </button>
                      </div>
                    ) : w.status === "Approved" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setPaymentTarget(w); setPaymentModalOpen(true); }}
                          title="Confirm Payment"
                          className="rounded-lg p-1.5 text-green-400 transition hover:bg-green-500/10"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </button>
                      </div>
                    ) : (
                      <button title="View Details" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700/50 hover:text-gray-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p className="text-gray-500">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} results
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-gray-400 transition hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setCurrentPage(n)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${n === currentPage ? "bg-indigo-600 text-white" : "border border-gray-700/50 text-gray-400 hover:bg-[#1a1a2e]"}`}
            >
              {n}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-gray-400 transition hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-2 py-1.5 text-sm text-gray-400 outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} per page</option>
            ))}
          </select>
        </div>
      </div>
      {/* Review Withdrawal Modal */}
      <ReviewWithdrawalModal
        open={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setReviewTarget(null); }}
        onConfirm={(data) => {
          if (reviewTarget) {
            setWithdrawals((prev) =>
              prev.map((w) =>
                w.id === reviewTarget.id
                  ? { ...w, status: (data.action === "approve" ? "Approved" : "Rejected") as Status }
                  : w
              )
            );
          }
          setReviewModalOpen(false);
          setReviewTarget(null);
        }}
        withdrawal={reviewTarget ? {
          id: reviewTarget.id,
          amount: reviewTarget.amount,
          promoterName: reviewTarget.promoter.name,
          promoterInitials: reviewTarget.promoter.avatar,
          promoterId: reviewTarget.promoter.id,
          promoterLevel: reviewTarget.promoter.level,
          totalCommission: reviewTarget.promoter.totalCommission,
          availableBalance: reviewTarget.promoter.availableBalance,
          bankName: reviewTarget.bankName,
          bankAccountName: reviewTarget.bankAccountName,
          bankAccount: reviewTarget.account,
          routingNumber: reviewTarget.routingNumber,
          bankAddress: reviewTarget.bankAddress,
          requestDate: reviewTarget.requestTime,
        } : null}
      />

      {/* Confirm Payment Modal */}
      <ConfirmPaymentModal
        open={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPaymentTarget(null); }}
        onConfirm={() => {
          if (paymentTarget) {
            setWithdrawals((prev) =>
              prev.map((w) =>
                w.id === paymentTarget.id ? { ...w, status: "Paid" as Status } : w
              )
            );
          }
          setPaymentModalOpen(false);
          setPaymentTarget(null);
        }}
        withdrawal={paymentTarget ? {
          id: paymentTarget.id,
          amount: paymentTarget.amount,
          recipientName: paymentTarget.promoter.name,
          recipientId: paymentTarget.promoter.id,
          method: paymentTarget.method,
          account: paymentTarget.account,
          bankName: paymentTarget.bankName,
        } : null}
      />
    </div>
  );
}
