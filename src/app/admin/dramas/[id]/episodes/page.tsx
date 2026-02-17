"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../../layout";
import { adminApi } from "@/lib/adminApi";

interface Episode {
  _id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration: number;
  isFree: boolean;
  unlockPrice: number;
  status?: string;
}

export default function EpisodesPage() {
  const { id: dramaId } = useParams();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", episodeNumber: 1, videoUrl: "", duration: 0,
    isFree: false, unlockPrice: 100,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res: any = await adminApi.getEpisodes(dramaId as string);
        setEpisodes(res.data?.episodes || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (dramaId) fetch();
  }, [dramaId]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await adminApi.updateEpisode(editingId, { ...form, dramaId });
      } else {
        await adminApi.createEpisode({ ...form, dramaId });
      }
      // Refresh
      const res: any = await adminApi.getEpisodes(dramaId as string);
      setEpisodes(res.data?.episodes || res.data || []);
      setShowForm(false);
      setEditingId(null);
      setForm({ title: "", episodeNumber: episodes.length + 2, videoUrl: "", duration: 0, isFree: false, unlockPrice: 100 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (ep: Episode) => {
    setEditingId(ep._id);
    setForm({
      title: ep.title, episodeNumber: ep.episodeNumber, videoUrl: ep.videoUrl,
      duration: ep.duration, isFree: ep.isFree, unlockPrice: ep.unlockPrice,
    });
    setShowForm(true);
  };

  const handleDelete = async (epId: string) => {
    if (!confirm("Delete this episode?")) return;
    try {
      await adminApi.deleteEpisode(epId);
      setEpisodes((prev) => prev.filter((e) => e._id !== epId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href={`/admin/dramas/${dramaId}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Drama
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Episode Management</h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: "", episodeNumber: episodes.length + 1, videoUrl: "", duration: 0, isFree: false, unlockPrice: 100 }); }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Episode
          </button>
        </div>

        {/* Episode Form */}
        {showForm && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Edit Episode" : "New Episode"}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Episode Number</label>
                <input type="number" value={form.episodeNumber} onChange={(e) => setForm({ ...form, episodeNumber: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Video URL</label>
                <input type="text" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Duration (seconds)</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Free Episode</span>
                </label>
              </div>
              {!form.isFree && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Unlock Price (coins)</label>
                  <input type="number" value={form.unlockPrice} onChange={(e) => setForm({ ...form, unlockPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={handleSave} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                {editingId ? "Update" : "Create"}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Episodes Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td></tr>
                ))
              ) : episodes.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No episodes yet</td></tr>
              ) : (
                episodes.sort((a, b) => a.episodeNumber - b.episodeNumber).map((ep) => (
                  <tr key={ep._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Ep {ep.episodeNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ep.title}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDuration(ep.duration)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {ep.isFree ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Free</span>
                      ) : (
                        <span className="text-gray-500">{ep.unlockPrice} coins</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button onClick={() => handleEdit(ep)} className="mr-3 text-indigo-600 hover:text-indigo-800">Edit</button>
                      <button onClick={() => handleDelete(ep._id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
