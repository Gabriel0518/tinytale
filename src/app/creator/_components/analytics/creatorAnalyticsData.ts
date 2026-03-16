import type { CreatorDashboardOverview } from '@/types/creator';

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

export interface OverviewSnapshot {
  metrics: AnalyticsMetric[];
  chart: AnalyticsChartSeries;
  stories: AnalyticsStoryRow[];
  balance: AnalyticsBalanceCardData;
  geography: AnalyticsGeographyData;
  agreement: AnalyticsAgreementData;
  heatmap: AnalyticsHeatmapData;
}

export interface RevenueSnapshot {
  metrics: AnalyticsMetric[];
  chart: AnalyticsChartSeries;
  titles: AnalyticsRevenueTableRow[];
  balance: AnalyticsBalanceCardData;
  splitRows: AnalyticsRevenueSplitRow[];
  forecastRows: AnalyticsForecastRow[];
}

export interface AudienceSnapshot {
  metrics: AnalyticsMetric[];
  chart: AnalyticsChartSeries;
  geography: AnalyticsGeographyData;
  devices: AnalyticsDeviceShare[];
  segments: AnalyticsSegmentRow[];
  heatmap: AnalyticsHeatmapData;
}

export interface DramaSnapshot {
  title: string;
  status: string;
  statusTone: 'success' | 'info' | 'warning';
  seasonLabel: string;
  metrics: AnalyticsMetric[];
  chart: AnalyticsChartSeries;
  episodes: AnalyticsEpisodeRow[];
  geography: AnalyticsGeographyData;
  devices: AnalyticsDeviceShare[];
  highlights: Array<{ label: string; value: string; helper: string }>;
}

export const ANALYTICS_RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace('M', 'm')
    .replace('K', 'k');
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function deriveSecondarySeries(primary: number[], secondary?: number[]): number[] {
  if (secondary && secondary.length === primary.length) {
    return secondary;
  }

  return primary.map((value, index) => Math.max(1, Math.round(value * (0.26 + index * 0.02))));
}

const STORY_ROWS: AnalyticsStoryRow[] = [
  {
    id: 'ceo-secret-heir',
    title: "CEO's Secret Heir",
    subtitle: 'Season 1 • Ep 42',
    status: 'Trending',
    statusTone: 'success',
    viewsLabel: '425.2k',
    retention: 0.72,
    revenueLabel: '$1,240',
    href: '/creator/dramas/ceo-secret-heir/analytics',
    initials: 'CH',
    gradient: 'from-[#f3d4bd] via-[#f8efe6] to-[#d8c0ae]',
  },
  {
    id: 'midnight-betrayal',
    title: 'Midnight Betrayal',
    subtitle: 'Season 2 • Ep 15',
    status: 'Stable',
    statusTone: 'info',
    viewsLabel: '189.1k',
    retention: 0.45,
    revenueLabel: '$840',
    href: '/creator/dramas/midnight-betrayal/analytics',
    initials: 'MB',
    gradient: 'from-[#2b1c3a] via-[#8f4d7a] to-[#f0b2a2]',
  },
  {
    id: 'vegas-vow',
    title: 'Vegas Vow',
    subtitle: 'Season 1 • Ep 11',
    status: 'Scaling',
    statusTone: 'warning',
    viewsLabel: '96.4k',
    retention: 0.58,
    revenueLabel: '$512',
    href: '/creator/dramas/vegas-vow/analytics',
    initials: 'VV',
    gradient: 'from-[#0f172a] via-[#1d4ed8] to-[#7dd3fc]',
  },
];

