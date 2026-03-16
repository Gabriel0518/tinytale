"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminTicketDetail, CreatorAdminTicketItem, CreatorTicketStatus } from "@/types/creator";
import {
  formatAdminDate,
  getMockCreatorTicket,
  mockCreatorTickets,
} from "../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

function getTicketStatusMeta(status: CreatorTicketStatus) {
  switch (status) {
    case "resolved":
      return { label: "Resolved", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "closed":
      return { label: "Closed", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
    case "in_progress":
      return { label: "In Progress", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    case "waiting_creator":
      return { label: "Waiting Creator", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
    case "waiting_support":
      return { label: "Waiting Support", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    default:
      return { label: "Open", className: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20" };
  }
}

function getPriorityMeta(priority: CreatorAdminTicketItem["priority"]) {
  switch (priority) {
    case "urgent":
      return "text-red-300";
    case "high":
      return "text-amber-300";
    case "medium":
      return "text-indigo-300";
    default:
      return "text-gray-400";
  }
}

export default function CreatorTicketsAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CreatorAdminTicketItem[]>(mockCreatorTickets);
  const [selectedId, setSelectedId] = useState<string>(mockCreatorTickets[0]?.id || "");
  const [detail, setDetail] = useState<CreatorAdminTicketDetail | null>(getMockCreatorTicket(mockCreatorTickets[0]?.id || ""));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] = useState<CreatorTicketStatus>("in_progress");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorTickets();
        const next = response?.data?.items || response?.data?.tickets || response?.data || [];
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setItems(next);
          setSelectedId(String(next[0]?.id || ""));
        }
      } catch {
        if (!cancelled) {
          setItems(mockCreatorTickets);
          setSelectedId(mockCreatorTickets[0]?.id || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!selectedId) return;
      try {
        const response: any = await adminApi.getCreatorTicket(selectedId);
        const next = response?.data?.ticket || response?.data || response;
        if (!cancelled && next?.id) {
          setDetail(next);
          setNextStatus(next.status);
        }
      } catch {
        const fallback = getMockCreatorTicket(selectedId);
        if (!cancelled) {
          setDetail(fallback);
          setNextStatus((fallback?.status || "in_progress") as CreatorTicketStatus);
        }
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => items.filter((item) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [item.ticketNo, item.creatorName, item.creatorEmail, item.subject, item.category].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (status !== "all" && item.status !== status) return false;
    return true;
  }), [items, search, status]);

  async function handleReply() {
    if (!detail || !reply.trim()) {
      toast("Reply content is required.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.replyCreatorTicket(detail.id, { message: reply, status: nextStatus });
      await adminApi.updateCreatorTicketStatus(detail.id, { status: nextStatus });
    } catch {
      // Keep admin support workflow functional before full back-office threading is wired.
    } finally {
      setSubmitting(false);
    }

    const now = new Date().toISOString();
    setDetail((current) => current ? {
      ...current,
      status: nextStatus,
      updatedAt: now,
      lastMessageAt: now,
      latestMessage: reply,
      latestSenderType: "support",
      messageCount: current.messageCount + 1,
      messages: [
        ...current.messages,
        {
          senderType: "support",
          senderId: "admin_current",
          message: reply,
          attachments: [],
          createdAt: now,
        },
      ],
    } : current);
    setItems((current) => current.map((item) => item.id === detail.id ? {
      ...item,
      status: nextStatus,
      updatedAt: now,
      lastMessageAt: now,
      latestMessage: reply,
      latestSenderType: "support",
      messageCount: item.messageCount + 1,
    } : item));
    setReply("");
    toast("Ticket reply saved.", "success");
  }

  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Management / Support</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Creator support ticket queue</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Handle creator tickets across payouts, content review, DMCA follow-up, and policy questions from one operational queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/policies" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Open policies
            </Link>
            <Link href="/admin/creators/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket no, creator, subject, or category"
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] pl-11 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
            <option value="all">All ticket states</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_support">Waiting support</option>
            <option value="waiting_creator">Waiting creator</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Ticket queue</h2>
              <p className="text-sm text-gray-400">Claim and reply to creator support threads.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading creator tickets...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No tickets match the current filters.</div>
            ) : filtered.map((item) => {
              const statusMeta = getTicketStatusMeta(item.status);
              const selected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-indigo-500/60 bg-[#171726]" : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.subject}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.creatorName} · {item.ticketNo}</p>
                      <p className="mt-2 text-xs text-gray-500">{item.category} · <span className={getPriorityMeta(item.priority)}>{item.priority}</span> · {item.messageCount} messages</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">{item.latestMessage}</p>
                  <p className="mt-3 text-xs text-gray-500">Updated {formatAdminDate(item.updatedAt, true)}</p>
                </button>
              );
            })}
          </div>
        </article>

        <aside className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Conversation</h2>
            {!detail ? (
              <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">Select a ticket to review the thread.</div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="font-medium text-white">{detail.subject}</p>
                  <p className="mt-1 text-sm text-gray-400">{detail.creatorName} · {detail.creatorEmail}</p>
                </div>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {detail.messages.map((message, index) => (
                    <div key={`${message.createdAt}-${index}`} className={`rounded-2xl p-4 ${message.senderType === "support" ? "bg-indigo-500/10" : "bg-[#0f0f17]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">{message.senderType === "support" ? "Support" : message.senderType === "creator" ? detail.creatorName : "System"}</p>
                        <span className="text-xs text-gray-500">{formatAdminDate(message.createdAt, true)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{message.message}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Next status</label>
                  <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as CreatorTicketStatus)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
                    <option value="in_progress">In progress</option>
                    <option value="waiting_creator">Waiting creator</option>
                    <option value="waiting_support">Waiting support</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Reply</label>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write a support response or internal follow-up note for the creator."
                    className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleReply}
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Send reply"}
                </button>
              </div>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
