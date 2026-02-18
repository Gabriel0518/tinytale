"use client";

import { useEffect, useState, useRef } from "react";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7002";

interface StatCard {
  label: string;
  value: string;
  change: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("admin_token") || "demo-token";
        const res = await fetch(`${ADMIN_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
          return;
        }
      } catch {
        // fallback
      }
      setStats({
        activeUsers: 8530,
        recharge: 3420,
        subscriptions: 156,
        plays: 45200,
        coinUsage: 280000,
      });
      setLoading(false);
    };
    fetchStats().finally(() => setLoading(false));
  }, []);

  const statCards: StatCard[] = [
    {
      label: "ACTIVE USERS",
      value: (stats?.activeUsers || 8530).toLocaleString(),
      change: 4.2,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
    },
    {
      label: "RECHARGE",
      value: "$" + (stats?.recharge || 3420).toLocaleString(),
      change: -2.1,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    {
      label: "SUBSCRIPTIONS",
      value: (stats?.subscriptions || 156).toLocaleString(),
      change: 8.4,
      icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      label: "PLAYS",
      value: stats?.plays ? (stats.plays >= 1000 ? (stats.plays / 1000).toFixed(1) + "K" : stats.plays.toString()) : "45.2K",
      change: 15.3,
      icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      label: "COIN USAGE",
      value: stats?.coinUsage ? (stats.coinUsage >= 1000 ? (stats.coinUsage / 1000).toFixed(0) + "K" : stats.coinUsage.toString()) : "280K",
      change: -0.8,
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
    },
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const userTrendsData = {
    labels: days,
    datasets: [
      {
        label: "New",
        data: [120, 190, 150, 220, 180, 250, 210],
        borderColor: "#818cf8",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#818cf8",
      },
      {
        label: "Active",
        data: [300, 420, 380, 500, 460, 520, 490],
        borderColor: "#34d399",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#34d399",
      },
    ],
  };

  const revenueTrendsData = {
    labels: days,
    datasets: [
      {
        label: "Recharge",
        data: [800, 1200, 900, 1400, 1100, 1600, 1300],
        borderColor: "#818cf8",
        backgroundColor: "rgba(129,140,248,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "Sub",
        data: [200, 350, 280, 420, 380, 500, 450],
        borderColor: "#f472b6",
        backgroundColor: "rgba(244,114,182,0.1)",
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

  const topDramasData = {
    labels: ["Love in Seoul", "Dark Secret", "City Lights", "Ocean Heart", "Night Run"],
    datasets: [
      {
        data: [4500, 3800, 3200, 2800, 2100],
        backgroundColor: ["#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6"],
        borderRadius: 4,
        barThickness: 18,
      },
    ],
  };

  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b7280", font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
    },
  };

  const acquisitionData = {
    labels: ["Organic", "Referral", "Social", "Paid"],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ["#818cf8", "#34d399", "#fbbf24", "#f87171"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#9ca3af", boxWidth: 10, usePointStyle: true, pointStyle: "circle", padding: 12, font: { size: 11 } },
      },
    },
  };

  return (
    <div>
      {/* Subtitle */}
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
                <p className="mt-1 text-xs text-gray-500">
                  <span className={card.change >= 0 ? "text-green-400" : "text-red-400"}>
                    {card.change >= 0 ? "+" : ""}
                    {card.change}%
                  </span>{" "}
                  vs yesterday
                </p>
              </div>
            ))}
      </div>

      {/* Charts Row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* User Trends */}
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">User Trends</h3>
          <div className="h-64">
            <Line data={userTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue Trends</h3>
          <div className="h-64">
            <Line data={revenueTrendsData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Dramas */}
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Top Dramas</h3>
            <a href="/admin/dramas" className="text-xs text-indigo-400 hover:text-indigo-300">
              View All
            </a>
          </div>
          <div className="h-64">
            <Bar data={topDramasData} options={barOptions} />
          </div>
        </div>

        {/* User Acquisition */}
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">User Acquisition</h3>
          <div className="flex h-64 items-center justify-center">
            <div className="h-56 w-56">
              <Doughnut data={acquisitionData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
