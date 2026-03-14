"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  ShieldCheck,
  Upload,
  Link as LinkIcon,
  Globe,
  CreditCard,
  FileText,
  Car,
  User,
  Pencil,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorApplicationDraft, CreatorIdentityType, CreatorVerificationType } from "@/types/creator";

const STORAGE_KEY = "creator_application_draft_v3_2";

const STEP_CONFIG = [
  { step: 1, title: "Basic Info", route: "/creator/apply" },
  { step: 2, title: "Creative Info", route: "/creator/apply/creative" },
  { step: 3, title: "Identity", route: "/creator/apply/identity" },
  { step: 4, title: "Agreement", route: "/creator/apply/agreement" },
  { step: 5, title: "Submission", route: "/creator/apply/review" },
] as const;

const COUNTRY_OPTIONS = ["United States", "Canada", "United Kingdom", "Australia", "Singapore", "Japan", "Other"];
const CATEGORY_OPTIONS = ["Short Drama", "Romance", "Fantasy", "Thriller", "Comedy", "Slice of Life", "Other"];
const LANGUAGE_OPTIONS = ["English", "Chinese", "Spanish", "Portuguese", "Japanese", "Korean", "Hindi", "Other"];
const PLATFORM_OPTIONS = ["TikTok", "YouTube", "Instagram", "Webtoon", "Wattpad", "X", "Other"];

