"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
};

const cardClass =
  "rounded-xl bg-white p-5 shadow-sm border border-gray-100";

function RevenueTrend() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = {
    labels,
    datasets: [
      {
        label: "Revenue ($)",
        data: [1200, 1900, 1500, 2400, 2100, 2800, 3200],
        borderColor: COLORS.indigo,
        backgroundColor: "rgba(99,102,241,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: COLORS.indigo,
      },
    ],
  };

  return (
    <div className={cardClass}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Revenue Trend
      </h3>
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
          },
        }}
      />
    </div>
  );
}

function UserDistribution() {
  const data = {
    labels: ["VIP Users", "Free Users"],
    datasets: [
      {
        data: [3420, 8750],
        backgroundColor: [COLORS.indigo, COLORS.emerald],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className={cardClass}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        User Distribution
      </h3>
      <Doughnut
        data={data}
        options={{
          responsive: true,
          cutout: "65%",
          plugins: {
            legend: { position: "bottom", labels: { padding: 16 } },
          },
        }}
      />
    </div>
  );
}

function TopDramas() {
  const data = {
    labels: [
      "Love in Seoul",
      "Dark Forest",
      "City Lights",
      "Ocean Heart",
      "Last Promise",
    ],
    datasets: [
      {
        label: "Views",
        data: [48200, 37800, 31500, 28900, 22100],
        backgroundColor: [
          COLORS.indigo,
          COLORS.emerald,
          COLORS.amber,
          COLORS.rose,
          COLORS.sky,
        ],
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  };

  return (
    <div className={cardClass}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Top Dramas by Views
      </h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: "#f3f4f6" }, beginAtZero: true },
            y: { grid: { display: false } },
          },
        }}
      />
    </div>
  );
}

export function DashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <RevenueTrend />
      </div>
      <UserDistribution />
      <TopDramas />
    </div>
  );
}
