"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Eye,
  FilePlus2,
  Globe,
  LifeBuoy,
  ReceiptText,
  Users,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import type { CreatorDashboardOverview } from "@/types/creator";
import { formatCreatorCurrency, formatCreatorNumber, translateCreatorText, useCreatorI18n } from "../_lib/creator-i18n";

function formatNumber(value: number, locale: ReturnType<typeof useLocale>): string {
  return formatCreatorNumber(value, locale);
}

function formatUsd(value: number, locale: ReturnType<typeof useLocale>): string {
  return formatCreatorCurrency(value, locale, "USD", { maximumFractionDigits: 2 });
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold leading-4 ${
        positive ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fff1f2] text-[#be123c]"
      }`}
    >
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  title,
  value,
  helper,
  icon,
  change,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  change: number;
}) {
  return (
    <article className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1876f2]">{icon}</div>
        <TrendBadge value={change} />
      </div>
      <p className="mt-5 text-sm font-medium text-[#64748b]">{title}</p>
      <p className="mt-1 text-[28px] font-black leading-[1.05] tracking-[-0.03em] text-[#0f172a] md:text-[32px]">{value}</p>
      <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{helper}</p>
    </article>
  );
}

function RangeChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
        active ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#f1f5f9] text-[#64748b]"
      }`}
    >
      {label}
    </span>
  );
}

