"use client";

import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────
type CommentStatus = "Visible" | "Pending" | "Hidden";

interface Comment {
  id: string;
  user: {
    displayName: string;
    handle: string;
    avatarColor: string;
    initials: string;
  };
  content: string;
  drama: string;
  likes: number;
  status: CommentStatus;
  createdAt: string;
}

// ── Mock Data ──────────────────────────────────────────
const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    user: { displayName: "Sophia Chen", handle: "@sophiac", avatarColor: "bg-pink-500", initials: "SC" },
    content: "This drama is absolutely amazing! The plot twists keep me on the edge of my seat every single episode. Can't wait for the next season!",
    drama: "Love in the Moonlight",
    likes: 128,
    status: "Visible",
    createdAt: "2026-02-18T09:30:00Z",
  },
  {
    id: "c2",
    user: { displayName: "Marcus Lee", handle: "@marcusl", avatarColor: "bg-blue-500", initials: "ML" },
    content: "Episode 12 was a masterpiece. The acting is top-notch.",
    drama: "CEO's Secret Wife",
    likes: 64,
    status: "Visible",
    createdAt: "2026-02-17T14:20:00Z",
  },
  {
    id: "c3",
    user: { displayName: "Emily Wang", handle: "@emilyw", avatarColor: "bg-purple-500", initials: "EW" },
    content: "I think this show is overrated. The storyline doesn't make sense after episode 5 and the characters feel flat and one-dimensional.",
    drama: "Revenge of the Heiress",
    likes: 12,
    status: "Pending",
    createdAt: "2026-02-17T11:45:00Z",
  },
  {
    id: "c4",
    user: { displayName: "Jake Rivera", handle: "@jaker", avatarColor: "bg-emerald-500", initials: "JR" },
    content: "Best drama on the platform hands down!",
    drama: "Love in the Moonlight",
    likes: 89,
    status: "Visible",
    createdAt: "2026-02-16T22:10:00Z",
  },
  {
    id: "c5",
    user: { displayName: "Aisha Patel", handle: "@aishap", avatarColor: "bg-orange-500", initials: "AP" },
    content: "Spam link removed by moderator",
    drama: "CEO's Secret Wife",
    likes: 0,
    status: "Hidden",
    createdAt: "2026-02-16T08:30:00Z",
  },
  {
    id: "c6",
    user: { displayName: "David Kim", handle: "@davidk", avatarColor: "bg-cyan-500", initials: "DK" },
    content: "The chemistry between the leads is incredible. Every scene they share together is pure magic. This is what good storytelling looks like.",
    drama: "Midnight Romance",
    likes: 203,
    status: "Visible",
    createdAt: "2026-02-15T16:55:00Z",
  },
  {
    id: "c7",
    user: { displayName: "Luna Torres", handle: "@lunat", avatarColor: "bg-rose-500", initials: "LT" },
    content: "New episode when?? I've been waiting for a week already!",
    drama: "Revenge of the Heiress",
    likes: 34,
    status: "Pending",
    createdAt: "2026-02-15T10:20:00Z",
  },
  {
    id: "c8",
    user: { displayName: "Ryan Nguyen", handle: "@ryann", avatarColor: "bg-indigo-500", initials: "RN" },
    content: "Inappropriate content flagged by community",
    drama: "Love in the Moonlight",
    likes: 2,
    status: "Hidden",
    createdAt: "2026-02-14T19:40:00Z",
  },
  {
    id: "c9",
    user: { displayName: "Mia Johnson", handle: "@miaj", avatarColor: "bg-amber-500", initials: "MJ" },
    content: "Just binged all 24 episodes in one sitting. No regrets whatsoever. This is peak entertainment!",
    drama: "Midnight Romance",
    likes: 156,
    status: "Visible",
    createdAt: "2026-02-14T07:15:00Z",
  },
  {
    id: "c10",
    user: { displayName: "Tyler Brooks", handle: "@tylerb", avatarColor: "bg-teal-500", initials: "TB" },
    content: "The ending of season 1 left me speechless. Absolutely need a season 2.",
    drama: "CEO's Secret Wife",
    likes: 77,
    status: "Pending",
    createdAt: "2026-02-13T13:00:00Z",
  },
];

const DRAMA_OPTIONS = ["All Dramas", "Love in the Moonlight", "CEO's Secret Wife", "Revenge of the Heiress", "Midnight Romance"];
const STATUS_OPTIONS: ("All Status" | CommentStatus)[] = ["All Status", "Visible", "Pending", "Hidden"];
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── SVG Icons (inline) ─────────────────────────────────
function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.31-3.775M6.938 6.938A9.966 9.966 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.043 5.062M6.938 6.938L3 3m3.938 3.938l3.124 3.124M17.062 17.062L21 21m-3.938-3.938l-3.124-3.124M14.121 14.121A3 3 0 009.879 9.879" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {direction === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}

