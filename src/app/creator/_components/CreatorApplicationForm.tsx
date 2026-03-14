"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorApplicationDraft, CreatorIdentityType, CreatorVerificationType } from "@/types/creator";

const STORAGE_KEY = "creator_application_draft_v3_2";

const STEP_CONFIG = [
  { step: 1, title: "Basic Information", route: "/creator/apply" },
  { step: 2, title: "Creative Info", route: "/creator/apply/creative" },
  { step: 3, title: "Verify Identity", route: "/creator/apply/identity" },
  { step: 4, title: "Terms & Agreement", route: "/creator/apply/agreement" },
  { step: 5, title: "Final Review", route: "/creator/apply/review" },
] as const;

const COUNTRY_OPTIONS = ["United States", "Canada", "United Kingdom", "Australia", "Singapore", "Japan", "Other"];
const CATEGORY_OPTIONS = ["Short Drama", "Romance", "Fantasy", "Thriller", "Comedy", "Slice of Life", "Other"];
const LANGUAGE_OPTIONS = ["English", "Chinese", "Spanish", "Portuguese", "Japanese", "Korean", "Hindi", "Other"];
const PLATFORM_OPTIONS = ["TikTok", "YouTube", "Instagram", "Webtoon", "Wattpad", "X", "Other"];

const VERIFY_OPTIONS: Array<{ value: CreatorVerificationType; title: string; description: string }> = [
  { value: "government_id", title: "Government ID", description: "National ID card or driver license." },
  { value: "passport", title: "Passport", description: "Passport identity and nationality page." },
  { value: "business_license", title: "Business License", description: "For agency or studio applicants." },
];

const DEFAULT_DRAFT: CreatorApplicationDraft = {
  basicInformation: {
    identityType: "individual",
    fullName: "",
    workEmail: "",
    country: "",
    portfolioLink: "",
  },
  creativeInformation: {
    contentCategory: "",
    primaryLanguage: "",
    primaryPlatforms: [],
    socialLink: "",
    shortBio: "",
  },
  identityVerification: {
    verificationType: "government_id",
    documentNumber: "",
    issueCountry: "",
    taxIdOrBusinessId: "",
    documentFileName: "",
  },
  agreement: {
    acceptedTerms: false,
    acceptedAuthenticity: false,
    signatureName: "",
  },
  lastCompletedStep: 0,
  updatedAt: "",
};

function normalizeDraft(raw: any): CreatorApplicationDraft {
  return {
    ...DEFAULT_DRAFT,
    ...raw,
    basicInformation: { ...DEFAULT_DRAFT.basicInformation, ...(raw?.basicInformation || {}) },
    creativeInformation: { ...DEFAULT_DRAFT.creativeInformation, ...(raw?.creativeInformation || {}) },
    identityVerification: { ...DEFAULT_DRAFT.identityVerification, ...(raw?.identityVerification || {}) },
    agreement: { ...DEFAULT_DRAFT.agreement, ...(raw?.agreement || {}) },
  };
}

function validateStep(step: number, draft: CreatorApplicationDraft): string[] {
  const errors: string[] = [];

  if (step === 1) {
    if (!draft.basicInformation.fullName.trim()) errors.push("Legal full name is required.");
    if (!draft.basicInformation.workEmail.trim()) errors.push("Work email is required.");
    if (!draft.basicInformation.country.trim()) errors.push("Country is required.");
    if (!draft.basicInformation.portfolioLink.trim()) errors.push("Primary portfolio link is required.");
  }

  if (step === 2) {
    if (!draft.creativeInformation.contentCategory.trim()) errors.push("Content category is required.");
    if (!draft.creativeInformation.primaryLanguage.trim()) errors.push("Primary language is required.");
    if (!draft.creativeInformation.primaryPlatforms.length) errors.push("Select at least one primary platform.");
    if (!draft.creativeInformation.socialLink.trim()) errors.push("Main portfolio/social link is required.");
    if (!draft.creativeInformation.shortBio.trim()) errors.push("Short bio is required.");
  }

  if (step === 3) {
    if (!draft.identityVerification.documentNumber.trim()) errors.push("Document number is required.");
    if (!draft.identityVerification.issueCountry.trim()) errors.push("Document issue country is required.");
    if (!draft.identityVerification.documentFileName.trim()) errors.push("Please upload one verification document.");
  }

  if (step === 4) {
    if (!draft.agreement.acceptedTerms) errors.push("You must accept TinyTale Creator Terms.");
    if (!draft.agreement.acceptedAuthenticity) errors.push("You must confirm the submitted information is authentic.");
    if (!draft.agreement.signatureName.trim()) errors.push("Signature name is required.");
  }

  return errors;
}

