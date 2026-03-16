"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, LifeBuoy } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import {
  getCreatorTicketCategoryDescription,
  getCreatorTicketCategoryLabel,
  getCreatorTicketPriorityClassName,
  getCreatorTicketStatusClassName,
  getCreatorTicketStatusLabel,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import type { CreatorTicket } from "@/types/creator";

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

function getReferenceChecklist(category: string): string[] {
  switch (category) {
    case "payment":
      return ["Settlement cycle or statement ID", "Expected vs actual amount", "Affected title or episode"];
    case "content":
      return ["Drama title", "Review or moderation note", "Requested correction or appeal reason"];
    case "policy":
      return ["Notice number", "Rights holder or claimant", "Links or proof supporting the claim"];
    case "account":
      return ["Creator account email", "Current verification state", "Change or issue being requested"];
    case "technical":
      return ["Upload step that failed", "Exact error text", "Browser, device, or file details"];
    default:
      return ["Blocked workflow", "When it started", "Expected outcome"];
  }
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
        if (!cancelled) {
          setTicket(res?.data || null);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Failed to load ticket detail");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId, token]);

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

  const categoryChecklist = useMemo(() => getReferenceChecklist(ticket?.category || "other"), [ticket?.category]);

  return (
    <div className="space-y-5">
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

      <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        {loading ? (
          <p className="text-sm text-[#64748b]">Loading ticket...</p>
        ) : error && !ticket ? (
          <p className="text-sm text-[#dc2626]">{error}</p>
        ) : !ticket ? (
          <p className="text-sm text-[#64748b]">Ticket not found.</p>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Creator Support</p>
                  <h1 className="mt-2 text-[30px] font-black leading-[1.08] tracking-[-0.02em] text-[#0f172a] md:text-[34px]">{ticket.subject}</h1>
                  <p className="mt-2 text-sm text-[#64748b]">
                    {ticket.ticketNo} · {getCreatorTicketCategoryLabel(ticket.category)} · Updated {formatDate(ticket.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getCreatorTicketStatusClassName(ticket.status)}`}>
                    {getCreatorTicketStatusLabel(ticket.status)}
                  </span>
                  <span className={`inline-flex rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold uppercase ${getCreatorTicketPriorityClassName(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  {ticket.status !== "closed" ? (
                    <button
                      type="button"
                      disabled={closing}
                      onClick={handleCloseTicket}
                      className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 text-[11px] font-semibold text-[#334155] disabled:opacity-50"
                    >
                      {closing ? "Closing..." : "Close Ticket"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="space-y-4">
                  {ticket.messages.map((message, index) => {
                    const creatorMessage = message.senderType === "creator";
                    return (
                      <div key={`${message.createdAt}-${index}`} className="flex flex-col">
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-6 ${
                            creatorMessage ? "self-end bg-[#dbeafe] text-[#1e3a8a]" : "self-start bg-white text-[#334155]"
                          }`}
                        >
                          {message.message}
                        </div>
                        <p className={`mt-1 text-xs text-[#64748b] ${creatorMessage ? "text-right" : "text-left"}`}>
                          {creatorMessage ? "You" : message.senderType === "system" ? "System" : "Support"} · {formatDate(message.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}

              {ticket.status !== "closed" ? (
                <form className="mt-4" onSubmit={handleReply}>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Reply</label>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Reply with additional context, corrected details, or confirmation for support."
                    className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
                  />
                  <div className="mt-3 flex justify-end gap-3">
                    <Link
                      href={localizePath("/creator/tickets", locale)}
                      className="rounded-2xl border border-[#e2e8f0] px-4 py-2 text-[13px] font-semibold text-[#334155]"
                    >
                      Back to list
                    </Link>
                    <button
                      type="submit"
                      disabled={replying || !reply.trim()}
                      className="rounded-2xl bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {replying ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
                  This ticket is closed. Open a new ticket if a new settlement, review, or rights issue appears.
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1876f2]">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{getCreatorTicketCategoryLabel(ticket.category)}</p>
                    <p className="text-xs text-[#64748b]">Support scope</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#475569]">{getCreatorTicketCategoryDescription(ticket.category)}</p>
              </div>

              <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                  <Clock3 className="h-4 w-4 text-[#1876f2]" />
                  Useful References
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[#475569]">
                  {categoryChecklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1876f2]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
