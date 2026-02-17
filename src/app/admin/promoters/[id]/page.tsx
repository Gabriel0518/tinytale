"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../layout";

type Level = "Standard" | "Pro" | "Elite";
type Tab = "referred" | "commissions" | "withdrawals" | "links";

const promoter = {
  id: "P001",
  name: "Alice Wang",
  avatar: "AW",
  level: "Elite" as Level,
  status: "Active" as "Active" | "Banned",
  commissionRate: 15,
  joinedAt: "2024-03-12",
  email: "alice@example.com",
  lifetimeEarnings: 8640,
  totalReferrals: 342,
  activeReferrals: 218,
  conversionRate: 63.7,
};

const referredUsers = [
  { name: "John Doe", joinDate: "2024-06-01", firstRecharge: true, totalVolume: 120, commission: 18 },
  { name: "Jane Smith", joinDate: "2024-07-15", firstRecharge: true, totalVolume: 340, commission: 51 },
  { name: "Mike Lee", joinDate: "2024-08-20", firstRecharge: false, totalVolume: 0, commission: 0 },
  { name: "Sara Kim", joinDate: "2024-09-03", firstRecharge: true, totalVolume: 85, commission: 12.75 },
];

const commissions = [
  { date: "2024-12-01", source: "John Doe", amount: 18, type: "Recharge", status: "Paid" },
  { date: "2024-12-03", source: "Jane Smith", amount: 51, type: "Recharge", status: "Paid" },
  { date: "2024-12-10", source: "Sara Kim", amount: 12.75, type: "Recharge", status: "Pending" },
  { date: "2024-12-15", source: "Jane Smith", amount: 24, type: "Subscription", status: "Pending" },
];

const withdrawals = [
  { id: "W001", amount: 500, method: "PayPal", status: "Completed", date: "2024-11-01" },
  { id: "W002", amount: 1200, method: "Bank Transfer", status: "Completed", date: "2024-11-15" },
  { id: "W003", amount: 800, method: "PayPal", status: "Processing", date: "2024-12-01" },
  { id: "W004", amount: 300, method: "PayPal", status: "Rejected", date: "2024-12-10" },
];

const referralLinks = [
  { code: "ALICE2024", url: "https://tinytale.com/r/ALICE2024", clicks: 1240, conversions: 186 },
  { code: "ALICE-VIP", url: "https://tinytale.com/r/ALICE-VIP", clicks: 530, conversions: 92 },
  { code: "ALICE-SUMMER", url: "https://tinytale.com/r/ALICE-SUMMER", clicks: 310, conversions: 64 },
];

const levelStyles: Record<Level, string> = {
  Standard: "bg-gray-100 text-gray-700",
  Pro: "bg-blue-100 text-blue-700",
  Elite: "bg-purple-100 text-purple-700 ring-1 ring-yellow-400",
};

const wdStatusStyles: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function PromoterDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>("referred");
  const [copied, setCopied] = useState<string | null>(null);
  const p = { ...promoter, id: id as string };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "referred", label: "Referred Users" },
    { key: "commissions", label: "Commission History" },
    { key: "withdrawals", label: "Withdrawal History" },
    { key: "links", label: "Referral Links" },
  ];

  return (
    <AdminLayout>
      <div>
        <Link href="/admin/promoters" className="text-sm text-gray-500 hover:text-gray-700">← Back to Promoters</Link>

        {/* Profile Header */}
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">{p.avatar}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[p.level]}`}>{p.level}</span>
              <span className="flex items-center gap-1.5 text-sm">
                <span className={`inline-block h-2 w-2 rounded-full ${p.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                {p.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{p.email} &middot; Joined {p.joinedAt}</p>
            <p className="mt-1 text-sm text-gray-600">Commission Rate: <span className="font-semibold text-gray-900">{p.commissionRate}%</span></p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Adjust Level</button>
            <button className={`rounded-lg px-4 py-2 text-sm font-medium ${p.status === "Active" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
              {p.status === "Active" ? "Ban Promoter" : "Unban Promoter"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Lifetime Earnings", value: `$${p.lifetimeEarnings.toLocaleString()}`, color: "text-green-600" },
            { label: "Total Referrals", value: p.totalReferrals, color: "text-blue-600" },
            { label: "Active Referrals", value: p.activeReferrals, color: "text-indigo-600" },
            { label: "Conversion Rate", value: `${p.conversionRate}%`, color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <div className="flex gap-6">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 text-sm font-medium ${tab === t.key ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
          {tab === "referred" && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["User", "Join Date", "First Recharge", "Total Volume", "Commission Earned"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referredUsers.map((u) => (
                  <tr key={u.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.joinDate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.firstRecharge ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.firstRecharge ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">${u.totalVolume}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${u.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "commissions" && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Source User", "Amount", "Type", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{c.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.source}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${c.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "withdrawals" && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Request ID", "Amount", "Method", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{w.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${w.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{w.method}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${wdStatusStyles[w.status] || "bg-gray-100 text-gray-700"}`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{w.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "links" && (
            <div className="divide-y divide-gray-100 p-4">
              {referralLinks.map((l) => (
                <div key={l.code} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.code}</p>
                    <p className="text-xs text-gray-500">{l.url}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{l.clicks}</p>
                      <p className="text-xs text-gray-500">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{l.conversions}</p>
                      <p className="text-xs text-gray-500">Conversions</p>
                    </div>
                    <button onClick={() => copyLink(l.url)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {copied === l.url ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
