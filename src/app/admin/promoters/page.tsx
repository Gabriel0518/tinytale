"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/adminApi";
import AdjustLevelModal from "@/components/admin/AdjustLevelModal";
import BanPromoterModal from "@/components/admin/BanPromoterModal";
import ReviewPromoterModal from "@/components/admin/ReviewPromoterModal";
import { useToast } from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────────────────────────────
type Level = "Standard" | "Professional" | "Elite";
type Status = "Active" | "Suspended" | "Banned" | "Applying";

interface Promoter {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatar: string;
  level: Level;
  totalPromoted: number;
  effectiveUsers: number;
  totalCommission: number;
  withdrawn: number;
  pending: number;
  status: Status;
  joinDate: string;
}

interface Filters {
  search: string;
  level: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_PROMOTERS: Promoter[] = [
  { id: "AP-0021", userId: "U-10021", userName: "Alice Wang", userEmail: "alice.wang@email.com", avatar: "AW", level: "Elite", totalPromoted: 342, effectiveUsers: 218, totalCommission: 8640, withdrawn: 7200, pending: 1440, status: "Active", joinDate: "2024-08-15" },
  { id: "AP-0022", userId: "U-10022", userName: "Bob Chen", userEmail: "bob.chen@email.com", avatar: "BC", level: "Professional", totalPromoted: 185, effectiveUsers: 97, totalCommission: 3820, withdrawn: 3000, pending: 820, status: "Active", joinDate: "2024-09-02" },
  { id: "AP-0023", userId: "U-10023", userName: "Carol Davis", userEmail: "carol.d@email.com", avatar: "CD", level: "Standard", totalPromoted: 46, effectiveUsers: 21, totalCommission: 630, withdrawn: 500, pending: 130, status: "Active", joinDate: "2024-10-11" },
  { id: "AP-0024", userId: "U-10024", userName: "David Kim", userEmail: "david.kim@email.com", avatar: "DK", level: "Professional", totalPromoted: 210, effectiveUsers: 134, totalCommission: 5360, withdrawn: 4800, pending: 560, status: "Suspended", joinDate: "2024-07-20" },
  { id: "AP-0025", userId: "U-10025", userName: "Eva Martinez", userEmail: "eva.m@email.com", avatar: "EM", level: "Elite", totalPromoted: 520, effectiveUsers: 389, totalCommission: 15560, withdrawn: 14000, pending: 1560, status: "Active", joinDate: "2024-06-05" },
  { id: "AP-0026", userId: "U-10026", userName: "Frank Liu", userEmail: "frank.liu@email.com", avatar: "FL", level: "Standard", totalPromoted: 28, effectiveUsers: 9, totalCommission: 270, withdrawn: 200, pending: 70, status: "Active", joinDate: "2025-01-18" },
  { id: "AP-0027", userId: "U-10027", userName: "Grace Park", userEmail: "grace.p@email.com", avatar: "GP", level: "Professional", totalPromoted: 156, effectiveUsers: 88, totalCommission: 4120, withdrawn: 3600, pending: 520, status: "Banned", joinDate: "2024-11-30" },
  { id: "AP-0028", userId: "U-10028", userName: "Henry Zhao", userEmail: "henry.z@email.com", avatar: "HZ", level: "Elite", totalPromoted: 410, effectiveUsers: 295, totalCommission: 11800, withdrawn: 10200, pending: 1600, status: "Active", joinDate: "2024-05-12" },
  { id: "AP-0029", userId: "U-10029", userName: "Iris Lee", userEmail: "iris.lee@email.com", avatar: "IL", level: "Standard", totalPromoted: 0, effectiveUsers: 0, totalCommission: 0, withdrawn: 0, pending: 0, status: "Applying", joinDate: "2025-02-18" },
  { id: "AP-0030", userId: "U-10030", userName: "Jack Wilson", userEmail: "jack.w@email.com", avatar: "JW", level: "Standard", totalPromoted: 0, effectiveUsers: 0, totalCommission: 0, withdrawn: 0, pending: 0, status: "Applying", joinDate: "2025-02-20" },
];

const PAGE_SIZE = 10;
const emptyFilters: Filters = { search: "", level: "All", status: "All", dateFrom: "", dateTo: "" };

// ── Level badge styles (dark theme) ────────────────────────────────────────────
const levelStyles: Record<Level, string> = {
  Standard: "bg-gray-500/20 text-gray-400",
  Professional: "bg-blue-500/20 text-blue-400",
  Elite: "bg-purple-500/20 text-purple-400",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function PromoterManagementPage() {
  const { toast } = useToast();
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{
    id: string; name: string; initials: string; joinedDate: string;
    currentLevel: string; totalUsers: number; earnings: number;
  } | null>(null);

  // Ban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<{
    id: string; name: string; initials: string; status: string;
  } | null>(null);

  // Review modal state (for Applying promoters)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string; name: string; initials: string; email: string;
    joinDate: string; totalPromoted: number; effectiveUsers: number; totalCommission: number;
  } | null>(null);

