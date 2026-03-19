import type {
  CreatorApplicationDraft,
  CreatorApplicationStatus,
  CreatorDramaListItem,
  CreatorDramaWorkflowStatus,
  CreatorTicketCategory,
} from "@/types/creator";

export const CREATOR_APPLICATION_STORAGE_KEY = "creator_application_draft_v6";

export const CREATOR_APPLICATION_STEP_TITLES = [
  "Basic Info",
  "Creative Profile",
  "Identity",
  "Agreement",
  "Review",
] as const;

export const CREATOR_GENRE_OPTIONS = [
  "Romance",
  "Suspense",
  "Urban",
  "Fantasy",
  "Revenge",
  "Comedy",
  "Family",
  "Other",
] as const;

export const CREATOR_LANGUAGE_OPTIONS = [
  "English",
  "Chinese",
  "Spanish",
  "Portuguese",
  "Japanese",
  "Korean",
  "Hindi",
  "Other",
] as const;

export function createEmptyCreatorApplicationDraft(): CreatorApplicationDraft {
  return {
    basicInformation: {
      creatorType: "individual",
      legalName: "",
      age: "",
      businessType: "",
      idNumber: "",
      companyName: "",
      registrationId: "",
      companyAddress: "",
      region: "",
      email: "",
      phone: "",
      country: "",
    },
    creativeInformation: {
      genres: [],
      primaryLanguage: "",
      portfolioLinks: [""],
      bio: "",
    },
    identityVerification: {
      verificationType: "government_id",
      documentNumber: "",
      issueCountry: "",
      taxIdOrBusinessId: "",
      frontDocumentFileName: "",
      backDocumentFileName: "",
      frontDocumentFileUrl: "",
      backDocumentFileUrl: "",
    },
    agreement: {
      acceptedTerms: false,
      acceptedAuthenticity: false,
      hasReviewedFullAgreement: false,
      signatureName: "",
      agreementVersion: "2026-03",
    },
    lastCompletedStep: 0,
    updatedAt: "",
  };
}

function compactPortfolioLinks(values: unknown): string[] {
  if (!Array.isArray(values)) return [""];
  const normalized = values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return normalized.length > 0 ? normalized : [""];
}