const VERIFY_OPTIONS: Array<{
  value: CreatorVerificationType;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "government_id",
    title: "ID Card",
    description: "National ID card",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    value: "passport",
    title: "Passport",
    description: "International passport",
    icon: <Globe className="h-6 w-6" />,
  },
  {
    value: "business_license",
    title: "Driver's License",
    description: "Valid driver's license",
    icon: <Car className="h-6 w-6" />,
  },
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
    if (!draft.identityVerification.documentFileName.trim()) errors.push("Please upload a verification document.");
  }

  if (step === 4) {
    if (!draft.agreement.acceptedTerms) errors.push("You must accept TinyTale Creator Terms.");
    if (!draft.agreement.acceptedAuthenticity) errors.push("You must confirm the Content Monetization Terms.");
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

  function handleSaveDraft() {
    persistDraft({ ...draft, updatedAt: new Date().toISOString() });
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#f8fafc]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1876f2] border-t-transparent" />
      </div>
    );
  }

  const stepTitles: Record<number, { heading: string; sub: string }> = {
    1: { heading: "Basic Information", sub: "Tell us who you are and where you're based." },
    2: { heading: "Creative Information", sub: "Share your creative background and expertise." },
    3: { heading: "Verify your identity", sub: "please provide a valid government-issued ID." },
    4: { heading: "Review & Sign Agreement", sub: "Finalize your creator status." },
    5: { heading: "Final Review", sub: "Please double-check all information before submitting your application." },
  };

  const currentHeading = stepTitles[step];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-[860px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#0f172a] md:text-[26px]">
                Step {step} of 5: {currentHeading.heading}
              </h1>
              <p className="mt-1 text-sm text-[#64748b]">{currentHeading.sub}</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1876f2]">
              {progressPercent}% Complete
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div
              className="h-full rounded-full bg-[#1876f2] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Tab navigation */}
          <div className="mt-5 flex border-b border-[#e2e8f0]">
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
                    "relative px-4 pb-3 pt-1 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[#1876f2] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-[#1876f2]"
                      : "text-[#64748b]",
                    !canJump ? "cursor-not-allowed opacity-40" : "hover:text-[#334155]",
                  ].join(" ")}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-sm text-[#b91c1c]">
            <p className="mb-2 font-semibold">Please fix these issues before continuing:</p>
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step content */}
        {step === 1 && <StepBasic draft={draft} onChange={updateDraft} />}
        {step === 2 && <StepCreative draft={draft} onChange={updateDraft} />}
        {step === 3 && <StepIdentity draft={draft} onChange={updateDraft} />}
        {step === 4 && <StepAgreement draft={draft} onChange={updateDraft} />}
        {step === 5 && (
          <StepReview
            draft={draft}
            userEmail={user?.email || ""}
            onEdit={pushStep}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            submitting={submitting}
          />
        )}

        {/* Footer navigation */}
        {step < 5 && step !== 4 ? (
          <div className="mt-8 flex items-center justify-between">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="text-sm font-medium text-[#64748b] transition hover:text-[#334155]"
              >
                Save Draft
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
              >
                {step === 3 ? "Back" : <><ArrowLeft className="h-4 w-4" /> Back to Step {step - 1}</>}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-[#1876f2] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,118,242,0.4)] transition hover:bg-[#1565d8]"
            >
              {step === 3 ? (
                <>Verify Identity <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Next Step <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        ) : step === 4 ? (
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition hover:text-[#334155]"
            >
              <ArrowLeft className="h-4 w-4" /> Previous Step
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="text-sm font-semibold text-[#334155] transition hover:text-[#0f172a]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#1876f2] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,118,242,0.4)] transition hover:bg-[#1565d8]"
              >
                Submit Application
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Encryption notice for Step 3 */}
        {step === 3 && (
          <p className="mt-6 text-center text-xs text-[#94a3b8]">
            Your data is protected by 256-bit encryption and will only be used for verification purposes.
          </p>
        )}

        {/* Copyright footer */}
        <div className="mt-10 border-t border-[#e2e8f0] pt-6 text-center text-xs text-[#94a3b8]">
          <p>&copy; {new Date().getFullYear()} TinyTale Creator Studio. All rights reserved.</p>
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shared helpers
   ────────────────────────────────────────────── */

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#334155]">
      {children}
      {optional && <span className="ml-1 font-normal text-[#94a3b8]">(optional)</span>}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  prefix,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={[
            "w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white focus:ring-2 focus:ring-[#1876f2]/20",
            prefix ? "pl-10" : "",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#1876f2] focus:bg-white focus:ring-2 focus:ring-[#1876f2]/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 1 — Basic Information
   ────────────────────────────────────────────── */

function StepBasic({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-6">
        {/* Identity Type toggle */}
        <div>
          <FieldLabel>Identity Type</FieldLabel>
          <div className="inline-flex rounded-xl bg-[#f1f5f9] p-1">
            {(["individual", "agency"] as CreatorIdentityType[]).map((option) => {
              const isActive = draft.basicInformation.identityType === option;
              const label = option === "individual" ? "Personal" : "Company";
              return (
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
                    "rounded-lg px-6 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-[#0f172a] shadow-sm"
                      : "text-[#64748b] hover:text-[#334155]",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Name */}
        <InputField
          label="Legal Full Name"
          placeholder="Johnathan Doe"
          value={draft.basicInformation.fullName}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: { ...current.basicInformation, fullName: value },
            }))
          }
        />

        {/* Work Email */}
        <InputField
          label="Work Email Address"
          type="email"
          placeholder="john@example.com"
          value={draft.basicInformation.workEmail}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: { ...current.basicInformation, workEmail: value },
            }))
          }
        />

        {/* Country + Portfolio in 2-col */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            placeholder="https://portfolio.com/user"
            value={draft.basicInformation.portfolioLink}
            prefix={<LinkIcon className="h-4 w-4" />}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, portfolioLink: value },
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 2 — Creative Information
   ────────────────────────────────────────────── */

function StepCreative({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-1 text-xl font-bold text-[#0f172a] md:text-2xl">Creative Information</h2>
      <p className="mb-6 text-sm text-[#64748b]">Tell us about your creative work and content focus.</p>

      <div className="space-y-6">
        {/* Category + Language 2-col */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

        {/* Platform pills */}
        <div>
          <FieldLabel>Primary Platforms</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((platform) => {
              const checked = draft.creativeInformation.primaryPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    onChange((current) => {
                      const source = current.creativeInformation.primaryPlatforms;
                      const nextPlatforms = checked
                        ? source.filter((item) => item !== platform)
                        : [...source, platform];
                      return {
                        ...current,
                        creativeInformation: { ...current.creativeInformation, primaryPlatforms: nextPlatforms },
                      };
                    })
                  }
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    checked
                      ? "border-[#1876f2] bg-[#1876f2] text-white"
                      : "border-[#e2e8f0] bg-white text-[#334155] hover:border-[#94a3b8]",
                  ].join(" ")}
                >
                  {checked && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                  {platform}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social link with icon */}
        <InputField
          label="Main Portfolio / Social Link"
          placeholder="https://your-profile.com"
          value={draft.creativeInformation.socialLink}
          prefix={<LinkIcon className="h-4 w-4" />}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, socialLink: value },
            }))
          }
        />

        {/* Short Bio */}
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
            className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white focus:ring-2 focus:ring-[#1876f2]/20"
            placeholder="Tell us about your creative journey and what makes your stories unique..."
          />
          <p className="mt-1.5 text-right text-xs text-[#94a3b8]">
            {draft.creativeInformation.shortBio.length} / 500 characters
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 3 — Identity Verification
   ────────────────────────────────────────────── */

function StepIdentity({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const docLabel =
    draft.identityVerification.verificationType === "government_id"
      ? "ID Card"
      : draft.identityVerification.verificationType === "passport"
        ? "Passport"
        : "Driver's License";

  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-1 text-xl font-bold text-[#0f172a] md:text-2xl">Verify your identity</h2>
      <p className="mb-8 text-sm text-[#64748b]">
        To ensure a safe community and secure payments, please provide a valid government-issued ID.
      </p>

      <div className="space-y-8">
        {/* Document type cards */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Select Document Type</p>
          <div className="grid grid-cols-3 gap-3">
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
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition",
                    active
                      ? "border-[#1876f2] bg-[#f0f7ff]"
                      : "border-[#e2e8f0] bg-white hover:border-[#94a3b8]",
                  ].join(" ")}
                >
                  <span className={active ? "text-[#1876f2]" : "text-[#94a3b8]"}>{option.icon}</span>
                  <span className={["text-sm font-medium", active ? "text-[#1876f2]" : "text-[#334155]"].join(" ")}>
                    {option.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload zones — front and back */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Front */}
          <div>
            <p className="mb-2 text-sm font-medium text-[#334155]">Front of {docLabel}</p>
            <label
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d1d5db] bg-[#f8fafc] py-8 transition hover:border-[#1876f2] hover:bg-[#f0f7ff]"
              onClick={() => frontInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-[#94a3b8]" />
              <p className="text-sm text-[#64748b]">
                Drag & drop or{" "}
                <span className="font-medium text-[#1876f2]">browse</span>
              </p>
              <p className="text-xs text-[#94a3b8]">JPG, PNG up to 5MB</p>
              <input
                ref={frontInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onChange((current) => ({
                      ...current,
                      identityVerification: {
                        ...current.identityVerification,
                        documentFileName: file.name,
                      },
                    }));
                  }
                }}
              />
            </label>
            {draft.identityVerification.documentFileName && (
              <p className="mt-2 text-xs text-[#22c55e] font-medium">
                {draft.identityVerification.documentFileName}
              </p>
            )}
          </div>

          {/* Back */}
          <div>
            <p className="mb-2 text-sm font-medium text-[#334155]">Back of {docLabel}</p>
            <label
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d1d5db] bg-[#f8fafc] py-8 transition hover:border-[#1876f2] hover:bg-[#f0f7ff]"
              onClick={() => backInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-[#94a3b8]" />
              <p className="text-sm text-[#64748b]">
                Drag & drop or{" "}
                <span className="font-medium text-[#1876f2]">browse</span>
              </p>
              <p className="text-xs text-[#94a3b8]">JPG, PNG up to 5MB</p>
              <input
                ref={backInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Photo requirements */}
        <div className="rounded-2xl bg-[#f8fafc] p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
            <ShieldCheck className="h-4 w-4 text-[#64748b]" />
            Photo Requirements
          </p>
          <ul className="space-y-2">
            {[
              "All details on the ID must be clearly readable",
              "No glare or shadows covering the information",
              "The document must be valid and not expired",
              "Upload original photos, not scans or photocopies",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#475569]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 4 — Terms & Agreement
   ────────────────────────────────────────────── */

function StepAgreement({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Document viewer */}
      <div className="rounded-3xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#64748b]" />
            <span className="text-sm font-semibold text-[#0f172a]">Terms of Service & Creator Agreement</span>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-6 py-6">
          <div className="prose prose-sm max-w-none text-[#334155]">
            <h3 className="text-base font-bold text-[#0f172a]">1. Introduction</h3>
            <p className="mt-2 leading-relaxed">
              Welcome to the TinyTale Creator Program. This Agreement sets forth the terms and conditions that
              govern your participation in the platform as a content creator. By signing this document, you
              acknowledge that you have read, understood, and agreed to be bound by these terms.
            </p>

            <h3 className="mt-6 text-base font-bold text-[#0f172a]">2. Ownership of Content</h3>
            <p className="mt-2 leading-relaxed">
              As a Creator, you retain all ownership rights to the original content you produce. However, by publishing
              on TinyTale, you grant us a non-exclusive, worldwide, royalty-free license to host, display, and distribute
              your content across our platform and marketing channels.
            </p>

            <h3 className="mt-6 text-base font-bold text-[#0f172a]">3. Monetization Policies</h3>
            <p className="mt-2 leading-relaxed">
              Monetization is available to qualified creators based on engagement metrics, subscription revenue share,
              and direct tips. TinyTale reserves the right to modify the revenue share structure with a 30-day notice. All
              payments are processed through our approved third-party payment gateways.
            </p>

            <h3 className="mt-6 text-base font-bold text-[#0f172a]">4. Community Guidelines</h3>
            <p className="mt-2 leading-relaxed">
              All content must adhere to TinyTale Community Guidelines. Content that promotes violence, discrimination,
              or illegal activities is strictly prohibited. Violations may result in content removal, account suspension,
              or termination from the Creator Program.
            </p>

            <h3 className="mt-6 text-base font-bold text-[#0f172a]">5. Data Privacy</h3>
            <p className="mt-2 leading-relaxed">
              We are committed to protecting your personal information. Data collected during the application and
              creator process will be handled in accordance with our Privacy Policy. You consent to the collection
              and use of data as described therein.
            </p>
          </div>
        </div>

        <div className="border-t border-[#e2e8f0] px-6 py-3">
          <p className="text-xs text-[#94a3b8]">Last updated: January 2024</p>
        </div>
      </div>

      {/* Checkbox agreements */}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition hover:border-[#94a3b8]">
        <input
          type="checkbox"
          checked={draft.agreement.acceptedTerms}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, acceptedTerms: event.target.checked },
            }))
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d1d5db] text-[#1876f2] focus:ring-[#1876f2]"
        />
        <div>
          <p className="text-sm font-semibold text-[#1876f2]">General Agreement</p>
          <p className="mt-0.5 text-sm text-[#64748b]">
            I have read and agree to the TinyTale Terms of Service and Privacy Policy.
          </p>
        </div>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition hover:border-[#94a3b8]">
        <input
          type="checkbox"
          checked={draft.agreement.acceptedAuthenticity}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, acceptedAuthenticity: event.target.checked },
            }))
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d1d5db] text-[#1876f2] focus:ring-[#1876f2]"
        />
        <div>
          <p className="text-sm font-semibold text-[#1876f2]">Content Monetization Terms</p>
          <p className="mt-0.5 text-sm text-[#64748b]">
            I agree to the Content Monetization Terms and understand the payout schedule and tax obligations.
          </p>
        </div>
      </label>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 5 — Final Review
   ────────────────────────────────────────────── */

function StepReview({
  draft,
  userEmail,
  onEdit,
  onSubmit,
  onSaveDraft,
  submitting,
}: {
  draft: CreatorApplicationDraft;
  userEmail: string;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Basic Information card */}
      <ReviewCard
        icon={<User className="h-5 w-5 text-[#1876f2]" />}
        title="Basic Information"
        onEdit={() => onEdit(1)}
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <ReviewField label="FULL NAME" value={draft.basicInformation.fullName} />
          <ReviewField label="EMAIL ADDRESS" value={draft.basicInformation.workEmail || userEmail} />
          <ReviewField label="LOCATION" value={draft.basicInformation.country} />
          <ReviewField
            label="PORTFOLIO LINK"
            value={draft.basicInformation.portfolioLink}
            isLink
          />
        </div>
      </ReviewCard>

      {/* Creative Profile card */}
      <ReviewCard
        icon={<Pencil className="h-5 w-5 text-[#1876f2]" />}
        title="Creative Profile"
        onEdit={() => onEdit(2)}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Creative Specialty</p>
            <div className="flex flex-wrap gap-2">
              {draft.creativeInformation.primaryPlatforms.length > 0 ? (
                draft.creativeInformation.primaryPlatforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#334155]"
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#94a3b8]">-</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Bio</p>
            <p className="text-sm leading-relaxed text-[#334155]">
              {draft.creativeInformation.shortBio || "-"}
            </p>
          </div>
        </div>
      </ReviewCard>

      {/* Identity Verification card */}
      <ReviewCard
        icon={<ShieldCheck className="h-5 w-5 text-[#1876f2]" />}
        title="Identity Verification"
        onEdit={() => onEdit(3)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f7ff]">
            <FileText className="h-5 w-5 text-[#1876f2]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0f172a]">
              {draft.identityVerification.verificationType === "government_id"
                ? "Government Issued ID"
                : draft.identityVerification.verificationType === "passport"
                  ? "Passport"
                  : "Driver's License"}
            </p>
            <p className="text-xs text-[#64748b]">
              {draft.identityVerification.documentFileName || "No document uploaded"}
            </p>
          </div>
          {draft.identityVerification.documentFileName && (
            <span className="text-xs font-semibold text-[#22c55e]">UPLOADED</span>
          )}
        </div>
      </ReviewCard>

      {/* Agreement incomplete warning */}
      {(!draft.agreement.acceptedTerms || !draft.agreement.acceptedAuthenticity) && (
        <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert className="h-4 w-4" /> Agreement is incomplete
          </p>
          <p className="mt-1">
            Please go back to Step 4 and complete both agreement checkboxes before submission.
          </p>
        </div>
      )}

      {/* CTA Card */}
      <div className="rounded-3xl bg-[#1876f2] p-8 text-center text-white">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">Ready to join the family?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
          By clicking &quot;Submit Application&quot;, you agree to our Creator Terms of Service and Privacy Policy.
          Our team will review your application within 3-5 business days.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-full border border-white/30 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#1876f2] shadow-lg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-[#0f172a]">{title}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-[#1876f2] transition hover:text-[#1565d8]"
        >
          Edit
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function ReviewField({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{label}</p>
      {isLink && value ? (
        <p className="text-sm font-medium text-[#1876f2]">{value}</p>
      ) : (
        <p className="text-sm font-medium text-[#0f172a]">{value || "-"}</p>
      )}
    </div>
  );
}
