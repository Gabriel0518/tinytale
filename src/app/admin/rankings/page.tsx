"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { adminApi } from "@/lib/adminApi";

// ── Types ──────────────────────────────────────────────
type RecommendationStatus = "Active" | "Scheduled" | "Expired";

interface Recommendation {
  id: string;
  spotName: string;
  drama: {
    title: string;
    thumbnail: string;
  };
  startDate: string;
  endDate: string;
  status: RecommendationStatus;
}

interface RankingCard {
  title: string;
  icon: "fire" | "sparkle" | "trending";
  frequency: string;
  lastUpdate: string;
}

// ── Icons ──────────────────────────────────────────────
function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────
const RANKING_CARDS: RankingCard[] = [
  { title: "Hot Rankings", icon: "fire", frequency: "Updates hourly", lastUpdate: "2026-02-18 14:00" },
  { title: "New Releases", icon: "sparkle", frequency: "Updates every 6 hours", lastUpdate: "2026-02-18 12:00" },
  { title: "Trending", icon: "trending", frequency: "Real-time", lastUpdate: "2026-02-18 14:32" },
];

const ICON_MAP: Record<RankingCard["icon"], React.FC<{ className?: string }>> = {
  fire: FireIcon,
  sparkle: SparkleIcon,
  trending: TrendingUpIcon,
};

const ICON_COLOR_MAP: Record<RankingCard["icon"], string> = {
  fire: "text-orange-400",
  sparkle: "text-yellow-400",
  trending: "text-emerald-400",
};

const STATUS_STYLES: Record<RecommendationStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-400",
  Scheduled: "bg-blue-500/20 text-blue-400",
  Expired: "bg-gray-500/20 text-gray-400",
};

const PAGE_SIZE = 5;

const TYPE_OPTIONS = [
  { value: "featured", label: "Editor Recommendation" },
  { value: "rankings", label: "Hot Rankings" },
  { value: "trending", label: "Trending" },
  { value: "new", label: "New Release" },
];

