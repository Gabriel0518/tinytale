export type CreatorProfileType = "individual" | "company";

export type CreatorVerificationType =
  | "government_id"
  | "passport"
  | "business_license";

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
  age: string;
  businessType: string;
  idNumber: string;
  companyName: string;
  registrationId: string;
  companyAddress: string;
  region: string;
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

export type CreatorTicketCategory =
  | "technical"
  | "content"
  | "payment"
  | "account"
  | "policy"
  | "other";
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
  needsEpisodeRevision?: boolean;
  rejectedEpisodeCount?: number;
  pendingEpisodeReviewCount?: number;
  latestEpisodeReviewNote?: string;
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
  videoWidth?: number;
  videoHeight?: number;
  videoFileName?: string;
  subtitleFileName?: string;
  subtitleStatus?: "none" | "uploaded" | "processing" | "ready" | "failed";
  coverStatus?: "none" | "uploaded";
  subtitleTracks?: Array<{
    id: string;
    language: string;
    label: string;
    fileUrl: string;
    format: string;
    status: string;
    source: string;
    isDefault: boolean;
  }>;
  subtitleTranslation?: {
    taskId: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    completedCount: number;
    totalCount: number;
    errorMessage: string;
    targetLanguages: string[];
  } | null;
  reviewStatus?: "pending" | "approved" | "rejected" | null;
  reviewNote?: string;
  rejectionReason?: string;
  reviewSubmittedAt?: string | null;
  reviewReviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorEpisodePreviewPayload {
  episodeId: string;
  streamVideoId?: string;
  signedToken?: string;
  videoUrl?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  videoWidth?: number;
  videoHeight?: number;
  aspectRatio?: number | null;
  qualityOptions?: string[];
  maxQuality?: string;
  subtitles: Array<{
    language: string;
    label: string;
    src: string;
  }>;
  subtitleTracks?: CreatorEpisodeItem["subtitleTracks"];
  subtitleTranslation?: CreatorEpisodeItem["subtitleTranslation"];
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

export interface CreatorOverviewAgreementCard {
  planName: string;
  expiresAt: string;
  status: string;
  revShare: string;
  copyright: string;
  href: string;
}

export interface CreatorOverviewStoryRow {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusTone: "success" | "info" | "warning";
  viewsLabel: string;
  retention: number;
  revenueLabel: string;
  href: string;
  initials: string;
  gradient: string;
}

export interface CreatorOverviewAnalytics {
  metrics: CreatorAnalyticsMetric[];
  chart: CreatorAnalyticsChartSeries;
  stories: CreatorOverviewStoryRow[];
  balance: CreatorAnalyticsBalanceCard;
  geography: CreatorAnalyticsGeography;
  agreement: CreatorOverviewAgreementCard;
  heatmap: CreatorAnalyticsHeatmap;
}

export interface CreatorContractTimelineItem {
  label: string;
  value: string;
  helper: string;
}

export interface CreatorContractOverview {
  creator: {
    displayName: string;
    legalName: string;
    email: string;
    country: string;
    creatorType: string;
    level: string;
    joinedAt: string | null;
    approvedAt: string | null;
  };
  agreement: {
    title: string;
    version: string;
    status: string;
    statusLabel: string;
    signedAt: string | null;
    effectiveAt: string | null;
    nextRenewalAt: string | null;
    signatureName: string;
    settlementCurrency: string;
    creatorShareRate: number;
    platformFeeRate: number;
    refundReserveRate: number;
    holdDays: number;
    minimumPayoutUsd: number;
    payoutScheduleDay: number;
    autoReleaseRequiresVerifiedBank: boolean;
  };
  bankAccount: CreatorSettlementBankAccount;
  taxInfo: CreatorSettlementTaxInfo;
  policy: {
    version: string;
    reviewSlaHours: number;
    notes: string[];
    lastUpdatedAt: string | null;
  };
  timeline: CreatorContractTimelineItem[];
}

export type CreatorSettlementBankStatus =
  | "missing"
  | "pending_review"
  | "verified"
  | "rejected";

export interface CreatorSettlementStripeConnectSummary {
  accountId: string;
  accountType: "express";
  country: string;
  email: string;
  businessType: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: string[];
  requirementsEventuallyDue: string[];
  requirementsPastDue: string[];
  requirementsPendingVerification: string[];
  requirementsDisabledReason: string;
  onboardingCompletedAt: string | null;
  lastSyncedAt: string | null;
  dashboardDisplayName: string;
  accountHolderName: string;
  externalAccountId: string;
  externalAccountBankName: string;
  externalAccountLast4: string;
  externalAccountCurrency: string;
}

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
  provider?: "manual" | "stripe";
  providerLabel?: string;
  stripeConnect?: CreatorSettlementStripeConnectSummary | null;
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
  status: "pending" | "generated" | "confirmed" | "processing" | "paid" | "disputed" | "held";
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

export type CreatorNotificationCategory = "system" | "performance";
export type CreatorNotificationIcon =
  | "system"
  | "ticket"
  | "settlement"
  | "performance"
  | "contract";

export interface CreatorNotification {
  id: string;
  category: CreatorNotificationCategory;
  title: string;
  message: string;
  href: string;
  icon: CreatorNotificationIcon;
  createdAt: string;
  read: boolean;
}

export interface CreatorNotificationSummary {
  total: number;
  system: number;
  performance: number;
}

export interface CreatorNotificationListResponse {
  notifications: CreatorNotification[];
  unreadCount: number;
  summary: CreatorNotificationSummary;
}

export type CreatorAdminRiskLevel = "low" | "medium" | "high";
export type CreatorAdminLifecycleStatus =
  | "under_review"
  | "active"
  | "restricted"
  | "suspended"
  | "banned"
  | "deactivated";
export type CreatorAdminBankStatus =
  | "missing"
  | "pending_review"
  | "verified"
  | "rejected"
  | "frozen";
export type CreatorAdminContractStatus =
  | "draft"
  | "sent"
  | "signed"
  | "renewal_due"
  | "terminated";

export interface CreatorAdminDashboardKpi {
  key: string;
  label: string;
  value: number;
  delta: number;
  helper: string;
  tone: "indigo" | "amber" | "emerald" | "rose";
}

export interface CreatorAdminSlaAlert {
  id: string;
  type: "application" | "content" | "ticket";
  label: string;
  owner: string;
  dueAt: string;
  status: "watch" | "breach";
  helper: string;
}

export interface CreatorAdminActivity {
  id: string;
  at: string;
  actor: string;
  action: string;
  summary: string;
}

export interface CreatorAdminDashboardOverview {
  kpis: CreatorAdminDashboardKpi[];
  applicationFunnel: Array<{
    label: string;
    value: number;
    helper: string;
  }>;
  slaAlerts: CreatorAdminSlaAlert[];
  creatorHighlights: Array<{
    id: string;
    name: string;
    level: string;
    monthlyRevenueUsd: number;
    publishedTitles: number;
    status: CreatorAdminLifecycleStatus;
  }>;
  financeWatchlist: Array<{
    id: string;
    creatorName: string;
    bankStatus: CreatorAdminBankStatus;
    availableBalanceUsd: number;
    payoutHoldReason: string;
  }>;
  recentActivity: CreatorAdminActivity[];
}

export interface CreatorAdminReviewChecklistItem {
  key:
    | "identity_verified"
    | "portfolio_verified"
    | "content_rights_verified"
    | "agreement_verified"
    | "risk_screening_passed";
  label: string;
  passed: boolean;
  note: string;
}

export interface CreatorAdminApplicationListItem {
  id: string;
  applicantName: string;
  creatorType: CreatorProfileType;
  displayName: string;
  email: string;
  country: string;
  genres: string[];
  primaryLanguage: string;
  status: CreatorApplicationStatus;
  riskLevel: CreatorAdminRiskLevel;
  submittedAt: string;
  updatedAt: string;
  assignedReviewer: string | null;
  missingItems: string[];
  applicationSummary: {
    legalEntityName: string;
    contactPhone: string;
    identityReference: string;
    age: string;
    businessType: string;
    companyAddress: string;
    region: string;
    verificationType: CreatorVerificationType;
    verificationLabel: string;
    primaryDocumentLabel: string;
    primaryDocumentName: string;
    secondaryDocumentLabel: string;
    secondaryDocumentName: string;
    secondaryDocumentRequired: boolean;
  };
}

export interface CreatorAdminApplicationDetail extends CreatorAdminApplicationListItem {
  creatorId: string;
  draft: CreatorApplicationDraft;
  reviewChecklist: CreatorAdminReviewChecklistItem[];
  notes: string;
  agreementVersion: string;
  signedAt: string | null;
  reviewHistory: Array<{
    id: string;
    at: string;
    actor: string;
    action: string;
    note: string;
  }>;
}

export interface CreatorAdminCreatorListItem {
  id: string;
  displayName: string;
  legalName: string;
  creatorType: CreatorProfileType;
  email: string;
  country: string;
  status: CreatorAdminLifecycleStatus;
  level: string;
  publishedTitles: number;
  totalEpisodes: number;
  monthlyRevenueUsd: number;
  bankStatus: CreatorAdminBankStatus;
  openTickets: number;
  dmcaStrikes: number;
  joinedAt: string;
}

export interface CreatorAdminCreatorDetail extends CreatorAdminCreatorListItem {
  bio: string;
  phone: string;
  languages: string[];
  genres: string[];
  approvedAt: string | null;
  managedBy: string | null;
  contract: {
    version: string;
    status: CreatorAdminContractStatus;
    signedAt: string | null;
    nextRenewalAt: string | null;
  };
  bankAccount: {
    status: CreatorAdminBankStatus;
    accountHolderName: string;
    bankName: string;
    maskedAccountNumber: string;
    country: string;
    updatedAt: string | null;
    provider?: "manual" | "stripe";
    providerLabel?: string;
    verificationLabel?: string;
    stripeAccountId?: string;
    stripeEmail?: string;
    stripeRequirementsCurrentlyDue?: string[];
    stripeRequirementsPendingVerification?: string[];
    stripeRequirementsEventuallyDue?: string[];
    stripeDisabledReason?: string;
    adminOverrideStatus?: "rejected" | "frozen" | null;
  };
  topDramas: Array<{
    id: string;
    title: string;
    status: CreatorDramaWorkflowStatus;
    views: number;
    revenueUsd: number;
    updatedAt: string;
  }>;
  dmcaStrikeHistory: Array<{
    id: string;
    issuedAt: string;
    status: "active" | "resolved";
    reason: string;
  }>;
  auditTrail: CreatorAdminActivity[];
}

export type CreatorAdminContentReviewStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export type CreatorAdminSlaStatus =
  | "resolved"
  | "on_track"
  | "due_soon"
  | "breach";

export interface CreatorAdminContentReviewListItem {
  dramaId: string;
  title: string;
  cover: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  categories: string[];
  episodes: number;
  viewCount: number;
  status: CreatorAdminContentReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  slaDeadlineAt: string | null;
  slaStatus: CreatorAdminSlaStatus;
  reviewNote: string;
  rejectionReason: string;
}

export interface CreatorAdminContentChecklistItem {
  key:
    | "metadata_complete"
    | "episode_assets_ready"
    | "pricing_ready"
    | "rights_clearance"
    | "policy_risk_clear";
  label: string;
  passed: boolean;
  note: string;
}

export interface CreatorAdminContentReviewDetail extends CreatorAdminContentReviewListItem {
  description: string;
  horizontalCover?: string;
  language: string;
  country: string;
  creatorLevel: string;
  creatorStatus: CreatorAdminLifecycleStatus;
  rejectionHistoryCount: number;
  activeDmcaStrikes: number;
  pricingSummary: {
    perEpisode: number;
    freeEpisodes: number;
    paidEpisodes: number;
    fullCurrentPrice: number;
    fullUnlockPrice: number;
    permanentUnlockPrice: number;
    currency: string;
  };
  checklist: CreatorAdminContentChecklistItem[];
  episodesPreview: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    durationSeconds: number;
    status: string;
    unlockPrice?: number;
    isFree?: boolean;
    streamVideoId?: string;
    thumbnail?: string;
    videoWidth?: number;
    videoHeight?: number;
    hasVideo?: boolean;
    isNew?: boolean;
    reviewStatus?: "pending" | "approved" | "rejected" | null;
    reviewNote?: string;
    rejectionReason?: string;
    reviewSubmittedAt?: string | null;
    reviewReviewedAt?: string | null;
    subtitleTracks?: CreatorEpisodeItem["subtitleTracks"];
    subtitleTranslation?: CreatorEpisodeItem["subtitleTranslation"];
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
  episodesCatalog: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    durationSeconds: number;
    status: string;
    unlockPrice?: number;
    isFree?: boolean;
    streamVideoId?: string;
    thumbnail?: string;
    videoWidth?: number;
    videoHeight?: number;
    hasVideo?: boolean;
    isNew?: boolean;
    reviewStatus?: "pending" | "approved" | "rejected" | null;
    reviewNote?: string;
    rejectionReason?: string;
    reviewSubmittedAt?: string | null;
    reviewReviewedAt?: string | null;
    subtitleTracks?: CreatorEpisodeItem["subtitleTracks"];
    subtitleTranslation?: CreatorEpisodeItem["subtitleTranslation"];
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
  reviewHistory: Array<{
    id: string;
    at: string;
    actor: string;
    action: string;
    note: string;
  }>;
}

export type CreatorAdminDmcaStatus =
  | "open"
  | "under_review"
  | "takedown_executed"
  | "counter_notice"
  | "resolved"
  | "rejected";

export interface CreatorAdminDmcaCaseItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  dramaId: string | null;
  dramaTitle: string | null;
  status: CreatorAdminDmcaStatus;
  reportedAt: string;
  dueAt: string | null;
  claimant: string;
  reason: string;
  actionRequired: string;
  strikeImpact: number;
  hasCounterNotice: boolean;
  note: string;
}

