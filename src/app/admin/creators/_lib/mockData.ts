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
  CreatorAdminRiskLevel,
  CreatorAdminRevenueOverview,
  CreatorAdminSlaStatus,
  CreatorAdminSettlementItem,
  CreatorAdminSettlementStatus,
  CreatorAdminTicketDetail,
  CreatorAdminTicketItem,
  CreatorAdminPolicyOverview,
  CreatorApplicationStatus,
} from "@/types/creator";

function iso(value: string) {
  return new Date(value).toISOString();
}

const creatorApplicationDetails: CreatorAdminApplicationDetail[] = [
  {
    id: "app_cr_001",
    creatorId: "creator_001",
    applicantName: "Amelia Brooks",
    creatorType: "individual",
    displayName: "Ame StoryLab",
    email: "amelia@storylab.fm",
    country: "United States",
    genres: ["Romance", "Drama"],
    primaryLanguage: "English",
    status: "under_review",
    riskLevel: "low",
    submittedAt: iso("2026-03-13T09:20:00+08:00"),
    updatedAt: iso("2026-03-15T16:40:00+08:00"),
    assignedReviewer: "Mia Chen",
    missingItems: [],
    notes: "Portfolio quality is strong. Verify the government ID match against the payout name before approval.",
    agreementVersion: "Creator Agreement v2026.03",
    signedAt: iso("2026-03-13T09:18:00+08:00"),
    draft: {
      basicInformation: {
        creatorType: "individual",
        legalName: "Amelia Brooks",
        companyName: "",
        representativeName: "",
        email: "amelia@storylab.fm",
        phone: "+1 415 555 0120",
        country: "United States",
      },
      creativeInformation: {
        genres: ["Romance", "Drama"],
        primaryLanguage: "English",
        portfolioLinks: [
          "https://youtube.com/@amestorylab",
          "https://tiktok.com/@amestorylab",
        ],
        bio: "Short-form drama creator focused on emotional cliffhangers and episodic romance arcs for Gen Z audiences.",
      },
      identityVerification: {
        verificationType: "government_id",
        documentNumber: "CA-4812-551",
        issueCountry: "United States",
        taxIdOrBusinessId: "US-IND-4812",
        frontDocumentFileName: "amelia-front.jpg",
        backDocumentFileName: "amelia-back.jpg",
        frontDocumentFileUrl: "/docs/amelia-front.jpg",
        backDocumentFileUrl: "/docs/amelia-back.jpg",
      },
      agreement: {
        acceptedTerms: true,
        acceptedAuthenticity: true,
        hasReviewedFullAgreement: true,
        signatureName: "Amelia Brooks",
        agreementVersion: "Creator Agreement v2026.03",
      },
      lastCompletedStep: 5,
      updatedAt: iso("2026-03-15T16:40:00+08:00"),
    },
    reviewChecklist: [
      { key: "identity_verified", label: "Identity verified", passed: true, note: "Document names align with the applicant record." },
      { key: "portfolio_verified", label: "Portfolio verified", passed: true, note: "Social links show original episodic storytelling content." },
      { key: "content_rights_verified", label: "Content rights", passed: true, note: "Applicant confirmed rights ownership in submission." },
      { key: "agreement_verified", label: "Agreement accepted", passed: true, note: "Latest agreement version accepted in-page." },
      { key: "risk_screening_passed", label: "Risk screening", passed: true, note: "No prior strikes or payment anomalies found." },
    ],
    reviewHistory: [
      {
        id: "review_001",
        at: iso("2026-03-14T10:15:00+08:00"),
        actor: "System",
        action: "Application submitted",
        note: "Entered creator application queue.",
      },
      {
        id: "review_002",
        at: iso("2026-03-15T09:10:00+08:00"),
        actor: "Mia Chen",
        action: "Assigned reviewer",
        note: "Initial verification started.",
      },
    ],
  },
  {
    id: "app_cr_002",
    creatorId: "creator_002",
    applicantName: "Moonlit Frame Studio",
    creatorType: "company",
    displayName: "Moonlit Frame",
    email: "ops@moonlitframe.co",
    country: "Canada",
    genres: ["Fantasy", "Thriller"],
    primaryLanguage: "English",
    status: "need_more_info",
    riskLevel: "medium",
    submittedAt: iso("2026-03-11T13:00:00+08:00"),
    updatedAt: iso("2026-03-14T18:15:00+08:00"),
    assignedReviewer: "Noah Patel",
    missingItems: ["Resubmit business license", "Provide bank account holder proof"],
    notes: "Business ID scan is blurry and the payout account holder does not match the company legal name.",
    agreementVersion: "Creator Agreement v2026.03",
    signedAt: iso("2026-03-11T12:56:00+08:00"),
    draft: {
      basicInformation: {
        creatorType: "company",
        legalName: "",
        companyName: "Moonlit Frame Studio Inc.",
        representativeName: "Lena Shaw",
        email: "ops@moonlitframe.co",
        phone: "+1 604 555 8843",
        country: "Canada",
      },
      creativeInformation: {
        genres: ["Fantasy", "Thriller"],
        primaryLanguage: "English",
        portfolioLinks: [
          "https://vimeo.com/moonlitframe",
          "https://instagram.com/moonlitframe",
        ],
        bio: "Independent studio producing vertical micro-dramas with fantasy and suspense hooks.",
      },
      identityVerification: {
        verificationType: "business_license",
        documentNumber: "CA-BC-77881",
        issueCountry: "Canada",
        taxIdOrBusinessId: "778812-BC",
        frontDocumentFileName: "moonlit-license-front.pdf",
        backDocumentFileName: "moonlit-proof.pdf",
        frontDocumentFileUrl: "/docs/moonlit-license-front.pdf",
        backDocumentFileUrl: "/docs/moonlit-proof.pdf",
      },
      agreement: {
        acceptedTerms: true,
        acceptedAuthenticity: true,
        hasReviewedFullAgreement: true,
        signatureName: "Lena Shaw",
        agreementVersion: "Creator Agreement v2026.03",
      },
      lastCompletedStep: 5,
      updatedAt: iso("2026-03-14T18:15:00+08:00"),
    },
    reviewChecklist: [
      { key: "identity_verified", label: "Identity verified", passed: false, note: "Business license requires a clearer scan." },
      { key: "portfolio_verified", label: "Portfolio verified", passed: true, note: "Studio portfolio contains original fantasy series." },
      { key: "content_rights_verified", label: "Content rights", passed: true, note: "Ownership declaration submitted." },
      { key: "agreement_verified", label: "Agreement accepted", passed: true, note: "Accepted under company representative." },
      { key: "risk_screening_passed", label: "Risk screening", passed: false, note: "Payout holder mismatch needs clarification." },
    ],
    reviewHistory: [
      {
        id: "review_003",
        at: iso("2026-03-12T08:25:00+08:00"),
        actor: "System",
        action: "Application submitted",
        note: "Company application entered queue.",
      },
      {
        id: "review_004",
        at: iso("2026-03-14T18:15:00+08:00"),
        actor: "Noah Patel",
        action: "Need more information",
        note: "Requested clearer license and payout holder proof.",
      },
    ],
  },
  {
    id: "app_cr_003",
    creatorId: "creator_003",
    applicantName: "Keira Moss",
    creatorType: "individual",
    displayName: "Keira Writes",
    email: "keira@writes.tv",
    country: "United Kingdom",
    genres: ["Comedy", "Slice of Life"],
    primaryLanguage: "English",
    status: "approved",
    riskLevel: "low",
    submittedAt: iso("2026-03-08T11:45:00+08:00"),
    updatedAt: iso("2026-03-10T09:30:00+08:00"),
    assignedReviewer: "Mia Chen",
    missingItems: [],
    notes: "Approved and activated. Ready for contract issuance.",
    agreementVersion: "Creator Agreement v2026.03",
    signedAt: iso("2026-03-08T11:42:00+08:00"),
    draft: {
      basicInformation: {
        creatorType: "individual",
        legalName: "Keira Moss",
        companyName: "",
        representativeName: "",
        email: "keira@writes.tv",
        phone: "+44 20 7946 1001",
        country: "United Kingdom",
      },
      creativeInformation: {
        genres: ["Comedy", "Slice of Life"],
        primaryLanguage: "English",
        portfolioLinks: ["https://youtube.com/@keirawrites"],
        bio: "Writer-performer specializing in sharp comedy micro-series with female-led plots.",
      },
      identityVerification: {
        verificationType: "passport",
        documentNumber: "UK-88291",
        issueCountry: "United Kingdom",
        taxIdOrBusinessId: "",
        frontDocumentFileName: "keira-passport.jpg",
        backDocumentFileName: "",
        frontDocumentFileUrl: "/docs/keira-passport.jpg",
        backDocumentFileUrl: "",
      },
      agreement: {
        acceptedTerms: true,
        acceptedAuthenticity: true,
        hasReviewedFullAgreement: true,
        signatureName: "Keira Moss",
        agreementVersion: "Creator Agreement v2026.03",
      },
      lastCompletedStep: 5,
      updatedAt: iso("2026-03-10T09:30:00+08:00"),
    },
    reviewChecklist: [
      { key: "identity_verified", label: "Identity verified", passed: true, note: "Passport validated." },
      { key: "portfolio_verified", label: "Portfolio verified", passed: true, note: "Existing audience and samples verified." },
      { key: "content_rights_verified", label: "Content rights", passed: true, note: "Ownership declaration completed." },
      { key: "agreement_verified", label: "Agreement accepted", passed: true, note: "Signed under current agreement version." },
      { key: "risk_screening_passed", label: "Risk screening", passed: true, note: "No exception found." },
    ],
    reviewHistory: [
      {
        id: "review_005",
        at: iso("2026-03-09T14:00:00+08:00"),
        actor: "Mia Chen",
        action: "Application approved",
        note: "Creator access enabled.",
      },
    ],
  },
  {
    id: "app_cr_004",
    creatorId: "creator_004",
    applicantName: "North Harbor Media",
    creatorType: "company",
    displayName: "North Harbor",
    email: "legal@northharbor.media",
    country: "Australia",
    genres: ["Thriller"],
    primaryLanguage: "English",
    status: "rejected",
    riskLevel: "high",
    submittedAt: iso("2026-03-05T17:10:00+08:00"),
    updatedAt: iso("2026-03-07T10:05:00+08:00"),
    assignedReviewer: "Noah Patel",
    missingItems: ["Provide rights chain for submitted portfolio"],
    notes: "Rejected due to unclear content rights ownership across two portfolio titles.",
    agreementVersion: "Creator Agreement v2026.03",
    signedAt: iso("2026-03-05T17:05:00+08:00"),
    draft: {
      basicInformation: {
        creatorType: "company",
        legalName: "",
        companyName: "North Harbor Media Pty Ltd",
        representativeName: "Jason Reed",
        email: "legal@northharbor.media",
        phone: "+61 2 5550 3177",
        country: "Australia",
      },
      creativeInformation: {
        genres: ["Thriller"],
        primaryLanguage: "English",
        portfolioLinks: ["https://northharbor.media/showreel"],
        bio: "Boutique thriller studio building serialized vertical drama.",
      },
      identityVerification: {
        verificationType: "business_license",
        documentNumber: "AU-99311",
        issueCountry: "Australia",
        taxIdOrBusinessId: "AU-99831",
        frontDocumentFileName: "northharbor-license.pdf",
        backDocumentFileName: "northharbor-ownership.pdf",
        frontDocumentFileUrl: "/docs/northharbor-license.pdf",
        backDocumentFileUrl: "/docs/northharbor-ownership.pdf",
      },
      agreement: {
        acceptedTerms: true,
        acceptedAuthenticity: true,
        hasReviewedFullAgreement: true,
        signatureName: "Jason Reed",
        agreementVersion: "Creator Agreement v2026.03",
      },
      lastCompletedStep: 5,
      updatedAt: iso("2026-03-07T10:05:00+08:00"),
    },
    reviewChecklist: [
      { key: "identity_verified", label: "Identity verified", passed: true, note: "Company registration is valid." },
      { key: "portfolio_verified", label: "Portfolio verified", passed: false, note: "Portfolio titles reference third-party distributors." },
      { key: "content_rights_verified", label: "Content rights", passed: false, note: "Rights chain was incomplete." },
      { key: "agreement_verified", label: "Agreement accepted", passed: true, note: "Agreement was accepted." },
      { key: "risk_screening_passed", label: "Risk screening", passed: false, note: "Escalated for rights compliance." },
    ],
    reviewHistory: [
      {
        id: "review_006",
        at: iso("2026-03-07T10:05:00+08:00"),
        actor: "Noah Patel",
        action: "Application rejected",
        note: "Rejected due to missing rights chain evidence.",
      },
    ],
  },
];

