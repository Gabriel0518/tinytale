"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ImagePlus,
  Paperclip,
  SendHorizontal,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import {
  getCreatorTicketCategoryLabel,
  getCreatorTicketPriorityBadgeClassName,
  getCreatorTicketPriorityLabel,
  getCreatorTicketStatusClassName,
  getCreatorTicketStatusDotClassName,
  getCreatorTicketStatusLabel,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import type { CreatorTicket, CreatorTicketMessage } from "@/types/creator";
import { useCreatorI18n } from "../../_lib/creator-i18n";

function formatFullDate(value: string, locale: ReturnType<typeof useLocale>): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale === "en" ? "en-US" : locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string, locale: ReturnType<typeof useLocale>): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(locale === "en" ? "en-US" : locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatConversationMarker(value: string, locale: ReturnType<typeof useLocale>, t: ReturnType<typeof useCreatorI18n>["t"]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("LATEST UPDATE");

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return `${isToday ? t("TODAY") : date.toLocaleDateString(locale === "en" ? "en-US" : locale, { month: "short", day: "numeric" }).toUpperCase()}, ${date.toLocaleTimeString(locale === "en" ? "en-US" : locale, {
    hour: "numeric",
    minute: "2-digit",
  }).toUpperCase()}`;
}

function getSupportLabel(
  message: CreatorTicketMessage,
  t: ReturnType<typeof useCreatorI18n>["t"]
): string {
  if (message.senderType === "creator") return t("You");
  if (message.senderType === "system") return t("TinyTale System");
  return t("TinyTale Support");
}

function ThreadAvatar({ message }: { message: CreatorTicketMessage }) {
  if (message.senderType === "creator") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d7af0] text-xs font-bold text-white">
        Y
      </div>
    );
  }

  if (message.senderType === "system") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e8f0] text-[#475569]">
        <AlertCircle className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fde7cf] text-[#9a5a2b]">
      <UserRound className="h-4 w-4" />
    </div>
  );
}

function TimelineItem({
  title,
  time,
  tone,
}: {
  title: string;
  time: string;
  tone: "blue" | "slate" | "amber" | "green";
}) {
  const iconClassName =
    tone === "blue"
      ? "border-[#dbeafe] bg-[#eff6ff] text-[#2d7af0]"
      : tone === "amber"
        ? "border-[#fde68a] bg-[#fffbeb] text-[#d97706]"
        : tone === "green"
          ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#10b981]"
          : "border-[#dbe4ef] bg-white text-[#94a3b8]";

  return (
    <div className="relative grid grid-cols-[24px_1fr] gap-3">
      <div className="relative flex justify-center">
        <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${iconClassName}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>
      </div>
      <div>
        <p className="text-[14px] font-semibold leading-5 text-[#18233a]">{title}</p>
        <p className="mt-1 text-[12px] leading-4 text-[#8ea0b6]">{time}</p>
      </div>
    </div>
  );
}

async function uploadTicketAttachments(token: string, files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const uploaded = await Promise.all(files.map((file) => creatorApi.uploadTicketAttachment(token, file)));
  return uploaded.map((item) => item.data.url);
}

