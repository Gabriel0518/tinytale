"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import CreateAdminModal from "@/components/admin/CreateAdminModal";
import EditAdminModal from "@/components/admin/EditAdminModal";
import ResetPasswordModal from "@/components/admin/ResetPasswordModal";
import { formatAdminDate, formatAdminDateTime, formatAdminTimeAgo, useAdminLocale } from "@/lib/admin-i18n";

// --- Types ---
interface Role {
  _id: string;
  name: string;
}

interface Admin {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string | Role;
  status: string;
  createdAt: string;
  lastLogin: string;
}

interface AdminsResponse {
  success: boolean;
  data: {
    admins: Admin[];
    total: number;
    page: number;
    limit: number;
  };
}

interface RolesResponse {
  success: boolean;
  data: Role[];
}

// --- Helpers ---
const ROLE_BADGE_COLORS: Record<string, string> = {
  "Super Admin": "bg-red-500/20 text-red-400",
  Finance: "bg-green-500/20 text-green-400",
  Operation: "bg-blue-500/20 text-blue-400",
  Support: "bg-purple-500/20 text-purple-400",
};

function getRoleName(admin: Admin, roles: Role[]): string {
  if (typeof admin.roleId === "object" && admin.roleId?.name) return admin.roleId.name;
  const found = roles.find((r) => r._id === admin.roleId);
  return found?.name || "Unknown";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string, locale: "zh" | "en"): { date: string; time: string } {
  if (!dateStr) return { date: "-", time: "" };
  return {
    date: formatAdminDate(dateStr, locale, { year: "numeric", month: "short", day: "numeric" }),
    time: formatAdminDateTime(dateStr, locale, { hour: "2-digit", minute: "2-digit" }),
  };
}

function timeAgo(dateStr: string, locale: "zh" | "en"): string {
  return formatAdminTimeAgo(dateStr, locale);
}

function exportCSV(admins: Admin[], roles: Role[]) {
  const headers = ["ID", "Username", "Full Name", "Email", "Role", "Status", "Created At", "Last Login"];
  const rows = admins.map((a) => [
    a._id,
    a.username,
    a.fullName,
    a.email,
    getRoleName(a, roles),
    a.status,
    a.createdAt,
    a.lastLogin,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `staff-list-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// --- Component ---
export default function AdminManagementPage() {
  const { locale } = useAdminLocale();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token") || "demo-token"
      : "demo-token";

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await adminApi.getAdmins(
        { page, limit, search, roleId: roleFilter, status: statusFilter },
        token
      )) as AdminsResponse;
      setAdmins(res.data?.admins || []);
      setTotal(res.data?.total || 0);
    } catch {
      setAdmins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, token]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await adminApi.getRoles(token);
      setRoles((res as RolesResponse).data || []);
    } catch {
      setRoles([]);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleDisableToggle = async (admin: Admin) => {
    try {
      const newStatus = admin.status === "active" ? "inactive" : "active";
      await adminApi.updateAdmin(admin._id, { status: newStatus }, token);
      fetchAdmins();
    } catch (err) {
      console.error("Failed to toggle admin status", err);
    }
    setOpenMenuId(null);
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6 text-gray-200">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff List</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage system administrators, roles, and access permissions.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          + Create Admin
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Disabled</option>
        </select>
        <button
          onClick={resetFilters}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm text-gray-400 hover:bg-[#1a1a2e]/80 hover:text-gray-200 transition-colors"
        >
          Reset Filters
        </button>
        <button
          onClick={() => exportCSV(admins, roles)}
          className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm text-gray-400 hover:bg-[#1a1a2e]/80 hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Admin Profile
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Last Login
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const roleName = getRoleName(admin, roles);
                  const badgeColor = ROLE_BADGE_COLORS[roleName] || "bg-gray-500/20 text-gray-400";
                  const created = formatDate(admin.createdAt, locale);
                  const isActive = admin.status === "active";

                  return (
                    <tr
                      key={admin._id}
                      className="hover:bg-[#1a1a2e]/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-mono">
                        {admin._id.slice(-6)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400">
                            {getInitials(admin.fullName || admin.username)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {admin.fullName || admin.username}
                            </p>
                            <p className="text-xs text-gray-500">@{admin.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor}`}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              isActive ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                          <span className={isActive ? "text-green-400" : "text-gray-500"}>
                            {isActive ? "Active" : "Disabled"}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm text-gray-300">{created.date}</p>
                        <p className="text-xs text-gray-500">{created.time}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                          {timeAgo(admin.lastLogin, locale)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === admin._id ? null : admin._id)
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openMenuId === admin._id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-1 shadow-xl">
                              <button
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setEditOpen(true);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#13131d] hover:text-white"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setResetPwdOpen(true);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#13131d] hover:text-white"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Reset Pwd
                              </button>
                              <div className="my-1 border-t border-gray-700/50" />
                              <button
                                onClick={() => handleDisableToggle(admin)}
                                className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                                  isActive
                                    ? "text-red-400 hover:bg-red-500/10"
                                    : "text-green-400 hover:bg-green-500/10"
                                }`}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                </svg>
                                {isActive ? "Disable" : "Enable"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-700/50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-sm text-gray-300 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              {startRow}-{endRow} of {total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1a1a2e] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1a1a2e] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click-away listener for action menus */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Modals */}
      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={() => {
          setCreateOpen(false);
          fetchAdmins();
        }}
        roles={roles}
      />
      <EditAdminModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedAdmin(null);
        }}
        onConfirm={() => {
          setEditOpen(false);
          setSelectedAdmin(null);
          fetchAdmins();
        }}
        admin={
          selectedAdmin
            ? {
                _id: selectedAdmin._id,
                username: selectedAdmin.username,
                fullName: selectedAdmin.fullName,
                email: selectedAdmin.email,
                roleId:
                  typeof selectedAdmin.roleId === "object"
                    ? selectedAdmin.roleId._id
                    : selectedAdmin.roleId,
                status: selectedAdmin.status,
              }
            : null
        }
        roles={roles}
      />
      <ResetPasswordModal
        open={resetPwdOpen}
        onClose={() => {
          setResetPwdOpen(false);
          setSelectedAdmin(null);
        }}
        onConfirm={() => {
          setResetPwdOpen(false);
          setSelectedAdmin(null);
        }}
        admin={
          selectedAdmin
            ? {
                _id: selectedAdmin._id,
                username: selectedAdmin.username,
                fullName: selectedAdmin.fullName,
                email: selectedAdmin.email,
              }
            : null
        }
      />
    </div>
  );
}
