"use client";

import { useState } from "react";
import Image from "next/image";
import AdminLayout from "../layout";
import { mockDramas } from "@/lib/mockData";

export default function AdminDramasPage() {
  const [search, setSearch] = useState("");

  const filteredDramas = mockDramas.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dramas</h1>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Add Drama
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search dramas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none">
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Drama</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categories</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Episodes</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDramas.map((drama) => (
                <tr key={drama._id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-8 overflow-hidden rounded">
                        <Image src={drama.cover} alt={drama.title} width={32} height={48} className="rounded object-cover" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{drama.title}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {drama.categories.join(", ")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {drama.episodes?.length || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {drama.rating}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      drama.isCompleted ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {drama.isCompleted ? "Completed" : "Ongoing"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button className="mr-3 text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
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
