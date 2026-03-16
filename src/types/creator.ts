export type CreatorProfileType = "individual" | "company";

export type CreatorVerificationType = "government_id" | "passport" | "business_license";

export type CreatorApplicationStatus =
  | "not_applied"
  | "draft"
  | "pending"
  | "under_review"
  | "need_more_info"
  | "approved"
  | "rejected"
  | "suspended";

export interface CreatorApplicationBasicInformation {
  creatorType: CreatorProfileType;
  legalName: string;
  companyName: string;
  representativeName: string;
  email: string;
  phone: string;
  country: string;
}

export interface CreatorApplicationCreativeInformation {
  genres: string[];
  primaryLanguage: string;
  portfolioLinks: string[];
  bio: string;
}

export interface CreatorApplicationIdentityVerification {
  verificationType: CreatorVerificationType;
  documentNumber: string;
  issueCountry: string;
  taxIdOrBusinessId: string;
  frontDocumentFileName: string;
  backDocumentFileName: string;
  frontDocumentFileUrl?: string;
  backDocumentFileUrl?: string;
}

export interface CreatorApplicationAgreement {
  acceptedTerms: boolean;
  acceptedAuthenticity: boolean;
  hasReviewedFullAgreement: boolean;
  signatureName: string;
  agreementVersion?: string;
}

export interface CreatorApplicationDraft {
  basicInformation: CreatorApplicationBasicInformation;
  creativeInformation: CreatorApplicationCreativeInformation;
  identityVerification: CreatorApplicationIdentityVerification;
  agreement: CreatorApplicationAgreement;
  lastCompletedStep: number;
  updatedAt: string;
}

export interface CreatorDashboardOverview {
  greeting: {
    name: string;
    message: string;
    highlight: string;
  };
  kpis: {
    totalReads: {
      value: number;
      changePercent: number;
    };
    avgReadTime: {
      valueSeconds: number;
      display: string;
      changePercent: number;
    };
    newFollowers: {
      value: number;
      changePercent: number;
    };
    monthlyRevenue: {
      valueUsd: number;
      changePercent: number;
    };
    contentStats?: {
      published: number;
      pendingReview: number;
      drafts: number;
    };
  };
  trend: {
    range: "7d" | "30d" | "90d";
    labels: string[];
    values: number[];
    revenueValues?: number[];
  };
  recentStories: Array<{
    _id: string;
    title: string;
    cover: string;
    status: CreatorDramaWorkflowStatus;
    statusText: string;
    statusMeta: string;
    reads: number;
    readsLabel: string;
    updatedAt: string;
  }>;
  topRegion: {
    name: string;
    activeReaders: number;
  };
  ticketSummary: {
    open: number;
    in_progress: number;
    waiting_support: number;
    waiting_creator: number;
    resolved: number;
    closed: number;
  };
  creatorTip: {
    title: string;
    content: string;
    ctaText: string;
  };
}

export type CreatorTicketCategory = "technical" | "content" | "payment" | "account" | "policy" | "other";
export type CreatorTicketPriority = "low" | "medium" | "high" | "urgent";
export type CreatorTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_support"
  | "waiting_creator"
  | "resolved"
  | "closed";