// ── Status Badge ───────────────────────────────────────
const statusBadge: Record<CommentStatus, string> = {
  Visible: "bg-emerald-500/20 text-emerald-400",
  Pending: "bg-yellow-500/20 text-yellow-400",
  Hidden: "bg-gray-500/20 text-gray-400",
};

// ── Page Component ─────────────────────────────────────
export default function CommentsPage() {
  const [keyword, setKeyword] = useState("");
  const [dramaFilter, setDramaFilter] = useState("All Dramas");
  const [statusFilter, setStatusFilter] = useState<"All Status" | CommentStatus>("All Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Filtering ──
  const filtered = useMemo(() => {
    return MOCK_COMMENTS.filter((c) => {
      if (keyword) {
        const q = keyword.toLowerCase();
        const matchesKeyword =
          c.content.toLowerCase().includes(q) ||
          c.user.displayName.toLowerCase().includes(q) ||
          c.user.handle.toLowerCase().includes(q);
        if (!matchesKeyword) return false;
      }
      if (dramaFilter !== "All Dramas" && c.drama !== dramaFilter) return false;
      if (statusFilter !== "All Status" && c.status !== statusFilter) return false;
      if (startDate && new Date(c.createdAt) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(c.createdAt) > end) return false;
      }
      return true;
    });
  }, [keyword, dramaFilter, statusFilter, startDate, endDate]);

  // ── Pagination ──
  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + rowsPerPage);
  const showFrom = totalResults === 0 ? 0 : startIdx + 1;
  const showTo = Math.min(startIdx + rowsPerPage, totalResults);

  // ── Selection ──
  const allOnPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));
  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) {
      paginated.forEach((c) => next.delete(c.id));
    } else {
      paginated.forEach((c) => next.add(c.id));
    }
    setSelectedIds(next);
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Actions (mock) ──
  const handleBulkAction = () => {
    if (selectedIds.size === 0) return;
    alert(`Bulk action on ${selectedIds.size} comment(s)`);
    setSelectedIds(new Set());
  };

  const selectClasses =
    "rounded-lg border border-gray-700 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-300 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 appearance-none cursor-pointer";
  const inputClasses =
    "rounded-lg border border-gray-700 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-300 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-gray-300 cursor-pointer">Content</span>
        <span>/</span>
        <span className="text-white">Comments &amp; Reviews</span>
      </nav>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">Comment Management</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#1a1a2e] p-4">
        {/* Keyword Search */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search comments..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className={`${inputClasses} w-full pl-9`}
          />
        </div>

        {/* Drama Filter */}
        <select
          value={dramaFilter}
          onChange={(e) => { setDramaFilter(e.target.value); setCurrentPage(1); }}
          className={selectClasses}
        >
          {DRAMA_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
          className={selectClasses}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className={`${inputClasses} w-[140px]`}
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className={`${inputClasses} w-[140px]`}
          />
        </div>

        {/* Bulk Action */}
        <button
          onClick={handleBulkAction}
          disabled={selectedIds.size === 0}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Bulk Hide/Delete
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl bg-[#1a1a2e]">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-500"
                />
              </th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 max-w-[300px]">Content</th>
              <th className="px-4 py-3">Drama</th>
              <th className="px-4 py-3">Likes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No comments found matching your filters.
                </td>
              </tr>
            ) : (
              paginated.map((comment) => {
                const isPending = comment.status === "Pending";
                const isHidden = comment.status === "Hidden";
                const rowBg = isPending
                  ? "bg-yellow-900/10"
                  : "";
                const rowOpacity = isHidden ? "opacity-75" : "";

                return (
                  <tr
                    key={comment.id}
                    className={`${rowBg} ${rowOpacity} transition hover:bg-white/[0.02]`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(comment.id)}
                        onChange={() => toggleSelect(comment.id)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-500"
                      />
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${comment.user.avatarColor}`}>
                          {comment.user.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{comment.user.displayName}</p>
                          <p className="truncate text-xs text-gray-500">{comment.user.handle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="px-4 py-3 max-w-[300px]">
                      <p className={`text-sm text-gray-300 line-clamp-2 ${isHidden ? "line-through text-gray-500" : ""}`}>
                        {comment.content}
                      </p>
                    </td>

                    {/* Drama */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">{comment.drama}</span>
                    </td>

                    {/* Likes */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <HeartIcon />
                        <span className="text-sm text-gray-300">{comment.likes}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[comment.status]}`}>
                        {comment.status}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          title="Approve"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          title="Hide"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-yellow-500/10 hover:text-yellow-400"
                        >
                          <EyeOffIcon />
                        </button>
                        <button
                          title="Delete"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
        <span>
          Showing {showFrom} to {showTo} of {totalResults} results
        </span>

        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-gray-700 bg-[#1a1a2e] px-2 py-1 text-sm text-gray-300 focus:border-red-500 focus:outline-none appearance-none cursor-pointer"
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronIcon direction="left" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] rounded-lg px-2 py-1 text-sm font-medium transition ${
                  page === safeCurrentPage
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
