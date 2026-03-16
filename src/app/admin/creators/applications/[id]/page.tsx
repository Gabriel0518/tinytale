"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
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

export default function CreatorApplicationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = String(params?.id || "");
  const [data, setData] = useState<CreatorAdminApplicationDetail | null>(getMockCreatorApplication(id));
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"approved" | "rejected" | "need_more_info">("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            <div className="mt-5 space-y-3">
              {data.reviewChecklist.map((item) => (
                <div key={item.key} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.label}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.passed ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}>
                      {item.passed ? "Passed" : "Attention"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{item.note}</p>
                </div>
              ))}
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