export type CreatorAdminSettlementStatus =
  | "pending"
  | "generated"
  | "confirmed"
  | "processing"
  | "paid"
  | "disputed"
  | "held";

export interface CreatorAdminBankAccountItem {
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorLevel: string;
  creatorStatus: CreatorAdminLifecycleStatus;
  bankStatus: CreatorAdminBankStatus;
  accountHolderName: string;
  bankName: string;
  maskedAccountNumber: string;
  country: string;
  updatedAt: string | null;
  availableBalanceUsd: number;
  pendingBalanceUsd: number;
  nextSettlementDate: string | null;
  lastReviewNote: string;
  bankProvider?: "manual" | "stripe";
  bankProviderLabel?: string;
  verificationLabel?: string;
  stripeAccountId?: string;
  stripeEmail?: string;
  stripeRequirementsCurrentlyDue?: string[];
  stripeRequirementsPendingVerification?: string[];
  stripeDisabledReason?: string;
  adminOverrideStatus?: "rejected" | "frozen" | null;
}

export interface CreatorAdminPayoutRequestItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  statementId: string;
  statementNo: string;
  amountUsd: number;
  requestedAt: string;
  payoutDate: string | null;
  bankStatus: CreatorAdminBankStatus;
  bankProvider?: "manual" | "stripe";
  bankProviderLabel?: string;
  bankVerificationLabel?: string;
  bankName?: string;
  maskedAccountNumber?: string;
  stripeAccountId?: string;
  stripeEmail?: string;
  stripeRequirementsCurrentlyDue?: string[];
  stripeRequirementsPendingVerification?: string[];
  stripeDisabledReason?: string;
  adminOverrideStatus?: "rejected" | "frozen" | null;
  status: CreatorAdminSettlementStatus;
  payoutMethodLabel: string;
  holdReason: string;
  transferReference: string;
  payoutId?: string;
  payoutStatus?: string;
  paidAt?: string | null;
  payoutFailureMessage?: string;
  note: string;
}