const creatorDetails: CreatorAdminCreatorDetail[] = [
  {
    id: "creator_001",
    displayName: "Ame StoryLab",
    legalName: "Amelia Brooks",
    creatorType: "individual",
    email: "amelia@storylab.fm",
    country: "United States",
    status: "active",
    level: "Signature",
    publishedTitles: 4,
    totalEpisodes: 62,
    monthlyRevenueUsd: 18540,
    bankStatus: "verified",
    openTickets: 1,
    dmcaStrikes: 0,
    joinedAt: iso("2025-11-18T12:00:00+08:00"),
    bio: "Creator focused on premium romance micro-dramas with cliffhanger-heavy pacing.",
    phone: "+1 415 555 0120",
    languages: ["English"],
    genres: ["Romance", "Drama"],
    approvedAt: iso("2025-11-20T09:00:00+08:00"),
    managedBy: "Mia Chen",
    contract: {
      version: "Contract v2.1",
      status: "signed",
      signedAt: iso("2025-11-20T10:30:00+08:00"),
      nextRenewalAt: iso("2026-11-20T10:30:00+08:00"),
    },
    bankAccount: {
      status: "verified",
      accountHolderName: "Amelia Brooks",
      bankName: "Chase",
      maskedAccountNumber: "**** 2148",
      country: "United States",
      updatedAt: iso("2026-02-18T09:15:00+08:00"),
    },
    topDramas: [
      { id: "drama_101", title: "Midnight Confession", status: "published", views: 1340000, revenueUsd: 9280, updatedAt: iso("2026-03-14T11:00:00+08:00") },
      { id: "drama_102", title: "When We Pretended", status: "published", views: 960000, revenueUsd: 6140, updatedAt: iso("2026-03-12T17:20:00+08:00") },
    ],
    dmcaStrikeHistory: [],
    auditTrail: [
      { id: "audit_001", at: iso("2026-03-12T15:00:00+08:00"), actor: "Finance Ops", action: "Bank verified", summary: "Primary payout account verified." },
      { id: "audit_002", at: iso("2026-03-14T11:20:00+08:00"), actor: "Content Ops", action: "Title published", summary: "Published episode batch for Midnight Confession." },
    ],
  },
  {
    id: "creator_002",
    displayName: "Moonlit Frame",
    legalName: "Moonlit Frame Studio Inc.",
    creatorType: "company",
    email: "ops@moonlitframe.co",
    country: "Canada",
    status: "under_review",
    level: "Studio",
    publishedTitles: 1,
    totalEpisodes: 18,
    monthlyRevenueUsd: 2140,
    bankStatus: "pending_review",
    openTickets: 2,
    dmcaStrikes: 0,
    joinedAt: iso("2026-03-11T13:00:00+08:00"),
    bio: "Independent studio producing genre-forward vertical suspense and fantasy.",
    phone: "+1 604 555 8843",
    languages: ["English"],
    genres: ["Fantasy", "Thriller"],
    approvedAt: null,
    managedBy: "Noah Patel",
    contract: {
      version: "Contract v2.1",
      status: "draft",
      signedAt: null,
      nextRenewalAt: null,
    },
    bankAccount: {
      status: "pending_review",
      accountHolderName: "Moonlit Frame Studio Inc.",
      bankName: "TD Canada Trust",
      maskedAccountNumber: "**** 8814",
      country: "Canada",
      updatedAt: iso("2026-03-14T18:12:00+08:00"),
    },
    topDramas: [
      { id: "drama_201", title: "Gilded Veil", status: "pending_review", views: 98000, revenueUsd: 2140, updatedAt: iso("2026-03-15T16:00:00+08:00") },
    ],
    dmcaStrikeHistory: [],
    auditTrail: [
      { id: "audit_003", at: iso("2026-03-14T18:15:00+08:00"), actor: "Noah Patel", action: "Need resubmission", summary: "Application moved to need more information." },
    ],
  },
  {
    id: "creator_003",
    displayName: "Keira Writes",
    legalName: "Keira Moss",
    creatorType: "individual",
    email: "keira@writes.tv",
    country: "United Kingdom",
    status: "active",
    level: "Rising",
    publishedTitles: 2,
    totalEpisodes: 24,
    monthlyRevenueUsd: 8420,
    bankStatus: "verified",
    openTickets: 0,
    dmcaStrikes: 0,
    joinedAt: iso("2026-03-10T09:30:00+08:00"),
    bio: "Writer-performer specializing in comedy micro-series with high completion rates.",
    phone: "+44 20 7946 1001",
    languages: ["English"],
    genres: ["Comedy", "Slice of Life"],
    approvedAt: iso("2026-03-10T09:30:00+08:00"),
    managedBy: "Mia Chen",
    contract: {
      version: "Contract v2.1",
      status: "signed",
      signedAt: iso("2026-03-10T10:15:00+08:00"),
      nextRenewalAt: iso("2027-03-10T10:15:00+08:00"),
    },
    bankAccount: {
      status: "verified",
      accountHolderName: "Keira Moss",
      bankName: "HSBC UK",
      maskedAccountNumber: "**** 0321",
      country: "United Kingdom",
      updatedAt: iso("2026-03-10T10:10:00+08:00"),
    },
    topDramas: [
      { id: "drama_301", title: "Roommate Roulette", status: "published", views: 640000, revenueUsd: 5120, updatedAt: iso("2026-03-15T10:40:00+08:00") },
      { id: "drama_302", title: "Text Me Tomorrow", status: "published", views: 420000, revenueUsd: 3300, updatedAt: iso("2026-03-13T09:40:00+08:00") },
    ],
    dmcaStrikeHistory: [],
    auditTrail: [
      { id: "audit_004", at: iso("2026-03-15T10:45:00+08:00"), actor: "Content Ops", action: "Published", summary: "Approved new episode batch for Roommate Roulette." },
    ],
  },
  {
    id: "creator_004",
    displayName: "North Harbor",
    legalName: "North Harbor Media Pty Ltd",
    creatorType: "company",
    email: "legal@northharbor.media",
    country: "Australia",
    status: "restricted",
    level: "Studio",
    publishedTitles: 3,
    totalEpisodes: 36,
    monthlyRevenueUsd: 9560,
    bankStatus: "rejected",
    openTickets: 3,
    dmcaStrikes: 2,
    joinedAt: iso("2025-09-01T11:30:00+08:00"),
    bio: "Thriller-focused studio currently under compliance review after ownership disputes.",
    phone: "+61 2 5550 3177",
    languages: ["English"],
    genres: ["Thriller"],
    approvedAt: iso("2025-09-03T10:00:00+08:00"),
    managedBy: "Noah Patel",
    contract: {
      version: "Contract v1.9",
      status: "renewal_due",
      signedAt: iso("2025-09-03T10:30:00+08:00"),
      nextRenewalAt: iso("2026-04-01T00:00:00+08:00"),
    },
    bankAccount: {
      status: "rejected",
      accountHolderName: "North Harbor Media Pty Ltd",
      bankName: "ANZ",
      maskedAccountNumber: "**** 4409",
      country: "Australia",
      updatedAt: iso("2026-03-09T14:30:00+08:00"),
    },
    topDramas: [
      { id: "drama_401", title: "Silent Harbor", status: "suspended", views: 760000, revenueUsd: 5220, updatedAt: iso("2026-03-10T08:00:00+08:00") },
      { id: "drama_402", title: "Glass Witness", status: "published", views: 410000, revenueUsd: 4340, updatedAt: iso("2026-03-08T20:10:00+08:00") },
    ],
    dmcaStrikeHistory: [
      { id: "strike_001", issuedAt: iso("2026-01-12T16:00:00+08:00"), status: "active", reason: "Third-party footage claim not resolved." },
      { id: "strike_002", issuedAt: iso("2026-02-26T12:45:00+08:00"), status: "resolved", reason: "Counter-notice accepted after rights proof." },
    ],
    auditTrail: [
      { id: "audit_005", at: iso("2026-03-09T14:30:00+08:00"), actor: "Finance Ops", action: "Bank rejected", summary: "Requested account holder proof." },
      { id: "audit_006", at: iso("2026-03-10T09:00:00+08:00"), actor: "Trust & Safety", action: "Restricted creator", summary: "Payouts blocked pending compliance review." },
    ],
  },
];