export default function CreatorTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const ticketId = String(params?.id || "");

  const [ticket, setTicket] = useState<CreatorTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
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
        if (!cancelled) setTicket(res?.data || null);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || t("Failed to load ticket detail"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t, ticketId, token]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    const message = reply.trim();
    if (!message || !token || !ticket) return;

    setReplying(true);
    setError("");

    try {
      const attachmentUrls = await uploadTicketAttachments(token, replyAttachments);
      const res: any = await creatorApi.replyTicket(token, ticket._id, { message, attachments: attachmentUrls });
      setTicket(res?.data || ticket);
      setReply("");
      setReplyAttachments([]);
    } catch (err: any) {
      setError(err?.message || t("Failed to send ticket reply"));
    } finally {
      setReplying(false);
    }
  }

  function handleAttachmentSelect(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.size <= 10 * 1024 * 1024).slice(0, 5);
    setReplyAttachments(selected);
  }

  async function handleCloseTicket() {
    if (!token || !ticket) return;

    setClosing(true);
    setError("");

    try {
      const res: any = await creatorApi.closeTicket(token, ticket._id);
      setTicket(res?.data || ticket);
    } catch (err: any) {
      setError(err?.message || t("Failed to close ticket"));
    } finally {
      setClosing(false);
    }
  }

  const supportMessages = useMemo(
    () => ticket?.messages.filter((message) => message.senderType === "support") || [],
    [ticket?.messages]
  );

  const timelineItems = useMemo<Array<{ title: string; time: string; tone: "blue" | "slate" | "amber" | "green" }>>(() => {
    if (!ticket) return [];

    const currentStatus = getCreatorTicketStatusLabel(ticket.status);
    const items: Array<{ title: string; time: string; tone: "blue" | "slate" | "amber" | "green" }> = [
      {
        title: t("Ticket Created"),
        time: formatFullDate(ticket.createdAt, locale),
        tone: "blue" as const,
      },
    ];

    if (supportMessages.length > 0) {
      items.push({
        title: t("Support Replied"),
        time: formatFullDate(supportMessages[0].createdAt, locale),
        tone: "slate" as const,
      });
    }

    items.push({
      title: t("Status: __ARG_0__", t(currentStatus)),
      time: formatFullDate(ticket.closedAt || ticket.resolvedAt || ticket.updatedAt, locale),
      tone: ticket.status === "resolved" || ticket.status === "closed" ? ("green" as const) : ("amber" as const),
    });

    return items;
  }, [locale, supportMessages, t, ticket]);

  if (loading) {
    return <div className="mx-auto w-full max-w-[1040px] text-[14px] text-[#64748b]">{t("Loading ticket...")}</div>;
  }

  if (error && !ticket) {
    return <div className="mx-auto w-full max-w-[1040px] text-[14px] text-[#dc2626]">{error}</div>;
  }

  if (!ticket) {
    return <div className="mx-auto w-full max-w-[1040px] text-[14px] text-[#64748b]">{t("Ticket not found.")}</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8">
      <section className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-[14px] text-[#7d8da4]">
            <Link href={localizePath("/creator/tickets", locale)} className="transition hover:text-[#2d7af0]">
              {t("Support")}
            </Link>
            <span>›</span>
            <Link href={localizePath("/creator/tickets", locale)} className="transition hover:text-[#2d7af0]">
              {t("My Tickets")}
            </Link>
            <span>›</span>
            <span className="font-medium text-[#4a5b75]">{t("Ticket #__ARG_0__", ticket.ticketNo)}</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-[42px] font-black leading-[1.05] tracking-[-0.04em] text-[#18233a]">{ticket.subject}</h1>
            <span className={`inline-flex rounded-full px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.06em] ${getCreatorTicketStatusClassName(ticket.status)}`}>
              {t(getCreatorTicketStatusLabel(ticket.status))}
            </span>
          </div>
        </div>

        {ticket.status !== "closed" ? (
          <button
            type="button"
            disabled={closing}
            onClick={handleCloseTicket}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d9e2ef] bg-white px-5 text-[14px] font-semibold text-[#18233a] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            {closing ? t("Closing...") : t("Close Ticket")}
          </button>
        ) : null}
      </section>

      {error ? <div className="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-5 py-3 text-[13px] text-[#c2410c]">{error}</div> : null}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,608px)_320px] xl:items-start">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
            <div className="px-6 pt-6">
              <div className="mx-auto inline-flex rounded-full bg-[#eef3f8] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#7d8da4]">
                {formatConversationMarker(ticket.updatedAt, locale, t)}
              </div>
            </div>

            <div className="space-y-6 px-6 pb-6 pt-5">
              {ticket.messages.map((message, index) => {
                const isCreator = message.senderType === "creator";
                const isSystem = message.senderType === "system";

                if (isSystem) {
                  return (
                    <div key={`${message.createdAt}-${index}`} className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-[#475569]">
                      <p className="font-semibold text-[#334155]">{t("System Update")}</p>
                      <p className="mt-1">{message.message}</p>
                      <p className="mt-2 text-[12px] text-[#94a3b8]">{formatTime(message.createdAt, locale)}</p>
                    </div>
                  );
                }

                return (
                  <div key={`${message.createdAt}-${index}`} className={`flex ${isCreator ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[446px] gap-3 ${isCreator ? "flex-row-reverse" : "flex-row"}`}>
                      {!isCreator ? <ThreadAvatar message={message} /> : null}
                      <div className={isCreator ? "items-end" : "items-start"}>
                        {!isCreator ? <p className="mb-2 text-[14px] font-semibold text-[#5b6a7d]">{getSupportLabel(message, t)}</p> : null}
                        <div
                          className={`rounded-[18px] px-4 py-3 text-[14px] leading-8 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${
                            isCreator ? "bg-[#2d7af0] text-white" : "bg-[#eef3f9] text-[#334155]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.message}</p>
                          {message.attachments.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={attachment}
                                  href={attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-flex rounded-full border px-3 py-1 text-[12px] ${
                                    isCreator ? "border-white/30 bg-white/10 text-white" : "border-[#d9e2ef] bg-white text-[#4a5b75]"
                                  }`}
                                >
                                  {attachment.split("/").pop() || t("Attachment")}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className={`mt-2 text-[12px] text-[#9aa8bc] ${isCreator ? "text-right" : "text-left"}`}>{formatTime(message.createdAt, locale)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
            <form onSubmit={handleReply} className="p-4">
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log,.csv,.json,.zip"
                className="hidden"
                onChange={(event) => handleAttachmentSelect(event.target.files)}
              />
              <div className="overflow-hidden rounded-[24px] border border-[#dbe4ef] bg-white">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder={ticket.status === "closed" ? t("This ticket has been closed.") : t("Type your reply here...")}
                  disabled={ticket.status === "closed"}
                  className="min-h-[116px] w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-7 text-[#18233a] outline-none placeholder:text-[#9aa8bc] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                />
                <div className="flex flex-col gap-3 border-t border-[#e9eff6] px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-1 text-[#8da0bb]">
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#eef4fb]"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#eef4fb]"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#eef4fb]"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={replying || ticket.status === "closed" || !reply.trim()}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#2d7af0] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1d6ee8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {replying ? t("Sending") + "..." : t("Send Reply")}
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {replyAttachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2 px-1">
                  {replyAttachments.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d7e2ef] bg-[#f8fbff] px-3 py-1.5 text-[12px] font-medium text-[#4a5b75]"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setReplyAttachments((current) => current.filter((item) => item !== file))}
                        className="rounded-full p-0.5 text-[#8ea0b6] transition hover:bg-[#eef4fb] hover:text-[#42536b]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </form>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
            <div className="border-b border-[#eef2f7] px-5 py-5">
              <h2 className="text-[18px] font-bold text-[#18233a]">{t("Ticket Details")}</h2>
            </div>
            <div className="space-y-8 px-5 py-5">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8ea0b6]">{t("Ticket ID")}</p>
                <p className="mt-2 text-[17px] font-semibold text-[#18233a]">#{ticket.ticketNo}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8ea0b6]">{t("Status")}</p>
                <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-[#18233a]">
                  <span className={`h-2.5 w-2.5 rounded-full ${getCreatorTicketStatusDotClassName(ticket.status)}`} />
                  <span>{t(getCreatorTicketStatusLabel(ticket.status))}</span>
                </div>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8ea0b6]">{t("Priority")}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.05em] ${getCreatorTicketPriorityBadgeClassName(ticket.priority)}`}>
                    {t(getCreatorTicketPriorityLabel(ticket.priority))}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8ea0b6]">{t("Category")}</p>
                <p className="mt-2 text-[17px] font-medium text-[#18233a]">{t(getCreatorTicketCategoryLabel(ticket.category))}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8ea0b6]">{t("Created On")}</p>
                <p className="mt-2 text-[17px] font-medium text-[#18233a]">{formatFullDate(ticket.createdAt, locale)}</p>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-5">
              <h2 className="text-[18px] font-bold text-[#18233a]">{t("Timeline")}</h2>
              <AlertCircle className="h-4 w-4 text-[#9db0c6]" />
            </div>
            <div className="relative px-5 py-6">
              <div className="absolute left-[36px] top-8 h-[calc(100%-64px)] w-px bg-[#e7eef6]" />
              <div className="space-y-6">
                {timelineItems.map((item) => (
                  <TimelineItem key={`${item.title}-${item.time}`} title={item.title} time={item.time} tone={item.tone} />
                ))}
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
