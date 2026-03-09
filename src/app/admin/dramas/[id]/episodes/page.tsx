"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

type ModalType = "editInfo" | "editCategories" | "editRankings" | "editComments" | null;

// ── Types ──────────────────────────────────────────────
type EpisodeStatus = "Published" | "Processing" | "Failed" | "Draft";
type Monetization = { type: "free" } | { type: "paid"; price: number };

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  cover: string;
  duration: number;
  status: EpisodeStatus;
  errorMessage?: string;
  plays: number;
  monetization: Monetization;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────
function fmtDur(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtTotal(eps: Episode[]): string {
  const t = eps.reduce((s, e) => s + e.duration, 0);
  return `${Math.floor(t / 3600)}h ${Math.floor((t % 3600) / 60)}m`;
}
function fmtPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const STATUS_CLS: Record<EpisodeStatus, string> = {
  Published: "bg-emerald-500/20 text-emerald-400",
  Processing: "bg-blue-500/20 text-blue-400 animate-pulse",
  Failed: "bg-red-500/20 text-red-400",
  Draft: "bg-gray-500/20 text-gray-400",
};
const ROW_CLS: Record<EpisodeStatus, string> = {
  Published: "border-l-2 border-emerald-500",
  Processing: "",
  Failed: "bg-red-500/5",
  Draft: "",
};

const PER_PAGE_OPTS = [5, 10, 20];

// ── Modal: Close Button ─────────────────────────────────
function ModalCloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ── M2-01: Edit Episode Info Modal ──────────────────────
function EditInfoModal({ episode, onClose, onSave }: { episode: Episode; onClose: () => void; onSave: (id: string, data: any) => Promise<void> }) {
  const [epNumber, setEpNumber] = useState(episode.episodeNumber);
  const [epTitle, setEpTitle] = useState(episode.title);
  const [accessType, setAccessType] = useState<"free" | "paid">(episode.monetization.type);
  const [price, setPrice] = useState(episode.monetization.type === "paid" ? episode.monetization.price : 30);
  const [publishMode, setPublishMode] = useState<"immediate" | "scheduled" | "draft">(
    episode.status === "Draft" ? "draft" : "immediate"
  );
  const [scheduleDate, setScheduleDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";
  const inputCls = "w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none";

  const handleSave = async () => {
    if (!Number.isFinite(epNumber) || epNumber < 1) {
      setValidationError("Episode number must be at least 1.");
      return;
    }
    if (!epTitle.trim()) {
      setValidationError("Episode title is required.");
      return;
    }
    if (accessType === "paid" && (!Number.isFinite(price) || price < 1)) {
      setValidationError("Paid episode price must be at least 1 coin.");
      return;
    }
    if (publishMode === "scheduled" && !scheduleDate) {
      setValidationError("Please choose a scheduled publish date.");
      return;
    }

    setValidationError(null);
    setSaving(true);
    try {
      const status = publishMode === "draft" ? "Draft" : publishMode === "immediate" ? "Published" : "Draft";
      await onSave(episode.id, {
        episodeNumber: epNumber,
        title: epTitle,
        isFree: accessType === "free",
        unlockPrice: accessType === "paid" ? price : 0,
        status,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#1a1a2e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose} />
        <h2 className="text-lg font-bold text-white mb-1">Edit Episode Info</h2>
        <p className="text-sm text-gray-500 mb-6">Episode {episode.episodeNumber} &mdash; {episode.title}</p>

        {validationError && (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {validationError}
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Episode Number */}
            <div>
              <label className={labelCls}>Episode Number</label>
              <input type="number" value={epNumber} onChange={(e) => setEpNumber(Number(e.target.value))} className={inputCls} min={1} />
            </div>
            {/* Episode Title */}
            <div>
              <label className={labelCls}>Episode Title</label>
              <input type="text" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} className={inputCls} placeholder="Enter title" />
            </div>
          </div>

          {/* Access Type */}
          <div>
            <label className={labelCls}>Access Type</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" name="accessType" checked={accessType === "free"} onChange={() => setAccessType("free")} className="accent-indigo-600" /> Free
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" name="accessType" checked={accessType === "paid"} onChange={() => setAccessType("paid")} className="accent-indigo-600" /> Paid
              </label>
            </div>
            {accessType === "paid" && (
              <div className="mt-2">
                <label className="block text-xs text-gray-400 mb-1">Price (coins)</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputCls + " max-w-[160px]"} min={1} />
              </div>
            )}
          </div>

          {/* Publishing Status */}
          <div>
            <label className={labelCls}>Publishing Status</label>
            <div className="flex items-center gap-4">
              {(["immediate", "scheduled", "draft"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer capitalize">
                  <input type="radio" name="publishMode" checked={publishMode === mode} onChange={() => setPublishMode(mode)} className="accent-indigo-600" />
                  {mode}
                </label>
              ))}
            </div>
            {publishMode === "scheduled" && (
              <div className="mt-2">
                <label className="block text-xs text-gray-400 mb-1">Scheduled Date</label>
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={inputCls + " max-w-[260px]"} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── M2-02: Assign Categories Modal ──────────────────────
function EditCategoriesModal({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const GENRES = ["Romance", "Thriller", "Comedy", "Fantasy", "Horror", "Action", "Drama"];
  const REGIONS = ["North America", "Southeast Asia", "Europe", "Latin America", "Middle East"];
  const TAGS = ["Trending", "New Release", "Editor's Pick", "Binge-worthy", "Classic"];

  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Romance", "Drama"]);
  const [selectedRegion, setSelectedRegion] = useState("North America");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Trending", "New Release"]);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const checkboxCls = "accent-indigo-600 h-4 w-4 rounded cursor-pointer";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#1a1a2e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose} />
        <h2 className="text-lg font-bold text-white mb-1">Assign Categories</h2>
        <p className="text-sm text-gray-500 mb-6">Episode {episode.episodeNumber} &mdash; {episode.title}</p>

        <div className="space-y-6">
          {/* Genre */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Genre</h3>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <label key={g} className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-[#13131d] px-3 py-2 text-sm text-gray-300 cursor-pointer hover:border-gray-600 transition-colors">
                  <input type="checkbox" checked={selectedGenres.includes(g)} onChange={() => toggleItem(selectedGenres, g, setSelectedGenres)} className={checkboxCls} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Region</h3>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r} className="bg-[#1a1a2e]">{r}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <label key={t} className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-[#13131d] px-3 py-2 text-sm text-gray-300 cursor-pointer hover:border-gray-600 transition-colors">
                  <input type="checkbox" checked={selectedTags.includes(t)} onChange={() => toggleItem(selectedTags, t, setSelectedTags)} className={checkboxCls} />
                  {t}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

// ── M2-03: Recommendation Config Modal ──────────────────
function EditRankingsModal({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const SPOTS = ["Homepage Banner", "Trending Section", "New Release", "Editor's Pick", "Category Highlight"];

  const [spot, setSpot] = useState(SPOTS[0]);
  const [dramaSearch, setDramaSearch] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";
  const inputCls = "w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#1a1a2e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose} />
        <h2 className="text-lg font-bold text-white mb-1">Recommendation Config</h2>
        <p className="text-sm text-gray-500 mb-6">Episode {episode.episodeNumber} &mdash; {episode.title}</p>

        <div className="space-y-5">
          {/* Recommendation Spot */}
          <div>
            <label className={labelCls}>Recommendation Spot</label>
            <select value={spot} onChange={(e) => setSpot(e.target.value)} className={inputCls}>
              {SPOTS.map((s) => (
                <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>
              ))}
            </select>
          </div>

          {/* Drama Search */}
          <div>
            <label className={labelCls}>Drama Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={dramaSearch} onChange={(e) => setDramaSearch(e.target.value)} placeholder="Search for a drama..." className={inputCls + " pl-10"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sort Order */}
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} min={1} />
            </div>
            {/* Status Toggle */}
            <div>
              <label className={labelCls}>Status</label>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-gray-700 bg-[#13131d] text-gray-400"
                }`}
              >
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-600"}`} />
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
            </div>
            {/* End Time */}
            <div>
              <label className={labelCls}>End Time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Configuration Note */}
          <div>
            <label className={labelCls}>Configuration Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note about this configuration..." className={inputCls + " resize-none"} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">Save Config</button>
        </div>
      </div>
    </div>
  );
}

// ── M2-04: Comment Details Modal ────────────────────────
function EditCommentsModal({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const reports: { id: string; reporter: string; reason: string; date: string; status: string }[] = [];

  const statusCls = (s: string) =>
    s === "Pending" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#1a1a2e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose} />
        <h2 className="text-lg font-bold text-white mb-1">Comment Details</h2>
        <p className="text-sm text-gray-500 mb-6">Episode {episode.episodeNumber} &mdash; {episode.title}</p>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-gray-800 bg-[#13131d] p-4">
            <h3 className="text-xs font-medium uppercase text-gray-500 mb-3">Comment Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Comment ID</span><span className="text-white font-mono">CMT-48291</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Episode</span><span className="text-white">Ep {episode.episodeNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Timestamp</span><span className="text-white">2025-12-10 14:32</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#13131d] p-4">
            <h3 className="text-xs font-medium uppercase text-gray-500 mb-3">User Info</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-sm font-bold">JD</div>
              <div>
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-gray-500">john.doe@example.com</p>
              </div>
            </div>
            <span className="inline-flex rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">Premium User</span>
          </div>
        </div>

        {/* Comment Content */}
        <div className="mb-6">
          <h3 className="text-xs font-medium uppercase text-gray-500 mb-3">Comment Content</h3>
          <div className="rounded-xl border border-gray-800 bg-[#13131d] p-4">
            <p className="text-sm text-gray-300 leading-relaxed">This episode was absolutely amazing! The plot twist at the end caught me completely off guard. Can&apos;t wait for the next one. The chemistry between the leads is incredible and the cinematography keeps getting better each episode.</p>
            <div className="mt-3 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-2.5 py-1 text-xs text-pink-400">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                247 Likes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                18 Replies
              </span>
            </div>
          </div>
        </div>

        {/* Report History */}
        <div className="mb-6">
          <h3 className="text-xs font-medium uppercase text-gray-500 mb-3">Report History</h3>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-[#13131d]">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Report ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Reporter</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-300">{r.id}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-300">{r.reporter}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-300">{r.reason}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-400">{r.date}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button onClick={onClose} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">Delete Comment</button>
          <button onClick={onClose} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors">Hide Comment</button>
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function EpisodesPage() {
  const { id: dramaId } = useParams();
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalEpisode, setModalEpisode] = useState<Episode | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [errTip, setErrTip] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const fetchEpisodes = useCallback(async () => {
    try {
      const res: any = await adminApi.getEpisodes(dramaId as string);
      const items = res.data?.episodes || res.data || [];
      setEpisodes(items.map((ep: any) => {
        const s = (ep.status || "").toLowerCase();
        const status: EpisodeStatus = s === "published" ? "Published" : s === "processing" ? "Processing" : s === "failed" ? "Failed" : "Draft";
        return {
          id: ep._id || ep.id,
          episodeNumber: ep.episodeNumber || 0,
          title: ep.title || "",
          cover: ep.thumbnail || ep.cover || "",
          duration: ep.duration || 0,
          status,
          errorMessage: ep.errorMessage,
          plays: ep.plays || ep.viewCount || 0,
          monetization: ep.isFree ? { type: "free" as const } : { type: "paid" as const, price: ep.unlockPrice || 30 },
          createdAt: ep.createdAt ? new Date(ep.createdAt).toISOString().slice(0, 10) : "",
        };
      }));
    } catch {
      setEpisodes([]);
    }
  }, [dramaId]);

  useEffect(() => { fetchEpisodes(); }, [fetchEpisodes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const togglePublish = useCallback(async (id: string) => {
    const ep = episodes.find((e) => e.id === id);
    if (!ep) return;
    const newStatus = ep.status === "Published" ? "draft" : "published";
    try {
      await adminApi.updateEpisode(id, { status: newStatus });
      fetchEpisodes();
    } catch {
      setEpisodes((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: (e.status === "Published" ? "Draft" : "Published") as EpisodeStatus }
            : e
        )
      );
    }
    setActionMenuId(null);
  }, [episodes, fetchEpisodes]);

  const handleSaveEpisode = useCallback(async (id: string, data: any) => {
    await adminApi.updateEpisode(id, data);
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleDeleteEpisode = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode? The video will also be removed from cloud storage.")) return;
    try {
      await adminApi.deleteEpisode(id);
      fetchEpisodes();
    } catch {
      // silently fail
    }
    setActionMenuId(null);
  }, [fetchEpisodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return episodes;
    const q = search.toLowerCase();
    return episodes.filter(
      (ep) => ep.title.toLowerCase().includes(q) || ep.episodeNumber.toString().includes(q)
    );
  }, [search, episodes]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const rows = filtered.slice((page - 1) * perPage, page * perPage);
  const total = episodes.length;
  const dur = fmtTotal(episodes);
  const issues = episodes.filter((e) => e.status === "Failed" || e.status === "Processing").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/admin/dramas/${dramaId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          &larr; Back to Drama
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-white">Episode Management</h1>
        <p className="text-sm text-gray-500">Drama ID: {dramaId}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800">
          <p className="text-sm text-gray-400">Total Episodes</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-xs text-emerald-400">+3 this week</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800">
          <p className="text-sm text-gray-400">Total Duration</p>
          <p className="mt-1 text-2xl font-bold text-white">{dur}</p>
        </div>
        <div className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800">
          <p className="text-sm text-gray-400">Processing Status</p>
          <div className="mt-1">
            {issues === 0 ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-sm font-medium text-emerald-400">Healthy</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-500/20 px-2.5 py-0.5 text-sm font-medium text-red-400">{issues} Issue{issues > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search episodes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-800 bg-[#1a1a2e] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none"
          />
        </div>
        <button className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Manage Categories</button>
        <button className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Bulk Upload</button>
        <button className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">Ranking Config</button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-[#1a1a2e] border border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="w-10 px-3 py-3" />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cover</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ep#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plays</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Monetization</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">No episodes found</td>
                </tr>
              ) : (
                rows.map((ep) => (
                  <tr key={ep.id} className={`hover:bg-white/[0.02] transition-colors ${ROW_CLS[ep.status]}`}>
                    {/* Drag Handle */}
                    <td className="px-3 py-3 text-center">
                      <span className="cursor-grab text-gray-600 select-none text-sm" title="Drag to reorder">&#8942;&#8942;</span>
                    </td>

                    {/* Cover */}
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-20 rounded-md bg-gray-800 flex items-center justify-center overflow-hidden">
                        <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </td>

                    {/* Ep# */}
                    <td className="px-4 py-3 text-sm font-medium text-white">{ep.episodeNumber}</td>

                    {/* Title */}
                    <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">{ep.title}</td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-sm text-gray-400">{fmtDur(ep.duration)}</td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[ep.status]}`}
                          onMouseEnter={() => ep.status === "Failed" && ep.errorMessage && setErrTip(ep.id)}
                          onMouseLeave={() => setErrTip(null)}
                        >
                          {ep.status}
                        </span>
                        {ep.status === "Failed" && errTip === ep.id && ep.errorMessage && (
                          <div className="absolute bottom-full left-0 mb-2 z-10 w-64 rounded-lg bg-gray-900 border border-gray-700 p-2 text-xs text-red-300 shadow-lg">
                            {ep.errorMessage}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Plays */}
                    <td className="px-4 py-3 text-sm text-gray-400">{fmtPlays(ep.plays)}</td>

                    {/* Monetization */}
                    <td className="px-4 py-3 text-sm">
                      {ep.monetization.type === "free" ? (
                        <span className="text-emerald-400">Free</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <text x="10" y="14" textAnchor="middle" fontSize="10" fill="currentColor">$</text>
                          </svg>
                          {ep.monetization.price}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end" ref={actionMenuId === ep.id ? actionMenuRef : undefined}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === ep.id ? null : ep.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {actionMenuId === ep.id && (
                          <div className="absolute right-8 z-50 mt-1 w-48 rounded-lg border border-gray-700 bg-[#1a1a2e] py-1 shadow-xl">
                            {/* Publish/Unpublish */}
                            <button
                              onClick={() => togglePublish(ep.id)}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                              {ep.status === "Published" ? (
                                <>
                                  <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Publish
                                </>
                              )}
                            </button>

                            {/* Edit Episode Info */}
                            <button
                              onClick={() => { setActionMenuId(null); setModalEpisode(ep); setActiveModal("editInfo"); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit Info
                            </button>

                            <div className="my-1 border-t border-gray-800" />

                            {/* Edit Categories */}
                            <button
                              onClick={() => { setActionMenuId(null); setModalEpisode(ep); setActiveModal("editCategories"); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Edit Categories
                            </button>

                            {/* Edit Rankings */}
                            <button
                              onClick={() => { setActionMenuId(null); setModalEpisode(ep); setActiveModal("editRankings"); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Edit Rankings
                            </button>

                            {/* Edit Comments */}
                            <button
                              onClick={() => { setActionMenuId(null); setModalEpisode(ep); setActiveModal("editComments"); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Edit Comments
                            </button>

                            <div className="my-1 border-t border-gray-800" />

                            {/* Delete Episode */}
                            <button
                              onClick={() => handleDeleteEpisode(ep.id)}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Episode
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="rounded border border-gray-700 bg-transparent px-2 py-1 text-sm text-gray-300 focus:outline-none"
            >
              {PER_PAGE_OPTS.map((n) => (
                <option key={n} value={n} className="bg-[#1a1a2e]">{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>
              {filtered.length === 0
                ? "0"
                : `${(page - 1) * perPage + 1}-${Math.min(page * perPage, filtered.length)}`}{" "}
              of {filtered.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "editInfo" && modalEpisode && (
        <EditInfoModal episode={modalEpisode} onSave={handleSaveEpisode} onClose={() => { setActiveModal(null); setModalEpisode(null); }} />
      )}
      {activeModal === "editCategories" && modalEpisode && (
        <EditCategoriesModal episode={modalEpisode} onClose={() => { setActiveModal(null); setModalEpisode(null); }} />
      )}
      {activeModal === "editRankings" && modalEpisode && (
        <EditRankingsModal episode={modalEpisode} onClose={() => { setActiveModal(null); setModalEpisode(null); }} />
      )}
      {activeModal === "editComments" && modalEpisode && (
        <EditCommentsModal episode={modalEpisode} onClose={() => { setActiveModal(null); setModalEpisode(null); }} />
      )}
    </div>
  );
}