function resolveDraftFromApi(payload: any): CreatorApplicationDraft | null {
  const candidate = payload?.data?.draft || payload?.data?.application || payload?.data;
  if (!candidate || typeof candidate !== "object") return null;
  if (!candidate.basicInformation && !candidate.creativeInformation && !candidate.identityVerification) return null;
  return normalizeDraft(candidate);
}

interface CreatorApplicationFormProps {
  step: 1 | 2 | 3 | 4 | 5;
}

export default function CreatorApplicationForm({ step }: CreatorApplicationFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { token, user } = useAuth();
  const [draft, setDraft] = useState<CreatorApplicationDraft>(DEFAULT_DRAFT);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const progressPercent = Math.round((step / STEP_CONFIG.length) * 100);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let next = DEFAULT_DRAFT;
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            next = normalizeDraft(JSON.parse(raw));
          } catch {
            next = DEFAULT_DRAFT;
          }
        }
      }

      if (token) {
        try {
          const response = await creatorApi.getApplicationDraft(token);
          const remote = resolveDraftFromApi(response);
          if (remote) next = remote;
        } catch {
          // Keep local draft as fallback.
        }
      }

      if (!cancelled) {
        setDraft(next);
        setReady(true);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const maxAccessibleStep = useMemo(() => Math.max(1, draft.lastCompletedStep + 1), [draft.lastCompletedStep]);

  function persistDraft(next: CreatorApplicationDraft) {
    setDraft(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    if (token) {
      creatorApi.saveApplicationDraft(token, next).catch(() => {});
    }
  }

  function updateDraft(updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) {
    const next = updater(draft);
    persistDraft({ ...next, updatedAt: new Date().toISOString() });
  }

  function pushStep(targetStep: number) {
    const target = STEP_CONFIG[targetStep - 1];
    if (!target) return;
    router.push(localizePath(target.route, locale));
  }

  function handlePrevious() {
    if (step <= 1) return;
    pushStep(step - 1);
  }

  function handleNext() {
    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    if (stepErrors.length > 0) return;

    const nextDraft = {
      ...draft,
      lastCompletedStep: Math.max(draft.lastCompletedStep, step),
      updatedAt: new Date().toISOString(),
    };
    persistDraft(nextDraft);

    if (step < 5) {
      pushStep(step + 1);
    }
  }

  async function handleSubmit() {
    const finalErrors = [1, 2, 3, 4].flatMap((s) => validateStep(s, draft));
    setErrors(finalErrors);
    if (finalErrors.length > 0) return;

    if (!token) {
      router.push(localizePath("/auth/login", locale));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const finalDraft = {
        ...draft,
        lastCompletedStep: 5,
        updatedAt: new Date().toISOString(),
      };
      persistDraft(finalDraft);
      await creatorApi.submitApplication(token, finalDraft);

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      router.push(localizePath("/creator/pending", locale));
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to submit your application. Please try again.");
      router.push(`${localizePath("/creator/apply/status", locale)}?result=failed`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#f8fafc]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f3f4f6] px-4 py-8 md:px-8">
      <section className="mx-auto w-full max-w-[960px] rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="border-b border-[#e2e8f0] px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a] md:text-[30px]">
                Step {step} of 5: {STEP_CONFIG[step - 1].title}
              </h1>
              <p className="mt-2 text-sm text-[#64748b] md:text-base">
                Complete your Creator application. Progress is saved automatically.
              </p>
            </div>
            <div className="rounded-xl bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8]">
              {progressPercent}% Complete
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
            <div className="h-full rounded-full bg-[#2563eb] transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
            {STEP_CONFIG.map((item) => {
              const isActive = item.step === step;
              const canJump = item.step <= maxAccessibleStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  disabled={!canJump}
                  onClick={() => {
                    if (!canJump) return;
                    pushStep(item.step);
                  }}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    isActive ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#e2e8f0] text-[#475569]",
                    !canJump ? "cursor-not-allowed opacity-50" : "hover:border-[#94a3b8]",
                  ].join(" ")}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-8">
          {errors.length > 0 ? (
            <div className="mb-6 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
              <p className="mb-2 font-semibold">Please fix these issues before continuing:</p>
              <ul className="list-disc space-y-1 pl-5">
                {errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 1 ? (
            <StepBasic draft={draft} onChange={updateDraft} />
          ) : null}
          {step === 2 ? (
            <StepCreative draft={draft} onChange={updateDraft} />
          ) : null}
          {step === 3 ? (
            <StepIdentity draft={draft} onChange={updateDraft} />
          ) : null}
          {step === 4 ? (
            <StepAgreement draft={draft} onChange={updateDraft} />
          ) : null}
          {step === 5 ? (
            <StepReview draft={draft} userEmail={user?.email || ""} />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(24,119,242,0.8)] transition hover:bg-[#1668d1]"
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(24,119,242,0.8)] transition hover:bg-[#1668d1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Application"}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>

        {submitError ? (
          <div className="px-6 pb-6 text-sm text-[#b91c1c] md:px-8">
            {submitError}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-[#334155]">{children}</label>;
}

function StepBasic({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Identity Type</FieldLabel>
        <div className="grid grid-cols-2 gap-3 max-w-[420px]">
          {(["individual", "agency"] as CreatorIdentityType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  basicInformation: { ...current.basicInformation, identityType: option },
                }))
              }
              className={[
                "rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition",
                draft.basicInformation.identityType === option
                  ? "border-[#1877F2] bg-[#eff6ff] text-[#1d4ed8]"
                  : "border-[#e2e8f0] text-[#475569] hover:border-[#94a3b8]",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <InputField
        label="Legal Full Name"
        value={draft.basicInformation.fullName}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, fullName: value },
          }))
        }
      />

      <InputField
        label="Work Email Address"
        type="email"
        value={draft.basicInformation.workEmail}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, workEmail: value },
          }))
        }
      />

      <SelectField
        label="Country of Residence"
        value={draft.basicInformation.country}
        options={COUNTRY_OPTIONS}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, country: value },
          }))
        }
      />

      <InputField
        label="Primary Portfolio Link"
        value={draft.basicInformation.portfolioLink}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, portfolioLink: value },
          }))
        }
      />
    </div>
  );
}

