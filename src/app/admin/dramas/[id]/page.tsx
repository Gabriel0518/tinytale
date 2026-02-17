"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../layout";
import { adminApi } from "@/lib/adminApi";

type TabId = "basic" | "payment" | "seo";

export default function DramaDetailPage() {
  const { id } = useParams();
  const [drama, setDrama] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [form, setForm] = useState({
    title: "", description: "", cover: "", categories: [] as string[],
    actors: [] as string[], director: "", year: 2024, status: "draft",
    isCompleted: false, totalEpisodes: 0,
    seoTitle: "", seoDescription: "", seoKeywords: "",
    isFree: false, defaultUnlockPrice: 100,
  });

  useEffect(() => {
    const fetchDrama = async () => {
      try {
        const res: any = await adminApi.getDrama(id as string);
        if (res.data) {
          setDrama(res.data);
          setForm({
            title: res.data.title || "",
            description: res.data.description || "",
            cover: res.data.cover || "",
            categories: res.data.categories || [],
            actors: res.data.actors || [],
            director: res.data.director || "",
            year: res.data.year || 2024,
            status: res.data.status || "draft",
            isCompleted: res.data.isCompleted || false,
            totalEpisodes: res.data.totalEpisodes || 0,
            seoTitle: res.data.seoTitle || "",
            seoDescription: res.data.seoDescription || "",
            seoKeywords: res.data.seoKeywords || "",
            isFree: res.data.isFree || false,
            defaultUnlockPrice: res.data.defaultUnlockPrice || 100,
          });
        }
      } catch (err) {
        console.error("Failed to fetch drama:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDrama();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateDrama(id as string, form);
      alert("Saved successfully");
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "payment" as const, label: "Payment Settings" },
    { id: "seo" as const, label: "SEO & Publish" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-96 rounded-xl bg-gray-200" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin/dramas" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Dramas
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {drama?.title || "New Drama"}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/dramas/${id}/episodes`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage Episodes
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Cover URL</label>
                <input
                  type="text"
                  value={form.cover}
                  onChange={(e) => setForm({ ...form, cover: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Director</label>
                <input
                  type="text"
                  value={form.director}
                  onChange={(e) => setForm({ ...form, director: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Total Episodes</label>
                <input
                  type="number"
                  value={form.totalEpisodes}
                  onChange={(e) => setForm({ ...form, totalEpisodes: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isCompleted}
                  onChange={(e) => setForm({ ...form, isCompleted: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label className="text-sm font-medium text-gray-700">Completed</label>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === "payment" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Payment Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label className="text-sm font-medium text-gray-700">Free Drama (all episodes free)</label>
              </div>
              {!form.isFree && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Default Unlock Price (coins per episode)
                  </label>
                  <input
                    type="number"
                    value={form.defaultUnlockPrice}
                    onChange={(e) => setForm({ ...form, defaultUnlockPrice: Number(e.target.value) })}
                    className="w-64 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Individual episode prices can be set in Episode Management</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEO & Publish Tab */}
        {activeTab === "seo" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">SEO Title</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder={form.title}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">SEO Description</label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  rows={3}
                  placeholder={form.description}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={form.seoKeywords}
                  onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
