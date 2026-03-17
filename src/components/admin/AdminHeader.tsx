"use client";

import { useState } from "react";
import AdminLanguageSwitcher from "@/components/admin/AdminLanguageSwitcher";
import { translateAdminText, useAdminLocale } from "@/lib/admin-i18n";

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title = "Overview" }: AdminHeaderProps) {
  const { locale } = useAdminLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();
  const dateStr = today.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      data-admin-i18n-controlled="true"
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800/40 bg-[#13131d]/80 px-6 backdrop-blur-md"
    >
      {/* Left: Title */}
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      {/* Center: Search */}
      <div className="hidden w-full max-w-md px-8 md:block">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translateAdminText("Search...", locale)}
            className="w-full rounded-lg border border-gray-700/50 bg-gray-800/50 py-2 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Right: Date + Notifications + User */}
      <div className="flex items-center gap-4">
        <AdminLanguageSwitcher />
        <span className="hidden text-xs text-gray-400 lg:block">{dateStr}</span>

        {/* Notification Bell */}
        <button className="relative rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{translateAdminText("Admin User", locale)}</p>
            <p className="text-[11px] text-gray-500">{translateAdminText("Super Admin", locale)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
