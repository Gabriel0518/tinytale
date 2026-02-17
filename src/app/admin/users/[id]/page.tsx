"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../layout";
import { adminApi } from "@/lib/adminApi";

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coinAdjust, setCoinAdjust] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res: any = await adminApi.getUser(id as string);
        setUser(res.data?.user || res.data);
      } catch (err) {
        console.error(err);
        // Mock data
        setUser({
          _id: id, nickname: "Test User", email: "test@example.com",
          coins: 500, role: "user", status: "active",
          vipStatus: "none", vipExpiry: null,
          createdAt: "2024-01-01T00:00:00Z",
          stats: { totalWatched: 45, totalSpent: 2500, favoriteCount: 12 },
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const handleCoinAdjust = async () => {
    if (!coinAdjust || !adjustReason) return;
    try {
      await adminApi.updateUser(id as string, {
        coinAdjustment: coinAdjust,
        reason: adjustReason,
      });
      setUser((prev: any) => ({ ...prev, coins: (prev.coins || 0) + coinAdjust }));
      setCoinAdjust(0);
      setAdjustReason("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBan = async () => {
    if (!confirm(`${user.status === "banned" ? "Unban" : "Ban"} this user?`)) return;
    const newStatus = user.status === "banned" ? "active" : "banned";
    try {
      await adminApi.updateUser(id as string, { status: newStatus });
      setUser((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) return <AdminLayout><p>User not found</p></AdminLayout>;

  return (
    <AdminLayout>
      <div>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">← Back to Users</Link>
        <h1 className="mt-1 mb-6 text-2xl font-bold text-gray-900">User Detail</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                {user.nickname?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{user.nickname}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-1 flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {user.status}
                  </span>
                  {user.vipStatus !== "none" && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">VIP</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
              <p>Role: {user.role}</p>
            </div>
            <button
              onClick={handleBan}
              className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium ${
                user.status === "banned"
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {user.status === "banned" ? "Unban User" : "Ban User"}
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Coin Balance</p>
              <p className="mt-1 text-3xl font-bold text-yellow-600">{user.coins || 0}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Watched</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{user.stats?.totalWatched || 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{user.stats?.totalSpent || 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Favorites</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{user.stats?.favoriteCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Coin Adjustment */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Adjust Coins</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={coinAdjust}
                  onChange={(e) => setCoinAdjust(Number(e.target.value))}
                  placeholder="Positive to add, negative to deduct"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation, Promotion"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCoinAdjust}
                disabled={!coinAdjust || !adjustReason}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