const OVERVIEW_BY_RANGE: Record<AnalyticsRange, Omit<OverviewSnapshot, 'stories' | 'balance' | 'geography' | 'agreement' | 'heatmap'>> = {
  '7d': {
    metrics: [
      { label: 'Total Views', value: '1,284,039', delta: 12.5, tone: 'blue', icon: 'views' },
      { label: 'Avg. Watch Time', value: '4m 32s', delta: 3.2, tone: 'violet', icon: 'time' },
      { label: 'New Followers', value: '24,592', delta: -0.8, tone: 'orange', icon: 'followers' },
      { label: 'Total Revenue', value: '$12,403.50', delta: 28.4, tone: 'green', icon: 'revenue' },
    ],
    chart: {
      title: 'Performance Trends',
      subtitle: 'Comparing views vs. total engagement actions',
      primaryLabel: 'Views',
      secondaryLabel: 'Engagement',
      labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      primary: [14, 21, 19, 84, 27, 192, 110],
      secondary: [4, 6, 5, 14, 7, 58, 32],
    },
  },
  '30d': {
    metrics: [
      { label: 'Total Views', value: '4,932,188', delta: 18.7, tone: 'blue', icon: 'views' },
      { label: 'Avg. Watch Time', value: '4m 48s', delta: 5.4, tone: 'violet', icon: 'time' },
      { label: 'New Followers', value: '92,110', delta: 7.9, tone: 'orange', icon: 'followers' },
      { label: 'Total Revenue', value: '$46,281.90', delta: 22.6, tone: 'green', icon: 'revenue' },
    ],
    chart: {
      title: 'Performance Trends',
      subtitle: 'Comparing views vs. total engagement actions',
      primaryLabel: 'Views',
      secondaryLabel: 'Engagement',
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      primary: [120, 184, 168, 242, 231, 288],
      secondary: [40, 58, 55, 74, 69, 92],
    },
  },
  '90d': {
    metrics: [
      { label: 'Total Views', value: '14,208,992', delta: 26.8, tone: 'blue', icon: 'views' },
      { label: 'Avg. Watch Time', value: '4m 40s', delta: 6.3, tone: 'violet', icon: 'time' },
      { label: 'New Followers', value: '248,311', delta: 11.2, tone: 'orange', icon: 'followers' },
      { label: 'Total Revenue', value: '$129,084.24', delta: 31.5, tone: 'green', icon: 'revenue' },
    ],
    chart: {
      title: 'Performance Trends',
      subtitle: 'Comparing views vs. total engagement actions',
      primaryLabel: 'Views',
      secondaryLabel: 'Engagement',
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
      primary: [280, 334, 308, 406, 482, 540],
      secondary: [94, 112, 108, 143, 170, 196],
    },
  },
};

const COMMON_BALANCE: AnalyticsBalanceCardData = {
  label: 'Current Balance',
  value: '$4,320.12',
  ctaLabel: 'Withdraw Now',
  href: '/creator/settlements',
};

const COMMON_GEOGRAPHY: AnalyticsGeographyData = {
  title: 'Audience Geography',
  rows: [
    { label: 'United States', share: 42 },
    { label: 'Southeast Asia', share: 28 },
    { label: 'United Kingdom', share: 14 },
  ],
};

const COMMON_AGREEMENT: AnalyticsAgreementData = {
  planName: 'Premium Content Partner V2',
  expiresAt: 'Dec 31, 2024',
  status: 'Active',
  revShare: '70 / 30',
  copyright: 'Shared',
  href: '/creator/contract',
};

const COMMON_HEATMAP: AnalyticsHeatmapData = {
  title: 'Peak Viewing Times',
  rows: [
    [0.12, 0.22, 0.32, 0.62, 0.86, 1, 0.92, 0.64, 0.42, 0.24, 0.14, 0.1],
    [0.2, 0.4, 0.62, 0.9, 1, 1, 1, 0.82, 0.54, 0.32, 0.2, 0.12],
    [0.1, 0.14, 0.22, 0.34, 0.48, 0.82, 0.66, 0.44, 0.2, 0.12, 0.1, 0.08],
  ],
  labels: ['12 AM', '6 AM', '12 PM', '6 PM', '11 PM'],
};

