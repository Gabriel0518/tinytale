"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { creatorApi } from "@/lib/api";
import { localizePath, type SupportedLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";

interface CreatorTopHeaderProps {
  locale: SupportedLocale;
}

export default function CreatorTopHeader({ locale }: CreatorTopHeaderProps) {
  const pathname = usePathname();
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await creatorApi.getNotifications(token);
      setUnreadCount(Number(response.data.unreadCount || 0));
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount, pathname]);

  useEffect(() => {
    function handleNotificationChange() {
      loadUnreadCount();
    }

    window.addEventListener("creator-notifications-changed", handleNotificationChange);
    return () => window.removeEventListener("creator-notifications-changed", handleNotificationChange);
  }, [loadUnreadCount]);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#e2e8f0] bg-[rgba(255,255,255,0.8)] px-4 backdrop-blur-md md:px-5 lg:px-6 xl:px-8">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          readOnly
          placeholder="Search dramas, submissions, tickets, or settlements..."
          className="h-[34px] w-full rounded-2xl bg-[#f1f5f9] pl-10 pr-4 text-[13px] text-[#6b7280] outline-none"
        />
      </div>
      <div className="ml-3 flex items-center gap-2.5 md:ml-5 md:gap-3">
        <Link
          href={localizePath("/creator/notifications", locale)}
          aria-label="Notifications"
          className="relative rounded-2xl p-1.5 text-[#475569] transition-colors hover:bg-[#f8fafc]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <>
              <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-[#ef4444]" />
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#1876f2] px-1 text-[10px] font-bold leading-[18px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          ) : null}
        </Link>
        <Link
          href={localizePath("/creator/dramas/new", locale)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1876f2] px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#1669da] md:px-3.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Drama</span>
        </Link>
      </div>
    </header>
  );
}
