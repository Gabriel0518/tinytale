"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../layout";
import { adminApi } from "@/lib/adminApi";

interface Order {
  _id: string;
  userId: string;
  user?: { nickname: string; email: string };
  type: "coin_recharge" | "episode_unlock" | "subscription";
  amount: number;
  coins?: number;
  status: "completed" | "pending" | "failed" | "refunded";
  paymentMethod?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = filter !== "all" ? { type: filter } : undefined;
        const res: any = await adminApi.getTransactions(params);
        setOrders(res.data?.transactions || res.data || []);
      } catch (err) {
        console.error(err);
        // Mock data
        setOrders([
          { _id: "o1", userId: "u1", user: { nickname: "Alice", email: "alice@test.com" }, type: "coin_recharge", amount: 9.99, coins: 1000, status: "completed", paymentMethod: "Stripe", createdAt: "2024-01-15T10:00:00Z" },
          { _id: "o2", userId: "u2", user: { nickname: "Bob", email: "bob@test.com" }, type: "subscription", amount: 24.99, status: "completed", paymentMethod: "Stripe", createdAt: "2024-01-14T08:00:00Z" },
          { _id: "o3", userId: "u3", user: { nickname: "Carol", email: "carol@test.com" }, type: "coin_recharge", amount: 4.99, coins: 500, status: "pending", paymentMethod: "PayPal", createdAt: "2024-01-13T15:00:00Z" },
          { _id: "o4", userId: "u1", user: { nickname: "Alice", email: "alice@test.com" }, type: "episode_unlock", amount: 0, coins: -100, status: "completed", createdAt: "2024-01-12T12:00:00Z" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [filter]);

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };

  const typeLabels: Record<string, string> = {
    coin_recharge: "Coin Recharge",
    episode_unlock: "Episode Unlock",
    subscription: "VIP Subscription",
  };

  const filters = [
    { id: "all", label: "All Orders" },
    { id: "coin_recharge", label: "Recharges" },
    { id: "episode_unlock", label: "Unlocks" },
    { id: "subscription", label: "Subscriptions" },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Order Management</h1>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === f.id ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-500">
                      {order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.user?.nickname || "Unknown"}</div>
                      <div className="text-xs text-gray-400">{order.user?.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {typeLabels[order.type] || order.type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {order.amount > 0 ? `$${order.amount.toFixed(2)}` : "-"}
                      {order.coins && <span className="ml-1 text-xs text-yellow-600">({order.coins > 0 ? "+" : ""}{order.coins} coins)</span>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
