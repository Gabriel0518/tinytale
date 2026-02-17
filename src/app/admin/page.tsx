"use client";

import { useEffect, useState } from "react";
import AdminLayout from "./layout";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

// Mock token for demo - in real app would come from auth
const MOCK_TOKEN = "demo-token";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7003'}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${MOCK_TOKEN}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use mock data on error
        setStats({
          totalDramas: 156,
          totalUsers: 12345,
          totalRevenue: 45678,
          newUsersThisWeek: 234,
          totalTransactions: 5678,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Dramas", value: stats?.totalDramas || 0, change: "+12%", color: "text-blue-600" },
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() || 0, change: "+8%", color: "text-green-600" },
    { label: "Total Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, change: "+23%", color: "text-yellow-600" },
    { label: "New Users (7d)", value: stats?.newUsersThisWeek || 0, change: "+15%", color: "text-purple-600" },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-4 h-8 w-32 rounded bg-gray-200" />
              </div>
            ))
          ) : (
            statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                  <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <a href="/admin/dramas" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Dramas</h3>
                <p className="text-sm text-gray-500">Add, edit, or remove dramas</p>
              </div>
            </div>
          </a>

          <a href="/admin/users" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-500">View and manage user accounts</p>
              </div>
            </div>
          </a>

          <a href="/admin/finance" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Transactions</h3>
                <p className="text-sm text-gray-500">Check payment history</p>
              </div>
            </div>
          </a>
        </div>

        {/* Charts */}
        <div className="mb-8">
          <DashboardCharts />
        </div>

        {/* Info Card */}
        <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Welcome to TinyTale Admin</h3>
              <p className="mt-1 text-red-100">Manage your short drama platform from here</p>
            </div>
            <div className="hidden md:block">
              <svg className="h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
