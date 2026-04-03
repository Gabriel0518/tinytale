"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { adminApi } from "@/lib/adminApi";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type BannerStatus = "Active" | "Disabled";

interface LinkedDrama {
  _id: string;
  title: string;
  cover?: string;
}

interface HeroBannerItem {
  _id: string;
  coverImage: string;
  title: string;
  subtitle: string;
  tag: string;
  dramaId: string | LinkedDrama;
  displayDurationSec: number;
  position: number;
  status: BannerStatus;
  startAt: string;
  endAt: string;
}

interface HeroBannerForm {
  coverImage: string;
  title: string;
  subtitle: string;
  tag: string;
  dramaId: string;
  displayDurationSec: number;
  position: number;
  status: BannerStatus;
  startAt: string;
  endAt: string;
}

const EMPTY_FORM: HeroBannerForm = {
  coverImage: "",
  title: "",
  subtitle: "",
  tag: "",
  dramaId: "",
  displayDurationSec: 5,
  position: 0,
  status: "Active",
  startAt: "",
  endAt: "",
};

function getDramaTitle(dramaId: HeroBannerItem["dramaId"]) {
  if (!dramaId) return "-";
  if (typeof dramaId === "string") return dramaId;
  return dramaId.title || dramaId._id;
}

function getDramaIdValue(dramaId: HeroBannerItem["dramaId"]) {
  if (!dramaId) return "";
  return typeof dramaId === "string" ? dramaId : dramaId._id;
}