export const mockCreatorApplications: CreatorAdminApplicationListItem[] = creatorApplicationDetails.map((item) => ({
  id: item.id,
  applicantName: item.applicantName,
  creatorType: item.creatorType,
  displayName: item.displayName,
  email: item.email,
  country: item.country,
  genres: item.genres,
  primaryLanguage: item.primaryLanguage,
  status: item.status,
  riskLevel: item.riskLevel,
  submittedAt: item.submittedAt,
  updatedAt: item.updatedAt,
  assignedReviewer: item.assignedReviewer,
  missingItems: item.missingItems,
}));

export const mockCreators: CreatorAdminCreatorListItem[] = creatorDetails.map((item) => ({
  id: item.id,
  displayName: item.displayName,
  legalName: item.legalName,
  creatorType: item.creatorType,
  email: item.email,
  country: item.country,
  status: item.status,
  level: item.level,
  publishedTitles: item.publishedTitles,
  totalEpisodes: item.totalEpisodes,
  monthlyRevenueUsd: item.monthlyRevenueUsd,
  bankStatus: item.bankStatus,
  openTickets: item.openTickets,
  dmcaStrikes: item.dmcaStrikes,
  joinedAt: item.joinedAt,
}));

const creatorContentReviewDetails: CreatorAdminContentReviewDetail[] = [
  {
    dramaId: "drama_cr_001",
    title: "Velvet Lies",
    cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80",
    creatorId: "creator_001",
    creatorName: "Ame StoryLab",
    creatorEmail: "amelia@storylab.fm",
    categories: ["Romance", "Drama"],
    episodes: 18,
    viewCount: 284000,
    status: "pending_review",
    submittedAt: iso("2026-03-15T10:10:00+08:00"),
    reviewedAt: null,
    slaDeadlineAt: iso("2026-03-17T10:10:00+08:00"),
    slaStatus: "due_soon",
    reviewNote: "",
    rejectionReason: "",
    description: "A revenge romance micro-drama built around boardroom secrets, fake engagement, and quick cliffhanger cuts.",
    language: "English",
    country: "United States",
    creatorLevel: "Rising",
    creatorStatus: "active",
    rejectionHistoryCount: 0,
    activeDmcaStrikes: 0,
    checklist: [
      { key: "metadata_complete", label: "Metadata complete", passed: true, note: "Title, cover, synopsis, and categories are all present." },
      { key: "episode_assets_ready", label: "Episode assets ready", passed: true, note: "18 episodes uploaded with thumbnails and durations." },
      { key: "pricing_ready", label: "Pricing ready", passed: true, note: "Free/paid episode mix is configured for launch." },
      { key: "rights_clearance", label: "Rights clearance", passed: true, note: "Creator agreement is approved and no ownership conflict is flagged." },
      { key: "policy_risk_clear", label: "Policy risk clear", passed: false, note: "A few descriptions need language tightening before publish." },
    ],
    episodesPreview: [
      { id: "ep_001", episodeNumber: 1, title: "The Return", durationSeconds: 74, status: "Published" },
      { id: "ep_002", episodeNumber: 2, title: "A Calculated Proposal", durationSeconds: 68, status: "Published" },
      { id: "ep_003", episodeNumber: 3, title: "Contract Clause", durationSeconds: 72, status: "Published" },
    ],
    reviewHistory: [
      { id: "content_hist_001", at: iso("2026-03-15T10:10:00+08:00"), actor: "Ame StoryLab", action: "Submitted for review", note: "Requested publish approval for first release wave." },
      { id: "content_hist_002", at: iso("2026-03-16T09:20:00+08:00"), actor: "Mia Chen", action: "Initial QA started", note: "Checking cover copy, synopsis wording, and monetization config." },
    ],
  },
  {
    dramaId: "drama_cr_002",
    title: "Moonlit Heist",
    cover: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=640&q=80",
    creatorId: "creator_002",
    creatorName: "Moonlit Frame",
    creatorEmail: "ops@moonlitframe.co",
    categories: ["Thriller", "Fantasy"],
    episodes: 12,
    viewCount: 91000,
    status: "rejected",
    submittedAt: iso("2026-03-12T08:30:00+08:00"),
    reviewedAt: iso("2026-03-13T16:00:00+08:00"),
    slaDeadlineAt: iso("2026-03-14T08:30:00+08:00"),
    slaStatus: "resolved",
    reviewNote: "Please replace non-original poster art and resubmit the trailer cover set.",
    rejectionReason: "Promotional assets include artwork that cannot be cleared for commercial use.",
    description: "A fantasy caper set in a hidden city where a missing relic pulls three rivals into the same heist.",
    language: "English",
    country: "Canada",
    creatorLevel: "Studio",
    creatorStatus: "restricted",
    rejectionHistoryCount: 1,
    activeDmcaStrikes: 1,
    checklist: [
      { key: "metadata_complete", label: "Metadata complete", passed: true, note: "Story metadata is complete." },
      { key: "episode_assets_ready", label: "Episode assets ready", passed: true, note: "12 episodes are technically ready to stream." },
      { key: "pricing_ready", label: "Pricing ready", passed: true, note: "Package pricing matches creator settings." },
      { key: "rights_clearance", label: "Rights clearance", passed: false, note: "Cover art source cannot be validated." },
      { key: "policy_risk_clear", label: "Policy risk clear", passed: false, note: "Manual copyright review required before launch." },
    ],
    episodesPreview: [
      { id: "ep_004", episodeNumber: 1, title: "The Missing Key", durationSeconds: 65, status: "Published" },
      { id: "ep_005", episodeNumber: 2, title: "False Mask", durationSeconds: 70, status: "Published" },
      { id: "ep_006", episodeNumber: 3, title: "Trap Door", durationSeconds: 66, status: "Published" },
    ],
    reviewHistory: [
      { id: "content_hist_003", at: iso("2026-03-12T08:30:00+08:00"), actor: "Moonlit Frame", action: "Submitted for review", note: "First batch of episodes sent to admin queue." },
      { id: "content_hist_004", at: iso("2026-03-13T16:00:00+08:00"), actor: "Noah Patel", action: "Rejected", note: "Rights proof for art pack is missing." },
    ],
  },
  {
    dramaId: "drama_cr_003",
    title: "Keira After Five",
    cover: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    categories: ["Comedy", "Slice of Life"],
    episodes: 24,
    viewCount: 542000,
    status: "published",
    submittedAt: iso("2026-03-08T12:00:00+08:00"),
    reviewedAt: iso("2026-03-09T18:20:00+08:00"),
    slaDeadlineAt: iso("2026-03-10T12:00:00+08:00"),
    slaStatus: "resolved",
    reviewNote: "Approved for launch. Publish banner rotation after episode 6 unlock test.",
    rejectionReason: "",
    description: "A female-led workplace comedy told through short, escalating office disasters after 5 p.m.",
    language: "English",
    country: "United Kingdom",
    creatorLevel: "Signature",
    creatorStatus: "active",
    rejectionHistoryCount: 0,
    activeDmcaStrikes: 0,
    checklist: [
      { key: "metadata_complete", label: "Metadata complete", passed: true, note: "Metadata package passed QA." },
      { key: "episode_assets_ready", label: "Episode assets ready", passed: true, note: "24 episodes published successfully." },
      { key: "pricing_ready", label: "Pricing ready", passed: true, note: "Monetization tier and free unlock setup approved." },
      { key: "rights_clearance", label: "Rights clearance", passed: true, note: "No rights conflicts detected." },
      { key: "policy_risk_clear", label: "Policy risk clear", passed: true, note: "No policy issue found during launch review." },
    ],
    episodesPreview: [
      { id: "ep_007", episodeNumber: 1, title: "Calendar Invite", durationSeconds: 61, status: "Published" },
      { id: "ep_008", episodeNumber: 2, title: "Breakroom Gossip", durationSeconds: 58, status: "Published" },
      { id: "ep_009", episodeNumber: 3, title: "Reply All", durationSeconds: 63, status: "Published" },
    ],
    reviewHistory: [
      { id: "content_hist_005", at: iso("2026-03-08T12:00:00+08:00"), actor: "Keira Writes", action: "Submitted for review", note: "Launch batch requested." },
      { id: "content_hist_006", at: iso("2026-03-09T18:20:00+08:00"), actor: "Mia Chen", action: "Approved and published", note: "Approved for featuring in comedy row." },
    ],
  },
];

