"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

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

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_support: "Waiting Support",
  waiting_creator: "Waiting You",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#eff6ff] text-[#1d4ed8]",
  in_progress: "bg-[#eef2ff] text-[#4338ca]",
  waiting_support: "bg-[#fefce8] text-[#a16207]",
  waiting_creator: "bg-[#fff7ed] text-[#c2410c]",
  resolved: "bg-[#ecfdf5] text-[#047857]",
  closed: "bg-[#f1f5f9] text-[#475569]",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-[#64748b]",
  medium: "text-[#0369a1]",
  high: "text-[#c2410c]",
  urgent: "text-[#b91c1c]",
};

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
  }, [token, page, status, keyword]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: `All (${Object.values(statusCounts).reduce((sum, count) => sum + Number(count || 0), 0)})` },
      { value: "open", label: `Open (${statusCounts.open || 0})` },
      { value: "in_progress", label: `In Progress (${statusCounts.in_progress || 0})` },
      { value: "waiting_support", label: `Waiting Support (${statusCounts.waiting_support || 0})` },
      { value: "resolved", label: `Resolved (${statusCounts.resolved || 0})` },
      { value: "closed", label: `Closed (${statusCounts.closed || 0})` },
    ],
    [statusCounts]
  );

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black leading-[1.1] tracking-[-0.02em] text-[#0f172a] md:text-[42px]">Support Tickets</h1>
          <p className="mt-2 text-sm text-[#64748b]">Track your support requests and continue conversations with creator support.</p>
        </div>

        <Link
          href={localizePath("/creator/tickets/new", locale)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1876f2] px-4 py-2 text-sm font-bold text-white hover:bg-[#1669da]"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[320px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Search ticket subject"
              className="h-10 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] pl-10 pr-3 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
            />
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#334155] outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">{error}</div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e2e8f0]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b]">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="border-t border-[#e2e8f0] text-sm text-[#0f172a]">
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-[#64748b]">{ticket.ticketNo} · {ticket.category}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status] || "bg-[#f1f5f9] text-[#475569]"}`}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className={`px-4 py-4 align-top text-xs font-semibold uppercase ${PRIORITY_STYLES[ticket.priority] || "text-[#475569]"}`}>
                      {ticket.priority}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-[#64748b]">{ticket.messageCount}</td>
                    <td className="px-4 py-4 align-top text-xs text-[#64748b]">{formatTime(ticket.updatedAt)}</td>
                    <td className="px-4 py-4 align-top text-right">
                      <Link
                        href={localizePath(`/creator/tickets/${ticket._id}`, locale)}
                        className="text-xs font-semibold text-[#1876f2] hover:text-[#1669da]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-[#64748b]">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
