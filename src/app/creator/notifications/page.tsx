"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChartColumnBig, FileText, Loader2, MessageSquareText, Search, ShieldCheck, Wallet } from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/hooks/useLocale";
import { localizePath } from "@/lib/i18n";
import type { CreatorNotification, CreatorNotificationCategory } from "@/types/creator";

type FilterKey = "all" | "unread" | CreatorNotificationCategory;

const panelClassName =
  "rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]";

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationVisual(icon: CreatorNotification["icon"]) {
  switch (icon) {
    case "ticket":
      return {
        icon: MessageSquareText,
        circle: "bg-[#e9f2ff] text-[#1876f2]",
      };
    case "settlement":
      return {
        icon: Wallet,
        circle: "bg-[#ecfdf3] text-[#12b76a]",
      };
    case "performance":
      return {
        icon: ChartColumnBig,
        circle: "bg-[#eef2ff] text-[#4f46e5]",
      };
    case "contract":
      return {
        icon: FileText,
        circle: "bg-[#fff4e8] text-[#f79009]",
      };
    default:
      return {
        icon: ShieldCheck,
        circle: "bg-[#eff6ff] text-[#2563eb]",
      };
  }
}

export default function CreatorNotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [summary, setSummary] = useState({ total: 0, system: 0, performance: 0 });

  const broadcastNotificationChange = useCallback(() => {
    window.dispatchEvent(new Event("creator-notifications-changed"));
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await creatorApi.getNotifications(token);
      setNotifications(response.data.notifications || []);
      setSummary(response.data.summary || { total: 0, system: 0, performance: 0 });
      broadcastNotificationChange();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to load notifications.", "error");
    } finally {
      setLoading(false);
    }
  }, [broadcastNotificationChange, toast, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const filters = useMemo(
    () => [
      { key: "all" as const, label: "All", count: notifications.length },
      { key: "unread" as const, label: "Unread", count: unreadCount },
      { key: "system" as const, label: "System", count: summary.system },
      { key: "performance" as const, label: "Performance", count: summary.performance },
    ],
    [notifications.length, summary.performance, summary.system, unreadCount]
  );

  const filteredNotifications = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter === "unread" && item.read) return false;
      if (filter === "system" && item.category !== "system") return false;
      if (filter === "performance" && item.category !== "performance") return false;

      if (!keyword) return true;
      return `${item.title} ${item.message}`.toLowerCase().includes(keyword);
    });
  }, [filter, notifications, query]);

  const markReadLocally = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!token) return;

      const target = notifications.find((item) => item.id === id);
      if (!target || target.read) return;

      setMarkingId(id);
      try {
        await creatorApi.markNotificationRead(token, id);
        markReadLocally(id);
        broadcastNotificationChange();
      } catch (error) {
        toast(error instanceof Error ? error.message : "Failed to update notification.", "error");
      } finally {
        setMarkingId(null);
      }
    },
    [broadcastNotificationChange, markReadLocally, notifications, toast, token]
  );

  async function handleMarkAllRead() {
    if (!token || unreadCount <= 0) return;

    setMarkingAll(true);
    try {
      await creatorApi.markAllNotificationsRead(token);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      broadcastNotificationChange();
      toast("All notifications marked as read.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update notifications.", "error");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[42px] font-black leading-[1.02] tracking-[-0.04em] text-[#18233a]">Notifications</h1>
          <p className="mt-2 text-[15px] leading-7 text-[#70819c]">
            Stay on top of creator workflow changes across support, settlement, agreement, and performance updates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount <= 0}
          className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#d9e2ef] bg-white px-5 text-[14px] font-semibold text-[#1e293b] transition hover:border-[#c9d5e4] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {markingAll ? "Updating..." : "Mark all as read"}
        </button>
      </section>

      <section className={panelClassName}>
        <div className="border-b border-[#edf2f7] px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da0bb]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications..."
                className="h-[44px] w-full rounded-full border border-[#d9e2ef] bg-[#fbfdff] pl-11 pr-4 text-[14px] text-[#18233a] outline-none transition placeholder:text-[#9aa8bc] focus:border-[#2d7af0]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => {
                const active = item.key === filter;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                      active
                        ? "border-[#cfe0ff] bg-[#eaf2ff] text-[#1d4ed8]"
                        : "border-[#dde5f0] bg-white text-[#52637e] hover:border-[#cbd8e6] hover:bg-[#f8fbff]"
                    }`}
                  >
                    {item.label}
                    <span className={`ml-1.5 ${active ? "text-[#1d4ed8]" : "text-[#8fa0b6]"}`}>{item.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
              Loading notifications...
            </div>
          </div>
        ) : filteredNotifications.length ? (
          <div className="flex flex-col">
            {filteredNotifications.map((item, index) => {
              const visual = getNotificationVisual(item.icon);
              const Icon = visual.icon;
              const href = localizePath(item.href || "/creator/notifications", locale);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) {
                      void handleMarkRead(item.id);
                    }
                    router.push(href);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!item.read) {
                        void handleMarkRead(item.id);
                      }
                      router.push(href);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  className={`group flex w-full cursor-pointer items-start gap-4 px-4 py-5 text-left transition hover:bg-[#fafcff] md:px-6 ${
                    index !== filteredNotifications.length - 1 ? "border-b border-[#edf2f7]" : ""
                  }`}
                >
                  <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.circle}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold leading-6 text-[#18233a]">{item.title}</p>
                        <p className="mt-1 text-[14px] leading-6 text-[#70819c]">{item.message}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[12px] font-medium text-[#94a3b8]">{formatRelativeTime(item.createdAt)}</span>
                        {!item.read ? <span className="h-2.5 w-2.5 rounded-full bg-[#1876f2]" /> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                          item.category === "performance" ? "bg-[#eef2ff] text-[#4f46e5]" : "bg-[#eff6ff] text-[#2563eb]"
                        }`}
                      >
                        {item.category}
                      </span>
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleMarkRead(item.id);
                          }}
                          disabled={markingId === item.id}
                          className="text-[12px] font-semibold text-[#1876f2] transition hover:text-[#165fcc] disabled:opacity-50"
                        >
                          {markingId === item.id ? "Updating..." : "Mark read"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-[20px] font-bold text-[#18233a]">No notifications found</h2>
            <p className="mt-2 max-w-[420px] text-[14px] leading-6 text-[#70819c]">
              There are no matching updates for the current filter. Try another category or clear the search keyword.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-[16px] border border-[#d9e2ef] bg-white px-5 text-[14px] font-semibold text-[#1e293b] transition hover:border-[#c9d5e4] hover:bg-[#f8fbff]"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