export const mockContentReviews: CreatorAdminContentReviewListItem[] = creatorContentReviewDetails.map((item) => ({
  dramaId: item.dramaId,
  title: item.title,
  cover: item.cover,
  creatorId: item.creatorId,
  creatorName: item.creatorName,
  creatorEmail: item.creatorEmail,
  categories: item.categories,
  episodes: item.episodes,
  viewCount: item.viewCount,
  status: item.status,
  submittedAt: item.submittedAt,
  reviewedAt: item.reviewedAt,
  slaDeadlineAt: item.slaDeadlineAt,
  slaStatus: item.slaStatus,
  reviewNote: item.reviewNote,
  rejectionReason: item.rejectionReason,
}));

export const mockDmcaCases: CreatorAdminDmcaCaseItem[] = [
  {
    id: "dmca_001",
    creatorId: "creator_002",
    creatorName: "Moonlit Frame",
    creatorEmail: "ops@moonlitframe.co",
    dramaId: "drama_cr_002",
    dramaTitle: "Moonlit Heist",
    status: "under_review",
    reportedAt: iso("2026-03-15T09:10:00+08:00"),
    dueAt: iso("2026-03-17T09:10:00+08:00"),
    claimant: "North Pier Licensing",
    reason: "Claimant alleges poster art and soundtrack preview were reused without permission.",
    actionRequired: "Validate source files and determine whether a takedown is required before release resumes.",
    strikeImpact: 1,
    hasCounterNotice: false,
    note: "Waiting on creator rights package.",
  },
  {
    id: "dmca_002",
    creatorId: "creator_004",
    creatorName: "North Harbor",
    creatorEmail: "legal@northharbor.media",
    dramaId: "drama_401",
    dramaTitle: "Silent Harbor",
    status: "counter_notice",
    reportedAt: iso("2026-03-10T11:40:00+08:00"),
    dueAt: iso("2026-03-18T11:40:00+08:00"),
    claimant: "Arclight Studios",
    reason: "Notice targets stock harbor footage used in episode 4 recap.",
    actionRequired: "Review counter-notice evidence and keep payout hold until resolution.",
    strikeImpact: 0,
    hasCounterNotice: true,
    note: "Counter-notice uploaded by creator counsel.",
  },
  {
    id: "dmca_003",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    dramaId: "drama_cr_003",
    dramaTitle: "Keira After Five",
    status: "resolved",
    reportedAt: iso("2026-02-24T14:15:00+08:00"),
    dueAt: iso("2026-02-26T14:15:00+08:00"),
    claimant: "Original Music House",
    reason: "Opening sting was flagged for potential library mismatch.",
    actionRequired: "No further action required; claimant accepted replacement cue sheet.",
    strikeImpact: 0,
    hasCounterNotice: true,
    note: "Resolved after rights proof and soundtrack swap.",
  },
];