function StepCreative({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SelectField
          label="Content Category"
          value={draft.creativeInformation.contentCategory}
          options={CATEGORY_OPTIONS}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, contentCategory: value },
            }))
          }
        />
        <SelectField
          label="Primary Language"
          value={draft.creativeInformation.primaryLanguage}
          options={LANGUAGE_OPTIONS}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, primaryLanguage: value },
            }))
          }
        />
      </div>

      <div>
        <FieldLabel>Primary Platforms (Select all that apply)</FieldLabel>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {PLATFORM_OPTIONS.map((platform) => {
            const checked = draft.creativeInformation.primaryPlatforms.includes(platform);
            return (
              <label
                key={platform}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#334155]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    onChange((current) => {
                      const source = current.creativeInformation.primaryPlatforms;
                      const nextPlatforms = event.target.checked
                        ? [...source, platform]
                        : source.filter((item) => item !== platform);
                      return {
                        ...current,
                        creativeInformation: { ...current.creativeInformation, primaryPlatforms: nextPlatforms },
                      };
                    })
                  }
                />
                {platform}
              </label>
            );
          })}
        </div>
      </div>

      <InputField
        label="Main Portfolio / Social Link"
        value={draft.creativeInformation.socialLink}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            creativeInformation: { ...current.creativeInformation, socialLink: value },
          }))
        }
      />

      <div>
        <FieldLabel>Short Bio</FieldLabel>
        <textarea
          rows={5}
          maxLength={500}
          value={draft.creativeInformation.shortBio}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, shortBio: event.target.value },
            }))
          }
          className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#1877F2] focus:ring-2 focus:ring-[#93c5fd]"
          placeholder="Tell us about your creative journey and what makes your stories unique..."
        />
        <p className="mt-2 text-xs text-[#64748b]">{draft.creativeInformation.shortBio.length}/500</p>
      </div>
    </div>
  );
}

function StepIdentity({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Verification Type</FieldLabel>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {VERIFY_OPTIONS.map((option) => {
            const active = draft.identityVerification.verificationType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    identityVerification: { ...current.identityVerification, verificationType: option.value },
                  }))
                }
                className={[
                  "rounded-xl border px-4 py-3 text-left transition",
                  active ? "border-[#1877F2] bg-[#eff6ff]" : "border-[#e2e8f0] hover:border-[#94a3b8]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[#0f172a]">{option.title}</p>
                <p className="mt-1 text-xs text-[#64748b]">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <InputField
          label="Document Number"
          value={draft.identityVerification.documentNumber}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              identityVerification: { ...current.identityVerification, documentNumber: value },
            }))
          }
        />
        <SelectField
          label="Document Issue Country"
          value={draft.identityVerification.issueCountry}
          options={COUNTRY_OPTIONS}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              identityVerification: { ...current.identityVerification, issueCountry: value },
            }))
          }
        />
      </div>

      <InputField
        label="Tax ID / Business ID (optional)"
        value={draft.identityVerification.taxIdOrBusinessId}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            identityVerification: { ...current.identityVerification, taxIdOrBusinessId: value },
          }))
        }
      />

      <div>
        <FieldLabel>Upload Verification Document</FieldLabel>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#94a3b8] bg-[#f8fafc] px-4 py-3 text-sm">
          <span className="text-[#334155]">
            {draft.identityVerification.documentFileName || "Choose file (PDF/JPG/PNG, max 10MB)"}
          </span>
          <span className="rounded-lg border border-[#cbd5e1] px-3 py-1 text-xs font-semibold text-[#475569]">Upload</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              onChange((current) => ({
                ...current,
                identityVerification: {
                  ...current.identityVerification,
                  documentFileName: file?.name || "",
                },
              }));
            }}
          />
        </label>
        <ul className="mt-3 space-y-1 text-xs text-[#64748b]">
          <li>1. Document must match the name entered in Basic Information.</li>
          <li>2. Images must be clear and not cropped.</li>
          <li>3. Verification is usually completed within 3-5 business days.</li>
        </ul>
      </div>
    </div>
  );
}

