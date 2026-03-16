"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Bell, ChartColumnBig, Landmark, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";

const highlights = [
  {
    title: "Structured application review",
    description: "Apply in 5 steps, sign the agreement in-page, and get reviewed under the 48h creator SLA.",
    icon: ShieldCheck,
  },
  {
    title: "Drama upload workflow",
    description: "Manage dramas, episodes, subtitles, covers, and review submissions from one creator workspace.",
    icon: UploadCloud,
  },
  {
    title: "Performance analytics",
    description: "Track views, audience signals, and USD revenue performance once your creator catalog goes live.",
    icon: ChartColumnBig,
  },
  {
    title: "Contracts and settlements",
    description: "Handle creator agreements, payout verification, and monthly settlement visibility in USD.",
    icon: Landmark,
  },
];

const stats = [
  { label: "REVIEW SLA", value: "48H" },
  { label: "SETTLEMENT CURRENCY", value: "USD" },
  { label: "CREATOR SPLIT RANGE", value: "30-60%" },
];

export default function CreatorLandingPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "Creator";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "CR";

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#0f172a]">
      <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-3 md:px-8 xl:px-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-block size-4 rotate-45 rounded-[3px] bg-[#1877F2]" />
              <span className="text-xl font-bold tracking-tight">TinyTale</span>
            </div>
            <label className="hidden min-w-[260px] items-center gap-2 rounded-lg bg-[#f1f5f9] px-3 py-2 text-sm text-[#64748b] lg:flex">
              <Search className="size-4" />
              <input
                aria-label="Search creator docs and onboarding"
                className="w-full bg-transparent outline-none placeholder:text-[#94a3b8]"
                placeholder="Search creator onboarding, content policies..."
                type="text"
              />
            </label>
          </div>

          <div className="flex items-center gap-5">
            <LanguageSwitcher />
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
                <p className="text-xs text-[#64748b]">Creator Applicant</p>
              </div>
              <Link href={localizePath("/user/profile", locale)} className="size-10 rounded-full">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#9ca3af] to-[#64748b] p-0.5">
                  {user?.avatar ? (
                    <Image alt={displayName} className="size-full rounded-full object-cover" height={40} src={user.avatar} width={40} />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-full bg-white text-xs font-semibold text-[#334155]">{initials}</div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 pb-12 pt-6 md:px-6 xl:px-0">
        <section className="relative overflow-hidden rounded-[28px] border border-[#dbe2ea] bg-[#0f172a] px-5 py-10 text-white md:px-8 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.18),_transparent_38%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">Creator Program</p>
              <h1 className="mt-4 max-w-4xl text-[36px] font-black leading-[1.04] tracking-[-0.04em] sm:text-[42px] md:text-[48px]">
                Build short dramas on TinyTale and grow from application to payout.
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#cbd5e1] md:text-[16px]">
                TinyTale Creator Center now follows a full workflow: creator application, manual review, drama uploads, analytics, contracts, and monthly USD settlements.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="rounded-xl bg-[#1877F2] px-6 py-2.5 text-[14px] font-bold shadow-[0_10px_20px_rgba(24,119,242,0.35)] transition hover:bg-[#166fe5]"
                  href={localizePath("/creator/apply", locale)}
                >
                  Start Application
                </Link>
                <Link
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-[14px] font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                  href={localizePath("/creator/dashboard", locale)}
                >
                  Open Creator Center
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              {stats.map((item) => (
                <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#93c5fd]">{item.label}</p>
                  <p className="mt-3 text-[26px] font-black leading-none">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[24px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1877F2]">
                <Icon className="size-5" />
              </div>
              <h2 className="text-[17px] font-bold text-[#0f172a]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 rounded-[24px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1877F2]">Program Scope</p>
              <h2 className="mt-2 text-[28px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[30px]">What happens after approval</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
                Approved creators manage dramas, episodes, subtitles, content review submissions, performance analytics, contract upgrades, bank-account verification, and monthly settlement visibility from the same workspace.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-[#475569]">
              <p className="font-semibold text-[#0f172a]">Aligned with latest creator docs</p>
              <p className="mt-1">Creator and Promoter are now fully separated in routing, workflow, and payout logic.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-sm font-bold text-[#0f172a]">Application & review</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Multi-step application, in-page agreement acceptance, manual approval, and revision requests.</p>
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-sm font-bold text-[#0f172a]">Content lifecycle</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Draft, pending review, published, rejected, and suspended states with review feedback and future DMCA handling.</p>
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-sm font-bold text-[#0f172a]">Revenue operations</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">USD settlement visibility, channel-fee deductions, bank verification, and creator-side ticket tracking.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