export function deserializeCreatorApplicationDraft(
  raw: any,
  fallback: CreatorApplicationDraft = createEmptyCreatorApplicationDraft()
): CreatorApplicationDraft {
  const remote = raw?.data?.draft || raw?.data?.application || raw?.data || raw || {};
  const identityType = String(remote?.basicInformation?.identityType || "").toLowerCase();
  const portfolioLink = String(remote?.basicInformation?.portfolioLink || "").trim();
  const socialLink = String(remote?.creativeInformation?.socialLink || "").trim();
  const mergedPortfolioLinks = compactPortfolioLinks(
    remote?.creativeInformation?.portfolioLinks || remote?.portfolioLinks || [socialLink || portfolioLink]
  );
  const contentCategory = String(remote?.creativeInformation?.contentCategory || "").trim();
  const documentFileName = String(remote?.identityVerification?.documentFileName || "").trim();

  return {
    ...fallback,
    basicInformation: {
      ...fallback.basicInformation,
      creatorType: identityType === "agency" || identityType === "company" ? "company" : fallback.basicInformation.creatorType,
      legalName: String(remote?.basicInformation?.legalName || remote?.basicInformation?.fullName || fallback.basicInformation.legalName || ""),
      age: String(remote?.basicInformation?.age || fallback.basicInformation.age || ""),
      businessType: String(remote?.basicInformation?.businessType || fallback.basicInformation.businessType || ""),
      idNumber: String(
        remote?.basicInformation?.idNumber
          || remote?.identityVerification?.documentNumber
          || fallback.basicInformation.idNumber
          || ""
      ),
      companyName: String(remote?.basicInformation?.companyName || fallback.basicInformation.companyName || ""),
      registrationId: String(
        remote?.basicInformation?.registrationId
          || remote?.identityVerification?.taxIdOrBusinessId
          || fallback.basicInformation.registrationId
          || ""
      ),
      companyAddress: String(remote?.basicInformation?.companyAddress || fallback.basicInformation.companyAddress || ""),
      region: String(remote?.basicInformation?.region || fallback.basicInformation.region || ""),
      email: String(remote?.basicInformation?.workEmail || remote?.basicInformation?.email || fallback.basicInformation.email || ""),
      phone: String(remote?.basicInformation?.phone || fallback.basicInformation.phone || ""),
      country: String(remote?.basicInformation?.country || fallback.basicInformation.country || ""),
    },
    creativeInformation: {
      ...fallback.creativeInformation,
      genres:
        Array.isArray(remote?.creativeInformation?.genres) && remote.creativeInformation.genres.length > 0
          ? remote.creativeInformation.genres.map((value: unknown) => String(value))
          : contentCategory
            ? [contentCategory]
            : fallback.creativeInformation.genres,
      primaryLanguage: String(remote?.creativeInformation?.primaryLanguage || fallback.creativeInformation.primaryLanguage || ""),
      portfolioLinks: mergedPortfolioLinks,
      bio: String(remote?.creativeInformation?.bio || remote?.creativeInformation?.shortBio || fallback.creativeInformation.bio || ""),
    },
    identityVerification: {
      ...fallback.identityVerification,
      verificationType: remote?.identityVerification?.verificationType || fallback.identityVerification.verificationType,
      documentNumber: String(remote?.identityVerification?.documentNumber || fallback.identityVerification.documentNumber || ""),
      issueCountry: String(remote?.identityVerification?.issueCountry || fallback.identityVerification.issueCountry || ""),
      taxIdOrBusinessId: String(remote?.identityVerification?.taxIdOrBusinessId || fallback.identityVerification.taxIdOrBusinessId || ""),
      frontDocumentFileName: String(remote?.identityVerification?.frontDocumentFileName || documentFileName || fallback.identityVerification.frontDocumentFileName || ""),
      backDocumentFileName: String(remote?.identityVerification?.backDocumentFileName || fallback.identityVerification.backDocumentFileName || ""),
      frontDocumentFileUrl: String(remote?.identityVerification?.frontDocumentFileUrl || remote?.identityVerification?.documentFileUrl || fallback.identityVerification.frontDocumentFileUrl || ""),
      backDocumentFileUrl: String(remote?.identityVerification?.backDocumentFileUrl || fallback.identityVerification.backDocumentFileUrl || ""),
    },
    agreement: {
      ...fallback.agreement,
      acceptedTerms: Boolean(remote?.agreement?.acceptedTerms ?? fallback.agreement.acceptedTerms),
      acceptedAuthenticity: Boolean(remote?.agreement?.acceptedAuthenticity ?? fallback.agreement.acceptedAuthenticity),
      hasReviewedFullAgreement: Boolean(remote?.agreement?.hasReviewedFullAgreement ?? fallback.agreement.hasReviewedFullAgreement),
      signatureName: String(remote?.agreement?.signatureName || fallback.agreement.signatureName || ""),
      agreementVersion: String(remote?.agreement?.agreementVersion || fallback.agreement.agreementVersion || "2026-03"),
    },
    lastCompletedStep: Math.max(0, Math.min(5, Number(remote?.lastCompletedStep ?? fallback.lastCompletedStep ?? 0) || 0)),
    updatedAt: String(remote?.updatedAt || fallback.updatedAt || ""),
  };
}