export const mockCreatorBankAccounts: CreatorAdminBankAccountItem[] = [
  {
    creatorId: "creator_001",
    creatorName: "Ame StoryLab",
    creatorEmail: "amelia@storylab.fm",
    creatorLevel: "Rising",
    creatorStatus: "active",
    bankStatus: "pending_review",
    accountHolderName: "Amelia Brooks",
    bankName: "Chase Bank",
    maskedAccountNumber: "**** 4821",
    country: "United States",
    updatedAt: iso("2026-03-15T15:20:00+08:00"),
    availableBalanceUsd: 4820,
    pendingBalanceUsd: 1640,
    nextSettlementDate: iso("2026-04-05T10:00:00+08:00"),
    lastReviewNote: "Need final name match against submitted ID before approving payouts.",
  },
  {
    creatorId: "creator_002",
    creatorName: "Moonlit Frame",
    creatorEmail: "ops@moonlitframe.co",
    creatorLevel: "Studio",
    creatorStatus: "restricted",
    bankStatus: "rejected",
    accountHolderName: "Moonlit Frame Studio Inc.",
    bankName: "RBC Royal Bank",
    maskedAccountNumber: "**** 9014",
    country: "Canada",
    updatedAt: iso("2026-03-14T18:10:00+08:00"),
    availableBalanceUsd: 2160,
    pendingBalanceUsd: 780,
    nextSettlementDate: iso("2026-04-05T10:00:00+08:00"),
    lastReviewNote: "Bank holder proof does not match the legal entity on file.",
  },
  {
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    creatorLevel: "Signature",
    creatorStatus: "active",
    bankStatus: "verified",
    accountHolderName: "Keira Moss",
    bankName: "HSBC UK",
    maskedAccountNumber: "**** 2207",
    country: "United Kingdom",
    updatedAt: iso("2026-03-09T11:30:00+08:00"),
    availableBalanceUsd: 8640,
    pendingBalanceUsd: 2100,
    nextSettlementDate: iso("2026-04-05T10:00:00+08:00"),
    lastReviewNote: "Verified and ready for payout scheduling.",
  },
];

