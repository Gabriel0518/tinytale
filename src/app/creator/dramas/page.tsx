"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronsLeft, ChevronsRight, Edit3, Filter, Search, Send, TrendingUp, Archive, ArchiveRestore } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorDramaListItem, CreatorDramaWorkflowStatus } from "@/types/creator";

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Dramas" },
  { key: "published", label: "Published" },
  { key: "under_review", label: "Under Review" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("en-US");
}

function formatRelativeTime(value?: string): string {
  if (!value) return "Updated recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const diffMs = Date.now() - date.getTime();
  const hour = 3600000;
  const day = 24 * hour;

  if (diffMs < hour) return "Updated just now";
  if (diffMs < day) return `Modified ${Math.floor(diffMs / hour)} hours ago`;
  if (diffMs < 30 * day) return `Updated ${Math.floor(diffMs / day)} days ago`;
  return `Updated ${date.toLocaleDateString("en-US")}`;
}

function mapStatusUi(status: CreatorDramaWorkflowStatus): { label: string; className: string } {
  if (status === "published") return { label: "Published", className: "bg-[#dcfce7] text-[#15803d]" };
  if (status === "under_review") return { label: "Under Review", className: "bg-[#fef3c7] text-[#b45309]" };
  if (status === "archived") return { label: "Archived", className: "bg-[#e2e8f0] text-[#475569]" };
  return { label: "Draft", className: "bg-[#f1f5f9] text-[#475569]" };
}

function rowGradientSeed(index: number): string {
  const gradients = [
    "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    "linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)",
    "linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%)",
    "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  ];
  return gradients[index % gradients.length];
}

export default function CreatorDramasPage() {
  const { token } = useAuth();
  const locale = useLocale();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState<CreatorDramaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await creatorApi.getDramas(token, {
        q: search,
        status,
        sort,
        page,
        limit: 10,
      });
      setList(response.data?.dramas || []);
      setTotal(Number(response.data?.total || 0));
      setTotalPages(Math.max(1, Number(response.data?.totalPages || 1)));
    } catch (err: any) {
      setError(err?.message || "Failed to load dramas");
      setList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, search, status, sort, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setPage(1);
      setSearch(searchInput.trim());
    },
    [searchInput]
  );

  const performRowAction = useCallback(
    async (id: string, action: "archive" | "unarchive" | "review" | "publish") => {
      if (!token) return;
      setError("");
      try {
        if (action === "archive") await creatorApi.archiveDrama(token, id);
        if (action === "unarchive") await creatorApi.unarchiveDrama(token, id);
        if (action === "review") await creatorApi.submitDramaForReview(token, id);
        if (action === "publish") await creatorApi.publishDrama(token, id);
        await fetchList();
      } catch (err: any) {
        setError(err?.message || "Action failed");
      }
    },
    [token, fetchList]
  );

  const pagingText = useMemo(() => {
    if (total <= 0) return "Showing 0 entries";
    const from = (page - 1) * 10 + 1;
    const to = Math.min(page * 10, total);
    return `Showing ${from} to ${to} of ${total} entries`;
  }, [page, total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[42px] font-black leading-[1.1] tracking-[-0.03em] text-[#0f172a]">Drama Management</h1>
          <p className="mt-1 text-base text-[#64748b]">Overview and control of your storytelling library</p>
        </div>

        <Link
          href={localizePath("/creator/dramas/new", locale)}
          className="inline-flex items-center gap-2 rounded-[24px] bg-[#1876f2] px-5 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da]"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          New Story
        </Link>
      </div>

      <section className="space-y-6 rounded-[16px] bg-transparent">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={onSearchSubmit} className="relative min-w-[320px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search dramas by title, keyword or tag..."
              className="h-11 w-full rounded-[24px] border border-transparent bg-white pl-12 pr-4 text-sm text-[#0f172a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#94a3b8] focus:border-[#bfdbfe]"
            />
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-[42px] items-center gap-2 rounded-[16px] border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#334155]"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="h-[42px] rounded-[16px] border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#334155] outline-none"
            >
              <option value="recent">Recent</option>
              <option value="views">Most Views</option>
              <option value="title">Title</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                  active ? "bg-[#1876f2] text-white" : "border border-[#e2e8f0] bg-white text-[#475569]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-white text-left text-xs font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4 text-center">Episodes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#64748b]">
                    Loading dramas...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#64748b]">
                    No dramas yet. Create your first story.
                  </td>
                </tr>
              ) : (
                list.map((item, index) => {
                  const statusUi = mapStatusUi(item.status);
                  return (
                    <tr key={item._id} className="border-t border-[#f8fafc] text-sm text-[#0f172a]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-[16px]" style={{ backgroundImage: rowGradientSeed(index) }} />
                          <div>
                            <p className="font-semibold text-[#0f172a]">{item.title}</p>
                            <p className="text-xs text-[#64748b]">{formatRelativeTime(item.updatedAt || item.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusUi.className}`}>{statusUi.label}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#475569]">{formatNumber(item.views)}</td>
                      <td className="px-6 py-5 text-center text-sm text-[#475569]">{formatNumber(item.episodes)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={localizePath(`/creator/dramas/${item._id}/episodes`, locale)}
                            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Link>

                          {item.status === "draft" ? (
                            <button
                              type="button"
                              onClick={() => performRowAction(item._id, "review")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#0f766e] hover:bg-[#f0fdfa]"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Submit
                            </button>
                          ) : null}

                          {item.status === "under_review" ? (
                            <button
                              type="button"
                              onClick={() => performRowAction(item._id, "publish")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#15803d] hover:bg-[#f0fdf4]"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Publish
                            </button>
                          ) : null}

                          {item.status === "archived" ? (
                            <button
                              type="button"
                              onClick={() => performRowAction(item._id, "unarchive")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              Unarchive
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => performRowAction(item._id, "archive")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between border-t border-[#f1f5f9] px-6 py-4 text-xs text-[#64748b]">
            <p>{pagingText}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-[16px] border border-[#e2e8f0] p-2 text-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <span className="rounded-[16px] bg-[#1876f2] px-3 py-2 font-bold text-white">{page}</span>
              <span className="px-1 text-[#475569]">/ {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-[16px] border border-[#e2e8f0] p-2 text-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