interface FormData {
  dramaId: string;
  dramaTitle: string;
  type: string;
  position: number;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormData = { dramaId: "", dramaTitle: "", type: "featured", position: 0, startDate: "", endDate: "" };

// ── Component ──────────────────────────────────────────
export default function AdminRankingsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [dramaSearch, setDramaSearch] = useState("");
  const [dramaResults, setDramaResults] = useState<any[]>([]);
  const [dramaLoading, setDramaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dramaSearchTimer = useRef<NodeJS.Timeout | null>(null);
  const [rawItems, setRawItems] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.getFeatured();
      const raw = res.data?.items || res.data?.featured || res.data || [];
      const items = Array.isArray(raw) ? raw : [];
      setRawItems(items);
      setRecommendations(items.map((f: any) => ({
        id: f._id || f.id,
        spotName: f.type || "Homepage Banner",
        drama: {
          title: f.dramaId?.title || f.drama?.title || "Unknown",
          thumbnail: (f.dramaId?.title || f.drama?.title || "??").slice(0, 2).toUpperCase(),
        },
        startDate: f.startDate ? new Date(f.startDate).toISOString().slice(0, 10) : "",
        endDate: f.endDate ? new Date(f.endDate).toISOString().slice(0, 10) : "",
        status: f.endDate && new Date(f.endDate) < new Date() ? "Expired"
          : f.startDate && new Date(f.startDate) > new Date() ? "Scheduled" : "Active",
      })));
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteFeatured(id); fetchData(); } catch { /* ignore */ }
  };

  // Drama search for modal
  const searchDramas = useCallback(async (q: string) => {
    if (!q.trim()) { setDramaResults([]); return; }
    setDramaLoading(true);
    try {
      const res: any = await adminApi.getDramas({ search: q, limit: 8 });
      const list = res.data?.dramas || res.data || [];
      setDramaResults(Array.isArray(list) ? list : []);
    } catch { setDramaResults([]); }
    setDramaLoading(false);
  }, []);

  const handleDramaSearchChange = (value: string) => {
    setDramaSearch(value);
    if (dramaSearchTimer.current) clearTimeout(dramaSearchTimer.current);
    dramaSearchTimer.current = setTimeout(() => searchDramas(value), 300);
  };

  const openCreate = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setForm({ ...EMPTY_FORM, startDate: today, endDate: nextMonth });
    setDramaSearch("");
    setDramaResults([]);
    setShowModal(true);
  };

  const openEdit = (item: Recommendation, rawItems: any[]) => {
    // Find the raw item to get dramaId
    const raw = rawItems.find((r: any) => (r._id || r.id) === item.id);
    setEditingId(item.id);
    setForm({
      dramaId: raw?.dramaId?._id || raw?.dramaId || "",
      dramaTitle: item.drama.title,
      type: item.spotName,
      position: raw?.position || 0,
      startDate: item.startDate,
      endDate: item.endDate,
    });
    setDramaSearch(item.drama.title);
    setDramaResults([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.dramaId || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateFeatured(editingId, {
          position: form.position,
          startDate: form.startDate,
          endDate: form.endDate,
        });
      } else {
        await adminApi.createFeatured({
          dramaId: form.dramaId,
          type: form.type,
          position: form.position,
          startDate: form.startDate,
          endDate: form.endDate,
        });
      }
      fetchData();
      setShowModal(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return recommendations;
    return recommendations.filter(
      (r) =>
        r.spotName.toLowerCase().includes(q) ||
        r.drama.title.toLowerCase().includes(q)
    );
  }, [search, recommendations]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-gray-300 cursor-pointer">Content</span>
        <span>/</span>
        <span className="text-gray-300">Rankings</span>
      </nav>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">Rankings &amp; Curation</h1>

      {/* Auto Rankings Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RANKING_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon];
          const iconColor = ICON_COLOR_MAP[card.icon];
          return (
            <div
              key={card.title}
              className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {card.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400">{card.frequency}</p>
              <p className="mt-2 text-xs text-gray-500">
                Last updated: {card.lastUpdate}
              </p>
            </div>
          );
        })}
      </div>

      {/* Editor Recommendations Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">
            Editor Recommendations
          </h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-9 w-64 rounded-lg border border-gray-700 bg-[#1a1a2e] pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {/* Refresh Rules */}
            <button className="h-9 rounded-lg border border-gray-700 px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
              Refresh Rules
            </button>
            {/* Create Recommendation */}
            <button onClick={openCreate} className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              Create Recommendation
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-[#1a1a2e] border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Spot Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Drama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      item.status === "Expired" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                      {item.spotName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-700 text-xs font-bold text-gray-300">
                          {item.drama.thumbnail}
                        </div>
                        <span className="text-sm text-gray-200">
                          {item.drama.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {item.startDate} – {item.endDate}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                          title="Edit"
                          onClick={() => openEdit(item, rawItems)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Remove"
                          onClick={() => handleDelete(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No recommendations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-800 px-6 py-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-medium text-gray-300">
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-300">
                  {filtered.length}
                </span>{" "}
                results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[#1a1a2e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? "Edit Recommendation" : "Create Recommendation"}
            </h3>
            <div className="mt-5 space-y-4">
              {/* Drama Search */}
              {!editingId && (
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Drama</label>
                  <input
                    type="text"
                    value={dramaSearch}
                    onChange={(e) => handleDramaSearchChange(e.target.value)}
                    placeholder="Search dramas..."
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                  {form.dramaId && (
                    <p className="mt-1 text-xs text-indigo-400">Selected: {form.dramaTitle}</p>
                  )}
                  {dramaResults.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-gray-700 bg-[#13131d]">
                      {dramaResults.map((d: any) => (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, dramaId: d._id, dramaTitle: d.title });
                            setDramaSearch(d.title);
                            setDramaResults([]);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                        >
                          <span className="truncate">{d.title}</span>
                          {d.rating && <span className="shrink-0 text-xs text-yellow-400">{d.rating.toFixed(1)}★</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {dramaLoading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}
                </div>
              )}
              {editingId && (
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Drama</label>
                  <input type="text" value={form.dramaTitle} readOnly className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
                </div>
              )}
              {/* Type */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  disabled={!!editingId}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Position */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Position (sort order)</label>
                <input
                  type="number" min={0} value={form.position}
                  onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Start Date</label>
                  <input
                    type="date" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">End Date</label>
                  <input
                    type="date" value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.dramaId || !form.startDate || !form.endDate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
