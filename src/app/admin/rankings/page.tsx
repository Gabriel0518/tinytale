"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "@/lib/adminApi";
import { ALL_COUNTRIES } from "@/lib/countries";
import { useConfirm } from "@/components/ui/ConfirmDialog";

// ── Types ──────────────────────────────────────────────
interface PlaylistItem {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  dramas: { dramaId: { _id: string; title: string; cover?: string; rating?: number } | null; position: number }[];
  countries: string[];
  position: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Disabled";
  isSystem: boolean;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  countries: string[];
  position: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Disabled";
  dramas: { dramaId: string; title: string; position: number }[];
}

const EMPTY_FORM: FormData = {
  name: "", description: "", icon: "", countries: [], position: 0,
  startDate: "", endDate: "", status: "Active", dramas: [],
};

// ── Icons ──────────────────────────────────────────────
function FireIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>);
}
function SparkleIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" /></svg>);
}
function TrendingUpIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>);
}
function PencilIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
}
function TrashIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>);
}
function SearchIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
}
function XIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>);
}

const RANKING_CARDS = [
  { title: "Hot Rankings", icon: "fire" as const, color: "text-orange-400", freq: "Updates hourly" },
  { title: "New Releases", icon: "sparkle" as const, color: "text-yellow-400", freq: "Updates every 6 hours" },
  { title: "Trending", icon: "trending" as const, color: "text-emerald-400", freq: "Real-time" },
];
const ICON_MAP = { fire: FireIcon, sparkle: SparkleIcon, trending: TrendingUpIcon };

