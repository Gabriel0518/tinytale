'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChartColumn,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileBadge2,
  Globe2,
  LayoutGrid,
  MoreHorizontal,
  Monitor,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/lib/authContext';
import { creatorApi } from '@/lib/api';
import { localizePath } from '@/lib/i18n';
import type {
  CreatorAudienceAnalytics,
  CreatorContractOverview,
  CreatorDramaAnalytics,
  CreatorOverviewAnalytics,
  CreatorRevenueAnalytics,
} from '@/types/creator';
import {
  ANALYTICS_RANGE_OPTIONS,
  normalizeAnalyticsRange,
  type AnalyticsAgreementData,
  type AnalyticsChartSeries,
  type AnalyticsDeviceShare,
  type AnalyticsEpisodeRow,
  type AnalyticsGeographyData,
  type AnalyticsHeatmapData,
  type AnalyticsMetric,
  type AnalyticsMetricIcon,
  type AnalyticsMetricTone,
  type AnalyticsRange,
  type AnalyticsRevenueSplitRow,
  type AnalyticsRevenueTableRow,
  type AnalyticsSegmentRow,
  type AnalyticsStoryRow,
} from './creatorAnalyticsData';
import { formatCreatorCurrency, formatCreatorDate, translateCreatorText, useCreatorI18n } from '../../_lib/creator-i18n';

type AnalyticsPageMode = 'overview' | 'revenue' | 'audience' | 'drama' | 'contract';

interface CreatorAnalyticsExperienceProps {
  mode: AnalyticsPageMode;
  dramaId?: string;
}

const CARD_CLASS = 'rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)]';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getMetricToneClasses(tone: AnalyticsMetricTone) {
  switch (tone) {
    case 'blue':
      return { surface: 'bg-[#eff6ff] text-[#2563eb]', delta: 'text-[#22c55e]' };
    case 'violet':
      return { surface: 'bg-[#f5f3ff] text-[#9333ea]', delta: 'text-[#22c55e]' };
    case 'orange':
      return { surface: 'bg-[#fff7ed] text-[#f97316]', delta: 'text-[#ef4444]' };
    case 'green':
      return { surface: 'bg-[#ecfdf5] text-[#16a34a]', delta: 'text-[#22c55e]' };
    default:
      return { surface: 'bg-[#f8fafc] text-[#475569]', delta: 'text-[#22c55e]' };
  }
}

function getStatusToneClasses(tone: 'success' | 'info' | 'warning') {
  switch (tone) {
    case 'success':
      return 'bg-[#dcfce7] text-[#15803d]';
    case 'warning':
      return 'bg-[#fef3c7] text-[#b45309]';
    default:
      return 'bg-[#dbeafe] text-[#1d4ed8]';
  }
}

function formatDelta(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function metricIcon(icon: AnalyticsMetricIcon, tone: AnalyticsMetricTone) {
  const iconClass = 'h-[18px] w-[18px]';
  switch (icon) {
    case 'views':
      return <Eye className={iconClass} />;
    case 'time':
      return <Clock3 className={iconClass} />;
    case 'followers':
      return <UserPlus className={iconClass} />;
    case 'revenue':
      return <CircleDollarSign className={iconClass} />;
    case 'wallet':
      return <Wallet className={iconClass} />;
    case 'share':
      return <ChartColumn className={iconClass} />;
    case 'rpm':
      return <TrendingUp className={iconClass} />;
    case 'audience':
      return <Users className={iconClass} />;
    case 'returning':
      return <TrendingUp className={iconClass} />;
    case 'completion':
      return <ShieldCheck className={iconClass} />;
    case 'device':
      return tone === 'slate' ? <Monitor className={iconClass} /> : <Smartphone className={iconClass} />;
    case 'unlock':
      return <ShieldCheck className={iconClass} />;
    case 'episode':
      return <LayoutGrid className={iconClass} />;
    default:
      return <ChartColumn className={iconClass} />;
  }
}

function buildRangeHref(locale: ReturnType<typeof useLocale>, pathname: string, range: AnalyticsRange) {
  return `${localizePath(pathname, locale)}?range=${range}`;
}

function buildTabHref(locale: ReturnType<typeof useLocale>, pathname: string, range: AnalyticsRange) {
  if (pathname === '/creator/contract') {
    return localizePath(pathname, locale);
  }
  return `${localizePath(pathname, locale)}?range=${range}`;
}

function rangeLabel(range: AnalyticsRange, locale: ReturnType<typeof useLocale>) {
  const label = ANALYTICS_RANGE_OPTIONS.find((option) => option.value === range)?.label ?? 'Last 7 days';
  return translateCreatorText(label, locale);
}

function AnalyticsCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx(CARD_CLASS, className)}>{children}</section>;
}

function AnalyticsPrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-[14px] bg-[#1876f2] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#1669da]"
    >
      {children}
    </Link>
  );
}

function AnalyticsGhostButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-[14px] border border-[#dbe4ee] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#334155] transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
    >
      {children}
    </button>
  );
}

