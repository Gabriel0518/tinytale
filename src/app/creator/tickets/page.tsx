"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, Plus, Search } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import {
  getCreatorTicketCategoryLabel,
  getCreatorTicketPriorityClassName,
  getCreatorTicketStatusClassName,
  getCreatorTicketStatusLabel,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";

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

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreatorTicketsPage() {
  const locale = useLocale();
  const { token } = useAuth();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [tickets, setTickets] = useState<TicketListItem[]>([]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    creatorApi
      .getTickets(token, { page, limit: 10, status, keyword })
      .then((res: any) => {
        if (cancelled) return;
        setTickets(res?.data?.tickets || []);
        setTotalPages(Math.max(1, Number(res?.data?.totalPages || 1)));
        setStatusCounts(res?.data?.statusCounts || {});
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load tickets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keyword, page, status, token]);

  const statusOptions = useMemo(
    () => [
      {
        value: "all",
        label: `All (${Object.values(statusCounts).reduce((sum, count) => sum + Number(count || 0), 0)})`,
      },
      { value: "open", label: `Open (${statusCounts.open || 0})` },
      { value: "in_progress", label: `In Progress (${statusCounts.in_progress || 0})` },
      { value: "waiting_creator", label: `Waiting You (${statusCounts.waiting_creator || 0})` },
      { value: "resolved", label: `Resolved (${statusCounts.resolved || 0})` },
      { value: "closed", label: `Closed (${statusCounts.closed || 0})` },
    ],
    [statusCounts]
  );

  const summaryCards = [
    { label: "Open", value: statusCounts.open || 0, tone: "text-[#1d4ed8] bg-[#eff6ff]" },
    { label: "In Progress", value: statusCounts.in_progress || 0, tone: "text-[#4338ca] bg-[#eef2ff]" },
    { label: "Waiting You", value: statusCounts.waiting_creator || 0, tone: "text-[#c2410c] bg-[#fff7ed]" },
    { label: "Resolved", value: statusCounts.resolved || 0, tone: "text-[#047857] bg-[#ecfdf5]" },
  ];

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Creator Support</p>
          <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[34px]">Support Tickets</h1>
          <p className="mt-2 max-w-4xl text-[13px] leading-6 text-[#64748b]">
            Use creator tickets for settlement disputes, content appeals, DMCA or rights issues, account problems, and upload blockers.
          </p>
        </div>

        <Link
          href={localizePath("/creator/tickets/new", locale)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1669da]"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${card.tone}`}>{card.label}</span>
            <p className="mt-4 text-[28px] font-black tracking-[-0.03em] text-[#0f172a]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-[#475569]">
          Fastest resolution happens when the ticket includes the affected drama title, settlement cycle, review note, bank-account state, or upload error details.
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[320px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Search subject, ticket no, settlement cycle, or drama title"
              className="h-10 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-10 pr-3 text-[13px] text-[#0f172a] outline-none focus:border-[#1876f2]"
            />
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-2xl border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#334155] outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] text-[#9f1239]">{error}</div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e2e8f0]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#64748b]">
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-5 py-6 text-center">
                      <LifeBuoy className="mx-auto h-8 w-8 text-[#94a3b8]" />
                      <p className="mt-3 text-[15px] font-semibold text-[#0f172a]">No tickets found</p>
                      <p className="mt-2 text-[13px] leading-6 text-[#64748b]">
                        Open a new ticket when you need help with settlement disputes, content appeals, or technical blockers.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="border-t border-[#e2e8f0] text-[13px] text-[#0f172a]">
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-[#64748b]">{ticket.ticketNo}</p>
                      {ticket.latestMessage ? (
                        <p className="mt-2 max-w-[320px] truncate text-xs text-[#64748b]">{ticket.latestMessage}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-[#475569]">
                      {getCreatorTicketCategoryLabel(ticket.category as any)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getCreatorTicketStatusClassName(ticket.status)}`}>
                        {getCreatorTicketStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className={`px-4 py-4 align-top text-xs font-semibold uppercase ${getCreatorTicketPriorityClassName(ticket.priority)}`}>
                      {ticket.priority}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-[#64748b]">{formatTime(ticket.updatedAt)}</td>
                    <td className="px-4 py-4 align-top text-right">
                      <Link href={localizePath(`/creator/tickets/${ticket._id}`, locale)} className="text-xs font-semibold text-[#1876f2] hover:text-[#1669da]">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-end gap-3 text-[13px] text-[#475569]">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
