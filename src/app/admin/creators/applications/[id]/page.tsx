"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  getCreatorApplicationStatusMeta,
  getCreatorRiskMeta,
  getMockCreatorApplication,
} from "../../_lib/mockData";
import type { CreatorAdminApplicationDetail } from "@/types/creator";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";
const emptyValue = "Not provided";

type ChecklistKey = CreatorAdminApplicationDetail["reviewChecklist"][number]["key"];

type ChecklistDetailSection = {
  title: string;
  description?: string;
  fields?: Array<{
    label: string;
    value: string;
    tone?: "default" | "good" | "warning";
  }>;
  links?: Array<{
    label: string;
    href?: string;
    meta?: string;
  }>;
};

type ChecklistDetail = {
  key: ChecklistKey;
  title: string;
  description: string;
  sections: ChecklistDetailSection[];
};

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function readValue(value: unknown, fallback = emptyValue) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export default function CreatorApplicationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = String(params?.id || "");
  const [data, setData] = useState<CreatorAdminApplicationDetail | null>(getMockCreatorApplication(id));
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"approved" | "rejected" | "need_more_info">("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeChecklistKey, setActiveChecklistKey] = useState<ChecklistKey>("identity_verified");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorApplication(id);
        const next = response?.data?.application || response?.data || response;
        if (!cancelled && next?.id) {
          setData(next);
        }
      } catch {
        if (!cancelled) setData(getMockCreatorApplication(id));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const statusMeta = useMemo(() => getCreatorApplicationStatusMeta(data?.status || "draft"), [data?.status]);
  const riskMeta = useMemo(() => getCreatorRiskMeta(data?.riskLevel || "low"), [data?.riskLevel]);
  const checklistDetails = useMemo<ChecklistDetail[]>(() => {
    if (!data) return [];

    const legalEntityName =
      data.draft.basicInformation.creatorType === "company"
        ? readValue(data.draft.basicInformation.companyName)
        : readValue(data.draft.basicInformation.legalName);
    const representativeName =
      data.draft.basicInformation.creatorType === "company"
        ? readValue(data.draft.basicInformation.representativeName)
        : readValue(data.draft.agreement.signatureName);

    return [
      {
        key: "identity_verified",
        title: "Identity verification evidence",
        description: "Review the creator identity record and the uploaded supporting files used during onboarding.",
        sections: [
          {
            title: "Submitted identity information",
            fields: [
              { label: "Verification type", value: readValue(data.draft.identityVerification.verificationType) },
              { label: "Legal entity", value: legalEntityName },
              { label: "Representative / signer", value: representativeName },
              { label: "Document number", value: readValue(data.draft.identityVerification.documentNumber) },
              { label: "Issue country", value: readValue(data.draft.identityVerification.issueCountry) },
              { label: "Tax / business ID", value: readValue(data.draft.identityVerification.taxIdOrBusinessId) },
            ],
          },
          {
            title: "Uploaded attachments",
            description: "Open the exact files submitted by the creator for manual inspection.",
            links: [
              {
                label: readValue(data.draft.identityVerification.frontDocumentFileName, "Front document"),
                href: data.draft.identityVerification.frontDocumentFileUrl,
                meta: "Front side / primary proof",
              },
              {
                label: readValue(data.draft.identityVerification.backDocumentFileName, "Back document not submitted"),
                href: data.draft.identityVerification.backDocumentFileUrl,
                meta: "Back side / secondary proof",
              },
            ],
          },
        ],
      },
      {
        key: "portfolio_verified",
        title: "Portfolio and content sample evidence",
        description: "Open the creator's public links and compare them against the submitted content profile.",
        sections: [
          {
            title: "Creative profile",
            fields: [
              { label: "Genres", value: data.draft.creativeInformation.genres.join(", ") || emptyValue },
              { label: "Primary language", value: readValue(data.draft.creativeInformation.primaryLanguage) },
              { label: "Display name", value: readValue(data.displayName) },
            ],
          },
          {
            title: "Portfolio links",
            description: "Each link opens in a new tab for verification.",
            links: data.draft.creativeInformation.portfolioLinks.length
              ? data.draft.creativeInformation.portfolioLinks.map((link, index) => ({
                  label: link,
                  href: link,
                  meta: `Portfolio link ${index + 1}`,
                }))
              : [{ label: "No portfolio links submitted", meta: "Missing evidence" }],
          },
          {
            title: "Creator bio",
            fields: [
              { label: "Bio", value: readValue(data.draft.creativeInformation.bio) },
            ],
          },
        ],
      },
      {
        key: "content_rights_verified",
        title: "Content-rights declaration evidence",
        description: "Validate the ownership declaration and the materials the creator attached to support originality.",
        sections: [
          {
            title: "Rights declaration",
            fields: [
              {
                label: "Authenticity confirmed",
                value: yesNo(data.draft.agreement.acceptedAuthenticity),
                tone: data.draft.agreement.acceptedAuthenticity ? "good" : "warning",
              },
              { label: "Applicant / entity", value: legalEntityName },
              { label: "Submitted genres", value: data.genres.join(", ") || emptyValue },
              { label: "Review note", value: readValue(data.notes) },
            ],
          },
          {
            title: "Reference materials",
            description: "Use the creator's portfolio and intro to cross-check whether the submitted catalog appears original.",
            links: [
              ...data.draft.creativeInformation.portfolioLinks.map((link, index) => ({
                label: link,
                href: link,
                meta: `Reference link ${index + 1}`,
              })),
              {
                label: readValue(data.draft.identityVerification.frontDocumentFileName, "Identity proof"),
                href: data.draft.identityVerification.frontDocumentFileUrl,
                meta: "Reference attachment",
              },
            ],
          },
        ],
      },
      {
        key: "agreement_verified",
        title: "Agreement acceptance evidence",
        description: "Check the accepted agreement version, signer identity, and completion flags before approval.",
        sections: [
          {
            title: "Agreement submission",
            fields: [
              {
                label: "Accepted terms",
                value: yesNo(data.draft.agreement.acceptedTerms),
                tone: data.draft.agreement.acceptedTerms ? "good" : "warning",
              },
              {
                label: "Reviewed full agreement",
                value: yesNo(data.draft.agreement.hasReviewedFullAgreement),
                tone: data.draft.agreement.hasReviewedFullAgreement ? "good" : "warning",
              },
              { label: "Agreement version", value: readValue(data.agreementVersion || data.draft.agreement.agreementVersion) },
              { label: "Signature name", value: readValue(data.draft.agreement.signatureName) },
              { label: "Signed at", value: formatAdminDate(data.signedAt, true) },
            ],
          },
        ],
      },
      {
        key: "risk_screening_passed",
        title: "Risk screening evidence",
        description: "Open the risk signals and onboarding gaps that need manual review before final approval.",
        sections: [
          {
            title: "Current risk signals",
            fields: [
              { label: "Risk level", value: riskMeta.label, tone: data.riskLevel === "low" ? "good" : "warning" },
              { label: "Application status", value: statusMeta.label },
              { label: "Assigned reviewer", value: readValue(data.assignedReviewer) },
              { label: "Country", value: readValue(data.country) },
            ],
          },
          {
            title: "Open review blockers",
            fields: (data.missingItems.length ? data.missingItems : [emptyValue]).map((item, index) => ({
              label: `Risk item ${index + 1}`,
              value: item,
              tone: item === emptyValue ? "default" : "warning",
            })),
          },
          {
            title: "Supporting reference",
            links: [
              {
                label: readValue(data.draft.identityVerification.frontDocumentFileName, "Identity proof"),
                href: data.draft.identityVerification.frontDocumentFileUrl,
                meta: "Re-open submitted proof",
              },
              ...data.draft.creativeInformation.portfolioLinks.slice(0, 2).map((link, index) => ({
                label: link,
                href: link,
                meta: `Portfolio reference ${index + 1}`,
              })),
            ],
          },
        ],
      },
    ];
  }, [data, riskMeta.label, statusMeta.label]);
  const activeChecklistDetail = useMemo(
    () => checklistDetails.find((item) => item.key === activeChecklistKey) || checklistDetails[0] || null,
    [activeChecklistKey, checklistDetails],
  );

  useEffect(() => {
    if (!data?.reviewChecklist.length) return;
    if (!data.reviewChecklist.some((item) => item.key === activeChecklistKey)) {
      setActiveChecklistKey(data.reviewChecklist[0].key);
    }
  }, [activeChecklistKey, data]);

  async function handleSubmitDecision() {
    if (!data) return;
    if (!note.trim()) {
      toast("A decision note is required for the review record.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorApplication(data.id, { decision, note });
    } catch {
      // Keep the mock flow functional even before the backend exists.
    } finally {
      setSubmitting(false);
    }

    setData((current) => current ? {
      ...current,
      status: decision,
      notes: note,
      reviewHistory: [
        {
          id: `local-${Date.now()}`,
          at: new Date().toISOString(),
          actor: "Current Admin",
          action:
            decision === "approved"
              ? "Application approved"
              : decision === "rejected"
                ? "Application rejected"
                : "More information requested",
          note,
        },
        ...current.reviewHistory,
      ],
    } : current);

    toast("Application review recorded.", "success");
    setNote("");
  }

  if (loading && !data) {
    return <div className="py-16 text-center text-sm text-gray-500">Loading application...</div>;
  }

  if (!data) {
    return (
      <div className="space-y-4 text-gray-200">
        <Link href="/admin/creators/applications" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>
        <div className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-8 text-center text-sm text-gray-400">Application not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/creators/applications" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Back to applications
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{data.displayName}</h1>
          <p className="mt-2 text-sm text-gray-400">{data.applicantName} · {data.creatorType === "company" ? "Company / Studio" : "Individual Creator"} · Submitted {formatAdminDate(data.submittedAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label} Risk</span>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Applicant snapshot</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Contact</p>
                <p className="mt-3 font-medium text-white">{data.draft.basicInformation.email}</p>
                <p className="mt-1 text-sm text-gray-400">{data.draft.basicInformation.phone || "No phone provided"}</p>
                <p className="mt-1 text-sm text-gray-500">{data.draft.basicInformation.country}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Agreement</p>
                <p className="mt-3 font-medium text-white">{data.agreementVersion}</p>
                <p className="mt-1 text-sm text-gray-400">Signed by {data.draft.agreement.signatureName}</p>
                <p className="mt-1 text-sm text-gray-500">{formatAdminDate(data.signedAt, true)}</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Bio / studio introduction</p>
              <p className="mt-3 text-sm leading-7 text-gray-300">{data.draft.creativeInformation.bio}</p>
            </div>
          </article>

          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Review checklist</h2>
                <p className="text-sm text-gray-400">The five-item admin checklist defined in the Creator spec.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                {data.reviewChecklist.map((item) => {
                  const isActive = item.key === activeChecklistKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveChecklistKey(item.key)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isActive
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-gray-700/50 bg-[#0f0f17] hover:border-gray-600 hover:bg-[#161621]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{item.label}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.passed ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}>
                          {item.passed ? "Passed" : "Attention"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{item.note}</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-300">
                        Open submitted evidence
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                {activeChecklistDetail ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Evidence viewer</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{activeChecklistDetail.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{activeChecklistDetail.description}</p>
                    </div>

                    {activeChecklistDetail.sections.map((section) => (
                      <div key={section.title} className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                        <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                        {section.description ? <p className="mt-2 text-sm leading-6 text-gray-400">{section.description}</p> : null}

                        {section.fields?.length ? (
                          <div className="mt-4 space-y-3">
                            {section.fields.map((field) => (
                              <div key={`${section.title}-${field.label}`} className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-[#0c0c13] px-3 py-2.5">
                                <span className="text-xs uppercase tracking-[0.12em] text-gray-500">{field.label}</span>
                                <span
                                  className={`max-w-[70%] text-right text-sm ${
                                    field.tone === "good"
                                      ? "text-green-300"
                                      : field.tone === "warning"
                                        ? "text-amber-300"
                                        : "text-gray-200"
                                  }`}
                                >
                                  {field.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {section.links?.length ? (
                          <div className="mt-4 space-y-3">
                            {section.links.map((link) => (
                              <div key={`${section.title}-${link.label}`} className="rounded-lg bg-[#0c0c13] px-3 py-3">
                                {link.href ? (
                                  <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200"
                                  >
                                    {link.label}
                                    <ArrowUpRight className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-gray-300">{link.label}</p>
                                )}
                                {link.meta ? <p className="mt-1 text-xs text-gray-500">{link.meta}</p> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No checklist evidence available.</div>
                )}
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Submission materials</h2>
                <p className="text-sm text-gray-400">Identity, portfolio, and agreement evidence submitted by the creator.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Portfolio links</p>
                <div className="mt-3 space-y-2">
                  {data.draft.creativeInformation.portfolioLinks.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm text-indigo-300 hover:text-indigo-200">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Identity files</p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>Front: {data.draft.identityVerification.frontDocumentFileName}</p>
                  <p>Back: {data.draft.identityVerification.backDocumentFileName || "Not required"}</p>
                  <p>ID / Tax: {data.draft.identityVerification.taxIdOrBusinessId || "Optional"}</p>
                </div>
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Review history</h2>
            <div className="mt-5 space-y-3">
              {data.reviewHistory.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.action}</p>
                    <span className="text-xs text-gray-500">{formatAdminDate(item.at, true)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{item.actor}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{item.note}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Reviewer action</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Decision</label>
                <select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
                  <option value="approved">Approve application</option>
                  <option value="need_more_info">Request more information</option>
                  <option value="rejected">Reject application</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Review note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Explain the approval, rejection reason, or resubmission request."
                  className="min-h-[140px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleSubmitDecision}
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save review decision"}
              </button>
            </div>
          </article>

          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Queue metadata</h2>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Application ID</span>
                <span>{data.id}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Assigned reviewer</span>
                <span>{data.assignedReviewer || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Primary language</span>
                <span>{data.primaryLanguage}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Genres</span>
                <span>{data.genres.join(", ")}</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