export function serializeCreatorApplicationDraft(draft: CreatorApplicationDraft) {
  const firstPortfolioLink = draft.creativeInformation.portfolioLinks.find((value) => value.trim()) || "";
  const firstGenre = draft.creativeInformation.genres[0] || "";
  const identityType = draft.basicInformation.creatorType === "company" ? "agency" : "individual";
  const documentNumber =
    draft.basicInformation.creatorType === "company"
      ? draft.basicInformation.registrationId.trim()
      : draft.basicInformation.idNumber.trim();
  const issueCountry = draft.identityVerification.issueCountry.trim() || draft.basicInformation.country.trim();
  const taxIdOrBusinessId =
    draft.identityVerification.taxIdOrBusinessId.trim()
    || (draft.basicInformation.creatorType === "company" ? draft.basicInformation.registrationId.trim() : "");
  const frontDocumentFileName = draft.identityVerification.frontDocumentFileName.trim();
  const backDocumentFileName = draft.identityVerification.backDocumentFileName.trim();
  const frontDocumentFileUrl = draft.identityVerification.frontDocumentFileUrl || "";
  const backDocumentFileUrl = draft.identityVerification.backDocumentFileUrl || "";

  return {
    basicInformation: {
      identityType,
      fullName:
        draft.basicInformation.creatorType === "company"
          ? draft.basicInformation.companyName.trim()
          : draft.basicInformation.legalName.trim(),
      legalName: draft.basicInformation.legalName.trim(),
      age: draft.basicInformation.age.trim(),
      businessType: draft.basicInformation.businessType.trim(),
      idNumber: draft.basicInformation.idNumber.trim(),
      companyName: draft.basicInformation.companyName.trim(),
      registrationId: draft.basicInformation.registrationId.trim(),
      companyAddress: draft.basicInformation.companyAddress.trim(),
      region: draft.basicInformation.region.trim(),
      workEmail: draft.basicInformation.email.trim(),
      phone: draft.basicInformation.phone.trim(),
      country: draft.basicInformation.country.trim(),
      portfolioLink: firstPortfolioLink,
    },
    creativeInformation: {
      genres: draft.creativeInformation.genres,
      contentCategory: firstGenre,
      primaryLanguage: draft.creativeInformation.primaryLanguage.trim(),
      primaryPlatforms: ["Creator Web"],
      portfolioLinks: draft.creativeInformation.portfolioLinks.filter((value) => value.trim()),
      socialLink: firstPortfolioLink,
      bio: draft.creativeInformation.bio.trim(),
      shortBio: draft.creativeInformation.bio.trim(),
    },
    identityVerification: {
      verificationType: draft.basicInformation.creatorType === "company" ? "business_license" : draft.identityVerification.verificationType,
      documentNumber,
      issueCountry,
      taxIdOrBusinessId,
      frontDocumentFileName,
      backDocumentFileName,
      documentFileName: frontDocumentFileName,
      frontDocumentFileUrl,
      backDocumentFileUrl,
      documentFileUrl: frontDocumentFileUrl,
    },
    agreement: {
      acceptedTerms: draft.agreement.acceptedTerms,
      acceptedAuthenticity: draft.agreement.acceptedAuthenticity,
      hasReviewedFullAgreement: draft.agreement.hasReviewedFullAgreement,
      signatureName: draft.agreement.signatureName.trim(),
      agreementVersion: draft.agreement.agreementVersion || "2026-03",
    },
    lastCompletedStep: draft.lastCompletedStep,
    updatedAt: draft.updatedAt,
  };
}

export function normalizeCreatorApplicationStatus(raw: unknown): CreatorApplicationStatus {
  const status = String(raw || "").toLowerCase();
  if (!status) return "not_applied";
  if (status === "needs_resubmission" || status === "need_more_info") return "need_more_info";
  if (status === "in_review") return "under_review";
  if (status === "completed") return "approved";
  if (status === "pending" || status === "draft" || status === "under_review" || status === "approved" || status === "rejected" || status === "suspended") {
    return status as CreatorApplicationStatus;
  }
  return "not_applied";
}

export function getCreatorApplicationStatusMeta(status: CreatorApplicationStatus) {
  switch (status) {
    case "pending":
      return {
        title: "Submitted",
        description: "Your application has been submitted and is waiting to enter the manual review queue.",
        tone: "info" as const,
      };
    case "under_review":
      return {
        title: "Under Review",
        description: "TinyTale is reviewing your profile, sample links, identity files, and agreement signature.",
        tone: "info" as const,
      };
    case "need_more_info":
      return {
        title: "More Information Required",
        description: "The review team needs additional details before approval. Update your application and resubmit.",
        tone: "warning" as const,
      };
    case "approved":
      return {
        title: "Approved",
        description: "Your creator access is active. You can now upload dramas, review analytics, and manage payouts.",
        tone: "success" as const,
      };
    case "rejected":
      return {
        title: "Not Approved",
        description: "This submission was not approved. You can revise your materials and apply again when ready.",
        tone: "danger" as const,
      };
    case "suspended":
      return {
        title: "Access Suspended",
        description: "Creator access is temporarily suspended. Please check notifications or contact support for next steps.",
        tone: "danger" as const,
      };
    case "draft":
      return {
        title: "Draft Saved",
        description: "Your application draft is saved locally. Complete the remaining steps before submitting for review.",
        tone: "info" as const,
      };
    default:
      return {
        title: "Application Required",
        description: "Start your creator application to unlock the creator workspace.",
        tone: "info" as const,
      };
  }
}