export const mockCreatorSettlements: CreatorAdminSettlementItem[] = [
  {
    id: "stl_creator_003_2026-02",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    statementId: "2026-02",
    statementNo: "CS-202602",
    periodStart: iso("2026-02-01T00:00:00+08:00"),
    periodEnd: iso("2026-02-28T23:59:59+08:00"),
    periodLabel: "Feb 1, 2026 - Feb 28, 2026",
    grossRevenueUsd: 16240,
    channelFeesUsd: 3248,
    reserveUsd: 1624,
    netPayoutUsd: 11368,
    unlockCount: 4912,
    payoutDate: iso("2026-03-05T10:00:00+08:00"),
    bankStatus: "verified",
    status: "paid",
    note: "Transferred via standard bank payout.",
  },
  {
    id: "stl_creator_001_2026-02",
    creatorId: "creator_001",
    creatorName: "Ame StoryLab",
    statementId: "2026-02",
    statementNo: "CS-202602",
    periodStart: iso("2026-02-01T00:00:00+08:00"),
    periodEnd: iso("2026-02-28T23:59:59+08:00"),
    periodLabel: "Feb 1, 2026 - Feb 28, 2026",
    grossRevenueUsd: 9180,
    channelFeesUsd: 1836,
    reserveUsd: 918,
    netPayoutUsd: 6426,
    unlockCount: 2860,
    payoutDate: iso("2026-04-05T10:00:00+08:00"),
    bankStatus: "pending_review",
    status: "generated",
    note: "Waiting on bank approval before payout can be released.",
  },
  {
    id: "stl_creator_002_2026-02",
    creatorId: "creator_002",
    creatorName: "Moonlit Frame",
    statementId: "2026-02",
    statementNo: "CS-202602",
    periodStart: iso("2026-02-01T00:00:00+08:00"),
    periodEnd: iso("2026-02-28T23:59:59+08:00"),
    periodLabel: "Feb 1, 2026 - Feb 28, 2026",
    grossRevenueUsd: 5400,
    channelFeesUsd: 1080,
    reserveUsd: 540,
    netPayoutUsd: 3780,
    unlockCount: 1711,
    payoutDate: null,
    bankStatus: "rejected",
    status: "held",
    note: "Held due to bank mismatch and open rights claim.",
  },
  {
    id: "stl_creator_003_2026-03",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    statementId: "2026-03",
    statementNo: "CS-202603",
    periodStart: iso("2026-03-01T00:00:00+08:00"),
    periodEnd: iso("2026-03-31T23:59:59+08:00"),
    periodLabel: "Mar 1, 2026 - Mar 31, 2026",
    grossRevenueUsd: 8240,
    channelFeesUsd: 1648,
    reserveUsd: 824,
    netPayoutUsd: 5768,
    unlockCount: 2390,
    payoutDate: iso("2026-04-05T10:00:00+08:00"),
    bankStatus: "verified",
    status: "confirmed",
    note: "Creator confirmed statement. Ready for next payout cycle.",
  },
];

export const mockCreatorPayoutRequests: CreatorAdminPayoutRequestItem[] = [
  {
    id: "payout_creator_001_2026-02",
    creatorId: "creator_001",
    creatorName: "Ame StoryLab",
    creatorEmail: "amelia@storylab.fm",
    statementId: "2026-02",
    statementNo: "CS-202602",
    amountUsd: 6426,
    requestedAt: iso("2026-03-16T09:00:00+08:00"),
    payoutDate: iso("2026-04-05T10:00:00+08:00"),
    bankStatus: "pending_review",
    status: "generated",
    payoutMethodLabel: "Bank Transfer",
    holdReason: "Bank review not finished",
    transferReference: "",
    note: "Auto-generated after statement creation.",
  },
  {
    id: "payout_creator_003_2026-03",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    statementId: "2026-03",
    statementNo: "CS-202603",
    amountUsd: 5768,
    requestedAt: iso("2026-03-15T12:00:00+08:00"),
    payoutDate: iso("2026-04-05T10:00:00+08:00"),
    bankStatus: "verified",
    status: "confirmed",
    payoutMethodLabel: "Bank Transfer",
    holdReason: "",
    transferReference: "",
    note: "Ready for finance transfer window.",
  },
  {
    id: "payout_creator_003_2026-02",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    statementId: "2026-02",
    statementNo: "CS-202602",
    amountUsd: 11368,
    requestedAt: iso("2026-03-04T13:00:00+08:00"),
    payoutDate: iso("2026-03-05T10:00:00+08:00"),
    bankStatus: "verified",
    status: "paid",
    payoutMethodLabel: "Bank Transfer",
    holdReason: "",
    transferReference: "WIRE-20260305-KEIRA",
    note: "Paid successfully.",
  },
];

export const mockCreatorRevenueOverview: CreatorAdminRevenueOverview = {
  kpis: [
    {
      key: "grossRevenueUsd",
      label: "Gross Revenue",
      valueUsd: mockCreatorSettlements.reduce((sum, item) => sum + item.grossRevenueUsd, 0),
      helper: "Gross unlock revenue attributed to creator titles in the current admin window.",
      tone: "indigo",
    },
    {
      key: "netPayoutUsd",
      label: "Net Payout",
      valueUsd: mockCreatorSettlements.reduce((sum, item) => sum + item.netPayoutUsd, 0),
      helper: "Net creator share after platform fees and reserve deductions.",
      tone: "emerald",
    },
    {
      key: "pendingPayoutUsd",
      label: "Pending Payout",
      valueUsd: mockCreatorSettlements
        .filter((item) => item.status === "generated" || item.status === "confirmed")
        .reduce((sum, item) => sum + item.netPayoutUsd, 0),
      helper: "Statements already generated but not yet paid out.",
      tone: "amber",
    },
    {
      key: "heldAmountUsd",
      label: "Held / Disputed",
      valueUsd: mockCreatorSettlements
        .filter((item) => item.status === "held" || item.status === "disputed")
        .reduce((sum, item) => sum + item.netPayoutUsd, 0),
      helper: "Amounts blocked by finance holds, disputes, or compliance issues.",
      tone: "rose",
    },
  ],
  creatorRows: mockCreatorBankAccounts.map((item) => {
    const creatorSettlements = mockCreatorSettlements.filter((statement) => statement.creatorId === item.creatorId);
    const creator = mockCreators.find((entry) => entry.id === item.creatorId);
    return {
      creatorId: item.creatorId,
      creatorName: item.creatorName,
      creatorEmail: item.creatorEmail,
      creatorLevel: item.creatorLevel,
      grossRevenueUsd: creatorSettlements.reduce((sum, statement) => sum + statement.grossRevenueUsd, 0),
      netPayoutUsd: creatorSettlements.reduce((sum, statement) => sum + statement.netPayoutUsd, 0),
      availableBalanceUsd: item.availableBalanceUsd,
      pendingBalanceUsd: item.pendingBalanceUsd,
      publishedTitles: creator?.publishedTitles || 0,
      bankStatus: item.bankStatus,
    };
  }).sort((left, right) => right.netPayoutUsd - left.netPayoutUsd),
  recentStatements: mockCreatorSettlements
    .slice()
    .sort((left, right) => new Date(right.periodStart).getTime() - new Date(left.periodStart).getTime())
    .slice(0, 6),
  watchlist: [
    {
      id: "rev_watch_001",
      creatorId: "creator_002",
      creatorName: "Moonlit Frame",
      issue: "Held settlement due to rejected bank account and copyright claim.",
      amountUsd: 3780,
      severity: "high",
    },
    {
      id: "rev_watch_002",
      creatorId: "creator_001",
      creatorName: "Ame StoryLab",
      issue: "Pending payout cannot move until bank verification is completed.",
      amountUsd: 6426,
      severity: "medium",
    },
  ],
};

