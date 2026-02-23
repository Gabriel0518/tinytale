"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/adminApi";
import AdjustLevelModal from "@/components/admin/AdjustLevelModal";
import BanPromoterModal from "@/components/admin/BanPromoterModal";
import { useToast } from "@/components/ui/Toast";

// ─── Types ───────────────────────────────────────────────
type Tab = "promoted" | "commissions" | "withdrawals" | "links";

interface PromoterData {
  id: string;
  name: string;
  initials: string;
  email: string;
  joinedDate: string;
  level: string;
  commissionRate: number;
  totalEarned: number;
  earnedChange: string;
  totalReferrals: number;
  referralsChange: string;
  status: string;
}

interface PromotedUser {
  id: string;
  name: string;
  avatarInitials: string;
  regDate: string;
  firstRecharge: boolean;
  rechargeAmount: number | null;
  totalVolume: number;
  commission: number;
}

interface CommissionRecord {
  date: string;
  sourceUser: string;
  type: string;
  amount: number;
  status: string;
}

interface WithdrawalRecord {
  requestId: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

interface PromotionLink {
  code: string;
  url: string;
  clicks: number;
  conversions: number;
}

// ─── Default empty promoter ───────────────────────────────────────────
const EMPTY_PROMOTER: PromoterData = {
  id: "",
  name: "",
  initials: "",
  email: "",
  joinedDate: "",
  level: "",
  commissionRate: 0,
  totalEarned: 0,
  earnedChange: "",
  totalReferrals: 0,
  referralsChange: "",
  status: "",
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function PromoterDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("promoted");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);

