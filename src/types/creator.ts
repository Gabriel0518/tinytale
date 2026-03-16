export type CreatorIdentityType = "individual" | "agency";

export type CreatorVerificationType = "government_id" | "passport" | "business_license";

export interface CreatorApplicationBasicInformation {
  identityType: CreatorIdentityType;
  fullName: string;
  workEmail: string;
  country: string;
  portfolioLink: string;
}

export interface CreatorApplicationCreativeInformation {
  contentCategory: string;
  primaryLanguage: string;
  primaryPlatforms: string[];
  socialLink: string;
  shortBio: string;
}

export interface CreatorApplicationIdentityVerification {
  verificationType: CreatorVerificationType;
  documentNumber: string;
  issueCountry: string;
  taxIdOrBusinessId: string;
  documentFileName: string;
}

export interface CreatorApplicationAgreement {
  acceptedTerms: boolean;
  acceptedAuthenticity: boolean;
  signatureName: string;
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
  };
  trend: {
    range: "7d";
    labels: string[];
    values: number[];
  };
  recentStories: Array<{
    _id: string;
    title: string;
    cover: string;
    status: "draft" | "published";
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

export type CreatorDramaWorkflowStatus = "draft" | "under_review" | "published" | "archived";

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
