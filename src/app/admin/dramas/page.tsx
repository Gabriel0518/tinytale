"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminApi } from "@/lib/adminApi";
import EditDramaModal from "./components/EditDramaModal";
import DeleteDramaConfirmModal from "./components/DeleteDramaConfirmModal";

// ── Types ──────────────────────────────────────────────
type DramaStatus = "Published" | "Draft" | "Suspended";

interface Drama {
  id: string;
  code: string;
  title: string;
  cover: string;
  horizontalCover?: string;
  description?: string;
  categories?: string[];
  regions?: string[];
  tags?: string[];
  activity?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  monetizationModel?: "free" | "partial" | "premium";
  freeEpisodeCount?: number;
  defaultPrice?: number;
  vipEarlyAccess?: boolean;
  genre: string;
  episodes: number;
  status: DramaStatus;
  totalViews: number;
  lastUpdated: string;
}

const ALL_GENRES = ["Romance", "Thriller", "Fantasy", "Sci-Fi"];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

const STATUS_STYLES: Record<DramaStatus, string> = {
  Published: "bg-green-500/20 text-green-400",
  Draft: "bg-gray-500/20 text-gray-400",
  Suspended: "bg-red-500/20 text-red-400",
};

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Component ──────────────────────────────────────────
export default function DramaManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DramaStatus>("All");
  const [genreFilter, setGenreFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null);
  const [deletingDrama, setDeletingDrama] = useState<Drama | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const fetchDramas = useCallback(async () => {
    try {
      const res: any = await adminApi.getDramas({ page: 1, limit: 100 });
      const items = res.data?.dramas || res.data || [];
      setDramas(items.map((d: any) => ({
        id: d._id || d.id,
        code: d.code || `DR-${(d._id || d.id || "").slice(-6)}`,
        title: d.title || "",
        cover: d.cover || "",
        horizontalCover: d.horizontalCover || "",
        description: d.description || "",
        categories: Array.isArray(d.categories) ? d.categories : [],
        regions: Array.isArray(d.regions) ? d.regions : [],
        tags: Array.isArray(d.tags) ? d.tags : [],
        activity: d.activity || "none",
        seoTitle: d.seoTitle || "",
        seoDescription: d.seoDescription || "",
        seoKeywords: d.seoKeywords || "",
        monetizationModel: d.monetizationModel || "partial",
        freeEpisodeCount: Number.isFinite(d.freeEpisodeCount) ? d.freeEpisodeCount : 3,
        defaultPrice: Number.isFinite(d.defaultPrice) ? d.defaultPrice : 15,
        vipEarlyAccess: Boolean(d.vipEarlyAccess),
        genre: (d.categories && d.categories[0]) || d.genre || "Other",
        episodes: d.totalEpisodes || d.episodes || 0,
        status: d.status === "published" ? "Published" : d.status === "suspended" ? "Suspended" : "Draft",
        totalViews: d.viewCount || d.totalViews || 0,
        lastUpdated: d.updatedAt ? new Date(d.updatedAt).toISOString().slice(0, 10) : "",
      })));
    } catch {
      setDramas([]);
    }
  }, []);

  useEffect(() => { fetchDramas(); }, [fetchDramas]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openEditDrama = useCallback(async (drama: Drama) => {
    setActionMenuId(null);
    try {
      const res: any = await adminApi.getDrama(drama.id);
      const detail = res?.data || {};
      const rawEpisodes = Array.isArray(detail.episodes) ? detail.episodes : [];
      setEditingDrama({
        ...drama,
        title: detail.title || drama.title,
        cover: detail.cover || drama.cover,
        horizontalCover: detail.horizontalCover || drama.horizontalCover || "",
        description: detail.description || drama.description || "",
        categories: Array.isArray(detail.categories) ? detail.categories : (drama.categories || []),
        regions: Array.isArray(detail.regions) ? detail.regions : (drama.regions || []),
        tags: Array.isArray(detail.tags) ? detail.tags : (drama.tags || []),
        activity: detail.activity || drama.activity || "none",
        seoTitle: detail.seoTitle || drama.seoTitle || "",
        seoDescription: detail.seoDescription || drama.seoDescription || "",
        seoKeywords: detail.seoKeywords || drama.seoKeywords || "",
        monetizationModel: detail.monetizationModel || drama.monetizationModel || "partial",
        freeEpisodeCount: Number.isFinite(detail.freeEpisodeCount) ? detail.freeEpisodeCount : (drama.freeEpisodeCount ?? 3),
        defaultPrice: Number.isFinite(detail.defaultPrice) ? detail.defaultPrice : (drama.defaultPrice ?? 15),
        vipEarlyAccess: detail.vipEarlyAccess !== undefined ? Boolean(detail.vipEarlyAccess) : Boolean(drama.vipEarlyAccess),
        episodes: rawEpisodes.length > 0 ? rawEpisodes.length : (detail.totalEpisodes || drama.episodes || 0),
      });
    } catch {
      setEditingDrama(drama);
    }
  }, []);

  const togglePublish = useCallback(async (drama: Drama) => {
    const newStatus = drama.status === "Published" ? "draft" : "published";
    try {
      await adminApi.updateDrama(drama.id, { status: newStatus });
      fetchDramas();
    } catch {
      setDramas((prev) =>
        prev.map((d) =>
          d.id === drama.id
            ? { ...d, status: (d.status === "Published" ? "Draft" : "Published") as DramaStatus }
            : d
        )
      );
    }
    setActionMenuId(null);
  }, [fetchDramas]);

  const handleDelete = useCallback(async () => {
    if (!deletingDrama) return;
    try {
      setDeleteError(null);
      setDeleteSubmitting(true);
      await adminApi.deleteDrama(deletingDrama.id);
      setDeletingDrama(null);
      fetchDramas();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete drama.";
      setDeleteError(message);
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deletingDrama, fetchDramas]);

  const filtered = useMemo(() => {
    return dramas.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || d.status === statusFilter;
      const matchesGenre = genreFilter === "All" || d.genre === genreFilter;
      return matchesSearch && matchesStatus && matchesGenre;
    });
  }, [search, statusFilter, genreFilter, dramas]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + rowsPerPage);
  const showingFrom = totalResults === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(startIdx + rowsPerPage, totalResults);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-300 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span>Content</span>
        <span>/</span>
        <span className="text-gray-300">Drama Management</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drama Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your video dramas, episodes, and publication status.
          </p>
        </div>
        <Link
          href="/admin/dramas/create"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create New Drama
        </Link>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      {/* Filters Card */}
      <div className="rounded-xl bg-[#1a1a2e] p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by ID or Title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-800 bg-[#13131d] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "All" | DramaStatus);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-800 bg-[#13131d] px-3 py-2 text-sm text-gray-300 outline-none transition-colors focus:border-indigo-600"
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* Genre Filter */}
          <select
            value={genreFilter}
            onChange={(e) => {
              setGenreFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-800 bg-[#13131d] px-3 py-2 text-sm text-gray-300 outline-none transition-colors focus:border-indigo-600"
          >
            <option value="All">All Genres</option>
            {ALL_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* More Filters */}
          <button className="rounded-lg border border-gray-800 bg-[#13131d] px-3 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300">
            More Filters
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl bg-[#1a1a2e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cover
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Drama Title
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Episodes
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Views
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No dramas found.
                  </td>
                </tr>
              ) : (
                paginated.map((drama) => (
                  <tr
                    key={drama.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Cover */}
                    <td className="px-6 py-3">
                      <div className="h-14 w-10 overflow-hidden rounded-md bg-gray-800">
                        <Image
                          src={drama.cover}
                          alt={drama.title}
                          width={40}
                          height={56}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                    </td>

                    {/* Title + Code */}
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-white">
                        {drama.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        #{drama.code}
                      </p>
                    </td>

                    {/* Episodes */}
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {drama.episodes}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[drama.status]}`}
                      >
                        {drama.status}
                      </span>
                    </td>

                    {/* Total Views */}
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {formatViews(drama.totalViews)}
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {drama.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div
                        className="relative"
                        ref={actionMenuId === drama.id ? actionMenuRef : undefined}
                      >
                        <button
                          onClick={() =>
                            setActionMenuId(actionMenuId === drama.id ? null : drama.id)
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                          title="Actions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {actionMenuId === drama.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-800 bg-[#1a1a2e] py-1 shadow-xl">
                            <button
                              onClick={() => togglePublish(drama)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5"
                            >
                              {drama.status === "Published" ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                void openEditDrama(drama);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Drama
                            </button>
                            <Link
                              href={`/admin/dramas/${drama.id}/episodes`}
                              onClick={() => setActionMenuId(null)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                              Episodes
                            </Link>
                            <div className="my-1 border-t border-gray-800" />
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingDrama(drama);
                                setActionMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing {showingFrom} to {showingTo} of {totalResults} results
          </p>

          <div className="flex items-center gap-4">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-800 bg-[#13131d] px-2 py-1 text-sm text-gray-300 outline-none focus:border-indigo-600"
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] rounded-md px-2 py-1 text-sm font-medium transition-colors ${
                      page === safePage
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:bg-white/5"
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
                disabled={safePage >= totalPages}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteDramaConfirmModal
        open={Boolean(deletingDrama)}
        dramaTitle={deletingDrama?.title}
        submitting={deleteSubmitting}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeletingDrama(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Edit Drama Modal */}
      {editingDrama && (
        <EditDramaModal
          drama={editingDrama}
          onClose={() => setEditingDrama(null)}
          onSave={async (updated) => {
            try {
              await adminApi.updateDrama(updated.id, updated);
              fetchDramas();
            } catch {
              setDramas((prev) =>
                prev.map((d) => (d.id === updated.id ? updated : d))
              );
            }
            setEditingDrama(null);
          }}
        />
      )}
    </div>
  );
}
