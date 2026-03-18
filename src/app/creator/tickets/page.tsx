"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Ellipsis,
  LifeBuoy,
  MessageSquareDashed,
  Plus,
  Search,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import {
  getCreatorTicketCategoryShortLabel,
  getCreatorTicketPriorityBadgeClassName,
  getCreatorTicketPriorityLabel,
  getCreatorTicketStatusDotClassName,
  getCreatorTicketStatusLabel,
  getCreatorTicketStatusTextClassName,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import { useCreatorI18n } from "../_lib/creator-i18n";

interface TicketListItem {
  _id: string;
  ticketNo: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  lastMessageAt: string;
  updatedAt: string;
  messageCount: number;
  latestMessage: string;
}

const PAGE_SIZE = 4;
const TABLE_GRID = "grid grid-cols-[108px_minmax(0,1.8fr)_minmax(120px,0.95fr)_110px_124px_120px_102px]";

function MetricCard({
  icon,
  title,
  value,
  helper,
  tone,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  helper: string;
  tone: "blue" | "green" | "slate";
  cta?: string;
  href?: string;
}) {
  const toneClassName =
    tone === "blue"
      ? "bg-[#e8f1fd]"
      : tone === "green"
        ? "bg-[#e7f8ef]"
        : "bg-white";

  const iconClassName =
    tone === "blue"
      ? "bg-[#2d7af0] text-white"
      : tone === "green"
        ? "bg-[#14b87a] text-white"
        : "bg-[#334155] text-white";

  return (
    <article className={`rounded-[24px] border border-[#d9e2ef] px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] ${toneClassName}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}>{icon}</div>
      <h3 className="mt-4 text-[14px] font-semibold leading-5 text-[#1e293b]">{title}</h3>
      {value ? <p className="mt-1 text-[36px] font-black leading-none tracking-[-0.04em] text-[#1f6fe5]">{value}</p> : null}
      <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{helper}</p>
      {cta && href ? (
        <Link href={href} className="mt-3 inline-flex text-[13px] font-semibold text-[#2d7af0] transition hover:text-[#165fcc]">
          {cta}
        </Link>
      ) : null}
    </article>
  );
}

export default function CreatorTicketsPage() {
  const locale = useLocale();
  const { t, formatRelativeTime } = useCreatorI18n();
  const { token } = useAuth();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setKeyword(keywordInput.trim());
    }, 280);

    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  const loadTickets = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const res: any = await creatorApi.getTickets(token, {
        page,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
        keyword,
      });
      setTickets(res?.data?.tickets || []);
      setTotal(Number(res?.data?.total || 0));
      setTotalPages(Math.max(1, Number(res?.data?.totalPages || 1)));
      setStatusCounts(res?.data?.statusCounts || {});
    } catch (err: any) {
      setError(err?.message || t("Failed to load tickets"));
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status, t, token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    function handleDocumentClick() {
      setActionTicketId(null);
    }

    if (!actionTicketId) return undefined;
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [actionTicketId]);

  const inProgressCount =
    Number(statusCounts.in_progress || 0) + Number(statusCounts.waiting_support || 0) + Number(statusCounts.waiting_creator || 0);
  const allCount = Object.values(statusCounts).reduce((sum, count) => sum + Number(count || 0), 0);

  const filters = useMemo(
    () => [
      { value: "all", label: "All Tickets", count: allCount },
      { value: "open", label: "Open", count: Number(statusCounts.open || 0) },
      { value: "in_progress", label: "In Progress", count: inProgressCount },
      { value: "resolved", label: "Resolved", count: Number(statusCounts.resolved || 0) },
      { value: "closed", label: "Closed", count: Number(statusCounts.closed || 0) },
    ],
    [allCount, inProgressCount, statusCounts.closed, statusCounts.open, statusCounts.resolved]
  );

  async function handleCloseTicket(ticketId: string) {
    if (!token) return;

    setClosingTicketId(ticketId);
    setError("");

    try {
      await creatorApi.closeTicket(token, ticketId);
      setActionTicketId(null);
      await loadTickets();
    } catch (err: any) {
        setError(err?.message || t("Failed to close ticket"));
      } finally {
        setClosingTicketId(null);
      }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.04em] text-[#18233a]">{t("Support Tickets")}</h1>
          <p className="mt-2 max-w-[620px] text-[15px] leading-7 text-[#70819c]">
            {t("Manage and track your creator support tickets across monetization, content review, platform issues, and account operations.")}
          </p>
        </div>

        <Link
          href={localizePath("/creator/tickets/new", locale)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#2d7af0] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(45,122,240,0.28)] transition hover:bg-[#1d6ee8]"
        >
          <Plus className="h-4 w-4" />
          {t("Create New Ticket")}
        </Link>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#edf2f7] px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-[424px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da0bb]" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder={t("Search by ticket ID or subject...")}
                className="h-[44px] w-full rounded-full border border-[#d9e2ef] bg-[#fbfdff] pl-11 pr-4 text-[14px] text-[#18233a] outline-none transition placeholder:text-[#9aa8bc] focus:border-[#2d7af0]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = filter.value === status;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setStatus(filter.value);
                    }}
                    className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                      active
                        ? "border-[#dbe3ee] bg-[#eef2f6] text-[#1e293b]"
                        : "border-[#dde5f0] bg-white text-[#52637e] hover:border-[#cbd8e6] hover:bg-[#f8fbff]"
                    }`}
                  >
                    {t(filter.label)}
                    {filter.count > 0 ? <span className="ml-1 text-[#8fa0b6]">{filter.count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-b border-[#fee2e2] bg-[#fff5f5] px-6 py-3 text-[13px] text-[#c2410c]">{error}</div>
        ) : null}

        <div className="overflow-x-auto">
          <div className="min-w-[926px]">
            <div className={`${TABLE_GRID} border-b border-[#edf2f7] bg-[#fbfcfe] px-6 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7f90a8]`}>
              <div className="py-5">{t("Ticket ID")}</div>
              <div className="py-5">{t("Subject")}</div>
              <div className="py-5">{t("Category")}</div>
              <div className="py-5">{t("Priority")}</div>
              <div className="py-5 leading-4">{t("Last Update")}</div>
              <div className="py-5">{t("Status")}</div>
              <div className="py-5 text-center">{t("Actions")}</div>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center text-[14px] text-[#64748b]">{t("Loading tickets...")}</div>
            ) : tickets.length === 0 ? (
              <div className="px-6 py-16">
                <div className="flex flex-col items-center rounded-[24px] border border-dashed border-[#d7e1ec] bg-[#fbfdff] px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2d7af0]">
                    <LifeBuoy className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-[18px] font-bold text-[#18233a]">{t("No tickets yet")}</p>
                  <p className="mt-2 max-w-[420px] text-[14px] leading-6 text-[#70819c]">
                    {t("Create a new ticket when you need help with payouts, review feedback, upload blockers, or creator account support.")}
                  </p>
                  <Link
                    href={localizePath("/creator/tickets/new", locale)}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-[14px] bg-[#2d7af0] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1d6ee8]"
                  >
                    {t("Submit New Ticket")}
                  </Link>
                </div>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket._id} className={`${TABLE_GRID} items-center border-b border-[#edf2f7] px-6 text-[14px] text-[#1e293b]`}>
                  <div className="py-5 text-[13px] leading-5 text-[#71819b] break-words">#{ticket.ticketNo}</div>
                  <div className="py-4 pr-4">
                    <Link href={localizePath(`/creator/tickets/${ticket._id}`, locale)} className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#1e293b] transition hover:text-[#2d7af0]">
                      {ticket.subject}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#98a7ba]">{ticket.latestMessage || t("No recent message preview.")}</p>
                  </div>
                  <div className="py-5 text-[14px] text-[#61728e]">{t(getCreatorTicketCategoryShortLabel(ticket.category as any))}</div>
                  <div className="py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] ${getCreatorTicketPriorityBadgeClassName(ticket.priority)}`}>
                      {t(getCreatorTicketPriorityLabel(ticket.priority))}
                    </span>
                  </div>
                  <div className="py-5 pr-4 text-[14px] leading-5 text-[#71819b]">{formatRelativeTime(ticket.updatedAt || ticket.lastMessageAt, "short")}</div>
                  <div className={`flex items-center gap-2 py-5 text-[14px] font-semibold ${getCreatorTicketStatusTextClassName(ticket.status)}`}>
                    <span className={`h-2 w-2 rounded-full ${getCreatorTicketStatusDotClassName(ticket.status)}`} />
                    <span>{t(getCreatorTicketStatusLabel(ticket.status))}</span>
                  </div>
                  <div className="relative flex justify-center py-5">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActionTicketId((current) => (current === ticket._id ? null : ticket._id));
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[#94a3b8] transition hover:bg-[#f5f8fc] hover:text-[#42536b]"
                    >
                      <Ellipsis className="h-5 w-5" />
                    </button>

                    {actionTicketId === ticket._id ? (
                      <div
                        className="absolute right-0 top-12 z-20 min-w-[170px] rounded-2xl border border-[#dbe4ef] bg-white p-2 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link
                          href={localizePath(`/creator/tickets/${ticket._id}`, locale)}
                          className="flex rounded-xl px-3 py-2 text-[13px] font-medium text-[#334155] transition hover:bg-[#f8fbff] hover:text-[#2d7af0]"
                        >
                          {t("View details")}
                        </Link>
                        {ticket.status !== "closed" ? (
                          <button
                            type="button"
                            disabled={closingTicketId === ticket._id}
                            onClick={() => handleCloseTicket(ticket._id)}
                            className="flex w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[#c2410c] transition hover:bg-[#fff7ed] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {closingTicketId === ticket._id ? t("Closing...") : t("Close ticket")}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-5 text-[13px] text-[#70819c]">
          <p>
            {t("Showing __ARG_0__ of __ARG_1__ tickets", tickets.length, total || tickets.length)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe4ef] bg-white text-[#8ea0b6] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe4ef] bg-white text-[#8ea0b6] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          icon={<MessageSquareDashed className="h-5 w-5" />}
          title={t("Average Response Time")}
          value="24h"
          helper={t("Typical first-response SLA for creator support tickets.")}
          tone="blue"
        />
        <MetricCard
          icon={<CircleHelp className="h-5 w-5" />}
          title={t("Resolved Tickets")}
          value={String(Number(statusCounts.resolved || 0) + Number(statusCounts.closed || 0))}
          helper={t("Resolved and closed tickets across your current support history.")}
          tone="green"
        />
        <MetricCard
          icon={<Bot className="h-5 w-5" />}
          title={t("AI Help Center")}
          helper={t("Try the guided help flow before opening a new ticket for routine technical checks.")}
          tone="slate"
          cta={t("Create guided ticket")}
          href={localizePath("/creator/tickets/new", locale)}
        />
      </section>
    </div>
  );
}