function StepAgreement({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5">
        <h3 className="text-lg font-semibold text-[#0f172a]">Creator Terms & Agreement</h3>
        <p className="mt-2 text-sm leading-6 text-[#475569]">
          By joining TinyTale Creator Program, you confirm that submitted works are original and comply with platform content, copyright, and community policies.
        </p>
        <div className="mt-4 space-y-2 text-sm text-[#334155]">
          <p>• Revenue settlement follows monthly cycle and creator policy.</p>
          <p>• Fraud or copyright violations will result in rejection or account suspension.</p>
          <p>• TinyTale may request additional verification material when required.</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] px-4 py-3">
        <input
          type="checkbox"
          checked={draft.agreement.acceptedTerms}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, acceptedTerms: event.target.checked },
            }))
          }
        />
        <span className="text-sm text-[#334155]">I have read and agree to TinyTale Creator Terms.</span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] px-4 py-3">
        <input
          type="checkbox"
          checked={draft.agreement.acceptedAuthenticity}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, acceptedAuthenticity: event.target.checked },
            }))
          }
        />
        <span className="text-sm text-[#334155]">I confirm all provided information and documents are authentic.</span>
      </label>

      <InputField
        label="Signature Name (legal full name)"
        value={draft.agreement.signatureName}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            agreement: { ...current.agreement, signatureName: value },
          }))
        }
      />
    </div>
  );
}

function StepReview({ draft, userEmail }: { draft: CreatorApplicationDraft; userEmail: string }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
        <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm text-[#334155]">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Basic Information">
        <p><span className="text-[#64748b]">Identity Type:</span> {draft.basicInformation.identityType}</p>
        <p><span className="text-[#64748b]">Full Name:</span> {draft.basicInformation.fullName || "-"}</p>
        <p><span className="text-[#64748b]">Work Email:</span> {draft.basicInformation.workEmail || userEmail || "-"}</p>
        <p><span className="text-[#64748b]">Country:</span> {draft.basicInformation.country || "-"}</p>
        <p><span className="text-[#64748b]">Portfolio:</span> {draft.basicInformation.portfolioLink || "-"}</p>
      </Section>

      <Section title="Creative Information">
        <p><span className="text-[#64748b]">Category:</span> {draft.creativeInformation.contentCategory || "-"}</p>
        <p><span className="text-[#64748b]">Language:</span> {draft.creativeInformation.primaryLanguage || "-"}</p>
        <p><span className="text-[#64748b]">Platforms:</span> {draft.creativeInformation.primaryPlatforms.join(", ") || "-"}</p>
        <p><span className="text-[#64748b]">Main Link:</span> {draft.creativeInformation.socialLink || "-"}</p>
        <p><span className="text-[#64748b]">Bio:</span> {draft.creativeInformation.shortBio || "-"}</p>
      </Section>

      <Section title="Identity Verification">
        <p><span className="text-[#64748b]">Verification Type:</span> {draft.identityVerification.verificationType}</p>
        <p><span className="text-[#64748b]">Document Number:</span> {draft.identityVerification.documentNumber || "-"}</p>
        <p><span className="text-[#64748b]">Issue Country:</span> {draft.identityVerification.issueCountry || "-"}</p>
        <p><span className="text-[#64748b]">Uploaded File:</span> {draft.identityVerification.documentFileName || "-"}</p>
      </Section>

      <div className="rounded-2xl border border-[#bfdbfe] bg-[#f8fbff] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
          <ShieldCheck className="h-4 w-4" />
          Ready to Submit
        </p>
        <p className="mt-2 text-sm text-[#334155]">
          After submission, your application will enter manual review. Review usually takes 3-5 business days.
        </p>
      </div>

      {!draft.agreement.acceptedTerms || !draft.agreement.acceptedAuthenticity ? (
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          <p className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4" /> Agreement is incomplete</p>
          <p className="mt-1">Please go back to Step 4 and complete both agreement checkboxes before submission.</p>
        </div>
      ) : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#1877F2] focus:ring-2 focus:ring-[#93c5fd]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#1877F2] focus:ring-2 focus:ring-[#93c5fd]"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
