"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string };

type NavGroup = {
  key: string;
  label: string;
  icon: string;
  items: NavItem[];
};

type NavBlock = {
  header?: string;
  groups: NavGroup[];
};

const navigation: NavBlock[] = [
  {
    groups: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        items: [{ href: "/admin", label: "Today's Overview" }],
      },
    ],
  },
  {
    header: "MANAGEMENT",
    groups: [
      {
        key: "content",
        label: "Content",
        icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        items: [
          { href: "/admin/dramas", label: "Drama Management" },
          { href: "/admin/categories", label: "Categories" },
          { href: "/admin/rankings", label: "Rankings" },
          { href: "/admin/comments", label: "Comments & Reviews" },
        ],
      },
      {
        key: "users",
        label: "Users",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        items: [{ href: "/admin/users", label: "User List" }],
      },
      {
        key: "finance",
        label: "Finance",
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        items: [
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/subscriptions", label: "Subscriptions" },
          { href: "/admin/coin-records", label: "Coin Records" },
          { href: "/admin/finance", label: "Finance Overview" },
        ],
      },
      {
        key: "promotion",
        label: "Promotion",
        icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
        items: [
          { href: "/admin/promoters", label: "Promoters" },
          { href: "/admin/withdrawals", label: "Withdrawals" },
        ],
      },
      {
        key: "activity",
        label: "Activity",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        items: [
          { href: "/admin/checkin", label: "Daily Check-in" },
          { href: "/admin/tasks", label: "Tasks" },
          { href: "/admin/campaigns", label: "Campaigns" },
        ],
      },
    ],
  },
  {
    header: "SYSTEM",
    groups: [
      {
        key: "system",
        label: "Settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        items: [
          { href: "/admin/admins", label: "Admins" },
          { href: "/admin/roles", label: "Roles" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/logs", label: "Audit Logs" },
        ],
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href) || false;
  };

  const isSectionActive = (group: NavGroup) =>
    group.items.some((item) => isItemActive(item.href));

  const toggleSection = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderGroup = (group: NavGroup) => {
    const active = isSectionActive(group);
    const isOpen = expanded[group.key] ?? active;
    const singleItem = group.items.length === 1;

    if (singleItem) {
      const item = group.items[0];
      const itemActive = isItemActive(item.href);
      return (
        <Link
          key={group.key}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
            itemActive ? "bg-indigo-600/15 text-indigo-400" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={group.icon} />
          </svg>
          {group.label}
        </Link>
      );
    }

    return (
      <div key={group.key} className="mb-0.5">
        <button
          onClick={() => toggleSection(group.key)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
            active ? "text-white" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={group.icon} />
          </svg>
          <span className="flex-1 text-left">{group.label}</span>
          <svg
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-gray-800 pl-4">
            {group.items.map((item) => {
              const itemActive = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-1.5 text-[13px] transition ${
                    itemActive
                      ? "bg-indigo-600/15 font-medium text-indigo-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-[#0f0f17] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight">TinyTale</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navigation.map((block, i) => (
          <div key={i} className={block.header ? "mt-5" : ""}>
            {block.header && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {block.header}
              </p>
            )}
            {block.groups.map(renderGroup)}
          </div>
        ))}
      </nav>

      {/* Admin User + Logout */}
      <div className="border-t border-gray-800/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Alex Morgan</p>
            <p className="truncate text-xs text-gray-500">alex@tinytale.com</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              window.location.href = "/admin/login";
            }}
            className="text-gray-500 hover:text-gray-300"
            aria-label="Logout"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