export function getCreatorApplicationProgress(status: CreatorApplicationStatus): number {
  switch (status) {
    case "pending":
      return 1;
    case "under_review":
      return 2;
    case "need_more_info":
      return 3;
    case "approved":
      return 4;
    case "rejected":
    case "suspended":
      return 3;
    case "draft":
      return 0;
    default:
      return 0;
  }
}

export const CREATOR_APPLICATION_PROGRESS_LABELS = [
  "Submitted",
  "Review Queue",
  "Manual Review",
  "Decision",
] as const;

export function normalizeCreatorDramaStatus(item: Pick<CreatorDramaListItem, "status" | "reviewMeta">): CreatorDramaWorkflowStatus {
  const status = String(item.status || "").toLowerCase() as CreatorDramaWorkflowStatus;
  if (status === "under_review") return "pending_review";
  return status;
}

export function getCreatorDramaStatusMeta(
  item: Pick<CreatorDramaListItem, "status" | "reviewMeta" | "needsEpisodeRevision" | "rejectedEpisodeCount" | "latestEpisodeReviewNote">
) {
  const status = normalizeCreatorDramaStatus(item);
  if (item.needsEpisodeRevision) {
    const rejectedCount = Math.max(1, Number(item.rejectedEpisodeCount || 0));
    return {
      label: "Changes Required",
      helper:
        item.latestEpisodeReviewNote
        || (rejectedCount === 1 ? "1 episode needs changes before re-review" : `${rejectedCount} episodes need changes before re-review`),
      className: "bg-[#fff1f2] text-[#be123c]",
    };
  }
  switch (status) {
    case "published":
      return { label: "Published", helper: "Visible on TinyTale", className: "bg-[#dcfce7] text-[#15803d]" };
    case "pending_review":
      return { label: "Pending Review", helper: "Waiting for 48h SLA review", className: "bg-[#eff6ff] text-[#1d4ed8]" };
    case "approved":
      return { label: "Approved", helper: "Approved and ready to schedule", className: "bg-[#ecfdf5] text-[#047857]" };
    case "rejected":
      return {
        label: "Changes Required",
        helper: item.reviewMeta?.rejectionReason || "Review feedback available",
        className: "bg-[#fff1f2] text-[#be123c]",
      };
    case "suspended":
      return { label: "Suspended", helper: "Removed from distribution", className: "bg-[#fee2e2] text-[#b91c1c]" };
    case "archived":
      return { label: "Archived", helper: "Hidden by creator", className: "bg-[#e2e8f0] text-[#475569]" };
    default:
      return { label: "Draft", helper: "Not submitted yet", className: "bg-[#f1f5f9] text-[#475569]" };
  }
}

export const CREATOR_DRAMA_FILTERS = [
  { key: "all", apiStatus: "all", label: "All Titles" },
  { key: "draft", apiStatus: "draft", label: "Draft" },
  { key: "pending_review", apiStatus: "under_review", label: "Pending Review" },
  { key: "published", apiStatus: "published", label: "Published" },
  { key: "archived", apiStatus: "archived", label: "Archived" },
] as const;

export const CREATOR_TICKET_CATEGORY_OPTIONS: Array<{
  value: CreatorTicketCategory;
  label: string;
  description: string;
}> = [
  {
    value: "payment",
    label: "Settlement Dispute",
    description: "Question a settlement amount, deductions, payout status, or monthly statement detail.",
  },
  {
    value: "content",
    label: "Content Appeal",
    description: "Appeal a review decision, rejection feedback, or suspension on a submitted drama.",
  },
  {
    value: "policy",
    label: "DMCA / Rights",
    description: "Report copyright, takedown, counter-notice, or rights-management issues.",
  },
  {
    value: "account",
    label: "Account Issue",
    description: "Get help with profile access, creator verification, bank review, or account changes.",
  },
  {
    value: "technical",
    label: "Upload / Technical",
    description: "Resolve upload failures, subtitle issues, transcoding errors, or media-processing problems.",
  },
  {
    value: "other",
    label: "Other",
    description: "Use when the issue does not fit the standard creator operations workflow.",
  },
] as const;