function AnalyticsLoadingState({ title = 'Loading analytics...' }: { title?: string }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-8">
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1876f2] border-t-transparent" />
        <div>
          <p className="text-[16px] font-bold text-[#0f172a]">{t(title)}</p>
          <p className="mt-1 text-sm text-[#64748b]">{t('Fetching the latest creator data from the API.')}</p>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function AnalyticsErrorState({ message }: { message: string }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-8">
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[16px] font-bold text-[#0f172a]">{t('Unable to load this workspace')}</p>
        <p className="max-w-[520px] text-sm leading-6 text-[#64748b]">{t(message)}</p>
      </div>
    </AnalyticsCard>
  );
}

function AnalyticsPageShell({
  title,
  description,
  activeTab,
  range,
  tabPath,
  showTabs = true,
  actions,
  children,
  eyebrow,
}: {
  title: string;
  description: string;
  activeTab: 'overview' | 'revenue' | 'audience' | 'contract';
  range: AnalyticsRange;
  tabPath: string;
  showTabs?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
}) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const tabs = [
    { key: 'overview' as const, label: 'Overview', href: '/creator/analytics', icon: <LayoutGrid className="h-[14px] w-[14px]" /> },
    { key: 'revenue' as const, label: 'Revenue', href: '/creator/analytics/revenue', icon: <CircleDollarSign className="h-[14px] w-[14px]" /> },
    { key: 'audience' as const, label: 'Audience', href: '/creator/analytics/audience', icon: <Users className="h-[14px] w-[14px]" /> },
    { key: 'contract' as const, label: 'Contract', href: '/creator/contract', icon: <FileBadge2 className="h-[14px] w-[14px]" /> },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">{eyebrow}</p> : null}
          <h1 className="mt-1 text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-[#0f172a] md:text-[32px]">{title}</h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#64748b] md:text-[14px]">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 self-start md:items-end">
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-1 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center gap-1">
              {ANALYTICS_RANGE_OPTIONS.map((option) => {
                const active = option.value === range;
                return (
                  <Link
                    key={option.value}
                    href={buildRangeHref(locale, tabPath, option.value)}
                    className={cx(
                      'rounded-[6px] px-3 py-1.5 text-[11px] font-semibold leading-4 transition',
                      active ? 'bg-[#1876f2] text-white' : 'text-[#475569] hover:bg-[#f8fafc]'
                    )}
                  >
                    {t(option.label)}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {showTabs ? (
        <nav className="overflow-x-auto border-b border-[#e2e8f0]">
          <div className="flex min-w-max items-end">
            {tabs.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <Link
                  key={tab.href}
                  href={buildTabHref(locale, tab.href, range)}
                  className={cx(
                    'flex items-center gap-2 border-b-[3px] px-6 py-3 text-[13px] font-bold transition',
                    active ? 'border-[#1876f2] text-[#1876f2]' : 'border-transparent text-[#64748b] hover:text-[#334155]'
                  )}
                >
                  {tab.icon}
                  <span>{t(tab.label)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {children}
    </div>
  );
}

function AnalyticsMetricCard({ metric }: { metric: AnalyticsMetric }) {
  const { t } = useCreatorI18n();
  const tone = getMetricToneClasses(metric.tone);
  const positive = metric.delta >= 0;

  return (
    <AnalyticsCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={cx('flex h-8 w-8 items-center justify-center rounded-full', tone.surface)}>{metricIcon(metric.icon, metric.tone)}</div>
        <div className={cx('inline-flex items-center gap-1 text-[12px] font-bold', positive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{formatDelta(metric.delta)}</span>
        </div>
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">{t(metric.label)}</p>
      <p className="mt-2 text-[21px] font-black leading-7 tracking-[-0.03em] text-[#0f172a] md:text-[24px]">{metric.value}</p>
    </AnalyticsCard>
  );
}

function linePath(values: number[], width: number, height: number, paddingX: number, paddingTop: number, paddingBottom: number) {
  if (values.length === 0) return '';

  const max = Math.max(...values, 1) * 1.15;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingTop - paddingBottom;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : paddingX + (plotWidth / (values.length - 1)) * index;
    const y = paddingTop + plotHeight - (value / max) * plotHeight;
    return { x, y };
  });

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  // Use cubic control points so the line follows the Figma curve instead of sharp polyline corners.
  const controlPoint = (current: typeof points[number], previous: typeof points[number] | undefined, next: typeof points[number] | undefined, reverse = false) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.18;
    const angle = Math.atan2(n.y - p.y, n.x - p.x) + (reverse ? Math.PI : 0);
    const length = Math.hypot(n.x - p.x, n.y - p.y) * smoothing;
    return {
      x: current.x + Math.cos(angle) * length,
      y: current.y + Math.sin(angle) * length,
    };
  };

  return points.reduce((path, point, index, array) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const cps = controlPoint(array[index - 1], array[index - 2], point);
    const cpe = controlPoint(point, array[index - 1], array[index + 1], true);
    return `${path} C ${cps.x} ${cps.y}, ${cpe.x} ${cpe.y}, ${point.x} ${point.y}`;
  }, '');
}

function AnalyticsLineChart({ chart }: { chart: AnalyticsChartSeries }) {
  const { t } = useCreatorI18n();
  const width = 920;
  const height = 228;
  const paddingX = 12;
  const paddingTop = 14;
  const paddingBottom = 24;
  const gridLines = 4;
  const max = Math.max(...chart.primary, ...chart.secondary, 1) * 1.15;
  const plotHeight = height - paddingTop - paddingBottom;
  const plotWidth = width - paddingX * 2;
  const primaryPath = linePath(chart.primary, width, height, paddingX, paddingTop, paddingBottom);
  const secondaryPath = linePath(chart.secondary, width, height, paddingX, paddingTop, paddingBottom);

  return (
    <div>
      <div className="h-[256px] overflow-hidden rounded-[20px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={t(chart.title)}>
          {Array.from({ length: gridLines }).map((_, index) => {
            const y = paddingTop + (plotHeight / (gridLines - 1)) * index;
            return <line key={index} x1={0} x2={width} y1={y} y2={y} stroke="#edf2f7" strokeWidth="1" />;
          })}
          <line x1={0} x2={0} y1={0} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={0} x2={width} y1={height - paddingBottom} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth="1" />
          <path d={secondaryPath} fill="none" stroke="#cbd5e1" strokeDasharray="7 7" strokeWidth="2.5" strokeLinecap="round" />
          <path d={primaryPath} fill="none" stroke="#1876f2" strokeWidth="4" strokeLinecap="round" />
          {chart.primary.map((value, index) => {
            if (index !== chart.primary.length - 2) return null;
            const x = chart.primary.length === 1 ? width / 2 : paddingX + (plotWidth / (chart.primary.length - 1)) * index;
            const y = paddingTop + plotHeight - (value / max) * plotHeight;
            return <circle key={index} cx={x} cy={y} r="3" fill="#1876f2" />;
          })}
        </svg>
      </div>
      <div className="mt-4 grid gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]" style={{ gridTemplateColumns: `repeat(${chart.labels.length}, minmax(0, 1fr))` }}>
        {chart.labels.map((label) => (
          <p key={label} className="text-center">
            {t(label)}
          </p>
        ))}
      </div>
    </div>
  );
}

function AnalyticsChartCard({ chart }: { chart: AnalyticsChartSeries }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t(chart.title)}</h2>
          <p className="text-sm text-[#64748b]">{t(chart.subtitle)}</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-medium text-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1876f2]" />
            <span>{t(chart.primaryLabel)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" />
            <span>{t(chart.secondaryLabel)}</span>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <AnalyticsLineChart chart={chart} />
      </div>
    </AnalyticsCard>
  );
}

function PosterThumbnail({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br text-sm font-black text-white', gradient)}>
      <span className="drop-shadow-[0_1px_2px_rgba(15,23,42,0.28)]">{initials}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[6px] w-24 overflow-hidden rounded-full bg-[#f1f5f9]">
      <div className="h-full rounded-full bg-[#1876f2]" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

function OverviewStoriesTable({ rows }: { rows: AnalyticsStoryRow[] }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard>
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-6">
        <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Recent Stories')}</h2>
        <Link href={localizePath('/creator/dramas', locale)} className="text-sm font-semibold text-[#1876f2] hover:text-[#1669da]">
          {t('View All')}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(260px,2fr)_140px_110px_170px_130px_88px] bg-[#f8fafc] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
            <span>{t('Drama Title')}</span>
            <span>{t('Status')}</span>
            <span>{t('Views')}</span>
            <span>{t('Retention')}</span>
            <span>{t('Revenue')}</span>
            <span className="text-right">{t('Actions')}</span>
          </div>
          {rows.slice(0, 2).map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(260px,2fr)_140px_110px_170px_130px_88px] items-center border-t border-[#e2e8f0] px-6 py-4">
              <div className="flex items-center gap-3">
                <PosterThumbnail initials={row.initials} gradient={row.gradient} />
                <div>
                  <p className="text-[14px] font-bold text-[#0f172a]">{row.title}</p>
                  <p className="text-[12px] text-[#64748b]">{row.subtitle}</p>
                </div>
              </div>
              <div>
                <span className={cx('inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase', getStatusToneClasses(row.statusTone))}>{t(row.status)}</span>
              </div>
              <div className="text-[14px] font-medium text-[#0f172a]">{row.viewsLabel}</div>
              <ProgressBar value={row.retention} />
              <div className="text-[14px] font-bold text-[#0f172a]">{row.revenueLabel}</div>
              <div className="flex justify-end">
                <Link href={localizePath(row.href, locale)} className="rounded-full p-2 text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#64748b]">
                  <MoreHorizontal className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function BalanceCard({ label, value, ctaLabel, href }: { label: string; value: string; ctaLabel: string; href: string }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="min-h-[166px] border-l-4 border-l-[#1876f2] p-7">
      <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t(label)}</p>
      <p className="mt-2 text-[30px] font-black leading-9 tracking-[-0.03em] text-[#0f172a]">{value}</p>
      <Link href={localizePath(href, locale)} className="mt-6 inline-flex items-center gap-1 text-[12px] font-bold text-[#1876f2] hover:text-[#1669da]">
        {t(ctaLabel)}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </AnalyticsCard>
  );
}

function GeographyCard({ data }: { data: AnalyticsGeographyData }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t(data.title)}</h2>
        <Globe2 className="h-5 w-5 text-[#94a3b8]" />
      </div>
      <div className="mt-6 rounded-[16px] bg-[#f1f5f9] px-6 py-8">
        <div className="mx-auto max-w-[240px] text-center">
          <p className="text-sm text-[#64748b]">{t('Top Regions')}</p>
          <div className="mt-4 space-y-3 text-left">
            {data.rows.slice(0, 3).map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <p className="w-28 text-[12px] font-bold uppercase leading-4 text-[#0f172a]">{row.label}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dbe4ee]">
                  <div className="h-full rounded-full bg-[#1876f2]" style={{ width: `${row.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function AgreementCard({ agreement }: { agreement: AnalyticsAgreementData }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Active Agreement')}</h2>
        <span className="inline-flex rounded-full bg-[#dcfce7] px-2 py-1 text-[10px] font-bold uppercase text-[#15803d]">{t(agreement.status)}</span>
      </div>
      <div className="mt-6 rounded-[24px] bg-[#f8fafc] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(24,118,242,0.1)] text-[#1876f2]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#0f172a]">{agreement.planName}</p>
            <p className="text-[12px] text-[#64748b]">{t('Expires: __ARG_0__', agreement.expiresAt)}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[#e2e8f0] p-3 text-center">
          <p className="text-[12px] font-bold uppercase text-[#64748b]">{t('Rev Share')}</p>
          <p className="mt-1 text-[18px] font-black text-[#0f172a]">{agreement.revShare}</p>
        </div>
        <div className="rounded-[16px] border border-[#e2e8f0] p-3 text-center">
          <p className="text-[12px] font-bold uppercase text-[#64748b]">{t('Copyright')}</p>
          <p className="mt-1 text-[18px] font-black text-[#0f172a]">{agreement.copyright}</p>
        </div>
      </div>
      <Link
        href={localizePath(agreement.href, locale)}
        className="mt-4 inline-flex w-full items-center justify-center rounded-[16px] border border-[rgba(24,118,242,0.2)] px-4 py-2.5 text-sm font-bold text-[#1876f2] transition hover:bg-[#f8fbff]"
      >
        {t('Review Agreement History')}
      </Link>
    </AnalyticsCard>
  );
}

function HeatmapCard({ data }: { data: AnalyticsHeatmapData }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t(data.title)}</h2>
      <div className="mt-6 space-y-1">
        {data.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
            {row.map((value, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="h-4 rounded-[2px]"
                style={{ backgroundColor: `rgba(24, 118, 242, ${Math.max(0.08, value)})` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
        {data.labels.map((label) => (
          <p key={label} className="text-center">
            {t(label)}
          </p>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function RevenueTitlesTable({ rows }: { rows: AnalyticsRevenueTableRow[] }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard>
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-6">
        <div>
          <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Top Earning Titles')}</h2>
          <p className="text-sm text-[#64748b]">{t('Track which dramas are driving the next settlement cycle.')}</p>
        </div>
        <AnalyticsGhostButton>
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('Export CSV')}
          </span>
        </AnalyticsGhostButton>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[minmax(240px,2fr)_128px_128px_110px_100px_120px] bg-[#f8fafc] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
            <span>{t('Drama Title')}</span>
            <span>{t('Gross')}</span>
            <span>{t('Creator Share')}</span>
            <span>{t('Unlocks')}</span>
            <span>{t('RPM')}</span>
            <span>{t('Status')}</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(240px,2fr)_128px_128px_110px_100px_120px] items-center border-t border-[#e2e8f0] px-6 py-4">
              <div className="flex items-center gap-3">
                <PosterThumbnail initials={row.initials} gradient={row.gradient} />
                <div>
                  <Link href={localizePath(row.href, locale)} className="text-[14px] font-bold text-[#0f172a] hover:text-[#1876f2]">
                    {row.title}
                  </Link>
                  <p className="text-[12px] text-[#64748b]">{row.season}</p>
                </div>
              </div>
              <p className="text-[14px] font-bold text-[#0f172a]">{row.grossRevenue}</p>
              <p className="text-[14px] font-bold text-[#1876f2]">{row.creatorShare}</p>
              <p className="text-[14px] font-medium text-[#0f172a]">{row.unlocks}</p>
              <p className="text-[14px] font-medium text-[#0f172a]">{row.rpm}</p>
              <span className={cx('inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-bold uppercase', getStatusToneClasses(row.statusTone))}>{t(row.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function RevenueSplitCard({ rows }: { rows: AnalyticsRevenueSplitRow[] }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Revenue Split')}</h2>
      <p className="text-sm text-[#64748b]">{t('USD settlement composition after reserve and channel fee deductions.')}</p>
      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const fill = row.tone === 'blue' ? '#1876f2' : row.tone === 'orange' ? '#f97316' : '#94a3b8';
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <p className="font-semibold text-[#0f172a]">{t(row.label)}</p>
                <p className="font-bold text-[#0f172a]">{row.amount}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full rounded-full" style={{ width: `${row.percent}%`, backgroundColor: fill }} />
              </div>
              <p className="mt-1 text-[12px] text-[#64748b]">{t('__ARG_0__% of total revenue', row.percent)}</p>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

function ForecastCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  const { t } = useCreatorI18n();

  return (
    <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t(label)}</p>
      <p className="mt-2 text-[22px] font-black leading-7 text-[#0f172a]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{t(helper)}</p>
    </div>
  );
}

function ForecastPanel({ rows }: { rows: Array<{ label: string; value: string; helper: string }> }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Settlement Forecast')}</h2>
      <p className="text-sm text-[#64748b]">{t('Finance-aligned preview of the next payout cycle.')}</p>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <ForecastCard key={row.label} {...row} />
        ))}
      </div>
    </AnalyticsCard>
  );
}

function deviceGradient(devices: AnalyticsDeviceShare[]) {
  const total = devices.reduce((sum, device) => sum + Math.max(device.share, 0), 0);
  if (!devices.length || total <= 0) {
    return 'conic-gradient(#e2e8f0 0% 100%)';
  }

  let current = 0;
  const stops = devices.map((device) => {
    const start = current;
    const end = current + device.share;
    current = end;
    return `${device.color} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

function DeviceMixCard({ devices }: { devices: AnalyticsDeviceShare[] }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Device Distribution')}</h2>
      <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative h-40 w-40 rounded-full" style={{ background: deviceGradient(devices) }}>
          <div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Primary')}</p>
              <p className="text-[22px] font-black text-[#0f172a]">{devices[0] ? t(devices[0].label) : ''}</p>
            </div>
          </div>
        </div>
        <div className="w-full space-y-3 lg:max-w-[240px]">
          {devices.map((device) => (
            <div key={device.label} className="flex items-center gap-3 rounded-[16px] border border-[#e2e8f0] px-4 py-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: device.color }} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0f172a]">{t(device.label)}</p>
                <p className="text-[12px] text-[#64748b]">{device.label === 'Mobile' ? t('Primary playback surface') : t('Secondary viewing surface')}</p>
              </div>
              <p className="text-sm font-bold text-[#0f172a]">{device.share}%</p>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function AudienceSegmentsCard({ rows }: { rows: AnalyticsSegmentRow[] }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Audience Segments')}</h2>
      <p className="text-sm text-[#64748b]">{t('Who is deepening engagement and where follow-on value is coming from.')}</p>
      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const fill = row.tone === 'green' ? '#16a34a' : row.tone === 'orange' ? '#f97316' : '#1876f2';
          return (
            <div key={row.label} className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[#0f172a]">{t(row.label)}</p>
                <p className="text-sm font-bold text-[#0f172a]">{row.share}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full rounded-full" style={{ width: `${row.share}%`, backgroundColor: fill }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">{t(row.helper)}</p>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

function EpisodePerformanceTable({ rows }: { rows: AnalyticsEpisodeRow[] }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard>
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-6">
        <div>
          <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Episode Diagnostics')}</h2>
          <p className="text-sm text-[#64748b]">{t('Spot where completion and paid continuation start to drop.')}</p>
        </div>
        <AnalyticsGhostButton>
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('Export CSV')}
          </span>
        </AnalyticsGhostButton>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[120px_120px_160px_120px_120px_120px] bg-[#f8fafc] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
            <span>{t('Episode')}</span>
            <span>{t('Views')}</span>
            <span>{t('Completion')}</span>
            <span>{t('Unlock Rate')}</span>
            <span>{t('Revenue')}</span>
            <span>{t('Watch Time')}</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[120px_120px_160px_120px_120px_120px] items-center border-t border-[#e2e8f0] px-6 py-4">
              <p className="text-[14px] font-bold text-[#0f172a]">{row.episode}</p>
              <p className="text-[14px] font-medium text-[#0f172a]">{row.viewsLabel}</p>
              <div className="flex items-center gap-3">
                <ProgressBar value={row.completion} />
                <span className="text-[12px] font-semibold text-[#64748b]">{Math.round(row.completion * 100)}%</span>
              </div>
              <p className="text-[14px] font-medium text-[#0f172a]">{row.unlockRate}</p>
              <p className="text-[14px] font-bold text-[#1876f2]">{row.revenue}</p>
              <p className="text-[14px] font-medium text-[#0f172a]">{row.watchTime}</p>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function HighlightsCard({ items }: { items: Array<{ label: string; value: string; helper: string }> }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Performance Notes')}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t(item.label)}</p>
            <p className="mt-1 text-[18px] font-black text-[#0f172a]">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{t(item.helper)}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function ContractSummaryCard({ contract }: { contract: CreatorContractOverview }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const rows = [
    { label: t('Agreement Version'), value: contract.agreement.version, helper: contract.agreement.title },
    { label: t('Current Status'), value: t(contract.agreement.statusLabel), helper: t('Signature: __ARG_0__', contract.agreement.signatureName || t('Pending')) },
    { label: t('Signed At'), value: contract.agreement.signedAt ? formatCreatorDate(contract.agreement.signedAt, locale) : t('Awaiting signature'), helper: t('Effective: __ARG_0__', contract.agreement.effectiveAt ? formatCreatorDate(contract.agreement.effectiveAt, locale) : t('Pending')) },
    { label: t('Renewal'), value: contract.agreement.nextRenewalAt ? formatCreatorDate(contract.agreement.nextRenewalAt, locale) : t('No renewal scheduled'), helper: t('Policy __ARG_0__', contract.policy.version) },
  ];

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Agreement Summary')}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{row.label}</p>
            <p className="mt-1 text-[18px] font-black text-[#0f172a]">{row.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{row.helper}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function ContractCommercialTerms({ contract }: { contract: CreatorContractOverview }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const rows = [
    { label: t('Settlement Currency'), value: contract.agreement.settlementCurrency, helper: t('All creator revenue is normalized and paid out in USD.') },
    { label: t('Creator Share'), value: `${Math.round(contract.agreement.creatorShareRate * 100)}%`, helper: t('Applied to eligible unlock revenue after platform policy checks.') },
    { label: t('Platform Fee'), value: `${Math.round(contract.agreement.platformFeeRate * 100)}%`, helper: t('Covers platform processing, distribution, and support operations.') },
    { label: t('Refund Reserve'), value: `${Math.round(contract.agreement.refundReserveRate * 100)}%`, helper: t('Held temporarily against chargebacks and refund exposure.') },
    { label: t('Hold Window'), value: t('__ARG_0__ days', contract.agreement.holdDays), helper: t('Revenue clears after the rolling verification hold expires.') },
    { label: t('Minimum Payout'), value: formatCreatorCurrency(contract.agreement.minimumPayoutUsd, locale), helper: t('Statements are scheduled on day __ARG_0__ each month.', contract.agreement.payoutScheduleDay) },
  ];

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Commercial Terms')}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{row.label}</p>
            <p className="mt-1 text-[18px] font-black text-[#0f172a]">{row.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{row.helper}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function ContractComplianceCard({ contract }: { contract: CreatorContractOverview }) {
  const { t } = useCreatorI18n();
  const taxProfile = contract.taxInfo.legalName
    ? `${contract.taxInfo.legalName} • ${contract.taxInfo.taxIdType.toUpperCase()}`
    : t('No tax information submitted');
  const payoutProfile = contract.bankAccount.bankName
    ? `${contract.bankAccount.bankName} ${contract.bankAccount.accountNumberMasked}`.trim()
    : t('No payout account on file');

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Compliance & Settlement Readiness')}</h2>
      <div className="mt-6 space-y-4">
        <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Payout Account')}</p>
          <p className="mt-1 text-[18px] font-black text-[#0f172a]">{t(contract.bankAccount.verificationLabel)}</p>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">{payoutProfile}</p>
        </div>
        <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Tax Information')}</p>
          <p className="mt-1 text-[18px] font-black text-[#0f172a]">{contract.taxInfo.status === 'submitted' ? t('Submitted') : t('Missing')}</p>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">{taxProfile}</p>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function ContractTimelineCard({ items }: { items: CreatorContractOverview['timeline'] }) {
  const { t } = useCreatorI18n();

  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Contract Timeline')}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t(item.label)}</p>
                <p className="mt-1 text-[16px] font-bold text-[#0f172a]">{item.value}</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{t(item.helper)}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function PolicyNotesCard({ contract }: { contract: CreatorContractOverview }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  return (
    <AnalyticsCard className="p-6">
      <h2 className="text-[18px] font-bold leading-7 text-[#0f172a]">{t('Policy Notes')}</h2>
      <div className="mt-6 space-y-3">
        {contract.policy.notes.map((note, index) => (
          <div key={`${index}-${note}`} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#475569]">
            {note}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#94a3b8]">
        {translateCreatorText('Last updated', locale)} {contract.policy.lastUpdatedAt ? formatCreatorDate(contract.policy.lastUpdatedAt, locale) : translateCreatorText('not recorded', locale)}.
      </p>
    </AnalyticsCard>
  );
}

function OverviewContent({ range, overview }: { range: AnalyticsRange; overview: CreatorOverviewAnalytics }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();

  return (
    <AnalyticsPageShell
      title={t('TinyTale Analytics')}
      description={t('Creator-wide views, readers, revenue, and audience behavior across __ARG_0__.', rangeLabel(range, locale).toLowerCase())}
      activeTab="overview"
      range={range}
      tabPath="/creator/analytics"
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <AnalyticsMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <AnalyticsChartCard chart={overview.chart} />
      <OverviewStoriesTable rows={overview.stories} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <BalanceCard {...overview.balance} />
        <div className="grid gap-6 md:grid-cols-2">
          <GeographyCard data={overview.geography} />
          <AgreementCard agreement={overview.agreement} />
        </div>
      </div>

      <HeatmapCard data={overview.heatmap} />
    </AnalyticsPageShell>
  );
}

function RevenueContent({ range }: { range: AnalyticsRange }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const [remoteSnapshot, setRemoteSnapshot] = useState<CreatorRevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setRemoteSnapshot(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    creatorApi
      .getRevenueAnalytics(token, range)
      .then((res) => {
        if (!cancelled) {
          setRemoteSnapshot(res?.data || null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setRemoteSnapshot(null);
          setError(err.message || t('Revenue analytics API returned an error.'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, t, token]);

  return (
    <AnalyticsPageShell
      title={t('Revenue Analysis')}
      description={t('USD revenue performance, settlement readiness, and title-level earning contribution across the current creator portfolio.')}
      activeTab="revenue"
      range={range}
      tabPath="/creator/analytics/revenue"
      actions={
        <>
          <AnalyticsGhostButton>
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('Export CSV')}
            </span>
          </AnalyticsGhostButton>
          <AnalyticsPrimaryButton href={localizePath('/creator/settlements', locale)}>{t('Open Settlements')}</AnalyticsPrimaryButton>
        </>
      }
    >
      {loading ? <AnalyticsLoadingState title={t('Loading revenue analytics...')} /> : null}
      {!loading && error ? <AnalyticsErrorState message={error} /> : null}
      {!loading && !error && !remoteSnapshot ? <AnalyticsErrorState message={t('Revenue analytics API returned no data.')} /> : null}
      {!loading && !error && remoteSnapshot ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {remoteSnapshot.metrics.map((metric) => (
              <AnalyticsMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <AnalyticsChartCard chart={remoteSnapshot.chart} />
          <RevenueTitlesTable rows={remoteSnapshot.titles} />

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <BalanceCard {...remoteSnapshot.balance} />
            <div className="grid gap-6 md:grid-cols-2">
              <RevenueSplitCard rows={remoteSnapshot.splitRows} />
              <ForecastPanel rows={remoteSnapshot.forecastRows} />
            </div>
          </div>
        </>
      ) : null}
    </AnalyticsPageShell>
  );
}

function AudienceContent({ range }: { range: AnalyticsRange }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const [remoteSnapshot, setRemoteSnapshot] = useState<CreatorAudienceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setRemoteSnapshot(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    creatorApi
      .getAudienceAnalytics(token, range)
      .then((res) => {
        if (!cancelled) {
          setRemoteSnapshot(res?.data || null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setRemoteSnapshot(null);
          setError(err.message || t('Audience analytics API returned an error.'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, t, token]);

  return (
    <AnalyticsPageShell
      title={t('Audience Insights')}
      description={t('Region mix, device composition, repeat intent, and viewing-time patterns that explain how your catalog is being consumed.')}
      activeTab="audience"
      range={range}
      tabPath="/creator/analytics/audience"
      actions={
        <>
          <AnalyticsGhostButton>
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('Export CSV')}
            </span>
          </AnalyticsGhostButton>
          <AnalyticsPrimaryButton href={localizePath('/creator/dramas', locale)}>{t('Open Dramas')}</AnalyticsPrimaryButton>
        </>
      }
    >
      {loading ? <AnalyticsLoadingState title={t('Loading audience analytics...')} /> : null}
      {!loading && error ? <AnalyticsErrorState message={error} /> : null}
      {!loading && !error && !remoteSnapshot ? <AnalyticsErrorState message={t('Audience analytics API returned no data.')} /> : null}
      {!loading && !error && remoteSnapshot ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {remoteSnapshot.metrics.map((metric) => (
              <AnalyticsMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <AnalyticsChartCard chart={remoteSnapshot.chart} />

          <div className="grid gap-6 md:grid-cols-2">
            <GeographyCard data={remoteSnapshot.geography} />
            <DeviceMixCard devices={remoteSnapshot.devices} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <HeatmapCard data={remoteSnapshot.heatmap} />
            <AudienceSegmentsCard rows={remoteSnapshot.segments} />
          </div>
        </>
      ) : null}
    </AnalyticsPageShell>
  );
}

function DramaContent({ range, dramaId, dramaTitle }: { range: AnalyticsRange; dramaId?: string; dramaTitle?: string }) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const [remoteSnapshot, setRemoteSnapshot] = useState<CreatorDramaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !dramaId) {
      setLoading(false);
      setRemoteSnapshot(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    creatorApi
      .getDramaAnalytics(token, dramaId, range)
      .then((res) => {
        if (!cancelled) {
          setRemoteSnapshot(res?.data || null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setRemoteSnapshot(null);
          setError(err.message || t('Drama analytics API returned an error.'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dramaId, range, t, token]);

  return (
    <AnalyticsPageShell
      title={remoteSnapshot?.title || dramaTitle || t('Drama Analytics')}
      description={t('Single-title diagnostic view across views, unlock conversion, episode completion, audience composition, and commercial efficiency.')}
      activeTab="overview"
      range={range}
      tabPath={dramaId ? `/creator/dramas/${dramaId}/analytics` : '/creator/analytics'}
      showTabs={false}
      eyebrow={t('Drama Analytics')}
      actions={
        <>
          <AnalyticsGhostButton>
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('Export CSV')}
            </span>
          </AnalyticsGhostButton>
          <AnalyticsPrimaryButton href={localizePath(dramaId ? `/creator/dramas/${dramaId}` : '/creator/dramas', locale)}>
            {t('Back to Drama')}
          </AnalyticsPrimaryButton>
        </>
      }
    >
      {loading ? <AnalyticsLoadingState title={t('Loading drama analytics...')} /> : null}
      {!loading && error ? <AnalyticsErrorState message={error} /> : null}
      {!loading && !error && !remoteSnapshot ? <AnalyticsErrorState message={t('Drama analytics API returned no data.')} /> : null}
      {!loading && !error && remoteSnapshot ? (
        <>
          <AnalyticsCard className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{remoteSnapshot.seasonLabel}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#0f172a]">{remoteSnapshot.title}</h2>
                  <span className={cx('inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase', getStatusToneClasses(remoteSnapshot.statusTone))}>{remoteSnapshot.status}</span>
                </div>
              </div>
              <p className="max-w-[360px] text-[13px] leading-6 text-[#64748b]">{t('This drilldown follows the latest creator spec: views, completion, unlocks, geography, and device context are all visible in one place.')}</p>
            </div>
          </AnalyticsCard>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {remoteSnapshot.metrics.map((metric) => (
              <AnalyticsMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <AnalyticsChartCard chart={remoteSnapshot.chart} />
          <EpisodePerformanceTable rows={remoteSnapshot.episodes} />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
            <GeographyCard data={remoteSnapshot.geography} />
            <DeviceMixCard devices={remoteSnapshot.devices} />
            <HighlightsCard items={remoteSnapshot.highlights} />
          </div>
        </>
      ) : null}
    </AnalyticsPageShell>
  );
}

function ContractContent() {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const [contract, setContract] = useState<CreatorContractOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setContract(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    creatorApi
      .getContractOverview(token)
      .then((res) => {
        if (!cancelled) {
          setContract(res?.data || null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setContract(null);
          setError(err.message || t('Contract API returned an error.'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t, token]);

  return (
    <AnalyticsPageShell
      title={t('Contract & Agreement')}
      description={t('Review the active creator agreement, payout readiness, applied policy version, and compliance checkpoints for this creator account.')}
      activeTab="contract"
      range="7d"
      tabPath="/creator/contract"
      actions={<AnalyticsPrimaryButton href={localizePath('/creator/settlements', locale)}>{t('Open Settlements')}</AnalyticsPrimaryButton>}
    >
      {loading ? <AnalyticsLoadingState title={t('Loading contract overview...')} /> : null}
      {!loading && error ? <AnalyticsErrorState message={error} /> : null}
      {!loading && !error && !contract ? <AnalyticsErrorState message={t('Contract API returned no data.')} /> : null}
      {!loading && !error && contract ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <ContractSummaryCard contract={contract} />
            <ContractComplianceCard contract={contract} />
          </div>

          <ContractCommercialTerms contract={contract} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <PolicyNotesCard contract={contract} />
            <ContractTimelineCard items={contract.timeline} />
          </div>
        </>
      ) : null}
    </AnalyticsPageShell>
  );
}

export default function CreatorAnalyticsExperience({ mode, dramaId }: CreatorAnalyticsExperienceProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const range = normalizeAnalyticsRange(searchParams.get('range'));
  const [remoteOverview, setRemoteOverview] = useState<CreatorOverviewAnalytics | null>(null);
  const [dramaTitle, setDramaTitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(mode === 'overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'overview') return;
    if (!token) {
      setLoading(false);
      setRemoteOverview(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    creatorApi
      .getOverviewAnalytics(token, range)
      .then((res) => {
        if (!cancelled) {
          setRemoteOverview(res?.data || null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setRemoteOverview(null);
          setError(err.message || t('Overview analytics API returned an error.'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, range, t, token]);

  useEffect(() => {
    if (mode !== 'drama' || !token || !dramaId) return;

    let cancelled = false;

    creatorApi
      .getDramaById(token, dramaId)
      .then((res: any) => {
        if (cancelled) return;
        const title = res?.data?.title || res?.data?.data?.title || res?.data?.drama?.title;
        if (title) {
          setDramaTitle(String(title));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [dramaId, mode, token]);

  if (mode === 'revenue') {
    return <RevenueContent range={range} />;
  }

  if (mode === 'audience') {
    return <AudienceContent range={range} />;
  }

  if (mode === 'drama') {
    return <DramaContent range={range} dramaId={dramaId} dramaTitle={dramaTitle} />;
  }

  if (mode === 'contract') {
    return <ContractContent />;
  }

  if (loading) {
    return (
        <AnalyticsPageShell
        title={t('TinyTale Analytics')}
        description={t('Creator-wide views, readers, revenue, and audience behavior across __ARG_0__.', rangeLabel(range, locale).toLowerCase())}
        activeTab="overview"
        range={range}
        tabPath="/creator/analytics"
      >
        <AnalyticsLoadingState />
      </AnalyticsPageShell>
    );
  }

  if (error || !remoteOverview) {
    return (
      <AnalyticsPageShell
        title={t('TinyTale Analytics')}
        description={t('Creator-wide views, readers, revenue, and audience behavior across __ARG_0__.', rangeLabel(range, locale).toLowerCase())}
        activeTab="overview"
        range={range}
        tabPath="/creator/analytics"
      >
        <AnalyticsErrorState message={error || t('Overview analytics API returned no data.')} />
      </AnalyticsPageShell>
    );
  }

  return <OverviewContent range={range} overview={remoteOverview} />;
}
