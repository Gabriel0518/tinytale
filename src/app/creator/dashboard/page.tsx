"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  FilePlus2,
  Globe,
  MessageSquare,
  Pencil,
  Share2,
  Timer,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorDashboardOverview } from "@/types/creator";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const className = positive
    ? "bg-[#f0fdf4] text-[#16a34a]"
    : "bg-[#fef2f2] text-[#dc2626]";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold leading-4 ${className}`}>
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  title,
  value,
  icon,
  change,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: number;
}) {
  return (
    <article className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2]">{icon}</div>
        <TrendBadge value={change} />
      </div>
      <p className="mt-6 text-sm font-medium leading-5 text-[#64748b]">{title}</p>
      <p className="mt-1 text-3xl font-black leading-[1.1] text-[#0f172a] md:text-[40px]">{value}</p>
    </article>
  );
}

function BarChartCard({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  const peakValue = Math.max(...values, 0);

  return (
    <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold leading-7 text-[#0f172a] md:text-[30px]">Performance Trends</h3>
        <span className="rounded-2xl bg-[#f1f5f9] px-3 py-1 text-xs font-bold leading-4 text-[#0f172a]">Last 7 Days</span>
      </div>

      <div className="mt-6 flex h-[248px] items-end gap-[2px] overflow-hidden rounded-t-2xl bg-transparent">
        {values.map((value, index) => {
          const height = Math.max(14, Math.round((value / max) * 228));
          const active = value === peakValue && peakValue > 0;
          return (
            <div
              key={`${labels[index]}-${index}`}
              className={`flex-1 rounded-t-2xl ${active ? "bg-[#1876f2]" : "bg-[rgba(24,118,242,0.25)]"}`}
              style={{ height }}
            />
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1">
        {labels.map((label) => (
          <p key={label} className="text-center text-xs font-medium uppercase tracking-[0.1em] text-[#94a3b8]">
            {label}
          </p>
        ))}
      </div>
    </section>
  );
}

function StoryCover({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return <div className="h-16 w-16 rounded-2xl bg-[#efece0]" />;
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#efece0]">
      <Image src={src} alt={alt} fill sizes="64px" className="object-cover" />
    </div>
  );
}

function RecentStoriesCard({
  stories,
  locale,
}: {
  stories: CreatorDashboardOverview["recentStories"];
  locale: ReturnType<typeof useLocale>;
}) {
  const visibleStories = stories.slice(0, 2);

  return (
    <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold leading-7 text-[#0f172a] md:text-[30px]">Recent Stories</h3>
        <Link href={localizePath("/creator/dramas", locale)} className="text-base font-bold leading-5 text-[#1876f2] hover:text-[#1669da]">
          View All
        </Link>
      </div>

      <div className="mt-6 divide-y divide-[#e2e8f0]">
        {visibleStories.length === 0 ? (
          <p className="py-4 text-sm text-[#64748b]">No stories yet.</p>
        ) : (
          visibleStories.map((story) => (
            <div key={story._id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <StoryCover src={story.cover} alt={story.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold leading-6 text-[#0f172a] md:text-2xl">{story.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs leading-4 text-[#64748b]">
                  <span>{story.statusText} {story.statusMeta}</span>
                  <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                  <span className="font-semibold text-[#1876f2]">{story.readsLabel}</span>
                </div>
              </div>
              {story.status === "published" ? (
                <ArrowRight className="h-[18px] w-[18px] text-[#94a3b8]" />
              ) : (
                <Pencil className="h-[18px] w-[18px] text-[#94a3b8]" />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QuickActionsCard() {
  const locale = useLocale();
  const actions = [
    { label: "Upload Media", href: "/creator/dramas/new", icon: <Upload className="h-5 w-5" /> },
    { label: "New Draft", href: "/creator/dramas/new", icon: <FilePlus2 className="h-5 w-5" /> },
    { label: "Share Profile", href: "/creator/settings/profile", icon: <Share2 className="h-5 w-5" /> },
    { label: "Read Comments", href: "/creator/tickets", icon: <MessageSquare className="h-5 w-5" /> },
  ];

  return (
    <section className="rounded-3xl border border-[rgba(24,118,242,0.1)] bg-[rgba(24,118,242,0.05)] p-6">
      <h3 className="text-xl font-bold leading-7 text-[#1876f2] md:text-[30px]">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={localizePath(action.href, locale)}
            className="flex h-[98px] flex-col items-center justify-center rounded-3xl border border-[#e2e8f0] bg-white text-center text-xs font-bold leading-4 text-[#334155] hover:bg-[#f8fafc]"
          >
            <span className="mb-2 text-[#1876f2]">{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CreatorTipCard({
  content,
  ctaText,
  locale,
}: {
  content: string;
  ctaText: string;
  locale: ReturnType<typeof useLocale>;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-6">
      <h3 className="text-xl font-bold leading-7 text-white md:text-[30px]">Creator Tip</h3>
      <p className="mt-2 text-sm leading-[1.65] text-[#cbd5e1]">{content}</p>
      <Link href={localizePath("/creator/dramas", locale)} className="mt-2 inline-block text-sm font-bold text-[#1876f2] hover:text-[#60a5fa]">
        {ctaText} →
      </Link>
      <div className="pointer-events-none absolute -bottom-5 -right-6 h-20 w-20 rounded-full border-[6px] border-[#334155]" />
    </section>
  );
}

function TopRegionCard({ region, readers }: { region: string; readers: number }) {
  return (
    <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Top Region</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#1876f2]">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-black leading-7 text-[#0f172a] md:text-[30px]">{region || "N/A"}</p>
          <p className="text-xs text-[#64748b]">{formatNumber(readers)} active readers</p>
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-72 rounded-xl bg-[#e2e8f0]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-[162px] rounded-3xl bg-[#e2e8f0]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-[420px] rounded-3xl bg-[#e2e8f0] lg:col-span-2" />
        <div className="h-[420px] rounded-3xl bg-[#e2e8f0]" />
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const locale = useLocale();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<CreatorDashboardOverview | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    creatorApi
      .getDashboardOverview(token)
      .then((res: any) => {
        if (cancelled) return;
        setOverview(res?.data || null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const kpiCards = useMemo(() => {
    if (!overview) return [];
    return [
      {
        title: "Total Reads",
        value: formatNumber(overview.kpis.totalReads.value),
        icon: <Eye className="h-[18px] w-[18px]" />,
        change: overview.kpis.totalReads.changePercent,
      },
      {
        title: "Avg. Read Time",
        value: overview.kpis.avgReadTime.display,
        icon: <Timer className="h-[18px] w-[18px]" />,
        change: overview.kpis.avgReadTime.changePercent,
      },
      {
        title: "New Followers",
        value: formatNumber(overview.kpis.newFollowers.value),
        icon: <Users className="h-[18px] w-[18px]" />,
        change: overview.kpis.newFollowers.changePercent,
      },
      {
        title: "Monthly Revenue",
        value: formatUsd(overview.kpis.monthlyRevenue.valueUsd),
        icon: <Wallet className="h-[18px] w-[18px]" />,
        change: overview.kpis.monthlyRevenue.changePercent,
      },
    ];
  }, [overview]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <section className="rounded-3xl border border-[#fecaca] bg-[#fff1f2] p-6 text-[#9f1239]">
        <h1 className="text-xl font-bold">Unable to load creator dashboard</h1>
        <p className="mt-2 text-sm">{error || "No data available"}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-[#e11d48] px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-black leading-[1.1] tracking-[-0.02em] text-[#0f172a] md:text-[42px]">Dashboard Overview</h1>
        <p className="mt-2 text-base leading-7 text-[#64748b] md:text-[28px]">
          {overview.greeting.message} <span className="font-bold text-[#1876f2]">{overview.greeting.highlight}</span>
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {kpiCards.map((item) => (
          <KpiCard key={item.title} title={item.title} value={item.value} icon={item.icon} change={item.change} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <BarChartCard labels={overview.trend.labels} values={overview.trend.values} />
          <RecentStoriesCard stories={overview.recentStories} locale={locale} />
        </div>

        <div className="space-y-6">
          <QuickActionsCard />
          <CreatorTipCard content={overview.creatorTip.content} ctaText={overview.creatorTip.ctaText} locale={locale} />
          <TopRegionCard region={overview.topRegion.name} readers={overview.topRegion.activeReaders} />
          <Link
            href={localizePath("/creator/tickets", locale)}
            className="block rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Tickets</p>
            <p className="mt-2 text-xl font-black leading-7 text-[#0f172a] md:text-[30px]">{overview.ticketSummary.open}</p>
            <p className="mt-1 text-xs text-[#64748b]">Open support tickets</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
