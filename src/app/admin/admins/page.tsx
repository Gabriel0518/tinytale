"use client";

import { useState } from "react";
import AdminLayout from "../layout";

type Role = "Super Admin" | "Finance" | "Operation" | "Support";
type Status = "Active" | "Disabled";

interface Admin {
  id: string;
  name: string;
  handle: string;
  role: Role;
  status: Status;
  lastLogin: string;
}

const mockAdmins: Admin[] = [
  { id: "1", name: "Alice Wang", handle: "@alice", role: "Super Admin", status: "Active", lastLogin: "2026-02-17 09:30" },
  { id: "2", name: "Bob Chen", handle: "@bob", role: "Finance", status: "Active", lastLogin: "2026-02-16 14:20" },
  { id: "3", name: "Carol Li", handle: "@carol", role: "Operation", status: "Active", lastLogin: "2026-02-15 11:45" },
  { id: "4", name: "David Zhao", handle: "@david", role: "Support", status: "Disabled", lastLogin: "2026-01-20 08:10" },
  { id: "5", name: "Eva Liu", handle: "@eva", role: "Operation", status: "Active", lastLogin: "2026-02-17 07:55" },
];

const roleBadge: Record<Role, string> = {
  "Super Admin": "bg-red-100 text-red-800",
  Finance: "bg-green-100 text-green-800",
  Operation: "bg-blue-100 text-blue-800",
  Support: "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 5;

export default function AdminManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = mockAdmins.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.handle.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase();

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Add Admin
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option>All</option>
            <option>Super Admin</option>
            <option>Finance</option>
            <option>Operation</option>
            <option>Support</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option>All</option>
            <option>Active</option>
            <option>Disabled</option>
          </select>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginated.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{admin.id}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                        {initials(admin.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                        <p className="text-xs text-gray-500">{admin.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleBadge[admin.role]}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`inline-block h-2 w-2 rounded-full ${admin.status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
                      {admin.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{admin.lastLogin}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button className="mr-3 text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="mr-3 text-yellow-600 hover:text-yellow-800">Reset Pwd</button>
                    <button className={admin.status === "Active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}>
                      {admin.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No admins found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {paginated.length} of {filtered.length} admins</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`rounded-lg border px-3 py-1 ${page === i + 1 ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300 hover:bg-gray-50"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