function toDateTimeLocalValue(input: string | Date) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function AdminHeroBannersPage() {
  const confirmDialog = useConfirm();
  const [heroBanners, setHeroBanners] = useState<HeroBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroBannerForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState("");
  const [dramaSearch, setDramaSearch] = useState("");
  const [dramaResults, setDramaResults] = useState<LinkedDrama[]>([]);
  const [dramaLoading, setDramaLoading] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchHeroBanners = useCallback(async () => {
    try {
      const res: any = await adminApi.getHeroBanners();
      setHeroBanners(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHeroBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroBanners();
  }, [fetchHeroBanners]);

  const searchDrama = (query: string) => {
    setDramaSearch(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setDramaResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setDramaLoading(true);
      try {
        const res: any = await adminApi.getDramas({ search: query, limit: 8 });
        const list = res.data?.dramas || res.data || [];
        setDramaResults(
          Array.isArray(list)
            ? list.map((item: any) => ({ _id: item._id, title: item.title, cover: item.cover }))
            : []
        );
      } catch {
        setDramaResults([]);
      } finally {
        setDramaLoading(false);
      }
    }, 300);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7002";
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiBase}/api/admin/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setForm((prev) => ({ ...prev, coverImage: json.data.url }));
        setCoverPreview(json.data.url);
      } else {
        setError("Image upload failed");
      }
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    const now = new Date();
    const startAt = toDateTimeLocalValue(now);
    const endAt = toDateTimeLocalValue(new Date(now.getTime() + 7 * 86400000));
    setEditingId(null);
    setForm({ ...EMPTY_FORM, startAt, endAt, status: "Active" });
    setCoverPreview("");
    setError("");
    setDramaSearch("");
    setDramaResults([]);
    setShowModal(true);
  };

  const openEdit = (item: HeroBannerItem) => {
    setEditingId(item._id);
    setForm({
      coverImage: item.coverImage || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
      tag: item.tag || "",
      dramaId: getDramaIdValue(item.dramaId),
      displayDurationSec: Number(item.displayDurationSec ?? 5),
      position: Number(item.position ?? 0),
      status: item.status || "Active",
      startAt: item.startAt ? toDateTimeLocalValue(item.startAt) : "",
      endAt: item.endAt ? toDateTimeLocalValue(item.endAt) : "",
    });
    setCoverPreview(item.coverImage || "");
    setError("");
    setDramaSearch("");
    setDramaResults([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.coverImage) {
      setError("Cover image is required");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.dramaId) {
      setError("Drama link is required");
      return;
    }
    if (!form.startAt || !form.endAt) {
      setError("Display time is required");
      return;
    }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      setError("End time must be later than start time");
      return;
    }
    if (form.displayDurationSec < 3 || form.displayDurationSec > 15) {
      setError("Display duration must be between 3 and 15 seconds");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        coverImage: form.coverImage,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        tag: form.tag.trim(),
        dramaId: form.dramaId,
        displayDurationSec: Number(form.displayDurationSec),
        position: Number(form.position),
        status: form.status,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      };

      if (editingId) {
        await adminApi.updateHeroBanner(editingId, payload);
      } else {
        await adminApi.createHeroBanner(payload);
      }
      setShowModal(false);
      fetchHeroBanners();
    } catch (err: any) {
      setError(err?.message || "Failed to save hero banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Delete Hero Banner",
      message: "Delete this hero banner?",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      await adminApi.deleteHeroBanner(id);
      fetchHeroBanners();
    } catch {
      alert("Failed to delete hero banner");
    }
  };

  const getStatusText = (item: HeroBannerItem) => {
    if (item.status === "Disabled") return "Disabled";
    const now = new Date();
    const start = new Date(item.startAt);
    const end = new Date(item.endAt);
    if (now < start) return "Scheduled";
    if (now > end) return "Expired";
    return "Active";
  };

  const getStatusClass = (item: HeroBannerItem) => {
    const status = getStatusText(item);
    if (status === "Active") return "bg-emerald-500/20 text-emerald-400";
    if (status === "Scheduled") return "bg-yellow-500/20 text-yellow-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const modal = showModal ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-gray-700/50 bg-[#1a1a2e] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-white">{editingId ? "Edit Hero Banner" : "Create Hero Banner"}</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-400">Cover Image *</label>
          <div
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-600 bg-[#13131d]"
            style={{ height: coverPreview ? "200px" : "120px" }}
          >
            {coverPreview ? (
              <>
                <Image src={coverPreview} alt="Cover preview" fill unoptimized className="object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverPreview("");
                    setForm((prev) => ({ ...prev, coverImage: "" }));
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                </svg>
                <span className="text-sm">{uploading ? "Uploading..." : "Click to upload cover image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Main title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Sub title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Tag</label>
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Top 1 / Editor Pick"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-400">Linked Drama *</label>
          {form.dramaId && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600/10 px-3 py-2">
              <span className="flex-1 truncate text-sm text-indigo-300">Drama ID: {form.dramaId}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, dramaId: "" })}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={dramaSearch}
              onChange={(e) => searchDrama(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Search drama by title..."
            />
            {dramaResults.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1a1a2e] shadow-xl">
                {dramaResults.map((drama) => (
                  <button
                    key={drama._id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, dramaId: drama._id });
                      setDramaSearch("");
                      setDramaResults([]);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#13131d]"
                  >
                    {drama.cover ? (
                      <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded">
                        <Image src={drama.cover} alt="" fill unoptimized className="object-cover" />
                      </div>
                    ) : null}
                    <span className="truncate">{drama.title}</span>
                  </button>
                ))}
              </div>
            )}
            {dramaLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Duration (sec)</label>
            <input
              type="number"
              min={3}
              max={15}
              value={form.displayDurationSec}
              onChange={(e) => setForm({ ...form, displayDurationSec: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Position</label>
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as BannerStatus })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Start At</label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">End At</label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
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
          <h1 className="text-2xl font-bold text-white">Hero Banner Management</h1>
          <p className="mt-1 text-sm text-gray-400">Configure homepage top carousel banners</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Hero Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" />
        </div>
      ) : heroBanners.length === 0 ? (
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-12 text-center">
          <p className="text-gray-500">No hero banners yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {heroBanners.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 rounded-xl border border-gray-700/50 bg-[#13131d] p-4 transition hover:border-gray-600"
            >
              <div className="relative h-24 w-44 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                {item.coverImage ? <Image src={item.coverImage} alt={item.title} fill unoptimized className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-white">{item.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClass(item)}`}>
                    {getStatusText(item)}
                  </span>
                  {item.tag && (
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                      {item.tag}
                    </span>
                  )}
                </div>
                {item.subtitle && <p className="truncate text-sm text-gray-400">{item.subtitle}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>Drama: {getDramaTitle(item.dramaId)}</span>
                  <span>Duration: {item.displayDurationSec}s</span>
                  <span>Pos: {item.position}</span>
                  <span>
                    {new Date(item.startAt).toLocaleString()} ~ {new Date(item.endAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-400 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:border-red-600 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {typeof window !== "undefined" && modal && createPortal(modal, document.body)}
    </div>
  );
}
