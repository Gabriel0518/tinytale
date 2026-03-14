"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  BookOpenText,
  Image as ImageIcon,
  MessageSquareMore,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

const stats = [
  { label: "ACTIVE CREATORS", value: "10K+", icon: BookOpenText },
  { label: "STORIES PUBLISHED", value: "50K+", icon: Sparkles },
  { label: "TOTAL EARNINGS", value: "$2M+", icon: Wallet },
];

const tools = [
  {
    title: "AI Story Assistant",
    description: "Break writer's block with intelligent suggestions.",
    icon: Sparkles,
  },
  {
    title: "Cover Designer",
    description: "Create stunning visuals for your story books.",
    icon: ImageIcon,
  },
  {
    title: "Feedback Loop",
    description: "Get early reviews from our beta community.",
    icon: MessageSquareMore,
  },
  {
    title: "Monetization Hub",
    description: "Manage subscriptions and ad-revenue sharing.",
    icon: Wallet,
  },
];

export default function CreatorLandingPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "Creator";
  const displayTag = user?.vipStatus === "active" ? "VIP Creator" : "Creator";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "CR";

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#0f172a]">
      <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-block size-4 rotate-45 rounded-[3px] bg-[#1877F2]" />
              <span className="text-xl font-bold tracking-tight">TinyTale</span>
            </div>
            <label className="hidden min-w-[220px] items-center gap-2 rounded-lg bg-[#f1f5f9] px-3 py-2 text-sm text-[#64748b] lg:flex">
              <Search className="size-4" />
              <input
                aria-label="Search stories and creators"
                className="w-full bg-transparent outline-none placeholder:text-[#94a3b8]"
                placeholder="Search stories, creators..."
                type="text"
              />
            </label>
          </div>

          <div className="flex items-center gap-5">
            <button
              aria-label="Notifications"
              className="rounded-md p-1 text-[#334155] transition hover:bg-[#f1f5f9]"
              type="button"
            >
              <Bell className="size-5" />
            </button>
            <div className="hidden h-10 items-center gap-3 border-l border-[#e2e8f0] pl-4 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-bold text-[#0f172a]">{displayName}</p>
                <p className="text-xs text-[#64748b]">{displayTag}</p>
              </div>
              <Link href={localizePath("/user/profile", locale)} className="size-10 rounded-full">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#9ca3af] to-[#64748b] p-0.5">
                  {user?.avatar ? (
                    <Image
                      alt={displayName}
                      className="size-full rounded-full object-cover"
                      height={40}
                      src={user.avatar}
                      width={40}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-full bg-white text-xs font-semibold text-[#334155]">
                      {initials}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 md:px-6">
        <section className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8f8f8f] via-[#5f5f5f] to-[#242526]" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-[#1b5e20]/40 blur-2xl" />
          <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-[#2e7d32]/35 blur-2xl" />

          <div className="relative flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center text-white">
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Empowering the Next
              <br />
              Generation of Storytellers
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-white/90 sm:text-[20px]">
              Create, share, and monetize your stories with a global community
              of readers and dreamers.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                className="rounded-xl bg-[#1877F2] px-8 py-3 text-base font-bold shadow-[0_10px_15px_-3px_rgba(24,119,242,0.35)] transition hover:bg-[#166fe5]"
                href={localizePath("/creator/apply", locale)}
              >
                Start Creating
              </Link>
              <Link
                className="rounded-xl border border-white/30 bg-white/20 px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                href={localizePath("/browse", locale)}
              >
                Explore Community
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2]">
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-bold tracking-[0.08em] text-[#64748b]">
                {label}
              </p>
              <p className="mt-2 text-5xl font-bold leading-none text-[#0f172a]">
                {value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-4xl font-bold tracking-tight text-[#0f172a]">
              Creative Tools
            </h2>
            <Link
              className="inline-flex items-center gap-1 text-sm font-bold text-[#1877F2] transition hover:text-[#166fe5]"
              href={localizePath("/creator", locale)}
            >
              View all tools
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tools.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#0f172a]">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-5 text-[#64748b]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