  // Fetch promoters on mount, fall back to mock data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "demo-token" : "demo-token";
        const res: any = await api.get("/api/promoter/admin/list", { token });
        if (!cancelled) {
          const list = res.data?.promoters ?? res.data ?? [];
          setPromoters(
            list.map((p: any) => {
              const user = p.user || (typeof p.userId === 'object' ? p.userId : null);
              const name = user?.nickname ?? p.userName ?? "Unknown";
              return {
                id: p._id ?? p.promoterId ?? p.id,
                userId: typeof p.userId === 'string' ? p.userId : (p.userId?._id ?? ""),
                userName: name,
                userEmail: user?.email ?? p.userEmail ?? "",
                avatar: name.slice(0, 2).toUpperCase(),
                level: mapLevel(p.level) as Level,
                totalPromoted: p.totalPromoted ?? p.referredUsers ?? 0,
                effectiveUsers: p.effectiveUsers ?? p.effectiveRecharges ?? 0,
                totalCommission: p.totalCommission ?? p.totalRevenue ?? 0,
                withdrawn: p.withdrawn ?? p.withdrawnAmount ?? 0,
                pending: p.pending ?? p.pendingWithdrawal ?? 0,
                status: deriveStatus(p),
                joinDate: p.joinDate ?? p.createdAt ?? "",
              };
            })
          );
        }
      } catch {
        if (!cancelled) setPromoters(MOCK_PROMOTERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Active filter chips
  const activeFilterEntries = useMemo(() => {
    const chips: { key: keyof Filters; label: string; value: string }[] = [];
    if (filters.search) chips.push({ key: "search", label: "Search", value: filters.search });
    if (filters.level !== "All") chips.push({ key: "level", label: "Level", value: filters.level });
    if (filters.status !== "All") chips.push({ key: "status", label: "Status", value: filters.status });
    if (filters.dateFrom) chips.push({ key: "dateFrom", label: "From", value: filters.dateFrom });
    if (filters.dateTo) chips.push({ key: "dateTo", label: "To", value: filters.dateTo });
    return chips;
  }, [filters]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    return promoters.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !p.id.toLowerCase().includes(q) &&
          !p.userName.toLowerCase().includes(q) &&
          !p.userEmail.toLowerCase().includes(q)
        ) return false;
      }
      if (filters.level !== "All" && p.level !== filters.level) return false;
      if (filters.status !== "All" && p.status !== filters.status) return false;
      if (filters.dateFrom && p.joinDate < filters.dateFrom) return false;
      if (filters.dateTo && p.joinDate > filters.dateTo) return false;
      return true;
    });
  }, [promoters, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  const removeFilter = (key: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [key]: key === "level" || key === "status" ? "All" : "" }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  const inputCls = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const selectCls = inputCls + " appearance-none";

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Promoter Management</h1>
          <p className="mt-1 text-sm text-gray-400">Manage promoter levels, track performance, and handle payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700/40 transition">
            Export CSV
          </button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
            Invite Promoter
          </button>
        </div>
      </div>

      {/* ── Filter Card ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d] px-5 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Search</label>
            <input
              className={inputCls}
              placeholder="ID, Username, or Email"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1); }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Level</label>
            <select
              className={selectCls}
              value={filters.level}
              onChange={(e) => { setFilters({ ...filters, level: e.target.value }); setCurrentPage(1); }}
            >
              <option value="All">All Levels</option>
              <option value="Standard">Standard</option>
              <option value="Professional">Professional</option>
              <option value="Elite">Elite</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
            <select
              className={selectCls}
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="Applying">Applying</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Join Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className={inputCls}
                value={filters.dateFrom}
                onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setCurrentPage(1); }}
              />
              <span className="text-gray-500">–</span>
              <input
                type="date"
                className={inputCls}
                value={filters.dateTo}
                onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterEntries.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-700/50 pt-4">
            <span className="text-xs font-medium text-gray-500">Active Filters:</span>
            {activeFilterEntries.map((chip) => (
              <span key={chip.key} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400">
                {chip.label}: {chip.value}
                <button onClick={() => removeFilter(chip.key)} className="ml-0.5 hover:text-white transition">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
            <button onClick={() => setCurrentPage(1)} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition">Select Active</button>
            <button onClick={resetFilters} className="text-xs font-medium text-gray-400 hover:text-gray-300 transition">Reset Filters</button>
          </div>
        )}
      </div>

      {/* ── Data Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/50 bg-[#13131d]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Promoter ID</th>
              <th className="px-4 py-3">User Info</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3 text-right">Promoted</th>
              <th className="px-4 py-3 text-right">Effective</th>
              <th className="px-4 py-3 text-right">Total Comm.</th>
              <th className="px-4 py-3 text-right">Withdrawn</th>
              <th className="px-4 py-3 text-right">Pend</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-700/40" /></td></tr>
              ))
            ) : paginated.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center text-gray-500">No promoters found</td></tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-[#1a1a2e]/60 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-indigo-400">{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">{p.avatar}</div>
                      <div>
                        <div className="font-medium text-gray-200">{p.userName}</div>
                        <div className="text-xs text-gray-500">{p.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[p.level]}`}>{p.level}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-300">{p.totalPromoted.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-300">{p.effectiveUsers.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-200">${p.totalCommission.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-300">${p.withdrawn.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-300">${p.pending.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === "Active" ? "bg-green-500/10 text-green-400" :
                      p.status === "Applying" ? "bg-orange-500/10 text-orange-400" :
                      p.status === "Suspended" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>{p.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* View */}
                      <Link href={`/admin/promoters/${p.id}`} className="rounded p-1 text-gray-400 hover:bg-gray-700/40 hover:text-indigo-400 transition" title="View">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      {/* Edit / Review */}
                      <button
                        onClick={() => {
                          if (p.status === "Applying") {
                            setReviewTarget({
                              id: p.id,
                              name: p.userName,
                              initials: p.avatar,
                              email: p.userEmail,
                              joinDate: p.joinDate,
                              totalPromoted: p.totalPromoted,
                              effectiveUsers: p.effectiveUsers,
                              totalCommission: p.totalCommission,
                            });
                            setReviewModalOpen(true);
                          } else {
                            setAdjustTarget({
                              id: p.id,
                              name: p.userName,
                              initials: p.avatar,
                              joinedDate: p.joinDate,
                              currentLevel: p.level,
                              totalUsers: p.totalPromoted,
                              earnings: p.totalCommission,
                            });
                            setAdjustModalOpen(true);
                          }
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-700/40 hover:text-indigo-400 transition" title={p.status === "Applying" ? "Review" : "Edit"}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {/* Ban / Unban toggle */}
                      <button
                        onClick={() => {
                          setBanTarget({
                            id: p.id,
                            name: p.userName,
                            initials: p.avatar,
                            status: p.status,
                          });
                          setBanModalOpen(true);
                        }}
                        className={`rounded p-1 transition ${p.status === "Banned" ? "text-green-400 hover:bg-green-500/10" : "text-gray-400 hover:bg-red-500/10 hover:text-red-400"}`} title={p.status === "Banned" ? "Unban" : "Ban"}
                      >
                        {p.status === "Banned" ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition">Prev</button>
            {pageNumbers(currentPage, totalPages).map((n, i) =>
              n === "..." ? (
                <span key={`dot-${i}`} className="px-2 text-gray-600">...</span>
              ) : (
                <button key={n} onClick={() => setCurrentPage(n as number)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${currentPage === n ? "bg-indigo-600 text-white" : "border border-gray-700/50 text-gray-400 hover:bg-[#1a1a2e]"}`}>{n}</button>
              )
            )}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition">Next</button>
          </div>
        </div>
      )}
      {/* Adjust Level Modal */}
      <AdjustLevelModal
        open={adjustModalOpen}
        onClose={() => { setAdjustModalOpen(false); setAdjustTarget(null); }}
        onConfirm={(data) => {
          setPromoters((prev) =>
            prev.map((p) =>
              p.id === adjustTarget?.id ? { ...p, level: capitalize(data.level) as Level } : p
            )
          );
          toast(`Level updated to ${data.level} successfully`, "success");
          setAdjustModalOpen(false);
          setAdjustTarget(null);
        }}
        promoter={adjustTarget}
      />
      {/* Ban Promoter Modal */}
      <BanPromoterModal
        open={banModalOpen}
        onClose={() => { setBanModalOpen(false); setBanTarget(null); }}
        onConfirm={async (data) => {
          if (banTarget) {
            const isBanned = banTarget.status === "Banned";
            const newStatus = isBanned ? "active" : "banned";
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "demo-token" : "demo-token";
              await api.put(`/api/promoter/admin/${banTarget.id}`, { status: newStatus, reason: data.reason }, { token });
              toast(isBanned ? "Promoter unbanned successfully" : "Promoter banned successfully", "success");
            } catch {
              toast("Failed to update promoter status", "error");
            }
            setPromoters((prev) =>
              prev.map((p) =>
                p.id === banTarget.id
                  ? { ...p, status: p.status === "Banned" ? "Active" as Status : "Banned" as Status }
                  : p
              )
            );
          }
          setBanModalOpen(false);
          setBanTarget(null);
        }}
        promoter={banTarget}
      />
      {/* Review Promoter Modal */}
      <ReviewPromoterModal
        open={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setReviewTarget(null); }}
        onConfirm={async (data) => {
          if (reviewTarget) {
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "demo-token" : "demo-token";
              await api.post(`/api/promoter/admin/${reviewTarget.id}/review`, { action: data.action, reason: data.reason }, { token });
              toast(data.action === "approve" ? "Application approved successfully" : "Application rejected", "success");
            } catch {
              toast("Failed to review application", "error");
            }
            setPromoters((prev) =>
              prev.map((p) =>
                p.id === reviewTarget.id
                  ? { ...p, status: data.action === "approve" ? "Active" as Status : "Banned" as Status }
                  : p
              )
            );
          }
          setReviewModalOpen(false);
          setReviewTarget(null);
        }}
        promoter={reviewTarget}
      />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function deriveStatus(p: any): Status {
  // applicationStatus: 'pending' | 'approved' | 'rejected'
  // status: 'active' | 'suspended' | 'banned'
  if (p.applicationStatus === "pending") return "Applying";
  if (p.status === "banned") return "Banned";
  if (p.status === "suspended") return "Suspended";
  return "Active";
}

function mapLevel(level: any): string {
  if (typeof level === "number") {
    if (level >= 3) return "Elite";
    if (level >= 2) return "Professional";
    return "Standard";
  }
  return capitalize(String(level ?? "Standard"));
}

function pageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