const REVENUE_BY_RANGE: Record<AnalyticsRange, RevenueSnapshot> = {
  '7d': {
    metrics: [
      { label: 'Gross Revenue', value: '$18,420.50', delta: 14.8, tone: 'green', icon: 'revenue' },
      { label: 'Creator Share', value: '$12,894.35', delta: 16.2, tone: 'blue', icon: 'share' },
      { label: 'Pending Payout', value: '$4,320.12', delta: 6.4, tone: 'violet', icon: 'wallet' },
      { label: 'RPM', value: '$9.66', delta: 2.9, tone: 'slate', icon: 'rpm' },
    ],
    chart: {
      title: 'Revenue Trends',
      subtitle: 'Gross revenue vs. creator share across the selected payout window',
      primaryLabel: 'Gross Revenue',
      secondaryLabel: 'Creator Share',
      labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      primary: [980, 1200, 1110, 1380, 1240, 1820, 1640],
      secondary: [686, 840, 777, 966, 868, 1274, 1148],
    },
    titles: [
      {
        id: 'ceo-secret-heir',
        title: "CEO's Secret Heir",
        season: 'Season 1 • 42 eps',
        grossRevenue: '$4,820',
        creatorShare: '$3,374',
        unlocks: '9.8k',
        rpm: '$11.34',
        status: 'Leading',
        statusTone: 'success',
        href: '/creator/dramas/ceo-secret-heir/analytics',
        initials: 'CH',
        gradient: 'from-[#f3d4bd] via-[#f8efe6] to-[#d8c0ae]',
      },
      {
        id: 'midnight-betrayal',
        title: 'Midnight Betrayal',
        season: 'Season 2 • 18 eps',
        grossRevenue: '$3,106',
        creatorShare: '$2,174',
        unlocks: '6.4k',
        rpm: '$9.82',
        status: 'Stable',
        statusTone: 'info',
        href: '/creator/dramas/midnight-betrayal/analytics',
        initials: 'MB',
        gradient: 'from-[#2b1c3a] via-[#8f4d7a] to-[#f0b2a2]',
      },
      {
        id: 'vegas-vow',
        title: 'Vegas Vow',
        season: 'Season 1 • 12 eps',
        grossRevenue: '$1,950',
        creatorShare: '$1,365',
        unlocks: '3.1k',
        rpm: '$8.34',
        status: 'Recovering',
        statusTone: 'warning',
        href: '/creator/dramas/vegas-vow/analytics',
        initials: 'VV',
        gradient: 'from-[#0f172a] via-[#1d4ed8] to-[#7dd3fc]',
      },
    ],
    balance: COMMON_BALANCE,
    splitRows: [
      { label: 'Creator Share', amount: '$12,894.35', percent: 70, tone: 'blue' },
      { label: 'Platform Fee', amount: '$3,684.10', percent: 20, tone: 'slate' },
      { label: 'Refund Reserve', amount: '$1,842.05', percent: 10, tone: 'orange' },
    ],
    forecastRows: [
      { label: 'Next Settlement', value: 'Apr 05, 2026', helper: 'Monthly USD statement closes on the last day of the month.' },
      { label: 'Cleared Revenue', value: '$8,574.23', helper: 'Already verified and ready to roll into the next settlement.' },
      { label: 'In Review', value: '$1,294.18', helper: 'Pending fraud and refund holdback checks before release.' },
    ],
  },
  '30d': {
    metrics: [
      { label: 'Gross Revenue', value: '$71,420.18', delta: 18.6, tone: 'green', icon: 'revenue' },
      { label: 'Creator Share', value: '$49,994.13', delta: 20.3, tone: 'blue', icon: 'share' },
      { label: 'Pending Payout', value: '$12,103.44', delta: 9.8, tone: 'violet', icon: 'wallet' },
      { label: 'RPM', value: '$9.38', delta: 1.4, tone: 'slate', icon: 'rpm' },
    ],
    chart: {
      title: 'Revenue Trends',
      subtitle: 'Gross revenue vs. creator share across the selected payout window',
      primaryLabel: 'Gross Revenue',
      secondaryLabel: 'Creator Share',
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      primary: [9100, 10800, 12340, 11760, 13200, 14220],
      secondary: [6370, 7560, 8638, 8232, 9240, 9954],
    },
    titles: [],
    balance: { ...COMMON_BALANCE, value: '$12,103.44' },
    splitRows: [
      { label: 'Creator Share', amount: '$49,994.13', percent: 70, tone: 'blue' },
      { label: 'Platform Fee', amount: '$14,284.04', percent: 20, tone: 'slate' },
      { label: 'Refund Reserve', amount: '$7,142.01', percent: 10, tone: 'orange' },
    ],
    forecastRows: [
      { label: 'Next Settlement', value: 'Apr 05, 2026', helper: 'Includes all cleared March revenue after reserve release.' },
      { label: 'Projected Creator Share', value: '$15,840.00', helper: 'Forecast based on the current daily run rate.' },
      { label: 'Refund Holdback', value: '$2,912.30', helper: 'Auto-released after 14-day post-purchase window.' },
    ],
  },
  '90d': {
    metrics: [
      { label: 'Gross Revenue', value: '$214,894.52', delta: 27.4, tone: 'green', icon: 'revenue' },
      { label: 'Creator Share', value: '$150,426.16', delta: 29.1, tone: 'blue', icon: 'share' },
      { label: 'Pending Payout', value: '$24,406.38', delta: 12.7, tone: 'violet', icon: 'wallet' },
      { label: 'RPM', value: '$9.72', delta: 4.1, tone: 'slate', icon: 'rpm' },
    ],
    chart: {
      title: 'Revenue Trends',
      subtitle: 'Gross revenue vs. creator share across the selected payout window',
      primaryLabel: 'Gross Revenue',
      secondaryLabel: 'Creator Share',
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
      primary: [24200, 28740, 32290, 34110, 40460, 45100],
      secondary: [16940, 20118, 22603, 23877, 28322, 31570],
    },
    titles: [],
    balance: { ...COMMON_BALANCE, value: '$24,406.38' },
    splitRows: [
      { label: 'Creator Share', amount: '$150,426.16', percent: 70, tone: 'blue' },
      { label: 'Platform Fee', amount: '$42,978.90', percent: 20, tone: 'slate' },
      { label: 'Refund Reserve', amount: '$21,489.46', percent: 10, tone: 'orange' },
    ],
    forecastRows: [
      { label: 'Next Settlement', value: 'Jul 05, 2026', helper: 'Quarter-end reconciliation expands refund reserve review.' },
      { label: 'Projected Creator Share', value: '$46,220.00', helper: 'Assumes the current content mix and RPM remain stable.' },
      { label: 'High-Variance Titles', value: '2 dramas', helper: 'Watch titles with refund spikes before the cycle closes.' },
    ],
  },
};