  const [promoter, setPromoter] = useState<PromoterData>(EMPTY_PROMOTER);
  const [promotedUsers, setPromotedUsers] = useState<PromotedUser[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [links, setLinks] = useState<PromotionLink[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<{ success: boolean; data: any }>(`/api/promoter/admin/${id}`);
        if (res.success && res.data) {
          const raw = res.data.promoter || res.data;
          if (raw && (raw._id || raw.id)) {
            const user = raw.user || (typeof raw.userId === 'object' ? raw.userId : null);
            const name = user?.nickname ?? raw.name ?? "Unknown";
            setPromoter({
              id: raw._id ?? raw.id ?? "",
              name,
              initials: name.slice(0, 2).toUpperCase(),
              email: user?.email ?? raw.email ?? "",
              joinedDate: raw.createdAt ?? raw.joinedDate ?? "",
              level: typeof raw.level === 'number'
                ? (raw.level >= 3 ? "Elite" : raw.level >= 2 ? "Professional" : "Standard")
                : (raw.level ?? "Standard"),
              commissionRate: raw.commissionRate ?? 0,
              totalEarned: raw.totalRevenue ?? raw.totalEarned ?? 0,
              earnedChange: raw.earnedChange ?? "",
              totalReferrals: raw.referredUsers ?? raw.totalReferrals ?? 0,
              referralsChange: raw.referralsChange ?? "",
              status: raw.applicationStatus === 'pending' ? 'Applying'
                : raw.status === 'banned' ? 'Banned'
                : raw.status === 'suspended' ? 'Suspended'
                : 'Active',
            });
          }
          setPromotedUsers(res.data.promotedUsers || []);
          setCommissions(res.data.commissions || []);
          setWithdrawals(res.data.withdrawals || []);
          setLinks(res.data.links || []);
        }
      } catch {
        // API not available — keep empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "promoted", label: "Promoted Users", count: promoter.totalReferrals },
    { key: "commissions", label: "Commission Records" },
    { key: "withdrawals", label: "Withdrawal History" },
    { key: "links", label: "Promotion Links" },
  ];

  const totalPages = 5; // mock pagination

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-300 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/admin/promoters" className="hover:text-gray-300 transition-colors">Promotions</Link>
        <span>/</span>
        <Link href="/admin/promoters" className="hover:text-gray-300 transition-colors">Promoter List</Link>
        <span>/</span>
        <span className="text-gray-200">{promoter.name}</span>
      </nav>

      {/* Profile Header Card */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
              {promoter.initials}
            </div>
            {/* Info */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-200">{promoter.name}</h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                ID: {promoter.id} &middot; {promoter.email} &middot; Joined {promoter.joinedDate}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
                  {promoter.level}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                  {promoter.commissionRate}% Commission
                </span>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdjustModalOpen(true)}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#1a1a2e]"
            >
              Adjust Level
            </button>
            <button
              onClick={() => setBanModalOpen(true)}
              className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              {promoter.status === "Banned" ? "Unban Promoter" : "Ban Promoter"}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-5">
          <p className="text-sm text-gray-400">Total Earned</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-2xl font-bold text-gray-200">${promoter.totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              {promoter.earnedChange}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Lifetime commission generated</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-5">
          <p className="text-sm text-gray-400">Total Referrals</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-2xl font-bold text-gray-200">{promoter.totalReferrals.toLocaleString()}</p>
            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              {promoter.referralsChange}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Users registered via link</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700/50">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setCurrentPage(1); }}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                  {t.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-300 outline-none focus:border-indigo-500"
        >
          <option value="All">Status: All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#252540]">
          Filter
        </button>
        <button className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#252540]">
          Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#13131d]">
        {/* ── Promoted Users Tab ── */}
        {tab === "promoted" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reg. Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">First Recharge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {promotedUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[#1a1a2e]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-medium text-indigo-400">
                          {u.avatarInitials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{u.regDate}</td>
                    <td className="px-4 py-3">
                      {u.firstRecharge ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          Yes (${u.rechargeAmount?.toFixed(2)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">${u.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">${u.commission.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Commission Records Tab ── */}
        {tab === "commissions" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {commissions.map((c, i) => (
                  <tr key={i} className="transition-colors hover:bg-[#1a1a2e]">
                    <td className="px-4 py-3 text-sm text-gray-400">{c.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">{c.sourceUser}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.type === "Recharge"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">${c.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === "Paid"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Withdrawal History Tab ── */}
        {tab === "withdrawals" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {withdrawals.map((w) => (
                  <tr key={w.requestId} className="transition-colors hover:bg-[#1a1a2e]">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">{w.requestId}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">${w.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{w.method}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        w.status === "Completed"
                          ? "bg-green-500/10 text-green-400"
                          : w.status === "Processing"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{w.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Promotion Links Tab ── */}
        {tab === "links" && (
          <div className="divide-y divide-gray-700/30 p-4">
            {links.map((l) => (
              <div key={l.code} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-200">{l.code}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{l.url}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-200">{l.clicks.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-200">{l.conversions.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Conversions</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(l.url)}
                    className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-[#252540]"
                  >
                    {copied === l.url ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-700/50 text-gray-400 hover:bg-[#1a1a2e]"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
      {/* Adjust Level Modal */}
      <AdjustLevelModal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        onConfirm={(data) => {
          setPromoter((prev) => ({
            ...prev,
            level: data.level.charAt(0).toUpperCase() + data.level.slice(1),
            commissionRate: data.commissionRate,
          }));
          toast(`Level updated to ${data.level} successfully`, "success");
          setAdjustModalOpen(false);
        }}
        promoter={{
          id: String(id),
          name: promoter.name,
          initials: promoter.initials,
          joinedDate: promoter.joinedDate,
          currentLevel: promoter.level,
          totalUsers: promoter.totalReferrals,
          earnings: promoter.totalEarned,
        }}
      />
      {/* Ban Promoter Modal */}
      <BanPromoterModal
        open={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={async (data) => {
          const isBanned = promoter.status === "Banned";
          const newStatus = isBanned ? "active" : "banned";
          try {
            const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "demo-token" : "demo-token";
            await api.put(`/api/promoter/admin/${id}`, { status: newStatus, reason: data.reason }, { token });
            toast(isBanned ? "Promoter unbanned successfully" : "Promoter banned successfully", "success");
          } catch {
            toast("Failed to update promoter status", "error");
          }
          setPromoter((prev) => ({
            ...prev,
            status: prev.status === "Banned" ? "Active" : "Banned",
          }));
          setBanModalOpen(false);
        }}
        promoter={{
          id: String(id),
          name: promoter.name,
          initials: promoter.initials,
          status: promoter.status,
        }}
      />
    </div>
  );
}