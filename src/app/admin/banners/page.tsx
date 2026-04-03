"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { adminApi } from "@/lib/adminApi";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface BannerItem {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  linkType: "drama" | "playlist" | "url";
  linkId: string;
  slot: "standard" | "featured";
  position: number;
  status: "Active" | "Disabled";
  startDate: string;
  endDate: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  image: string;
  linkType: "drama" | "playlist" | "url";
  linkId: string;
  slot: "standard" | "featured";
  position: number;
  status: "Active" | "Disabled";
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: BannerFormData = {
  title: "", subtitle: "", image: "", linkType: "drama", linkId: "",
  slot: "standard", position: 0, status: "Active", startDate: "", endDate: "",
};

export default function AdminBannersPage() {
  const confirmDialog = useConfirm();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerFormData>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  // Drama/Playlist search for link target
  const [linkSearch, setLinkSearch] = useState("");
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const res: any = await adminApi.getBanners();
      setBanners(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const searchLink = (query: string) => {
    setLinkSearch(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setLinkResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setLinkLoading(true);
      try {
        if (form.linkType === "drama") {
          const res: any = await adminApi.getDramas({ search: query, limit: 8 });
          setLinkResults((res.data?.dramas || res.data || []).map((d: any) => ({ _id: d._id, title: d.title, cover: d.cover })));
        } else if (form.linkType === "playlist") {
          const res: any = await adminApi.getPlaylists();
          const all = res.data || [];
          setLinkResults(all.filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8));
        }
      } catch { /* ignore */ } finally { setLinkLoading(false); }
    }, 300);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7002";
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/admin/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setForm(prev => ({ ...prev, image: json.data.url }));
        setImagePreview(json.data.url);
      } else {
        setError("Image upload failed");
      }
    } catch { setError("Image upload failed"); } finally { setUploading(false); }
  };

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, startDate: today, endDate: nextMonth });
    setImagePreview("");
    setError("");
    setLinkSearch(""); setLinkResults([]);
    setShowModal(true);
  };

  const openEdit = (b: BannerItem) => {
    setEditingId(b._id);
    setForm({
      title: b.title, subtitle: b.subtitle || "", image: b.image,
      linkType: b.linkType, linkId: b.linkId || "", slot: b.slot || "standard",
      position: b.position, status: b.status,
      startDate: b.startDate?.slice(0, 10) || "", endDate: b.endDate?.slice(0, 10) || "",
    });
    setImagePreview(b.image);
    setError("");
    setLinkSearch(""); setLinkResults([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.image) { setError("Image is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form };
      if (editingId) {
        await adminApi.updateBanner(editingId, payload);
      } else {
        await adminApi.createBanner(payload);
      }
      setShowModal(false);
      fetchBanners();
    } catch (err: any) { setError(err?.message || "Failed to save banner"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Delete Banner",
      message: "Delete this banner?",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await adminApi.deleteBanner(id);
      fetchBanners();
    } catch { alert("Failed to delete banner"); }
  };

  const getStatusBadge = (b: BannerItem) => {
    if (b.status === "Disabled") return "bg-gray-500/20 text-gray-400";
    const now = new Date();
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    if (now >= start && now <= end) return "bg-green-500/20 text-green-400";
    if (now < start) return "bg-yellow-500/20 text-yellow-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const getStatusText = (b: BannerItem) => {
    if (b.status === "Disabled") return "Disabled";
    const now = new Date();
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    if (now >= start && now <= end) return "Active";
    if (now < start) return "Scheduled";
    return "Expired";
  };

  const modal = showModal ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
      <div className="w-full max-w-2xl rounded-2xl bg-[#1a1a2e] p-6 shadow-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">{editingId ? "Edit Banner" : "Create Banner"}</h2>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">{error}</div>}

        {/* Image Upload */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-400">Banner Image *</label>
          <div className="relative rounded-xl border-2 border-dashed border-gray-600 bg-[#13131d] overflow-hidden" style={{ height: imagePreview ? "180px" : "120px" }}>
            {imagePreview ? (
              <>
                <Image src={imagePreview} alt="Preview" fill unoptimized className="object-cover" />
                <button type="button" onClick={() => { setImagePreview(""); setForm(prev => ({ ...prev, image: "" })); }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </>
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                <span className="text-sm">{uploading ? "Uploading..." : "Click to upload image"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </label>
            )}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Weekly Top Picks:" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Subtitle</label>
            <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="The Best of Revenge" />
          </div>
        </div>

        {/* Link Target */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-400">Link Target</label>
          <div className="flex gap-2 mb-2">
            {(["drama", "playlist", "url"] as const).map(t => (
              <button key={t} type="button"
                onClick={() => { setForm({ ...form, linkType: t, linkId: "" }); setLinkSearch(""); setLinkResults([]); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${form.linkType === t ? "bg-indigo-600 text-white" : "bg-[#13131d] text-gray-400 border border-gray-700 hover:border-gray-500"}`}>
                {t === "drama" ? "Drama" : t === "playlist" ? "Playlist" : "External URL"}
              </button>
            ))}
          </div>
          {form.linkType === "url" ? (
            <input type="text" value={form.linkId} onChange={e => setForm({ ...form, linkId: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="https://..." />
          ) : (
            <div className="relative">
              {form.linkId && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-indigo-600/10 border border-indigo-500/30 px-3 py-2">
                  <span className="text-sm text-indigo-300 flex-1 truncate">ID: {form.linkId}</span>
                  <button type="button" onClick={() => setForm({ ...form, linkId: "" })} className="text-gray-400 hover:text-white">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              <input type="text" value={linkSearch} onChange={e => searchLink(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                placeholder={`Search ${form.linkType}...`} />
              {linkResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1a1a2e] shadow-xl">
                  {linkResults.map((item: any) => (
                    <button key={item._id} type="button"
                      onClick={() => { setForm({ ...form, linkId: item._id }); setLinkSearch(""); setLinkResults([]); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#13131d]">
                      {item.cover ? (
                        <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded">
                          <Image src={item.cover} alt="" fill unoptimized className="object-cover" />
                        </div>
                      ) : null}
                      <span className="truncate">{item.title || item.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {linkLoading && <div className="absolute right-3 top-2.5"><div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" /></div>}
            </div>
          )}
        </div>

        {/* Slot Type */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-400">Banner Slot</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, slot: "standard" })}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition border ${form.slot === "standard" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[#13131d] border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              <div className="font-semibold">Standard</div>
              <div className="text-[11px] opacity-70 mt-0.5">After 3rd playlist · 240px height</div>
            </button>
            <button type="button" onClick={() => setForm({ ...form, slot: "featured" })}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition border ${form.slot === "featured" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[#13131d] border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              <div className="font-semibold">Featured</div>
              <div className="text-[11px] opacity-70 mt-0.5">After 6th playlist · 360px height</div>
            </button>
          </div>
        </div>

        {/* Position, Status, Dates */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Position</label>
            <input type="number" value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">End Date</label>
            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Banner Management</h1>
          <p className="mt-1 text-sm text-gray-400">Manage homepage promotional banners</p>
        </div>
        <button onClick={openCreate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          + New Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" /></div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-12 text-center">
          <p className="text-gray-500">No banners yet. Create your first banner.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map(b => (
            <div key={b._id} className="flex items-center gap-4 rounded-xl border border-gray-700/50 bg-[#13131d] p-4 hover:border-gray-600 transition">
              <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                {b.image ? <Image src={b.image} alt={b.title} fill unoptimized className="object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white truncate">{b.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(b)}`}>{getStatusText(b)}</span>
                </div>
                {b.subtitle && <p className="text-sm text-gray-400 truncate">{b.subtitle}</p>}
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${b.slot === 'featured' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{b.slot === 'featured' ? 'Featured' : 'Standard'}</span>
                  <span>Link: {b.linkType}{b.linkId ? ` → ${b.linkId.slice(0, 12)}...` : ""}</span>
                  <span>Pos: {b.position}</span>
                  <span>{b.startDate?.slice(0, 10)} ~ {b.endDate?.slice(0, 10)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-400">Edit</button>
                <button onClick={() => handleDelete(b._id)} className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {typeof window !== "undefined" && modal && createPortal(modal, document.body)}
    </div>
  );
}
