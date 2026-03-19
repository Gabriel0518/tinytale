"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronsLeft, ChevronsRight, Edit3, Filter, Search, Send, TrendingUp, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { CREATOR_DRAMA_FILTERS, getCreatorDramaStatusMeta, normalizeCreatorDramaStatus } from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorDramaListItem } from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

function formatRelativeTime(
  value: string | undefined,
  formatRelative: ReturnType<typeof useCreatorI18n>["formatRelativeTime"],
  t: ReturnType<typeof useCreatorI18n>["t"]
) {
  if (!value) return t("Updated recently");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("Updated recently");
  return `${t("Updated")} ${formatRelative(date, "short")}`;
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
  const { t, formatNumber, formatRelativeTime: formatRelative } = useCreatorI18n();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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
        status: CREATOR_DRAMA_FILTERS.find((item) => item.key === status)?.apiStatus || status,
        sort,
        page,
        limit: 10,
      });
      setList(response.data?.dramas || []);
      setTotal(Number(response.data?.total || 0));
      setTotalPages(Math.max(1, Number(response.data?.totalPages || 1)));
    } catch (err: any) {
      setError(err?.message || t("Failed to load dramas"));
      setList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, status, t, token]);

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
    async (id: string, action: "archive" | "unarchive" | "review" | "delete") => {
      if (!token) return;
      setError("");
      try {
        if (
          action === "delete" &&
          typeof window !== "undefined" &&
          !window.confirm(t("Delete this drama permanently? All synced episodes, subtitles, and videos will be removed."))
        ) {
          return;
        }

        setActionLoadingId(id);
        if (action === "archive") await creatorApi.archiveDrama(token, id);
        if (action === "unarchive") await creatorApi.unarchiveDrama(token, id);
        if (action === "review") await creatorApi.submitDramaForReview(token, id);
        if (action === "delete") await creatorApi.deleteDrama(token, id);
        await fetchList();
      } catch (err: any) {
        setError(err?.message || t("Action failed"));
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchList, t, token]
  );

  const pagingText = useMemo(() => {
    if (total <= 0) return t("Showing 0 entries");
    const from = (page - 1) * 10 + 1;
    const to = Math.min(page * 10, total);
    return t("Showing __ARG_0__ to __ARG_1__ of __ARG_2__ entries", from, to, total);
  }, [page, t, total]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-[#0f172a] md:text-[34px]">{t("Drama Management")}</h1>
          <p className="mt-1 max-w-4xl text-[13px] leading-6 text-[#64748b]">{t("Manage creator dramas, episode uploads, and review submissions. Review-facing status labels are aligned to the latest creator documentation.")}</p>
        </div>

        <Link
          href={localizePath("/creator/dramas/new", locale)}
          className="inline-flex items-center gap-2 rounded-[20px] bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white shadow-[0px_10px_15px_-3px_rgba(24,118,242,0.2),0px_4px_6px_-4px_rgba(24,118,242,0.2)] hover:bg-[#1669da]"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {t("New Story")}
        </Link>
      </div>

      <section className="space-y-6 rounded-[16px] bg-transparent">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={onSearchSubmit} className="relative min-w-[320px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("Search dramas by title, keyword or tag...")}
              className="h-10 w-full rounded-[20px] border border-transparent bg-white pl-12 pr-4 text-[13px] text-[#0f172a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#94a3b8] focus:border-[#bfdbfe]"
            />
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-medium text-[#334155]"
            >
              <Filter className="h-3.5 w-3.5" />
              {t("Filters")}
            </button>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-[14px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-medium text-[#334155] outline-none"
            >
              <option value="recent">{t("Recent")}</option>
              <option value="views">{t("Most Views")}</option>
              <option value="title">{t("Title")}</option>
              <option value="oldest">{t("Oldest")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {CREATOR_DRAMA_FILTERS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold ${
                  active ? "bg-[#1876f2] text-white" : "border border-[#e2e8f0] bg-white text-[#475569]"
                }`}
              >
                {t(tab.label)}
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
              <tr className="border-b border-[#f1f5f9] bg-white text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                <th className="px-5 py-3.5">{t("Title")}</th>
                <th className="px-5 py-3.5">{t("Status")}</th>
                <th className="px-5 py-3.5">{t("Views")}</th>
                <th className="px-5 py-3.5 text-center">{t("Episodes")}</th>
                <th className="px-5 py-3.5 text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#64748b]">
                    {t("Loading dramas...")}
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#64748b]">
                    {t("No dramas yet. Create your first story.")}
                  </td>
                </tr>
              ) : (
                list.map((item, index) => {
                  const statusUi = getCreatorDramaStatusMeta(item);
                  const normalizedStatus = normalizeCreatorDramaStatus(item);
                  const hasEpisodeRevision = Boolean(item.needsEpisodeRevision && Number(item.rejectedEpisodeCount || 0) > 0);
                  return (
                    <tr key={item._id} className="border-t border-[#f8fafc] text-[13px] text-[#0f172a]">
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-[14px]" style={{ backgroundImage: rowGradientSeed(index) }} />
                          <div>
                            <p className="font-semibold text-[#0f172a]">{item.title}</p>
                            <p className="text-xs text-[#64748b]">
                              {formatRelativeTime(item.updatedAt || item.createdAt, formatRelative, t)}
                            </p>
                            <p className="mt-1 text-xs text-[#94a3b8]">{t(statusUi.helper)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusUi.className}`}>{t(statusUi.label)}</span>
                      </td>
                      <td className="px-5 py-4.5 text-[13px] text-[#475569]">{formatNumber(item.views)}</td>
                      <td className="px-5 py-4.5 text-center text-[13px] text-[#475569]">{formatNumber(item.episodes)}</td>
                      <td className="px-5 py-4.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={localizePath(`/creator/dramas/${item._id}/episodes`, locale)}
                            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {t("Edit")}
                          </Link>

                          {hasEpisodeRevision ? (
                            <Link
                              href={localizePath(`/creator/dramas/${item._id}/episodes?mode=revision`, locale)}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#be123c] hover:bg-[#fff1f2]"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {t("Modify")}
                            </Link>
                          ) : null}

                          {(normalizedStatus === "draft" || (normalizedStatus === "rejected" && !hasEpisodeRevision)) ? (
                            <button
                              type="button"
                              disabled={actionLoadingId === item._id}
                              onClick={() => performRowAction(item._id, "review")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#0f766e] hover:bg-[#f0fdfa] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {normalizedStatus === "rejected" ? t("Resubmit") : t("Submit")}
                            </button>
                          ) : null}

                          {normalizedStatus === "archived" ? (
                            <button
                              type="button"
                              disabled={actionLoadingId === item._id}
                              onClick={() => performRowAction(item._id, "unarchive")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#1d4ed8] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              {t("Unarchive")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoadingId === item._id}
                              onClick={() => performRowAction(item._id, "archive")}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              {t("Archive")}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoadingId === item._id}
                            onClick={() => performRowAction(item._id, "delete")}
                            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#b91c1c] hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("Delete")}
                          </button>
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