export interface CreatorTicketMessage {
  senderType: "creator" | "support" | "system";
  senderId: string | null;
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface CreatorTicket {
  _id: string;
  ticketNo: string;
  creatorId: string;
  subject: string;
  category: CreatorTicketCategory;
  priority: CreatorTicketPriority;
  status: CreatorTicketStatus;
  messages: CreatorTicketMessage[];
  lastMessageAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatorDramaWorkflowStatus =
  | "draft"
  | "pending_review"
  | "in_review"
  | "approved"
  | "rejected"
  | "published"
  | "suspended"
  | "archived"
  | "under_review";

export interface CreatorDramaListItem {
  _id: string;
  title: string;
  cover?: string;
  status: CreatorDramaWorkflowStatus;
  views: number;
  episodes: number;
  createdAt?: string;
  updatedAt?: string;
  reviewMeta?: {
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewerId?: string | null;
    rejectionReason?: string;
    reviewNote?: string;
  } | null;
  archivedAt?: string | null;
}

export interface CreatorDramaListResponse {
  dramas: CreatorDramaListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreatorEpisodeItem {
  _id: string;
  dramaId: string;
  title: string;
  description?: string;
  episodeNumber: number;
  videoUrl?: string;
  thumbnail?: string;
  duration: number;
  isFree: boolean;
  unlockPrice: number;
  subtitleUrl?: string;
  subtitleLanguage?: string;
  status: "Draft" | "Processing" | "Published" | "Failed";
  streamVideoId?: string;
  videoFileName?: string;
  subtitleFileName?: string;
  subtitleStatus?: "none" | "uploaded" | "processing" | "ready" | "failed";
  coverStatus?: "none" | "uploaded";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorDramaEpisodesResponse {
  dramaId: string;
  episodes: CreatorEpisodeItem[];
}

export type CreatorAnalyticsRange = "7d" | "30d" | "90d";

export interface CreatorAnalyticsMetric {
  label: string;
  value: string;
  delta: number;
  tone: "blue" | "violet" | "orange" | "green" | "slate";
  icon:
    | "views"
    | "time"
    | "followers"
    | "revenue"
    | "wallet"
    | "payout"
    | "share"
    | "rpm"
    | "audience"
    | "returning"
    | "completion"
    | "device"
    | "unlock"
    | "episode";
}

export interface CreatorAnalyticsChartSeries {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  labels: string[];
  primary: number[];
  secondary: number[];
}

export interface CreatorAnalyticsBalanceCard {
  label: string;
  value: string;
  ctaLabel: string;
  href: string;
}

export interface CreatorAnalyticsGeographyRow {
  label: string;
  share: number;
}

export interface CreatorAnalyticsGeography {
  title: string;
  rows: CreatorAnalyticsGeographyRow[];
}

export interface CreatorAnalyticsHeatmap {
  title: string;
  rows: number[][];
  labels: string[];
}

export interface CreatorRevenueSplitRow {
  label: string;
  amount: string;
  percent: number;
  tone: "blue" | "violet" | "orange" | "green" | "slate";
}

export interface CreatorRevenueForecastRow {
  label: string;
  value: string;
  helper: string;
}

export interface CreatorRevenueTitleRow {
  id: string;
  title: string;
  season: string;
  grossRevenue: string;
  creatorShare: string;
  unlocks: string;
  rpm: string;
  status: string;
  statusTone: "success" | "info" | "warning";
  href: string;
  initials: string;
  gradient: string;
}

export interface CreatorAudienceDeviceShare {
  label: string;
  share: number;
  color: string;
}

export interface CreatorAudienceSegmentRow {
  label: string;
  share: number;
  helper: string;
  tone: "blue" | "violet" | "orange" | "green" | "slate";
}

export interface CreatorDramaAnalyticsEpisodeRow {
  id: string;
  episode: string;
  viewsLabel: string;
  completion: number;
  unlockRate: string;
  revenue: string;
  watchTime: string;
}

export interface CreatorDramaAnalyticsHighlight {
  label: string;
  value: string;
  helper: string;
}

export interface CreatorRevenueAnalytics {
  metrics: CreatorAnalyticsMetric[];
  chart: CreatorAnalyticsChartSeries;
  titles: CreatorRevenueTitleRow[];
  balance: CreatorAnalyticsBalanceCard;
  splitRows: CreatorRevenueSplitRow[];
  forecastRows: CreatorRevenueForecastRow[];
}

export interface CreatorAudienceAnalytics {
  metrics: CreatorAnalyticsMetric[];
  chart: CreatorAnalyticsChartSeries;
  geography: CreatorAnalyticsGeography;
  devices: CreatorAudienceDeviceShare[];
  segments: CreatorAudienceSegmentRow[];
  heatmap: CreatorAnalyticsHeatmap;
}

export interface CreatorDramaAnalytics {
  title: string;
  status: string;
  statusTone: "success" | "info" | "warning";
  seasonLabel: string;
  metrics: CreatorAnalyticsMetric[];
  chart: CreatorAnalyticsChartSeries;
  episodes: CreatorDramaAnalyticsEpisodeRow[];
  geography: CreatorAnalyticsGeography;
  devices: CreatorAudienceDeviceShare[];
  highlights: CreatorDramaAnalyticsHighlight[];
}

export type CreatorSettlementBankStatus = "missing" | "pending_review" | "verified" | "rejected";

export interface CreatorSettlementBankAccount {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountNumberMasked: string;
  routingNumber: string;
  routingNumberMasked: string;
  swiftCode: string;
  bankAddress: string;
  country: string;
  currency: string;
  verificationStatus: CreatorSettlementBankStatus;
  verificationLabel: string;
  verifiedAt: string | null;
  updatedAt: string | null;
}

export interface CreatorSettlementStatement {
  id: string;
  statementNo: string;
  periodStart: string;
  periodEnd: string;
  grossRevenueUsd: number;
  channelFeesUsd: number;
  reserveUsd: number;
  settlementBaseUsd: number;
  creatorShareUsd: number;
  unlockCount: number;
  status: "pending" | "generated" | "confirmed" | "paid" | "disputed";
  statusLabel: string;
  payoutDate: string | null;
}

export interface CreatorSettlementOverview {
  summary: {
    settlementCurrency: string;
    minimumPayoutUsd: number;
    holdDays: number;
    creatorShareRate: number;
    availableBalanceUsd: number;
    pendingBalanceUsd: number;
    paidToDateUsd: number;
    nextSettlementDate: string;
    payoutMethodLabel: string;
    bankStatus: CreatorSettlementBankStatus;
    bankStatusLabel: string;
  };
  bankAccount: CreatorSettlementBankAccount;
  taxInfo: CreatorSettlementTaxInfo;
  statements: CreatorSettlementStatement[];
}

export interface CreatorSettlementTaxInfo {
  legalName: string;
  businessName: string;
  taxClassification:
    | "individual"
    | "sole_proprietor"
    | "llc"
    | "c_corp"
    | "s_corp"
    | "partnership"
    | "trust_estate"
    | "other";
  taxIdType: "ssn" | "ein";
  taxIdNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  country: string;
  certificationName: string;
  status: "missing" | "submitted";
  updatedAt: string | null;
}

export interface CreatorSettlementEpisodeBreakdownRow {
  id: string;
  dramaId: string;
  dramaTitle: string;
  episodeLabel: string;
  thumbnail: string;
  views: number;
  grossRevenueUsd: number;
  feesUsd: number;
  netEarningUsd: number;
}

export interface CreatorSettlementDetail {
  statement: CreatorSettlementStatement & {
    netPayoutUsd: number;
    readyForPayout: boolean;
    periodLabel: string;
  };
  financialBreakdown: {
    grossRevenueUsd: number;
    platformFeesUsd: number;
    withholdingTaxUsd: number;
    netPayoutUsd: number;
    platformFeeRate: number;
    withholdingTaxRate: number;
  };
  episodeBreakdown: CreatorSettlementEpisodeBreakdownRow[];
  confirmation: {
    canConfirm: boolean;
    confirmedAt: string | null;
    disputedAt: string | null;
  };
}
