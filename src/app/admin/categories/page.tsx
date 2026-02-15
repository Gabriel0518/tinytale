"use client";

import { useState } from "react";
import AdminLayout from "../layout";
import { mockCategories } from "@/lib/mockData";

export default function AdminCategoriesPage() {
  const [categories] = useState(mockCategories);

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Add Category
          </button>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{category.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{category.slug}</td>
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
