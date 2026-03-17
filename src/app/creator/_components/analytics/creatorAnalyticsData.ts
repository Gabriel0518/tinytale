export type AnalyticsRange = '7d' | '30d' | '90d';
export type AnalyticsMetricTone = 'blue' | 'violet' | 'orange' | 'green' | 'slate';
export type AnalyticsMetricIcon =
  | 'views'
  | 'time'
  | 'followers'
  | 'revenue'
  | 'wallet'
  | 'payout'
  | 'share'
  | 'rpm'
  | 'audience'
  | 'returning'
  | 'completion'
  | 'device'
  | 'unlock'
  | 'episode';

export interface AnalyticsMetric {
  label: string;
  value: string;
  delta: number;
  tone: AnalyticsMetricTone;
  icon: AnalyticsMetricIcon;
}

export interface AnalyticsChartSeries {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  labels: string[];
  primary: number[];
  secondary: number[];
}

export interface AnalyticsStoryRow {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusTone: 'success' | 'info' | 'warning';
  viewsLabel: string;
  retention: number;
  revenueLabel: string;
  href: string;
  initials: string;
  gradient: string;
}

export interface AnalyticsBalanceCardData {
  label: string;
  value: string;
  ctaLabel: string;
  href: string;
}

export interface AnalyticsGeographyRow {
  label: string;
  share: number;
}

export interface AnalyticsGeographyData {
  title: string;
  rows: AnalyticsGeographyRow[];
}

export interface AnalyticsAgreementData {
  planName: string;
  expiresAt: string;
  status: string;
  revShare: string;
  copyright: string;
  href: string;
}

export interface AnalyticsHeatmapData {
  title: string;
  rows: number[][];
  labels: string[];
}

export interface AnalyticsRevenueSplitRow {
  label: string;
  amount: string;
  percent: number;
  tone: AnalyticsMetricTone;
}

export interface AnalyticsForecastRow {
  label: string;
  value: string;
  helper: string;
}

export interface AnalyticsRevenueTableRow {
  id: string;
  title: string;
  season: string;
  grossRevenue: string;
  creatorShare: string;
  unlocks: string;
  rpm: string;
  status: string;
  statusTone: 'success' | 'info' | 'warning';
  href: string;
  initials: string;
  gradient: string;
}

export interface AnalyticsDeviceShare {
  label: string;
  share: number;
  color: string;
}

export interface AnalyticsSegmentRow {
  label: string;
  share: number;
  helper: string;
  tone: AnalyticsMetricTone;
}

export interface AnalyticsEpisodeRow {
  id: string;
  episode: string;
  viewsLabel: string;
  completion: number;
  unlockRate: string;
  revenue: string;
  watchTime: string;
}

export const ANALYTICS_RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function normalizeAnalyticsRange(value: string | null | undefined): AnalyticsRange {
  return value === '30d' || value === '90d' ? value : '7d';
}
