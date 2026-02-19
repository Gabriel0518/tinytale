"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface DashboardData {
  stats: {
    totalClicks: number;
    clicksChange: number;
    totalRegistrations: number;
    registrationsChange: number;
    paidUsers: number;
    paidUsersChange: number;
    totalCommission: number;
    commissionChange: number;
  };
  earningsTrend: {
    labels: string[];
    data: number[];
  };
  referralLink: string;
  notifications: { _id: string; title: string; message: string; createdAt: string }[];
}

function SkeletonCard() {
  return (
    <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5 animate-pulse">
      <div className="h-4 w-24 bg-gray-700/50 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-700/50 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-700/50 rounded" />
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  prefix = "",
}: {
  label: string;
  value: string;
  change: number;
  prefix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">
        {prefix}{value}
      </p>
      <p className={`text-xs mt-2 ${isPositive ? "text-green-400" : "text-red-400"}`}>
        {isPositive ? "+" : ""}{change.toFixed(1)}% vs last period
      </p>
    </div>
  );
}

export default function AffiliateDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<"7" | "30">("7");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    promoterApi
      .getDashboard(token)
      .then((res: any) => {
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateRange = `${monthNames[now.getMonth()]} 1 - ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const chartLabels = data?.earningsTrend?.labels ?? [];
  const chartValues = data?.earningsTrend?.data ?? [];
  const displayLabels = chartRange === "7" ? chartLabels.slice(-7) : chartLabels.slice(-30);
  const displayValues = chartRange === "7" ? chartValues.slice(-7) : chartValues.slice(-30);

  const chartData = {
    labels: displayLabels,
    datasets: [
      {
        label: "Earnings",
        data: displayValues,
        borderColor: "#8b5cf6",
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(139,92,246,0.1)";
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(139,92,246,0.3)");
          gradient.addColorStop(1, "rgba(139,92,246,0.0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#8b5cf6",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#e5e7eb",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(75,85,99,0.2)" },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(75,85,99,0.2)" },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (val: any) => `$${val}`,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-sm text-gray-400">{dateRange}</span>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Clicks"
            value={data.stats.totalClicks.toLocaleString()}
            change={data.stats.clicksChange}
          />
          <StatCard
            label="Total Registrations"
            value={data.stats.totalRegistrations.toLocaleString()}
            change={data.stats.registrationsChange}
          />
          <StatCard
            label="Paid Users"
            value={data.stats.paidUsers.toLocaleString()}
            change={data.stats.paidUsersChange}
          />
          <StatCard
            label="Total Commission"
            value={data.stats.totalCommission.toFixed(2)}
            change={data.stats.commissionChange}
            prefix="$"
          />
        </div>
      ) : null}

      {/* Earnings Trend */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Earnings Trend</h2>
          <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1">
            <button
              onClick={() => setChartRange("7")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                chartRange === "7"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setChartRange("30")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                chartRange === "30"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
        {loading ? (
          <div className="h-64 bg-gray-700/20 rounded animate-pulse" />
        ) : (
          <div className="h-64">
            <Line data={chartData} options={chartOptions as any} />
          </div>
        )}
      </div>

      {/* Quick Link & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Link */}
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Quick Link</h2>
          {loading ? (
            <div className="h-10 bg-gray-700/20 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={data?.referralLink ?? ""}
                className="flex-1 bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>

        {/* Latest Notifications */}
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Latest Notifications</h2>
            <a
              href="/affiliate/notifications"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-700/20 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.notifications?.length ? (
            <div className="space-y-3">
              {data.notifications.slice(0, 3).map((n) => (
                <div
                  key={n._id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a2e]/50"
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
