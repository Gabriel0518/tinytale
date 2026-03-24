import type {
  CreatorAdminApplicationDetail,
  CreatorAdminApplicationListItem,
  CreatorAdminBankStatus,
  CreatorAdminBankAccountItem,
  CreatorAdminContentReviewDetail,
  CreatorAdminContentReviewListItem,
  CreatorAdminContentReviewStatus,
  CreatorAdminDmcaCaseItem,
  CreatorAdminDmcaStatus,
  CreatorAdminCreatorDetail,
  CreatorAdminCreatorListItem,
  CreatorAdminDashboardOverview,
  CreatorAdminLifecycleStatus,
  CreatorAdminPayoutRequestItem,
  CreatorAdminPolicyOverview,
  CreatorAdminRiskLevel,
  CreatorAdminRevenueOverview,
  CreatorAdminSettlementItem,
  CreatorAdminSettlementStatus,
  CreatorAdminSlaStatus,
  CreatorAdminTicketDetail,
  CreatorAdminTicketItem,
  CreatorApplicationStatus,
} from "@/types/creator";

export const mockCreatorApplications: CreatorAdminApplicationListItem[] = [];
export const mockCreators: CreatorAdminCreatorListItem[] = [];
export const mockContentReviews: CreatorAdminContentReviewListItem[] = [];
export const mockDmcaCases: CreatorAdminDmcaCaseItem[] = [];
export const mockCreatorBankAccounts: CreatorAdminBankAccountItem[] = [];
export const mockCreatorSettlements: CreatorAdminSettlementItem[] = [];
export const mockCreatorPayoutRequests: CreatorAdminPayoutRequestItem[] = [];
export const mockCreatorTickets: CreatorAdminTicketItem[] = [];

export const mockCreatorRevenueOverview: CreatorAdminRevenueOverview = {
  kpis: [],
  creatorRows: [],
  recentStatements: [],
  watchlist: [],
};

export const mockCreatorPolicyOverview: CreatorAdminPolicyOverview = {
  version: "",
  creatorShareRate: 0,
  platformFeeRate: 0,
  refundReserveRate: 0,
  holdDays: 0,
  minimumPayoutUsd: 0,
  reviewSlaHours: 0,
  payoutScheduleDay: 0,
  autoReleaseRequiresVerifiedBank: false,
  notes: [],
  lastUpdatedAt: null,
};

export const mockCreatorAdminDashboard: CreatorAdminDashboardOverview = {
  kpis: [],
  applicationFunnel: [],
  slaAlerts: [],
  creatorHighlights: [],
  financeWatchlist: [],
  recentActivity: [],
};

export function getMockCreatorApplication(_id: string): CreatorAdminApplicationDetail | null {
  return null;
}

export function getMockCreator(_id: string): CreatorAdminCreatorDetail | null {
  return null;
}

export function getMockContentReview(_dramaId: string): CreatorAdminContentReviewDetail | null {
  return null;
}

export function getMockDmcaCase(_id: string): CreatorAdminDmcaCaseItem | null {
  return null;
}

export function getMockCreatorTicket(_id: string): CreatorAdminTicketDetail | null {
  return null;
}

export function getCreatorApplicationStatusMeta(status: CreatorApplicationStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "need_more_info":
      return {
        label: "Need More Info",
        className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
      };
    case "under_review":
    case "pending":
      return {
        label: "Under Review",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    default:
      return {
        label: "Draft",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
  }
}

export function getCreatorLifecycleMeta(status: CreatorAdminLifecycleStatus) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "restricted":
      return {
        label: "Restricted",
        className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
      };
    case "suspended":
      return {
        label: "Suspended",
        className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20",
      };
    case "banned":
      return {
        label: "Banned",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "under_review":
      return {
        label: "Under Review",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    default:
      return {
        label: "Deactivated",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
  }
}

export function getCreatorRiskMeta(level: CreatorAdminRiskLevel) {
  switch (level) {
    case "high":
      return { label: "High", className: "bg-red-500/15 text-red-300" };
    case "medium":
      return { label: "Medium", className: "bg-amber-500/15 text-amber-300" };
    default:
      return { label: "Low", className: "bg-emerald-500/15 text-emerald-300" };
  }
}

export function getCreatorBankStatusMeta(status: CreatorAdminBankStatus) {
  switch (status) {
    case "verified":
      return {
        label: "Verified",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "pending_review":
      return {
        label: "Pending Review",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "frozen":
      return {
        label: "Frozen",
        className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20",
      };
    default:
      return {
        label: "Missing",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
  }
}

export function getCreatorContentReviewStatusMeta(status: CreatorAdminContentReviewStatus) {
  switch (status) {
    case "published":
      return {
        label: "Published",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "rejected":
      return {
        label: "Changes Requested",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "pending_review":
      return {
        label: "Pending Review",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    case "archived":
      return {
        label: "Archived",
        className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20",
      };
    default:
      return {
        label: "Draft",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
  }
}

export function getCreatorSlaStatusMeta(status: CreatorAdminSlaStatus) {
  switch (status) {
    case "breach":
      return {
        label: "Breached",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "due_soon":
      return {
        label: "Due Soon",
        className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
      };
    case "resolved":
      return {
        label: "Resolved",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    default:
      return {
        label: "On Track",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
  }
}

export function getCreatorDmcaStatusMeta(status: CreatorAdminDmcaStatus) {
  switch (status) {
    case "takedown_executed":
      return {
        label: "Takedown",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "counter_notice":
      return {
        label: "Counter Notice",
        className: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20",
      };
    case "resolved":
      return {
        label: "Resolved",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
    case "under_review":
      return {
        label: "Under Review",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    default:
      return {
        label: "Open",
        className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
      };
  }
}

export function getCreatorSettlementStatusMeta(status: CreatorAdminSettlementStatus) {
  switch (status) {
    case "processing":
      return {
        label: "Processing",
        className: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20",
      };
    case "paid":
      return {
        label: "Paid",
        className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20",
      };
    case "generated":
      return {
        label: "Generated",
        className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
      };
    case "held":
      return {
        label: "Held",
        className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20",
      };
    case "disputed":
      return {
        label: "Disputed",
        className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
      };
    default:
      return {
        label: "Pending",
        className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
      };
  }
}

export function formatAdminDate(value?: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(
    "en-US",
    withTime
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : { month: "short", day: "numeric", year: "numeric" },
  ).format(date);
}

export function formatUsd(value: number) {
  const locale =
    typeof window !== "undefined"
      ? window.localStorage.getItem("admin_locale")?.startsWith("zh")
        ? "zh-CN"
        : "en-US"
      : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