// ── Component ──────────────────────────────────────────
export default function AdminRankingsPage() {
  const confirmDialog = useConfirm();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dramaSearch, setDramaSearch] = useState("");
  const [dramaResults, setDramaResults] = useState<any[]>([]);
  const [dramaLoading, setDramaLoading] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.getPlaylists();
      setPlaylists(Array.isArray(res.data) ? res.data : []);
    } catch { setPlaylists([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

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

  const handleDramaSearch = (v: string) => {
    setDramaSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchDramas(v), 300);
  };

  const addDrama = (d: any) => {
    if (form.dramas.some(x => x.dramaId === d._id)) return;
    setForm({ ...form, dramas: [...form.dramas, { dramaId: d._id, title: d.title, position: form.dramas.length }] });
    setDramaSearch("");
    setDramaResults([]);
  };

  const removeDrama = (id: string) => {
    setForm({ ...form, dramas: form.dramas.filter(d => d.dramaId !== id).map((d, i) => ({ ...d, position: i })) });
  };

  const moveDrama = (idx: number, dir: -1 | 1) => {
    const arr = [...form.dramas];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setForm({ ...form, dramas: arr.map((d, i) => ({ ...d, position: i })) });
  };

  const addCountry = (c: string) => {
    if (!form.countries.includes(c)) {
      setForm({ ...form, countries: [...form.countries, c] });
    }
    setCountryInput("");
    setShowCountryDropdown(false);
  };

  const removeCountry = (c: string) => {
    setForm({ ...form, countries: form.countries.filter(x => x !== c) });
  };

  const openCreate = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setForm({ ...EMPTY_FORM, startDate: today, endDate: nextMonth, status: "Active", dramas: [], countries: [] });
    setDramaSearch(""); setDramaResults([]);
    setShowModal(true);
  };

  const openEdit = (p: PlaylistItem) => {
    setEditingId(p._id);
    setForm({
      name: p.name, description: p.description || "", icon: p.icon || "",
      countries: p.countries || [],
      position: p.position,
      status: p.status || "Active",
      startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : "",
      endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : "",
      dramas: p.dramas.filter(d => d.dramaId).map((d, i) => ({
        dramaId: d.dramaId!._id, title: d.dramaId!.title, position: d.position ?? i,
      })),
    });
    setDramaSearch(""); setDramaResults([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name, description: form.description, icon: form.icon,
        countries: form.countries, position: form.position, status: form.status,
        startDate: form.startDate, endDate: form.endDate,
        dramas: form.dramas.map(d => ({ dramaId: d.dramaId, position: d.position })),
      };
      if (editingId) {
        await adminApi.updatePlaylist(editingId, payload);
      } else {
        await adminApi.createPlaylist(payload);
      }
      fetchPlaylists();
      setShowModal(false);
    } catch (e: any) { setError(e?.message || "Failed to save playlist"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Delete Playlist",
      message: "Delete this playlist?",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    try { await adminApi.deletePlaylist(id); fetchPlaylists(); } catch (e: any) { alert(e?.message || "Failed to delete"); }
  };

  const getStatus = (p: PlaylistItem) => {
    if (p.status === "Disabled") return "Disabled";
    const now = new Date();
    if (new Date(p.endDate) < now) return "Expired";
    if (new Date(p.startDate) > now) return "Scheduled";
    return "Active";
  };

  const statusStyle = (s: string) => {
    if (s === "Active") return "bg-emerald-500/20 text-emerald-400";
    if (s === "Scheduled") return "bg-blue-500/20 text-blue-400";
    if (s === "Disabled") return "bg-gray-500/20 text-gray-400";
    return "bg-gray-500/20 text-gray-400"; // Expired
  };

  const filteredCountries = ALL_COUNTRIES.filter(
    c => !form.countries.includes(c) && c.toLowerCase().includes(countryInput.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span><span>/</span><span>Content</span><span>/</span>
        <span className="text-gray-300">Rankings</span>
      </nav>

      <h1 className="text-2xl font-bold text-white">Rankings & Playlists</h1>

      {/* System Rankings Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RANKING_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon];
          return (
            <div key={card.title} className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className={card.color}><Icon className="h-5 w-5" /></div>
                <h3 className="text-base font-semibold text-white">{card.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{card.freq}</p>
              <p className="mt-1 text-xs text-gray-600">System auto-generated</p>
            </div>
          );
        })}
      </div>

      {/* Playlists Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Custom Playlists</h2>
          <button onClick={openCreate} className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Create Playlist
          </button>
        </div>

        <div className="rounded-xl bg-[#1a1a2e] border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dramas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Countries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {playlists.map((p) => {
                  const st = getStatus(p);
                  return (
                    <tr key={p._id} className={`hover:bg-white/[0.02] transition-colors ${st === "Expired" ? "opacity-60" : ""}`}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          {p.icon && <span className="text-lg">{p.icon}</span>}
                          <span className="text-sm font-medium text-white">{p.name}</span>
                          {p.isSystem && <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">System</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {p.dramas.filter(d => d.dramaId).length} dramas
                      </td>
                      <td className="px-6 py-4">
                        {p.countries.length === 0 ? (
                          <span className="text-xs text-gray-500">Global</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.countries.slice(0, 3).map(c => (
                              <span key={c} className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">{c}</span>
                            ))}
                            {p.countries.length > 3 && <span className="text-[10px] text-gray-500">+{p.countries.length - 3}</span>}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {new Date(p.startDate).toISOString().slice(0, 10)} – {new Date(p.endDate).toISOString().slice(0, 10)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(st)}`}>{st}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {!p.isSystem && (
                            <button onClick={() => handleDelete(p._id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && playlists.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No playlists yet. Create one to get started.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#1a1a2e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? "Edit Playlist" : "Create Playlist"}
            </h3>
            <div className="mt-5 space-y-4">
              {/* Name + Icon */}
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Valentine's Special"
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Icon</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="emoji"
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white text-center placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Description (optional)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              {/* Countries */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Target Countries (empty = global)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.countries.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-2.5 py-1 text-xs text-indigo-300">
                      {c}
                      <button type="button" onClick={() => removeCountry(c)} className="hover:text-white"><XIcon className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input type="text" value={countryInput}
                    onChange={(e) => { setCountryInput(e.target.value); setShowCountryDropdown(true); }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="Type to add country..."
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
                  {showCountryDropdown && filteredCountries.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-32 w-full overflow-auto rounded-lg border border-gray-700 bg-[#13131d]">
                      {filteredCountries.map(c => (
                        <button key={c} type="button" onClick={() => addCountry(c)}
                          className="flex w-full px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Position + Status + Date Range */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Position</label>
                  <input type="number" min={0} value={form.position}
                    onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Disabled" })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Start Date</label>
                  <input type="date" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">End Date</label>
                  <input type="date" value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
              {/* Dramas */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Dramas ({form.dramas.length})</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={dramaSearch} onChange={(e) => handleDramaSearch(e.target.value)}
                    placeholder="Search dramas to add..."
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
                </div>
                {dramaLoading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}
                {dramaResults.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-auto rounded-lg border border-gray-700 bg-[#13131d]">
                    {dramaResults.map((d: any) => (
                      <button key={d._id} type="button" onClick={() => addDrama(d)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 ${form.dramas.some(x => x.dramaId === d._id) ? "text-gray-600" : "text-gray-300"}`}>
                        <span className="truncate">{d.title}</span>
                        {d.rating && <span className="shrink-0 text-xs text-yellow-400">{d.rating.toFixed(1)}★</span>}
                        {form.dramas.some(x => x.dramaId === d._id) && <span className="text-xs text-gray-600">added</span>}
                      </button>
                    ))}
                  </div>
                )}
                {/* Drama list */}
                {form.dramas.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.dramas.map((d, i) => (
                      <div key={d.dramaId} className="flex items-center gap-2 rounded-lg bg-[#13131d] px-3 py-2">
                        <span className="text-xs text-gray-500 w-5">{i + 1}</span>
                        <span className="flex-1 truncate text-sm text-gray-200">{d.title}</span>
                        <button type="button" onClick={() => moveDrama(i, -1)} disabled={i === 0}
                          className="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs">▲</button>
                        <button type="button" onClick={() => moveDrama(i, 1)} disabled={i === form.dramas.length - 1}
                          className="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs">▼</button>
                        <button type="button" onClick={() => removeDrama(d.dramaId)}
                          className="text-gray-500 hover:text-red-400"><XIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
              <button onClick={handleSave}
                disabled={saving || !form.name || !form.startDate || !form.endDate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
