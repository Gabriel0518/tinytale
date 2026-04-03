"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminApi } from "@/lib/adminApi";

// --- Types ---
interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  maskedEmail: string;
  status: "VIP" | "Standard";
  coins: number;
  recharge: number;
  regTime: string;
  lastLogin: string;
  tag: "Active" | "Banned";
  regMethod: "Email" | "Google" | "Apple";
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterNickname, setFilterNickname] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMemberStatus, setFilterMemberStatus] = useState("all");
  const [filterRechargeMin, setFilterRechargeMin] = useState("");
  const [filterRechargeMax, setFilterRechargeMax] = useState("");
  const [filterRegMethod, setFilterRegMethod] = useState("all");
  const [filterAccountStatus, setFilterAccountStatus] = useState("all");

  // Applied filters (only update on Apply)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // API data
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, any> = { page: currentPage, limit: PAGE_SIZE };
      if (appliedFilters.nickname) params.search = appliedFilters.nickname;
      if (appliedFilters.accountStatus && appliedFilters.accountStatus !== "all") params.status = appliedFilters.accountStatus;
      const res: any = await adminApi.getUsers(params);
      const data = res.data || res;
      const rawUsers = data.users || data.items || [];
      setUsers(rawUsers.map((u: any) => ({
        id: `#${u._id || u.userId || u.id}`,
        name: u.nickname || u.name || "Unknown",
        avatar: u.avatar || `https://i.pravatar.cc/40?u=${u._id || u.id}`,
        email: u.email || "",
        maskedEmail: u.email ? u.email.charAt(0) + "***@" + u.email.split("@")[1] : "",
        status: u.vipStatus === "active" ? "VIP" as const : "Standard" as const,
        coins: u.coins || 0,
        recharge: u.totalRecharge || 0,
        regTime: u.createdAt ? u.createdAt.split("T")[0] : "",
        lastLogin: u.lastLogin || u.updatedAt || "",
        tag: u.status === "banned" ? "Banned" as const : "Active" as const,
        regMethod: (u.registrationMethod === "google" ? "Google" : u.registrationMethod === "apple" ? "Apple" : "Email") as "Email" | "Google" | "Apple",
      })));
      setTotalUsers(data.total || data.totalCount || rawUsers.length);
    } catch {
      setUsers([]);
      setTotalUsers(0);
    }
  }, [currentPage, appliedFilters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const paginatedUsers = users;

  const handleApplyFilters = () => {
    setAppliedFilters({
      userId: filterUserId,
      email: filterEmail,
      nickname: filterNickname,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      memberStatus: filterMemberStatus,
      rechargeMin: filterRechargeMin,
      rechargeMax: filterRechargeMax,
      regMethod: filterRegMethod,
      accountStatus: filterAccountStatus,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterUserId("");
    setFilterEmail("");
    setFilterNickname("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMemberStatus("all");
    setFilterRechargeMin("");
    setFilterRechargeMax("");
    setFilterRegMethod("all");
    setFilterAccountStatus("all");
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const displayTotal = totalUsers;
  const displayTotalFormatted = displayTotal.toLocaleString();

  // Pagination range
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = Object.keys(appliedFilters).length > 0 ? totalPages : Math.ceil(totalUsers / PAGE_SIZE);
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(total - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  const inputClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const selectClass = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none";

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">User List</h1>
          <span className="rounded bg-indigo-600/20 px-2 py-0.5 text-xs font-medium text-indigo-400">P3-01</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
            Export
          </button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters
          </div>
          <svg className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {filtersOpen && (
          <div className="border-t border-gray-700/50 px-5 pb-5 pt-4">
            {/* Row 1 */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">User ID</label>
                <input type="text" placeholder="e.g. #89021" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                <input type="text" placeholder="Search email..." value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Nickname</label>
                <input type="text" placeholder="Search nickname..." value={filterNickname} onChange={(e) => setFilterNickname(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Registration Date</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={inputClass} />
                  <span className="text-gray-500 text-xs">to</span>
                  <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
            {/* Row 2 */}
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Member Status</label>
                <select value={filterMemberStatus} onChange={(e) => setFilterMemberStatus(e.target.value)} className={selectClass}>
                  <option value="all">All Status</option>
                  <option value="vip">VIP</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Total Recharge $</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={filterRechargeMin} onChange={(e) => setFilterRechargeMin(e.target.value)} className={inputClass} />
                  <span className="text-gray-500 text-xs">-</span>
                  <input type="number" placeholder="Max" value={filterRechargeMax} onChange={(e) => setFilterRechargeMax(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Reg. Method</label>
                <select value={filterRegMethod} onChange={(e) => setFilterRegMethod(e.target.value)} className={selectClass}>
                  <option value="all">All Methods</option>
                  <option value="email">Email</option>
                  <option value="google">Google</option>
                  <option value="apple">Apple</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Account Status</label>
                <select value={filterAccountStatus} onChange={(e) => setFilterAccountStatus(e.target.value)} className={selectClass}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
            {/* Filter Actions */}
            <div className="flex items-center justify-end gap-3">
              <button onClick={handleReset} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
                Reset
              </button>
              <button onClick={handleApplyFilters} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                Apply Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
          <span className="text-sm font-medium text-gray-300">User Data</span>
          <span className="text-sm text-gray-400">Total Users: <span className="font-semibold text-white">{displayTotalFormatted}</span></span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a1a2e] text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="whitespace-nowrap px-5 py-3">User ID</th>
                <th className="whitespace-nowrap px-5 py-3">User</th>
                <th className="whitespace-nowrap px-5 py-3">Email</th>
                <th className="whitespace-nowrap px-5 py-3">Status</th>
                <th className="whitespace-nowrap px-5 py-3">Coins</th>
                <th className="whitespace-nowrap px-5 py-3">Recharge</th>
                <th className="whitespace-nowrap px-5 py-3">Reg. Time</th>
                <th className="whitespace-nowrap px-5 py-3">Last Login</th>
                <th className="whitespace-nowrap px-5 py-3">Tag</th>
                <th className="whitespace-nowrap px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-[#1a1a2e]/50">
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm font-mono text-gray-300">{user.id}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Image src={user.avatar} alt={user.name} width={32} height={32} className="rounded-full" unoptimized />
                      <span className="text-sm font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-400">{user.maskedEmail}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.status === "VIP"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-white">{user.coins.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    <span className={user.recharge > 0 ? "text-emerald-400" : "text-gray-500"}>
                      ${user.recharge.toFixed(2)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-400">{user.regTime}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-400">{user.lastLogin}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.tag === "Active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {user.tag}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Link href={`/admin/users/${user.id.replace("#", "")}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                      Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-500">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-700/50 px-5 py-4">
          <span className="text-sm text-gray-400">
            Showing {users.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, users.length)} of {displayTotalFormatted} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {getPageNumbers().map((page, idx) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-500">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-[#1a1a2e]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