REVENUE_BY_RANGE['30d'].titles = REVENUE_BY_RANGE['7d'].titles;
REVENUE_BY_RANGE['90d'].titles = REVENUE_BY_RANGE['7d'].titles;

const AUDIENCE_BY_RANGE: Record<AnalyticsRange, AudienceSnapshot> = {
  '7d': {
    metrics: [
      { label: 'Unique Viewers', value: '412,584', delta: 10.4, tone: 'blue', icon: 'audience' },
      { label: 'Returning Viewers', value: '178,330', delta: 6.2, tone: 'violet', icon: 'returning' },
      { label: 'Avg. Completion', value: '61.8%', delta: 2.7, tone: 'green', icon: 'completion' },
      { label: 'Follower Conversion', value: '8.4%', delta: 1.3, tone: 'orange', icon: 'followers' },
    ],
    chart: {
      title: 'Audience Momentum',
      subtitle: 'New vs. returning viewer momentum over the selected window',
      primaryLabel: 'Unique Viewers',
      secondaryLabel: 'Returning Viewers',
      labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      primary: [62, 74, 71, 90, 84, 118, 110],
      secondary: [28, 32, 31, 40, 38, 54, 51],
    },
    geography: COMMON_GEOGRAPHY,
    devices: [
      { label: 'Mobile', share: 72, color: '#1876f2' },
      { label: 'Desktop', share: 20, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    segments: [
      { label: 'Returning viewers', share: 43, helper: 'Strong repeat intent across your top two titles.', tone: 'blue' },
      { label: 'Unlocked viewers', share: 31, helper: 'Paid viewers who progressed past the free episode window.', tone: 'green' },
      { label: 'New followers', share: 8, helper: 'Followers gained after a first-time viewing session.', tone: 'orange' },
    ],
    heatmap: COMMON_HEATMAP,
  },
  '30d': {
    metrics: [
      { label: 'Unique Viewers', value: '1,204,112', delta: 14.2, tone: 'blue', icon: 'audience' },
      { label: 'Returning Viewers', value: '548,904', delta: 9.4, tone: 'violet', icon: 'returning' },
      { label: 'Avg. Completion', value: '63.1%', delta: 3.9, tone: 'green', icon: 'completion' },
      { label: 'Follower Conversion', value: '9.1%', delta: 2.2, tone: 'orange', icon: 'followers' },
    ],
    chart: {
      title: 'Audience Momentum',
      subtitle: 'New vs. returning viewer momentum over the selected window',
      primaryLabel: 'Unique Viewers',
      secondaryLabel: 'Returning Viewers',
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      primary: [202, 218, 234, 245, 261, 278],
      secondary: [82, 90, 102, 109, 118, 126],
    },
    geography: {
      title: 'Audience Geography',
      rows: [
        { label: 'United States', share: 39 },
        { label: 'Southeast Asia', share: 24 },
        { label: 'Latin America', share: 16 },
      ],
    },
    devices: [
      { label: 'Mobile', share: 70, color: '#1876f2' },
      { label: 'Desktop', share: 22, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    segments: [
      { label: 'Returning viewers', share: 45, helper: 'Your serialized releases are retaining viewers week over week.', tone: 'blue' },
      { label: 'Unlocked viewers', share: 34, helper: 'Unlocked viewers are strongest on romance and betrayal genres.', tone: 'green' },
      { label: 'New followers', share: 9, helper: 'Follower conversion improves most after weekend release pushes.', tone: 'orange' },
    ],
    heatmap: COMMON_HEATMAP,
  },
  '90d': {
    metrics: [
      { label: 'Unique Viewers', value: '3,844,210', delta: 21.8, tone: 'blue', icon: 'audience' },
      { label: 'Returning Viewers', value: '1,842,660', delta: 13.6, tone: 'violet', icon: 'returning' },
      { label: 'Avg. Completion', value: '64.3%', delta: 4.7, tone: 'green', icon: 'completion' },
      { label: 'Follower Conversion', value: '9.8%', delta: 3.1, tone: 'orange', icon: 'followers' },
    ],
    chart: {
      title: 'Audience Momentum',
      subtitle: 'New vs. returning viewer momentum over the selected window',
      primaryLabel: 'Unique Viewers',
      secondaryLabel: 'Returning Viewers',
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
      primary: [522, 604, 648, 702, 760, 838],
      secondary: [204, 242, 268, 296, 320, 356],
    },
    geography: {
      title: 'Audience Geography',
      rows: [
        { label: 'United States', share: 37 },
        { label: 'Southeast Asia', share: 23 },
        { label: 'Latin America', share: 18 },
      ],
    },
    devices: [
      { label: 'Mobile', share: 69, color: '#1876f2' },
      { label: 'Desktop', share: 23, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    segments: [
      { label: 'Returning viewers', share: 48, helper: 'High repeat behavior among viewers who complete more than 60% of the first arc.', tone: 'blue' },
      { label: 'Unlocked viewers', share: 36, helper: 'Unlock conversion remains strongest in US and Southeast Asia.', tone: 'green' },
      { label: 'New followers', share: 10, helper: 'Follower conversion is compounding on weekend drops.', tone: 'orange' },
    ],
    heatmap: COMMON_HEATMAP,
  },
};

const DRAMA_BY_RANGE: Record<AnalyticsRange, Omit<DramaSnapshot, 'title'>> = {
  '7d': {
    status: 'Trending',
    statusTone: 'success',
    seasonLabel: 'Season 1 • 42 Episodes • Published',
    metrics: [
      { label: 'Drama Views', value: '425.2k', delta: 12.8, tone: 'blue', icon: 'views' },
      { label: 'Avg. Completion', value: '72.4%', delta: 3.4, tone: 'green', icon: 'completion' },
      { label: 'Unlock Rate', value: '18.6%', delta: 2.1, tone: 'orange', icon: 'unlock' },
      { label: 'Drama Revenue', value: '$4,820', delta: 19.2, tone: 'violet', icon: 'revenue' },
    ],
    chart: {
      title: 'Drama Performance Curve',
      subtitle: 'Daily views vs. unlock conversion for this title',
      primaryLabel: 'Views',
      secondaryLabel: 'Unlocks',
      labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      primary: [28, 34, 38, 56, 44, 88, 76],
      secondary: [8, 10, 12, 19, 16, 31, 27],
    },
    episodes: [
      { id: 'ep-40', episode: 'Ep 40', viewsLabel: '72.8k', completion: 0.74, unlockRate: '18.2%', revenue: '$880', watchTime: '5m 12s' },
      { id: 'ep-41', episode: 'Ep 41', viewsLabel: '68.1k', completion: 0.72, unlockRate: '18.9%', revenue: '$842', watchTime: '4m 58s' },
      { id: 'ep-42', episode: 'Ep 42', viewsLabel: '64.3k', completion: 0.69, unlockRate: '19.4%', revenue: '$810', watchTime: '4m 51s' },
      { id: 'ep-43', episode: 'Ep 43', viewsLabel: '58.4k', completion: 0.66, unlockRate: '17.1%', revenue: '$756', watchTime: '4m 26s' },
    ],
    geography: {
      title: 'Top Regions',
      rows: [
        { label: 'United States', share: 44 },
        { label: 'Canada', share: 14 },
        { label: 'Southeast Asia', share: 22 },
      ],
    },
    devices: [
      { label: 'Mobile', share: 74, color: '#1876f2' },
      { label: 'Desktop', share: 18, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    highlights: [
      { label: 'Highest unlock lift', value: 'Ep 42', helper: 'Cliffhanger ending is producing the strongest paid continuation rate.' },
      { label: 'Best retention window', value: '8 PM - 12 AM', helper: 'This title over-indexes on late-evening viewing compared with creator average.' },
      { label: 'Optimization note', value: 'Recap pacing', helper: 'Episodes 43-44 show faster early drop-off. Tighten recap runtime in the next cut.' },
    ],
  },
  '30d': {
    status: 'Trending',
    statusTone: 'success',
    seasonLabel: 'Season 1 • 42 Episodes • Published',
    metrics: [
      { label: 'Drama Views', value: '1.4m', delta: 17.6, tone: 'blue', icon: 'views' },
      { label: 'Avg. Completion', value: '73.1%', delta: 4.1, tone: 'green', icon: 'completion' },
      { label: 'Unlock Rate', value: '19.2%', delta: 2.8, tone: 'orange', icon: 'unlock' },
      { label: 'Drama Revenue', value: '$14,112', delta: 24.7, tone: 'violet', icon: 'revenue' },
    ],
    chart: {
      title: 'Drama Performance Curve',
      subtitle: 'Daily views vs. unlock conversion for this title',
      primaryLabel: 'Views',
      secondaryLabel: 'Unlocks',
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      primary: [116, 132, 154, 148, 176, 194],
      secondary: [26, 30, 34, 33, 40, 45],
    },
    episodes: [
      { id: 'ep-40', episode: 'Ep 40', viewsLabel: '221.8k', completion: 0.75, unlockRate: '19.0%', revenue: '$2,630', watchTime: '5m 10s' },
      { id: 'ep-41', episode: 'Ep 41', viewsLabel: '208.4k', completion: 0.73, unlockRate: '19.3%', revenue: '$2,481', watchTime: '4m 57s' },
      { id: 'ep-42', episode: 'Ep 42', viewsLabel: '196.3k', completion: 0.71, unlockRate: '19.9%', revenue: '$2,422', watchTime: '4m 53s' },
      { id: 'ep-43', episode: 'Ep 43', viewsLabel: '182.5k', completion: 0.68, unlockRate: '18.0%', revenue: '$2,188', watchTime: '4m 31s' },
    ],
    geography: {
      title: 'Top Regions',
      rows: [
        { label: 'United States', share: 42 },
        { label: 'Canada', share: 13 },
        { label: 'Southeast Asia', share: 24 },
      ],
    },
    devices: [
      { label: 'Mobile', share: 73, color: '#1876f2' },
      { label: 'Desktop', share: 19, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    highlights: [
      { label: 'Highest unlock lift', value: 'Ep 42', helper: 'Paid continuation remains strongest once the secret-heir twist lands.' },
      { label: 'Best retention window', value: '8 PM - 12 AM', helper: 'The drama retains a late-evening viewing advantage across English-speaking markets.' },
      { label: 'Optimization note', value: 'Accelerate act one', helper: 'Mid-season viewers are dropping slightly earlier on replay sessions.' },
    ],
  },
  '90d': {
    status: 'Flagship',
    statusTone: 'info',
    seasonLabel: 'Season 1 • 42 Episodes • Published',
    metrics: [
      { label: 'Drama Views', value: '4.8m', delta: 24.4, tone: 'blue', icon: 'views' },
      { label: 'Avg. Completion', value: '74.0%', delta: 5.2, tone: 'green', icon: 'completion' },
      { label: 'Unlock Rate', value: '19.8%', delta: 3.1, tone: 'orange', icon: 'unlock' },
      { label: 'Drama Revenue', value: '$46,210', delta: 29.2, tone: 'violet', icon: 'revenue' },
    ],
    chart: {
      title: 'Drama Performance Curve',
      subtitle: 'Daily views vs. unlock conversion for this title',
      primaryLabel: 'Views',
      secondaryLabel: 'Unlocks',
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
      primary: [362, 410, 468, 522, 560, 612],
      secondary: [74, 84, 96, 108, 116, 129],
    },
    episodes: [
      { id: 'ep-40', episode: 'Ep 40', viewsLabel: '688.1k', completion: 0.76, unlockRate: '19.1%', revenue: '$8,012', watchTime: '5m 08s' },
      { id: 'ep-41', episode: 'Ep 41', viewsLabel: '651.4k', completion: 0.74, unlockRate: '19.4%', revenue: '$7,834', watchTime: '4m 56s' },
      { id: 'ep-42', episode: 'Ep 42', viewsLabel: '614.8k', completion: 0.72, unlockRate: '20.1%', revenue: '$7,598', watchTime: '4m 49s' },
      { id: 'ep-43', episode: 'Ep 43', viewsLabel: '582.3k', completion: 0.69, unlockRate: '18.4%', revenue: '$7,104', watchTime: '4m 24s' },
    ],
    geography: {
      title: 'Top Regions',
      rows: [
        { label: 'United States', share: 41 },
        { label: 'Canada', share: 13 },
        { label: 'Southeast Asia', share: 25 },
      ],
    },
    devices: [
      { label: 'Mobile', share: 72, color: '#1876f2' },
      { label: 'Desktop', share: 20, color: '#60a5fa' },
      { label: 'Tablet', share: 8, color: '#cbd5e1' },
    ],
    highlights: [
      { label: 'Highest unlock lift', value: 'Ep 42', helper: 'The title sustains top-quartile paid conversion across the full quarter.' },
      { label: 'Best retention window', value: '8 PM - 12 AM', helper: 'Prime-time behavior is consistent across all top markets.' },
      { label: 'Optimization note', value: 'Prepare sequel hook', helper: 'Viewership and unlock rate support a sequel tease in the finale CTA.' },
    ],
  },
};

export function normalizeAnalyticsRange(raw: string | null | undefined): AnalyticsRange {
  return raw === '30d' || raw === '90d' ? raw : '7d';
}

export function getOverviewSnapshot(range: AnalyticsRange, remoteOverview?: CreatorDashboardOverview | null): OverviewSnapshot {
  const base = OVERVIEW_BY_RANGE[range];

  if (!remoteOverview || range !== '7d') {
    return {
      ...base,
      stories: STORY_ROWS,
      balance: COMMON_BALANCE,
      geography: COMMON_GEOGRAPHY,
      agreement: COMMON_AGREEMENT,
      heatmap: COMMON_HEATMAP,
    };
  }

  const remoteStories = Array.isArray(remoteOverview.recentStories) ? remoteOverview.recentStories : [];
  const mergedStories = (remoteStories.length > 0 ? remoteStories.slice(0, 3) : STORY_ROWS).map((story: any, index) => {
    const fallback = STORY_ROWS[index] || STORY_ROWS[0];
    const storyId = String(story?._id || fallback.id);
    const storyTitle = String(story?.title || fallback.title);

    return {
      ...fallback,
      id: storyId,
      title: storyTitle,
      subtitle: String(story?.statusMeta || fallback.subtitle),
      status: String(story?.statusText || fallback.status),
      viewsLabel: String(story?.readsLabel || fallback.viewsLabel),
      href: `/creator/dramas/${storyId}/analytics`,
      initials: storyTitle
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || fallback.initials,
    } satisfies AnalyticsStoryRow;
  });

  return {
    metrics: [
      {
        label: 'Total Views',
        value: formatNumber(remoteOverview.kpis.totalReads.value),
        delta: remoteOverview.kpis.totalReads.changePercent,
        tone: 'blue',
        icon: 'views',
      },
      {
        label: 'Avg. Watch Time',
        value: remoteOverview.kpis.avgReadTime.display,
        delta: remoteOverview.kpis.avgReadTime.changePercent,
        tone: 'violet',
        icon: 'time',
      },
      {
        label: 'New Followers',
        value: formatNumber(remoteOverview.kpis.newFollowers.value),
        delta: remoteOverview.kpis.newFollowers.changePercent,
        tone: 'orange',
        icon: 'followers',
      },
      {
        label: 'Total Revenue',
        value: formatUsd(remoteOverview.kpis.monthlyRevenue.valueUsd),
        delta: remoteOverview.kpis.monthlyRevenue.changePercent,
        tone: 'green',
        icon: 'revenue',
      },
    ],
    chart: {
      ...base.chart,
      labels: remoteOverview.trend.labels?.length ? remoteOverview.trend.labels.map((label) => label.toUpperCase()) : base.chart.labels,
      primary: remoteOverview.trend.values?.length ? remoteOverview.trend.values : base.chart.primary,
      secondary: deriveSecondarySeries(remoteOverview.trend.values?.length ? remoteOverview.trend.values : base.chart.primary, remoteOverview.trend.revenueValues),
    },
    stories: mergedStories,
    balance: COMMON_BALANCE,
    geography: {
      ...COMMON_GEOGRAPHY,
      rows: [
        { label: remoteOverview.topRegion.name || COMMON_GEOGRAPHY.rows[0].label, share: 42 },
        ...COMMON_GEOGRAPHY.rows.slice(1),
      ],
    },
    agreement: COMMON_AGREEMENT,
    heatmap: COMMON_HEATMAP,
  };
}

export function getRevenueSnapshot(range: AnalyticsRange): RevenueSnapshot {
  return REVENUE_BY_RANGE[range];
}

export function getAudienceSnapshot(range: AnalyticsRange): AudienceSnapshot {
  return AUDIENCE_BY_RANGE[range];
}

export function getDramaSnapshot(range: AnalyticsRange, title?: string): DramaSnapshot {
  return {
    title: title || "CEO's Secret Heir",
    ...DRAMA_BY_RANGE[range],
  };
}
