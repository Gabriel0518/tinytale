"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorTicket } from "@/types/creator";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_support: "Waiting Support",
  waiting_creator: "Waiting You",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreatorTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuth();

  const ticketId = String(params?.id || "");

  const [ticket, setTicket] = useState<CreatorTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!token || !ticketId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    creatorApi
      .getTicketById(token, ticketId)
      .then((res: any) => {
        if (cancelled) return;
        setTicket(res?.data || null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load ticket detail");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, ticketId]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    const message = reply.trim();
    if (!message || !token || !ticket) return;

    setReplying(true);
    setError("");

    try {
      const res: any = await creatorApi.replyTicket(token, ticket._id, message);
      setTicket(res?.data || ticket);
      setReply("");
    } catch (err: any) {
      setError(err?.message || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  }

  async function handleCloseTicket() {
    if (!token || !ticket) return;
    setClosing(true);
    setError("");

    try {
      const res: any = await creatorApi.closeTicket(token, ticket._id);
      setTicket(res?.data || ticket);
    } catch (err: any) {
      setError(err?.message || "Failed to close ticket");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(localizePath("/creator/tickets", locale))}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-semibold text-[#334155]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        {loading ? (
          <p className="text-sm text-[#64748b]">Loading ticket...</p>
        ) : error && !ticket ? (
          <p className="text-sm text-[#dc2626]">{error}</p>
        ) : !ticket ? (
          <p className="text-sm text-[#64748b]">Ticket not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black leading-[1.1] tracking-[-0.02em] text-[#0f172a] md:text-[42px]">{ticket.subject}</h1>
                <p className="mt-2 text-sm text-[#64748b]">
                  {ticket.ticketNo} · {ticket.category} · Updated {formatDate(ticket.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-bold text-[#1d4ed8]">
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </span>
                <span className="inline-flex rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold uppercase text-[#475569]">
                  {ticket.priority}
                </span>
                {ticket.status !== "closed" ? (
                  <button
                    type="button"
                    disabled={closing}
                    onClick={handleCloseTicket}
                    className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:opacity-50"
                  >
                    {closing ? "Closing..." : "Close Ticket"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="space-y-4">
                {ticket.messages.map((message, index) => {
                  const creatorMessage = message.senderType === "creator";
                  return (
                    <div key={`${message.createdAt}-${index}`} className="flex flex-col">
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          creatorMessage ? "self-end bg-[#dbeafe] text-[#1e3a8a]" : "self-start bg-white text-[#334155]"
                        }`}
                      >
                        {message.message}
                      </div>
                      <p className={`mt-1 text-xs text-[#64748b] ${creatorMessage ? "text-right" : "text-left"}`}>
                        {creatorMessage ? "You" : "Support"} · {formatDate(message.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}

            {ticket.status !== "closed" ? (
              <form className="mt-5" onSubmit={handleReply}>
                <label className="mb-2 block text-sm font-semibold text-[#334155]">Reply</label>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Write your reply..."
                  className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
                />
                <div className="mt-3 flex justify-end gap-3">
                  <Link
                    href={localizePath("/creator/tickets", locale)}
                    className="rounded-2xl border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#334155]"
                  >
                    Back to list
                  </Link>
                  <button
                    type="submit"
                    disabled={replying || !reply.trim()}
                    className="rounded-2xl bg-[#1876f2] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {replying ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
                This ticket is closed. Create a new ticket if you need more help.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