const creatorTicketDetails: CreatorAdminTicketDetail[] = [
  {
    id: "ticket_admin_001",
    ticketNo: "CT-20260316-001",
    creatorId: "creator_001",
    creatorName: "Ame StoryLab",
    creatorEmail: "amelia@storylab.fm",
    subject: "Settlement generated but payout still blocked",
    category: "payment",
    priority: "high",
    status: "waiting_support",
    lastMessageAt: iso("2026-03-16T10:20:00+08:00"),
    updatedAt: iso("2026-03-16T10:20:00+08:00"),
    messageCount: 3,
    latestMessage: "Can finance confirm whether the bank review is the only blocker for this payout?",
    latestSenderType: "creator",
    messages: [
      {
        senderType: "creator",
        senderId: "creator_001",
        message: "My February statement shows generated, but I cannot see a payout date. What is missing?",
        attachments: [],
        createdAt: iso("2026-03-15T18:30:00+08:00"),
      },
      {
        senderType: "support",
        senderId: "admin_001",
        message: "Finance is checking the payout account holder name against your KYC file.",
        attachments: [],
        createdAt: iso("2026-03-16T09:05:00+08:00"),
      },
      {
        senderType: "creator",
        senderId: "creator_001",
        message: "Can finance confirm whether the bank review is the only blocker for this payout?",
        attachments: [],
        createdAt: iso("2026-03-16T10:20:00+08:00"),
      },
    ],
  },
  {
    id: "ticket_admin_002",
    ticketNo: "CT-20260314-004",
    creatorId: "creator_002",
    creatorName: "Moonlit Frame",
    creatorEmail: "ops@moonlitframe.co",
    subject: "Need guidance on copyright appeal materials",
    category: "policy",
    priority: "urgent",
    status: "in_progress",
    lastMessageAt: iso("2026-03-15T21:40:00+08:00"),
    updatedAt: iso("2026-03-15T21:40:00+08:00"),
    messageCount: 4,
    latestMessage: "Legal team is reviewing the uploaded rights package. We will update the DMCA case after verification.",
    latestSenderType: "support",
    messages: [
      {
        senderType: "creator",
        senderId: "creator_002",
        message: "Which exact files do you need for the DMCA counter-notice review?",
        attachments: [],
        createdAt: iso("2026-03-14T14:00:00+08:00"),
      },
      {
        senderType: "support",
        senderId: "admin_002",
        message: "Please provide the original license agreement, invoice, and source asset references.",
        attachments: [],
        createdAt: iso("2026-03-14T16:20:00+08:00"),
      },
      {
        senderType: "creator",
        senderId: "creator_002",
        message: "The rights package is uploaded. Please confirm receipt.",
        attachments: [],
        createdAt: iso("2026-03-15T18:05:00+08:00"),
      },
      {
        senderType: "support",
        senderId: "admin_002",
        message: "Legal team is reviewing the uploaded rights package. We will update the DMCA case after verification.",
        attachments: [],
        createdAt: iso("2026-03-15T21:40:00+08:00"),
      },
    ],
  },
  {
    id: "ticket_admin_003",
    ticketNo: "CT-20260310-002",
    creatorId: "creator_003",
    creatorName: "Keira Writes",
    creatorEmail: "keira@writes.tv",
    subject: "Question about March settlement reserve deduction",
    category: "payment",
    priority: "medium",
    status: "resolved",
    lastMessageAt: iso("2026-03-13T12:30:00+08:00"),
    updatedAt: iso("2026-03-13T12:30:00+08:00"),
    messageCount: 2,
    latestMessage: "Reserve is the standard 10% refund buffer under the current creator policy. Ticket resolved.",
    latestSenderType: "support",
    messages: [
      {
        senderType: "creator",
        senderId: "creator_003",
        message: "Could you explain why reserve was deducted on the March statement?",
        attachments: [],
        createdAt: iso("2026-03-12T10:00:00+08:00"),
      },
      {
        senderType: "support",
        senderId: "admin_001",
        message: "Reserve is the standard 10% refund buffer under the current creator policy. Ticket resolved.",
        attachments: [],
        createdAt: iso("2026-03-13T12:30:00+08:00"),
      },
    ],
  },
];

export const mockCreatorTickets: CreatorAdminTicketItem[] = creatorTicketDetails.map((item) => ({
  id: item.id,
  ticketNo: item.ticketNo,
  creatorId: item.creatorId,
  creatorName: item.creatorName,
  creatorEmail: item.creatorEmail,
  subject: item.subject,
  category: item.category,
  priority: item.priority,
  status: item.status,
  lastMessageAt: item.lastMessageAt,
  updatedAt: item.updatedAt,
  messageCount: item.messageCount,
  latestMessage: item.latestMessage,
  latestSenderType: item.latestSenderType,
}));

export const mockCreatorPolicyOverview: CreatorAdminPolicyOverview = {
  version: "Creator Policy v2026.03",
  creatorShareRate: 0.7,
  platformFeeRate: 0.2,
  refundReserveRate: 0.1,
  holdDays: 15,
  minimumPayoutUsd: 50,
  reviewSlaHours: 48,
  payoutScheduleDay: 5,
  autoReleaseRequiresVerifiedBank: true,
  notes: [
    "Creator payout is released only after the payout account is verified.",
    "Standard reserve is retained to cover refund and dispute exposure.",
    "Policy changes must be reflected in new contracts before finance applies them to creators.",
  ],
  lastUpdatedAt: iso("2026-03-10T09:00:00+08:00"),
};

