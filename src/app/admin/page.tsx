"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { adminApi } from "@/lib/adminApi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

interface StatCard {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes]: any[] = await Promise.all([
          adminApi.getStats(),
          adminApi.getStatsCharts(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (chartsRes.success) setCharts(chartsRes.data);
      } catch {
        // API unavailable
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards: StatCard[] = [
    {
      label: "TOTAL USERS",
      value: (stats?.totalUsers || 0).toLocaleString(),
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
    },
    {
      label: "TOTAL REVENUE",
      value: "$" + (stats?.totalRevenue || 0).toLocaleString(),
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    {
      label: "TOTAL DRAMAS",
      value: (stats?.totalDramas || 0).toLocaleString(),
      icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      label: "TOTAL EPISODES",
      value: (stats?.totalEpisodes || 0).toLocaleString(),
      icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      label: "NEW USERS (7D)",
      value: (stats?.newUsersThisWeek || 0).toLocaleString(),
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
    },
  ];

  // Build chart data from API response
  const buildChartLabels = (data: any[]) =>
    data?.map((d: any) => {
      const date = new Date(d._id);
      return date.toLocaleDateString("en", { month: "short", day: "numeric" });
    }) || [];

  const usersByDay = charts?.usersByDay || [];
  const revenueByDay = charts?.revenueByDay || [];

  const userTrendsData = {
    labels: buildChartLabels(usersByDay),
    datasets: [
      {
        label: "New Users",
        data: usersByDay.map((d: any) => d.count),
        borderColor: "#818cf8",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#818cf8",
      },
    ],
  };

  const revenueTrendsData = {
    labels: buildChartLabels(revenueByDay),
    datasets: [
      {
        label: "Revenue",
        data: revenueByDay.map((d: any) => d.revenue),
        borderColor: "#818cf8",
        backgroundColor: "rgba(129,140,248,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: { color: "#9ca3af", boxWidth: 8, usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } },
      },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b7280", font: { size: 11 } } },
      y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b7280", font: { size: 11 } } },
    },
  };

  // Recent transactions
  const recentTxns = stats?.recentTransactions || [];

  return (
    <div>
      <p className="mb-5 text-sm text-gray-500">Real-time monitoring</p>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-[#1a1a2e] p-5">
                <div className="h-4 w-20 rounded bg-gray-700" />
                <div className="mt-3 h-7 w-24 rounded bg-gray-700" />
              </div>
            ))
          : statCards.map((card) => (
              <div key={card.label} className="rounded-xl bg-[#1a1a2e] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider text-gray-500">
                    {card.label}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                    <svg className={`h-4 w-4 ${card.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            ))}
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">New Users (7 Days)</h3>
          <div className="h-64">
            {usersByDay.length > 0 ? (
              <Line data={userTrendsData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No data yet</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue (7 Days)</h3>
          <div className="h-64">
            {revenueByDay.length > 0 ? (
              <Line data={revenueTrendsData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl bg-[#1a1a2e] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Recent Transactions</h3>
        {recentTxns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs text-gray-500">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((tx: any) => (
                  <tr key={tx._id} className="border-b border-gray-700/30">
                    <td className="py-3 text-gray-300">{tx.userId?.nickname || tx.userId?.email || "—"}</td>
                    <td className="py-3">
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">{tx.type}</span>
                    </td>
                    <td className="py-3 text-gray-300">${tx.amount?.toFixed(2) || "0.00"}</td>
                    <td className="py-3">
                      <span className={`text-xs ${tx.status === "completed" ? "text-green-400" : tx.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
