"use client";

import { useState } from "react";
import AdminLayout from "../layout";

const mockUsers = [
  { id: "1", email: "user1@example.com", nickname: "MovieFan", coins: 500, status: "Active", joined: "Jan 2024" },
  { id: "2", email: "user2@example.com", nickname: "DramaLover", coins: 1200, status: "Active", joined: "Feb 2024" },
  { id: "3", email: "user3@example.com", nickname: "Viewer", coins: 0, status: "Banned", joined: "Mar 2024" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const filteredUsers = mockUsers.filter(
    (u) => u.email.includes(search) || u.nickname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Coins</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.nickname}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <span className="font-medium text-yellow-600">{user.coins}</span> coins
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button className="mr-3 text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