export function getCreatorTicketCategoryLabel(category: CreatorTicketCategory): string {
  switch (category) {
    case "payment":
      return "Settlement Dispute";
    case "content":
      return "Content Appeal";
    case "policy":
      return "DMCA / Rights";
    case "account":
      return "Account Issue";
    case "technical":
      return "Upload / Technical";
    default:
      return "Other";
  }
}

export function getCreatorTicketCategoryShortLabel(category: CreatorTicketCategory): string {
  switch (category) {
    case "payment":
      return "Monetization";
    case "content":
      return "Content";
    case "policy":
      return "Rights";
    case "account":
      return "Account";
    case "technical":
      return "Technical";
    default:
      return "Other";
  }
}

export function getCreatorTicketCategoryDescription(category: CreatorTicketCategory): string {
  return (
    CREATOR_TICKET_CATEGORY_OPTIONS.find((option) => option.value === category)?.description ||
    "General creator support request."
  );
}

export function getCreatorTicketPriorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
    default:
      return priority || "Unknown";
  }
}

export function getCreatorTicketStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "waiting_support":
      return "Waiting Support";
    case "waiting_creator":
      return "Waiting You";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status || "Unknown";
  }
}

export function getCreatorTicketStatusClassName(status: string): string {
  switch (status) {
    case "open":
      return "bg-[#eff6ff] text-[#1d4ed8]";
    case "in_progress":
      return "bg-[#eef2ff] text-[#4338ca]";
    case "waiting_support":
      return "bg-[#fefce8] text-[#a16207]";
    case "waiting_creator":
      return "bg-[#fff7ed] text-[#c2410c]";
    case "resolved":
      return "bg-[#ecfdf5] text-[#047857]";
    case "closed":
      return "bg-[#f1f5f9] text-[#475569]";
    default:
      return "bg-[#f1f5f9] text-[#475569]";
  }
}

export function getCreatorTicketStatusTextClassName(status: string): string {
  switch (status) {
    case "open":
      return "text-[#2563eb]";
    case "in_progress":
      return "text-[#d97706]";
    case "waiting_support":
      return "text-[#a16207]";
    case "waiting_creator":
      return "text-[#ea580c]";
    case "resolved":
      return "text-[#059669]";
    case "closed":
      return "text-[#94a3b8]";
    default:
      return "text-[#64748b]";
  }
}

export function getCreatorTicketStatusDotClassName(status: string): string {
  switch (status) {
    case "open":
      return "bg-[#2563eb]";
    case "in_progress":
      return "bg-[#f59e0b]";
    case "waiting_support":
      return "bg-[#ca8a04]";
    case "waiting_creator":
      return "bg-[#f97316]";
    case "resolved":
      return "bg-[#10b981]";
    case "closed":
      return "bg-[#cbd5e1]";
    default:
      return "bg-[#94a3b8]";
  }
}

export function getCreatorTicketPriorityClassName(priority: string): string {
  switch (priority) {
    case "low":
      return "text-[#64748b]";
    case "medium":
      return "text-[#0369a1]";
    case "high":
      return "text-[#c2410c]";
    case "urgent":
      return "text-[#b91c1c]";
    default:
      return "text-[#475569]";
  }
}

export function getCreatorTicketPriorityBadgeClassName(priority: string): string {
  switch (priority) {
    case "low":
      return "bg-[#f1f5f9] text-[#64748b]";
    case "medium":
      return "bg-[#fef3c7] text-[#d97706]";
    case "high":
      return "bg-[#fee2e2] text-[#ef4444]";
    case "urgent":
      return "bg-[#fee2e2] text-[#b91c1c]";
    default:
      return "bg-[#f1f5f9] text-[#475569]";
  }
}
