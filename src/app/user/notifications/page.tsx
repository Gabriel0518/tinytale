"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect} from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

interface Notification {
  _id: string;
  type: "release" | "promo" | "system";
  title: string;
  message: string;
  dramaId?: string;
  read: boolean;
  createdAt: string;
}

type NotificationsCopy = {
  title: string;
  markAllRead: string;
  noNotifications: string;
  watchNow: string;
  justNow: string;
  hoursAgo: (h: number) => string;
  daysAgo: (d: number) => string;
};

const COPY: Record<SupportedLocale, NotificationsCopy> = {
  en: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    noNotifications: "No notifications yet",
    watchNow: "Watch now",
    justNow: "Just now",
    hoursAgo: (h) => `${h}h ago`,
    daysAgo: (d) => `${d}d ago` },
  zh: {
    title: "通知",
    markAllRead: "全部标为已读",
    noNotifications: "暂无通知",
    watchNow: "立即观看",
    justNow: "刚刚",
    hoursAgo: (h) => `${h}小时前`,
    daysAgo: (d) => `${d}天前` },
  ja: {
    title: "通知",
    markAllRead: "すべて既読にする",
    noNotifications: "通知はまだありません",
    watchNow: "今すぐ視聴",
    justNow: "たった今",
    hoursAgo: (h) => `${h}時間前`,
    daysAgo: (d) => `${d}日前` },
  es: {
    title: "Notificaciones",
    markAllRead: "Marcar todo como leído",
    noNotifications: "Aún no hay notificaciones",
    watchNow: "Ver ahora",
    justNow: "Ahora mismo",
    hoursAgo: (h) => `hace ${h} h`,
    daysAgo: (d) => `hace ${d} d` },
  pt: {
    title: "Notificações",
    markAllRead: "Marcar tudo como lido",
    noNotifications: "Nenhuma notificação ainda",
    watchNow: "Assistir agora",
    justNow: "Agora",
    hoursAgo: (h) => `${h}h atrás`,
    daysAgo: (d) => `${d}d atrás` },
  hi: {
    title: "सूचनाएं",
    markAllRead: "सभी को पढ़ा हुआ करें",
    noNotifications: "अभी कोई सूचना नहीं",
    watchNow: "अभी देखें",
    justNow: "अभी",
    hoursAgo: (h) => `${h}घं पहले`,
    daysAgo: (d) => `${d}दिन पहले` },
  id: {
    title: "Notifikasi",
    markAllRead: "Tandai semua sudah dibaca",
    noNotifications: "Belum ada notifikasi",
    watchNow: "Tonton sekarang",
    justNow: "Baru saja",
    hoursAgo: (h) => `${h}j lalu`,
    daysAgo: (d) => `${d}h lalu` } };

export default function NotificationsPage() {
  const locale = useLocale();
  const t = COPY[locale] || COPY.en;
  const { token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    userApi.getNotifications(token)
      .then((res: { data: { notifications: Notification[] } }) => {
        setNotifications(res.data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const markRead = async (id: string) => {
    if (!token) return;
    await userApi.markNotificationRead(token, id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!token) return;
    await userApi.markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (authLoading) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "release": return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
      case "promo": return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
      default: return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t.justNow;
    if (hours < 24) return t.hoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days < 7) return t.daysAgo(days);
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-amber-400 transition hover:text-amber-300"
            >
              {t.markAllRead}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/50" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <svg className="mx-auto mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p>{t.noNotifications}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                  n.read
                    ? "border-zinc-800/50 bg-zinc-900/30"
                    : "border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800"
                }`}
              >
                {typeIcon(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.read ? "text-zinc-400" : "text-white"}`}>
                      {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-zinc-500">{formatTime(n.createdAt)}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${n.read ? "text-zinc-500" : "text-zinc-300"}`}>
                    {n.message}
                  </p>
                  {n.dramaId && (
                    <Link
                      href={localizePath(`/drama/${n.dramaId}`, locale)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-block text-xs font-medium text-amber-400 hover:text-amber-300"
                    >
                      {t.watchNow} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