export interface CreatorAdminSettlementItem {
  id: string;
  creatorId: string;
  creatorName: string;
  statementId: string;
  statementNo: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  grossRevenueUsd: number;
  channelFeesUsd: number;
  reserveUsd: number;
  netPayoutUsd: number;
  unlockCount: number;
  payoutDate: string | null;
  bankStatus: CreatorAdminBankStatus;
  bankProvider?: "manual" | "stripe";
  bankProviderLabel?: string;
  bankVerificationLabel?: string;
  bankName?: string;
  maskedAccountNumber?: string;
  stripeAccountId?: string;
  stripeEmail?: string;
  stripeRequirementsCurrentlyDue?: string[];
  stripeRequirementsPendingVerification?: string[];
  stripeDisabledReason?: string;
  adminOverrideStatus?: "rejected" | "frozen" | null;
  status: CreatorAdminSettlementStatus;
  transferReference?: string;
  payoutId?: string;
  payoutStatus?: string;
  paidAt?: string | null;
  note: string;
}

export interface CreatorAdminRevenueOverview {
  kpis: Array<{
    key:
      | "grossRevenueUsd"
      | "netPayoutUsd"
      | "pendingPayoutUsd"
      | "heldAmountUsd";
    label: string;
    valueUsd: number;
    helper: string;
    tone: "indigo" | "emerald" | "amber" | "rose";
  }>;
  creatorRows: Array<{
    creatorId: string;
    creatorName: string;
    creatorEmail: string;
    creatorLevel: string;
    grossRevenueUsd: number;
    netPayoutUsd: number;
    availableBalanceUsd: number;
    pendingBalanceUsd: number;
    publishedTitles: number;
    bankStatus: CreatorAdminBankStatus;
  }>;
  recentStatements: CreatorAdminSettlementItem[];
  watchlist: Array<{
    id: string;
    creatorId: string;
    creatorName: string;
    issue: string;
    amountUsd: number;
    severity: "medium" | "high";
  }>;
}

export interface CreatorAdminTicketItem {
  id: string;
  ticketNo: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  subject: string;
  category: CreatorTicketCategory;
  priority: CreatorTicketPriority;
  status: CreatorTicketStatus;
  lastMessageAt: string;
  updatedAt: string;
  messageCount: number;
  latestMessage: string;
  latestSenderType: "creator" | "support" | "system";
}

export interface CreatorAdminTicketDetail extends CreatorAdminTicketItem {
  messages: CreatorTicketMessage[];
}

export interface CreatorAdminPolicyOverview {
  version: string;
  creatorShareRate: number;
  platformFeeRate: number;
  refundReserveRate: number;
  holdDays: number;
  minimumPayoutUsd: number;
  reviewSlaHours: number;
  payoutScheduleDay: number;
  autoReleaseRequiresVerifiedBank: boolean;
  notes: string[];
  lastUpdatedAt: string | null;
}
