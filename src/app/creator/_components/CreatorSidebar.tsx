"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  BookMarked,
  FileBadge2,
  Home,
  LifeBuoy,
  MoreVertical,
  ReceiptText,
  Settings,
  Bell,
} from "lucide-react";
import { localizePath, type SupportedLocale } from "@/lib/i18n";
import type { User } from "@/types";

interface CreatorSidebarProps {
  locale: SupportedLocale;
  normalizedPath: string;
  user: User | null;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/creator/dashboard",
    icon: Home,
    matcher: (path) => path === "/creator/dashboard",
  },
  {
    label: "Dramas",
    href: "/creator/dramas",
    icon: BookMarked,
    matcher: (path) => path.startsWith("/creator/dramas"),
  },
  {
    label: "Analytics",
    href: "/creator/analytics",
    icon: BarChart3,
    matcher: (path) => path.startsWith("/creator/analytics"),
  },
  {
    label: "Contract",
    href: "/creator/contract",
    icon: FileBadge2,
    matcher: (path) => path.startsWith("/creator/contract"),
  },
  {
    label: "Settlements",
    href: "/creator/settlements",
    icon: ReceiptText,
    matcher: (path) => path.startsWith("/creator/settlements"),
  },
  {
    label: "Tickets",
    href: "/creator/tickets",
    icon: LifeBuoy,
    matcher: (path) => path.startsWith("/creator/tickets"),
  },
  {
    label: "Notifications",
    href: "/creator/notifications",
    icon: Bell,
    matcher: (path) => path.startsWith("/creator/notifications"),
  },
  {
    label: "Settings",
    href: "/creator/settings",
    icon: Settings,
    matcher: (path) => path.startsWith("/creator/settings"),
  },
];

function getInitials(name: string): string {
  const normalized = name.trim();
  if (!normalized) return "CR";
  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  return initials || "CR";
}

export default function CreatorSidebar({ locale, normalizedPath, user }: CreatorSidebarProps) {
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "Creator";
  const initials = getInitials(displayName);

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[272px] flex-col justify-between border-r border-[#e2e8f0] bg-white lg:flex">
      <div>
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1876f2]">
            <BookMarked className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <p className="text-[18px] font-black leading-5 tracking-[-0.5px] text-[#0f172a]">TinyTale</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.06em] text-[#64748b]">Creator Center</p>
          </div>
        </div>

        <nav className="mt-3 flex flex-col gap-1 px-3.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon, matcher }) => {
            const active = matcher(normalizedPath);
            return (
              <Link
                key={href}
                href={localizePath(href, locale)}
                className={`flex items-center gap-3 rounded-3xl px-4 py-2.5 transition-colors ${
                  active ? "bg-[rgba(24,118,242,0.1)] text-[#1876f2]" : "text-[#475569] hover:bg-[#f8fafc]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={`text-[14px] leading-6 ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#e2e8f0] px-3.5 py-4">
        <Link
          href={localizePath("/user/profile", locale)}
          className="flex items-center gap-3 rounded-3xl bg-[#f8fafc] p-2 hover:bg-[#f1f5f9]"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            {user?.avatar ? (
              <Image alt={displayName} src={user.avatar} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#dbeafe] text-sm font-bold text-[#1d4ed8]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-[#0f172a]">{displayName}</p>
            <p className="text-xs leading-4 text-[#64748b]">Creator Account</p>
          </div>
          <MoreVertical className="h-4 w-4 text-[#94a3b8]" />
        </Link>
      </div>
    </aside>
  );
}
