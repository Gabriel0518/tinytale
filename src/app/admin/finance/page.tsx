"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  recharge: { label: "Recharge", cls: "bg-green-500/15 text-green-400 border border-green-500/20" },
  vip: { label: "VIP", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
  unlock: { label: "Unlock", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  refund: { label: "Refund", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
  task_reward: { label: "Task Reward", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
  promotion: { label: "Promotion", cls: "bg-pink-500/15 text-pink-400 border border-pink-500/20" },
};

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-red-500/15 text-red-400",
  refunded: "bg-gray-500/15 text-gray-400",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function AdminFinancePage() {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await adminApi.getFinanceOverview();
        if (res?.success && res.data) {
          setTotalRevenue(res.data.totalRevenue || 0);
          setTotalTransactions(res.data.totalTransactions || 0);
          setTotalRefunds(res.data.totalRefunds || 0);
          setRecentTransactions(res.data.recentTransactions || []);
          setRevenueByType(res.data.revenueByType || []);
        }
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getRevenueForType = (type: string) => {
    const item = revenueByType.find((r: any) => r._id === type);
    return item?.total || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <h1 className="mb-8 text-2xl font-bold text-gray-200">Finance Overview</h1>
        <div className="text-center text-gray-500 py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      <h1 className="mb-8 text-2xl font-bold text-white">Finance Overview</h1>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-gray-500">Recharge + VIP</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Coin Recharges</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{formatCurrency(getRevenueForType('recharge'))}</p>
          <p className="mt-1 text-xs text-gray-500">Coin package purchases</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">VIP Subscriptions</p>
          <p className="mt-2 text-3xl font-bold text-purple-400">{formatCurrency(getRevenueForType('vip'))}</p>
          <p className="mt-1 text-xs text-gray-500">VIP plan revenue</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Refunds</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{formatCurrency(totalRefunds)}</p>
          <p className="mt-1 text-xs text-gray-500">{totalTransactions} total transactions</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
        <div className="border-b border-gray-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                recentTransactions.map((tx: any) => {
                  const user = tx.userId && typeof tx.userId === 'object' ? tx.userId : null;
                  const typeCfg = TYPE_BADGE[tx.type] || { label: tx.type, cls: "bg-gray-500/15 text-gray-400" };
                  return (
                    <tr key={tx._id} className="transition-colors hover:bg-[#1a1a2e]/60">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCfg.cls}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-200">
                        {formatCurrency(tx.amount || 0)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {user?.nickname || user?.email || "Unknown"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[tx.status] || "bg-gray-500/15 text-gray-400"}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