export const mockCreatorAdminDashboard: CreatorAdminDashboardOverview = {
  kpis: [
    {
      key: "pendingApplications",
      label: "Pending Applications",
      value: mockCreatorApplications.filter((item) => item.status === "under_review" || item.status === "need_more_info").length,
      delta: 12,
      helper: "Creator applications still inside the review SLA window.",
      tone: "indigo",
    },
    {
      key: "activeCreators",
      label: "Active Creators",
      value: mockCreators.filter((item) => item.status === "active").length,
      delta: 8,
      helper: "Creators currently allowed to publish, settle, and manage new content.",
      tone: "emerald",
    },
    {
      key: "restrictedCreators",
      label: "Risk / Restricted",
      value: mockCreators.filter((item) => item.status === "restricted" || item.status === "suspended" || item.status === "banned").length,
      delta: -1,
      helper: "Accounts that need compliance, finance, or trust-and-safety attention.",
      tone: "rose",
    },
    {
      key: "bankReviewQueue",
      label: "Bank Review Queue",
      value: mockCreators.filter((item) => item.bankStatus === "pending_review" || item.bankStatus === "rejected").length,
      delta: 5,
      helper: "Payout account records that still block future settlements or payouts.",
      tone: "amber",
    },
  ],
  applicationFunnel: [
    { label: "Under Review", value: mockCreatorApplications.filter((item) => item.status === "under_review").length, helper: "Still within the 48-hour review SLA." },
    { label: "Need More Info", value: mockCreatorApplications.filter((item) => item.status === "need_more_info").length, helper: "Waiting for applicant resubmission." },
    { label: "Approved", value: mockCreatorApplications.filter((item) => item.status === "approved").length, helper: "Ready for contracts and content upload." },
    { label: "Rejected", value: mockCreatorApplications.filter((item) => item.status === "rejected").length, helper: "Closed with explicit rejection reasons." },
  ],
  slaAlerts: [
    {
      id: "sla_001",
      type: "application",
      label: "Moonlit Frame application",
      owner: "Noah Patel",
      dueAt: iso("2026-03-16T20:00:00+08:00"),
      status: "watch",
      helper: "Needs follow-up on resubmitted business license within the next 6 hours.",
    },
    {
      id: "sla_002",
      type: "application",
      label: "Amelia Brooks approval decision",
      owner: "Mia Chen",
      dueAt: iso("2026-03-16T12:00:00+08:00"),
      status: "breach",
      helper: "Review exceeded 48-hour target and should be resolved immediately.",
    },
    {
      id: "sla_003",
      type: "ticket",
      label: "North Harbor payout dispute ticket",
      owner: "Finance Ops",
      dueAt: iso("2026-03-16T18:30:00+08:00"),
      status: "watch",
      helper: "Ticket remains open and blocks the next settlement approval.",
    },
  ],
  creatorHighlights: creatorDetails
    .slice()
    .sort((left, right) => right.monthlyRevenueUsd - left.monthlyRevenueUsd)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.displayName,
      level: item.level,
      monthlyRevenueUsd: item.monthlyRevenueUsd,
      publishedTitles: item.publishedTitles,
      status: item.status,
    })),
  financeWatchlist: creatorDetails
    .filter((item) => item.bankStatus !== "verified" || item.status === "restricted")
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      creatorName: item.displayName,
      bankStatus: item.bankStatus,
      availableBalanceUsd: item.monthlyRevenueUsd * 0.42,
      payoutHoldReason:
        item.bankStatus === "pending_review"
          ? "Awaiting payout account approval"
          : item.bankStatus === "rejected"
            ? "Rejected bank details require resubmission"
            : "Risk hold from compliance workflow",
    })),
  recentActivity: [
    ...creatorApplicationDetails.flatMap((item) => item.reviewHistory.map((history) => ({
      id: history.id,
      at: history.at,
      actor: history.actor,
      action: history.action,
      summary: `${item.displayName}: ${history.note}`,
    }))),
    ...creatorDetails.flatMap((item) => item.auditTrail),
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 8),
};

export function getMockCreatorApplication(id: string) {
  return creatorApplicationDetails.find((item) => item.id === id) || null;
}

export function getMockCreator(id: string) {
  return creatorDetails.find((item) => item.id === id) || null;
}

export function getMockContentReview(dramaId: string) {
  return creatorContentReviewDetails.find((item) => item.dramaId === dramaId) || null;
}

export function getMockDmcaCase(id: string) {
  return mockDmcaCases.find((item) => item.id === id) || null;
}

export function getMockCreatorTicket(id: string) {
  return creatorTicketDetails.find((item) => item.id === id) || null;
}

export function getCreatorApplicationStatusMeta(status: CreatorApplicationStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "need_more_info":
      return { label: "Need More Info", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
    case "under_review":
    case "pending":
      return { label: "Under Review", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    default:
      return { label: "Draft", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
  }
}

export function getCreatorLifecycleMeta(status: CreatorAdminLifecycleStatus) {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "restricted":
      return { label: "Restricted", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
    case "suspended":
      return { label: "Suspended", className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20" };
    case "banned":
      return { label: "Banned", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "under_review":
      return { label: "Under Review", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    default:
      return { label: "Deactivated", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
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
      return { label: "Verified", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "pending_review":
      return { label: "Pending Review", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "frozen":
      return { label: "Frozen", className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20" };
    default:
      return { label: "Missing", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
  }
}

export function getCreatorContentReviewStatusMeta(status: CreatorAdminContentReviewStatus) {
  switch (status) {
    case "published":
      return { label: "Published", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "rejected":
      return { label: "Changes Requested", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "pending_review":
      return { label: "Pending Review", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    case "archived":
      return { label: "Archived", className: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20" };
    default:
      return { label: "Draft", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
  }
}

export function getCreatorSlaStatusMeta(status: CreatorAdminSlaStatus) {
  switch (status) {
    case "breach":
      return { label: "Breached", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "due_soon":
      return { label: "Due Soon", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
    case "resolved":
      return { label: "Resolved", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    default:
      return { label: "On Track", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
  }
}

export function getCreatorDmcaStatusMeta(status: CreatorAdminDmcaStatus) {
  switch (status) {
    case "takedown_executed":
      return { label: "Takedown", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "counter_notice":
      return { label: "Counter Notice", className: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20" };
    case "resolved":
      return { label: "Resolved", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "rejected":
      return { label: "Rejected", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
    case "under_review":
      return { label: "Under Review", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    default:
      return { label: "Open", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
  }
}

export function getCreatorSettlementStatusMeta(status: CreatorAdminSettlementStatus) {
  switch (status) {
    case "paid":
      return { label: "Paid", className: "bg-green-500/15 text-green-300 ring-1 ring-green-500/20" };
    case "confirmed":
      return { label: "Confirmed", className: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20" };
    case "generated":
      return { label: "Generated", className: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" };
    case "held":
      return { label: "Held", className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/20" };
    case "disputed":
      return { label: "Disputed", className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" };
    default:
      return { label: "Pending", className: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20" };
  }
}

export function formatAdminDate(value?: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", withTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