function TrendTrack({
  values,
  colorClassName,
  labels,
}: {
  values: number[];
  colorClassName: string;
  labels: string[];
}) {
  const max = Math.max(...values, 1);

  return (
    <div>
      <div className="flex h-[140px] items-end gap-2 overflow-hidden rounded-2xl bg-[#f8fafc] px-3 pb-3 pt-4">
        {values.map((value, index) => (
          <div key={`${labels[index]}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className={`w-full rounded-t-2xl ${colorClassName}`} style={{ height: `${Math.max(12, (value / max) * 116)}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {labels.map((label) => (
          <p key={label} className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}

function TrendCard({ overview }: { overview: CreatorDashboardOverview }) {
  const locale = useLocale();
  const range = overview.trend.range || "7d";
  const peakViews = Math.max(...overview.trend.values, 0);
  const revenueValues = overview.trend.revenueValues || [];
  const peakRevenue = Math.max(...revenueValues, 0);

  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[28px]">{translateCreatorText("Performance Trends", locale)}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#64748b]">
            {translateCreatorText("The overview now tracks plays and revenue together so creators can compare content traction with settlement impact.", locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RangeChip label="7D" active={range === "7d"} />
          <RangeChip label="30D" active={range === "30d"} />
          <RangeChip label="90D" active={range === "90d"} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#0f172a]">{translateCreatorText("Views", locale)}</p>
              <p className="text-xs text-[#64748b]">{translateCreatorText("Peak", locale)} {formatNumber(peakViews, locale)}</p>
            </div>
            <TrendTrack labels={overview.trend.labels} values={overview.trend.values} colorClassName="bg-[#1876f2]" />
          </div>

          {revenueValues.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-[#0f172a]">{translateCreatorText("Revenue", locale)}</p>
                <p className="text-xs text-[#64748b]">{translateCreatorText("Peak", locale)} {formatUsd(peakRevenue, locale)}</p>
              </div>
              <TrendTrack labels={overview.trend.labels} values={revenueValues} colorClassName="bg-[#0f766e]" />
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("Peak Views", locale)}</p>
            <p className="mt-3 text-[28px] font-black text-[#0f172a]">{formatNumber(peakViews, locale)}</p>
            <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{translateCreatorText("Use this spike to review which drama or campaign drove the strongest reach.", locale)}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("Settlement Lens", locale)}</p>
            <p className="mt-3 text-[28px] font-black text-[#0f172a]">USD</p>
            <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{translateCreatorText("Revenue analytics and settlements now share the same USD payout lens.", locale)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCover({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return <div className="h-16 w-16 rounded-2xl bg-[#e2e8f0]" />;
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#e2e8f0]">
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
  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[28px]">{translateCreatorText("Recent Titles", locale)}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{translateCreatorText("Monitor the most recent creator titles and jump straight into the next action.", locale)}</p>
        </div>
        <Link href={localizePath("/creator/dramas", locale)} className="text-sm font-bold text-[#1876f2] hover:text-[#1669da]">
          {translateCreatorText("View All", locale)}
        </Link>
      </div>

      <div className="mt-6 divide-y divide-[#e2e8f0]">
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">
            {translateCreatorText("No drama records yet. Create your first title to start the content-review workflow.", locale)}
          </div>
        ) : (
          stories.slice(0, 4).map((story) => (
            <div key={story._id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <StoryCover src={story.cover} alt={story.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#0f172a] md:text-[17px]">{story.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#64748b]">
                  {story.statusText} · {story.statusMeta} · {story.readsLabel}
                </p>
              </div>
              <Link
                href={localizePath(`/creator/dramas/${story._id}`, locale)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1876f2] hover:text-[#1669da]"
              >
                {translateCreatorText("Manage", locale)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QuickActionsCard({ locale }: { locale: ReturnType<typeof useLocale> }) {
  const actions = [
    { label: "New Drama", href: "/creator/dramas/new", icon: <FilePlus2 className="h-5 w-5" /> },
    { label: "Content List", href: "/creator/dramas", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Analytics", href: "/creator/analytics", icon: <Eye className="h-5 w-5" /> },
    { label: "Settlements", href: "/creator/settlements", icon: <ReceiptText className="h-5 w-5" /> },
    { label: "Support", href: "/creator/tickets/new", icon: <LifeBuoy className="h-5 w-5" /> },
  ];

  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <h2 className="text-[20px] font-black text-[#0f172a] md:text-[24px]">{translateCreatorText("Quick Actions", locale)}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={localizePath(action.href, locale)}
            className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-[13px] font-semibold text-[#334155] hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
          >
            <span className="text-[#1876f2]">{action.icon}</span>
            <span>{translateCreatorText(action.label, locale)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PipelineCard({
  overview,
  locale,
}: {
  overview: CreatorDashboardOverview;
  locale: ReturnType<typeof useLocale>;
}) {
  const contentStats = overview.kpis.contentStats;

  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-black text-[#0f172a] md:text-[24px]">{translateCreatorText("Content Pipeline", locale)}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{translateCreatorText("Track what is live, still pending review, or waiting on creator action.", locale)}</p>
        </div>
        <Link href={localizePath("/creator/dramas", locale)} className="text-sm font-bold text-[#1876f2] hover:text-[#1669da]">
          {translateCreatorText("Open Dramas", locale)}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#ecfdf5] p-4 text-[#047857]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em]">{translateCreatorText("Published", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#065f46]">{contentStats?.published ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-[#eff6ff] p-4 text-[#1d4ed8]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em]">{translateCreatorText("Pending Review", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#1e40af]">{contentStats?.pendingReview ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-[#f1f5f9] p-4 text-[#475569]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em]">{translateCreatorText("Drafts", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#0f172a]">{contentStats?.drafts ?? 0}</p>
        </div>
      </div>
    </section>
  );
}

function TicketSummaryCard({
  overview,
  locale,
}: {
  overview: CreatorDashboardOverview;
  locale: ReturnType<typeof useLocale>;
}) {
  const { ticketSummary } = overview;

  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-black text-[#0f172a] md:text-[24px]">{translateCreatorText("Support Queue", locale)}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{translateCreatorText("Settlement disputes, content appeals, DMCA issues, and technical blockers all land here.", locale)}</p>
        </div>
        <Link href={localizePath("/creator/tickets", locale)} className="text-sm font-bold text-[#1876f2] hover:text-[#1669da]">
          {translateCreatorText("View Tickets", locale)}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("Open", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#0f172a]">{ticketSummary.open}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("Waiting You", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#0f172a]">{ticketSummary.waiting_creator}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("In Progress", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#0f172a]">{ticketSummary.in_progress}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{translateCreatorText("Resolved", locale)}</p>
          <p className="mt-2 text-[28px] font-black text-[#0f172a]">{ticketSummary.resolved}</p>
        </div>
      </div>
    </section>
  );
}

function OperationsCard({ locale }: { locale: ReturnType<typeof useLocale> }) {
  return (
    <section className="rounded-[24px] bg-[#0f172a] p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#93c5fd]">{translateCreatorText("Operations", locale)}</p>
      <h2 className="mt-3 text-[20px] font-black md:text-[24px]">{translateCreatorText("Analytics, bank review, and monthly USD settlements are now one workflow.", locale)}</h2>
      <ul className="mt-4 space-y-2 text-[13px] leading-6 text-[#cbd5e1]">
        <li>{translateCreatorText("48-hour review target for creator application and content review queues", locale)}</li>
        <li>{translateCreatorText("USD settlement view with channel-fee deduction before creator split", locale)}</li>
        <li>{translateCreatorText("Bank-account verification is required before payout release", locale)}</li>
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={localizePath("/creator/analytics", locale)} className="rounded-2xl bg-[#1876f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1669da]">
          {translateCreatorText("Open Analytics", locale)}
        </Link>
        <Link href={localizePath("/creator/settlements", locale)} className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/5">
          {translateCreatorText("Open Settlements", locale)}
        </Link>
      </div>
    </section>
  );
}

function TopRegionCard({ region, readers }: { region: string; readers: number }) {
  const locale = useLocale();
  return (
    <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">{translateCreatorText("Top Region", locale)}</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#1876f2]">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[22px] font-black text-[#0f172a]">{region || "N/A"}</p>
          <p className="text-[13px] text-[#64748b]">{formatNumber(readers, locale)} {translateCreatorText("active viewers", locale)}</p>
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 w-72 rounded-xl bg-[#e2e8f0]" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-[188px] rounded-3xl bg-[#e2e8f0]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.5fr]">
        <div className="h-[460px] rounded-3xl bg-[#e2e8f0]" />
        <div className="h-[460px] rounded-3xl bg-[#e2e8f0]" />
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const locale = useLocale();
  const { t } = useCreatorI18n();
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
        if (!cancelled) {
          setOverview(res?.data || null);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || t("Failed to load dashboard data"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const kpiCards = useMemo(() => {
    if (!overview) return [];

    return [
      {
        title: t("Total Plays"),
        value: formatNumber(overview.kpis.totalReads.value, locale),
        helper: t("All published creator titles combined."),
        icon: <Eye className="h-[18px] w-[18px]" />,
        change: overview.kpis.totalReads.changePercent,
      },
      {
        title: t("Avg. Watch Time"),
        value: overview.kpis.avgReadTime.display,
        helper: t("Average engagement depth across recent viewers."),
        icon: <Clock3 className="h-[18px] w-[18px]" />,
        change: overview.kpis.avgReadTime.changePercent,
      },
      {
        title: t("New Followers"),
        value: formatNumber(overview.kpis.newFollowers.value, locale),
        helper: t("Recent follower growth tied to active titles."),
        icon: <Users className="h-[18px] w-[18px]" />,
        change: overview.kpis.newFollowers.changePercent,
      },
      {
        title: t("Monthly Revenue"),
        value: formatUsd(overview.kpis.monthlyRevenue.valueUsd, locale),
        helper: t("Current month earnings shown in USD."),
        icon: <ReceiptText className="h-[18px] w-[18px]" />,
        change: overview.kpis.monthlyRevenue.changePercent,
      },
    ];
  }, [overview, locale, t]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <section className="rounded-3xl border border-[#fecaca] bg-[#fff1f2] p-6 text-[#9f1239]">
        <h1 className="text-xl font-bold">{t("Unable to load creator dashboard")}</h1>
        <p className="mt-2 text-sm">{error || t("No data available")}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-[#e11d48] px-4 py-2 text-sm font-semibold text-white"
        >
          {t("Retry")}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">{t("Creator Dashboard")}</p>
          <h1 className="mt-2 text-[28px] font-black leading-[1.05] tracking-[-0.03em] text-[#0f172a] md:text-[36px]">
            {overview.greeting.message}
          </h1>
          <p className="mt-3 max-w-4xl text-[13px] leading-6 text-[#64748b] md:text-[14px]">
            {overview.greeting.highlight} {t("The creator center now tracks review progress, published performance, contract state, and USD settlement readiness together.")}
          </p>
        </div>
        <Link
          href={localizePath("/creator/dramas/new", locale)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1669da]"
        >
          <FilePlus2 className="h-4 w-4" />
          {t("New Drama")}
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {kpiCards.map((item) => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            helper={item.helper}
            icon={item.icon}
            change={item.change}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-6">
          <TrendCard overview={overview} />
          <div className="grid gap-6 xl:grid-cols-2">
            <PipelineCard overview={overview} locale={locale} />
            <TicketSummaryCard overview={overview} locale={locale} />
          </div>
          <RecentStoriesCard stories={overview.recentStories} locale={locale} />
        </div>

        <div className="space-y-6">
          <QuickActionsCard locale={locale} />
          <OperationsCard locale={locale} />
          <TopRegionCard region={overview.topRegion.name} readers={overview.topRegion.activeReaders} />
        </div>
      </section>
    </div>
  );
}
