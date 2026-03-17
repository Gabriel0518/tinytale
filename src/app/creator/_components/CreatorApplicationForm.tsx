"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  FileText,
  Globe2,
  Link as LinkIcon,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import {
  CREATOR_APPLICATION_STEP_TITLES,
  CREATOR_APPLICATION_STORAGE_KEY,
  CREATOR_GENRE_OPTIONS,
  CREATOR_LANGUAGE_OPTIONS,
  createEmptyCreatorApplicationDraft,
  deserializeCreatorApplicationDraft,
} from "@/lib/creator";
import { useCountryCatalog } from "@/hooks/useCountryCatalog";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CountryOption } from "@/lib/countries";
import type { CreatorApplicationDraft, CreatorProfileType, CreatorVerificationType } from "@/types/creator";

const STEP_CONFIG = [
  { step: 1, title: "Basic Info", route: "/creator/apply" },
  { step: 2, title: "Creative Profile", route: "/creator/apply/creative" },
  { step: 3, title: "Identity", route: "/creator/apply/identity" },
  { step: 4, title: "Agreement", route: "/creator/apply/agreement" },
  { step: 5, title: "Review", route: "/creator/apply/review" },
] as const;

const VERIFICATION_OPTIONS: Array<{
  value: CreatorVerificationType;
  title: string;
  description: string;
}> = [
  { value: "government_id", title: "Government ID", description: "National ID card or state-issued ID." },
  { value: "passport", title: "Passport", description: "International passport for identity verification." },
  { value: "business_license", title: "Business License", description: "Required for company-based applications." },
];

function createDefaultDraft() {
  return createEmptyCreatorApplicationDraft();
}

function formatRelativeUpdate(value: string): string {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved yet";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Saved just now";
  if (minutes < 60) return `Saved ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Saved ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Saved ${days}d ago`;
}

function compactLinks(values: string[]): string[] {
  const next = values.map((value) => value.trim());
  while (next.length > 1 && !next[next.length - 1]) {
    next.pop();
  }
  return next;
}

function isPositiveInteger(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

function getIdentityPrimaryUploadLabel(draft: CreatorApplicationDraft): string {
  if (draft.basicInformation.creatorType === "company") return "Registration Document";
  return draft.identityVerification.verificationType === "passport" ? "Passport Copy" : "ID Card Front";
}

function getIdentitySecondaryUploadLabel(_draft: CreatorApplicationDraft): string {
  return "ID Card Back";
}

function getIdentityVerificationTitle(draft: CreatorApplicationDraft): string {
  if (draft.basicInformation.creatorType === "company") return "Business Registration";
  return draft.identityVerification.verificationType === "passport" ? "Passport" : "Government ID";
}

function validateStep(step: number, draft: CreatorApplicationDraft): string[] {
  const errors: string[] = [];

  if (step === 1) {
    if (draft.basicInformation.creatorType === "company") {
      if (!draft.basicInformation.companyName.trim()) errors.push("Company name is required.");
      if (!draft.basicInformation.businessType.trim()) errors.push("Business type is required.");
      if (!draft.basicInformation.registrationId.trim()) errors.push("Registration ID is required.");
      if (!draft.basicInformation.companyAddress.trim()) errors.push("Company address is required.");
      if (!draft.basicInformation.region.trim()) errors.push("Region is required.");
    } else {
      if (!draft.basicInformation.legalName.trim()) errors.push("Full name is required.");
      if (!draft.basicInformation.age.trim()) {
        errors.push("Age is required.");
      } else if (!isPositiveInteger(draft.basicInformation.age)) {
        errors.push("Age must be a valid whole number.");
      }
      if (!draft.basicInformation.idNumber.trim()) errors.push("ID number is required.");
    }

    if (!draft.basicInformation.email.trim()) errors.push("Email is required.");
    if (!draft.basicInformation.phone.trim()) errors.push("Phone number is required.");
    if (!draft.basicInformation.country.trim()) errors.push("Country or region is required.");
  }

  if (step === 2) {
    if (draft.creativeInformation.genres.length === 0) errors.push("Select at least one creative genre.");
    if (!draft.creativeInformation.primaryLanguage.trim()) errors.push("Primary language is required.");
    if (!draft.creativeInformation.portfolioLinks.some((value) => value.trim())) {
      errors.push("Add at least one portfolio or social link.");
    }
    if (!draft.creativeInformation.bio.trim()) errors.push("Creator bio or studio introduction is required.");
  }

  if (step === 3) {
    if (!draft.identityVerification.frontDocumentFileName.trim()) {
      errors.push(
        draft.basicInformation.creatorType === "company"
          ? "Upload the registration document."
          : draft.identityVerification.verificationType === "passport"
            ? "Upload the passport copy."
            : "Upload the ID card front."
      );
    }
    if (draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id" && !draft.identityVerification.backDocumentFileName.trim()) {
      errors.push("Upload the ID card back.");
    }
  }

  if (step === 4) {
    if (!draft.agreement.hasReviewedFullAgreement) {
      errors.push("Please review the creator agreement through the end before continuing.");
    }
    if (!draft.agreement.acceptedTerms) {
      errors.push("You must accept the TinyTale Creator Agreement.");
    }
    if (!draft.agreement.acceptedAuthenticity) {
      errors.push("You must confirm content authenticity and rights ownership.");
    }
    if (!draft.agreement.signatureName.trim()) {
      errors.push("Signature name is required.");
    }
  }

  return errors;
}

interface CreatorApplicationFormProps {
  step: 1 | 2 | 3 | 4 | 5;
}

export default function CreatorApplicationForm({ step }: CreatorApplicationFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { options: countryOptions } = useCountryCatalog(locale);
  const { token, user } = useAuth();
  const [draft, setDraft] = useState<CreatorApplicationDraft>(createDefaultDraft());
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const progressPercent = Math.round((step / STEP_CONFIG.length) * 100);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let next = createDefaultDraft();
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(CREATOR_APPLICATION_STORAGE_KEY);
        if (raw) {
          try {
            next = deserializeCreatorApplicationDraft(JSON.parse(raw));
          } catch {
            next = createDefaultDraft();
          }
        }
      }

      if (token) {
        try {
          const response = await creatorApi.getApplicationDraft(token);
          next = deserializeCreatorApplicationDraft(response, next);
        } catch {
          // Fall back to local draft.
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

  useEffect(() => {
    if (!ready || !user?.email) return;
    setDraft((current) => {
      if (current.basicInformation.email.trim()) return current;
      const next = {
        ...current,
        basicInformation: { ...current.basicInformation, email: user.email || "" },
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CREATOR_APPLICATION_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [ready, user?.email]);

  const maxAccessibleStep = useMemo(() => Math.max(1, draft.lastCompletedStep + 1), [draft.lastCompletedStep]);
  const currentTitle = CREATOR_APPLICATION_STEP_TITLES[step - 1];

  function pushStep(targetStep: number) {
    const target = STEP_CONFIG[targetStep - 1];
    if (!target) return;
    router.push(localizePath(target.route, locale));
  }

  function persistLocal(next: CreatorApplicationDraft) {
    setDraft(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CREATOR_APPLICATION_STORAGE_KEY, JSON.stringify(next));
    }
  }

  async function persistRemote(next: CreatorApplicationDraft) {
    if (!token) return;
    await creatorApi.saveApplicationDraft(token, next);
  }

  function updateDraft(updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) {
    setSubmitError("");
    setErrors([]);
    const next = updater(draft);
    persistLocal({ ...next, updatedAt: new Date().toISOString() });
  }

  async function handleSaveDraft() {
    try {
      const next = { ...draft, updatedAt: new Date().toISOString() };
      persistLocal(next);
      await persistRemote(next);
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to save draft.");
    }
  }

  async function handleNext() {
    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    if (stepErrors.length > 0) return;

    const next = {
      ...draft,
      lastCompletedStep: Math.max(draft.lastCompletedStep, step),
      updatedAt: new Date().toISOString(),
    };

    persistLocal(next);
    try {
      await persistRemote(next);
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to save progress.");
      return;
    }

    if (step < 5) pushStep(step + 1);
  }

  async function handleSubmit() {
    const finalErrors = [1, 2, 3, 4].flatMap((index) => validateStep(index, draft));
    setErrors(finalErrors);
    if (finalErrors.length > 0) return;
    if (!token) {
      router.push(localizePath("/auth/login", locale));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const next = {
        ...draft,
        lastCompletedStep: 5,
        updatedAt: new Date().toISOString(),
      };
      persistLocal(next);
      await creatorApi.submitApplication(token, next);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CREATOR_APPLICATION_STORAGE_KEY);
      }
      router.push(localizePath("/creator/pending", locale));
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to submit your application.");
      router.push(`${localizePath("/creator/apply/status", locale)}?result=failed`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#f8fafc]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1876f2] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto w-full max-w-[860px]">
        <div className="mb-5 rounded-[24px] border border-[#e2e8f0] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Creator Onboarding</p>
              <h1 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[30px]">
                Step {step} of {STEP_CONFIG.length}: {currentTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                Complete your TinyTale creator application. We will review profile quality, identity documents, and rights confirmation before creator access is granted.
              </p>
            </div>
            <div className="rounded-full bg-[#eff6ff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              {progressPercent}% complete
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div className="h-full rounded-full bg-[#1876f2] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-1">
            {STEP_CONFIG.map((item) => {
              const active = item.step === step;
              const canJump = item.step <= maxAccessibleStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && pushStep(item.step)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#eff6ff] text-[#1d4ed8]"
                      : canJump
                        ? "text-[#475569] hover:bg-[#f8fafc]"
                        : "cursor-not-allowed text-[#cbd5e1]"
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#94a3b8]">
            <p>{formatRelativeUpdate(draft.updatedAt)}</p>
            <p>All creator agreements are displayed in-page and require explicit acceptance before submission.</p>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-sm text-[#b91c1c]">
            <p className="mb-2 font-semibold">Please resolve the following before continuing:</p>
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 1 ? <StepBasic draft={draft} onChange={updateDraft} countryOptions={countryOptions} /> : null}
        {step === 2 ? <StepCreative draft={draft} onChange={updateDraft} /> : null}
        {step === 3 ? <StepIdentity draft={draft} onChange={updateDraft} /> : null}
        {step === 4 ? <StepAgreement draft={draft} onChange={updateDraft} /> : null}
        {step === 5 ? <StepReview draft={draft} onEdit={pushStep} onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} submitting={submitting} /> : null}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-5">
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => pushStep(step - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-xl border border-[#dbe2ea] bg-white px-4 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
            >
              Save Draft
            </button>
          </div>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-[#1876f2] px-6 py-2 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(24,118,242,0.22)] hover:bg-[#1669da]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {submitError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#334155]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[#94a3b8]">(optional)</span> : null}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <div className="relative">
        {icon ? <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white ${icon ? "pl-11" : ""}`}
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
  options: readonly string[] | CountryOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2] focus:bg-white"
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:p-6">
      <h2 className="text-lg font-bold text-[#0f172a] md:text-[22px]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function StepBasic({
  draft,
  onChange,
  countryOptions,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
  countryOptions: CountryOption[];
}) {
  return (
    <SectionCard
      title="Basic creator information"
      description="Collect the legal identity and contact information needed for application review and creator account setup."
    >
      <div>
        <FieldLabel>Applicant Type</FieldLabel>
        <div className="inline-flex rounded-2xl bg-[#f1f5f9] p-1">
          {(["individual", "company"] as CreatorProfileType[]).map((option) => {
            const active = draft.basicInformation.creatorType === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    basicInformation: {
                      ...current.basicInformation,
                      creatorType: option,
                    },
                    identityVerification: {
                      ...current.identityVerification,
                      verificationType:
                        option === "company"
                          ? "business_license"
                          : current.identityVerification.verificationType === "business_license"
                            ? "government_id"
                            : current.identityVerification.verificationType,
                    },
                  }))
                }
                className={`rounded-2xl px-4 py-2 text-[13px] font-semibold transition ${
                  active ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                }`}
              >
                {option === "individual" ? "Individual Creator" : "Company / Studio"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label={draft.basicInformation.creatorType === "company" ? "Company Name" : "Full Name"}
          value={draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyName : draft.basicInformation.legalName}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: {
                ...current.basicInformation,
                [current.basicInformation.creatorType === "company" ? "companyName" : "legalName"]: value,
              },
            }))
          }
          placeholder={draft.basicInformation.creatorType === "company" ? "TinyTale Studio LLC" : "Alex Morgan"}
          icon={draft.basicInformation.creatorType === "company" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
        />

        {draft.basicInformation.creatorType === "company" ? (
          <InputField
            label="Business Type"
            value={draft.basicInformation.businessType}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, businessType: value },
              }))
            }
            placeholder="Short drama studio / MCN / Talent agency"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
          />
        ) : (
          <InputField
            label="Age"
            type="number"
            value={draft.basicInformation.age}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, age: value },
              }))
            }
            placeholder="28"
            icon={<BadgeCheck className="h-4 w-4" />}
          />
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {draft.basicInformation.creatorType === "company" ? (
          <InputField
            label="Registration ID"
            value={draft.basicInformation.registrationId}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, registrationId: value },
              }))
            }
            placeholder="US-12345678"
            icon={<FileText className="h-4 w-4" />}
          />
        ) : (
          <InputField
            label="ID Number"
            value={draft.basicInformation.idNumber}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, idNumber: value },
              }))
            }
            placeholder="A123456789"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        )}
        <InputField
          label={draft.basicInformation.creatorType === "company" ? "Company Address" : "Email"}
          type={draft.basicInformation.creatorType === "company" ? "text" : "email"}
          value={draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyAddress : draft.basicInformation.email}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              basicInformation: {
                ...current.basicInformation,
                [current.basicInformation.creatorType === "company" ? "companyAddress" : "email"]: value,
              },
            }))
          }
          placeholder={draft.basicInformation.creatorType === "company" ? "350 Fifth Avenue, New York, NY" : "creator@studio.com"}
          icon={draft.basicInformation.creatorType === "company" ? <Building2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        />
      </div>

      {draft.basicInformation.creatorType === "company" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Email"
            type="email"
            value={draft.basicInformation.email}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, email: value },
              }))
            }
            placeholder="creator@studio.com"
            icon={<Mail className="h-4 w-4" />}
          />
          <InputField
            label="Phone Number"
            value={draft.basicInformation.phone}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, phone: value },
              }))
            }
            placeholder="+1 555 010 3000"
            icon={<Phone className="h-4 w-4" />}
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Phone Number"
            value={draft.basicInformation.phone}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, phone: value },
              }))
            }
            placeholder="+1 555 010 3000"
            icon={<Phone className="h-4 w-4" />}
          />
          <div />
        </div>
      )}

      {draft.basicInformation.creatorType === "company" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Region"
            value={draft.basicInformation.region}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                basicInformation: { ...current.basicInformation, region: value },
              }))
            }
            placeholder="California"
            icon={<Globe2 className="h-4 w-4" />}
          />
          <div />
        </div>
      ) : null}

      <SelectField
        label="Country / Region"
        value={draft.basicInformation.country}
        options={countryOptions}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            basicInformation: { ...current.basicInformation, country: value },
          }))
        }
        placeholder="Select country or region"
      />

      <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
        {draft.basicInformation.creatorType === "company"
          ? "Company applications require the legal entity record, business type, registration identifier, mailing address, and operating region."
          : "Individual applications require the creator's legal profile, age, ID number, and direct contact information."}
      </div>
    </SectionCard>
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
    <SectionCard
      title="Creative profile"
      description="Describe your storytelling focus, language, and proof of prior work. These signals drive onboarding review and creator quality scoring."
    >
      <div>
        <FieldLabel>Genres</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CREATOR_GENRE_OPTIONS.map((genre) => {
            const selected = draft.creativeInformation.genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() =>
                  onChange((current) => {
                    const genres = selected
                      ? current.creativeInformation.genres.filter((item) => item !== genre)
                      : [...current.creativeInformation.genres, genre];
                    return {
                      ...current,
                      creativeInformation: { ...current.creativeInformation, genres },
                    };
                  })
                }
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  selected ? "border-[#1876f2] bg-[#1876f2] text-white" : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#94a3b8]"
                }`}
              >
                {selected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <SelectField
        label="Primary Language"
        value={draft.creativeInformation.primaryLanguage}
        options={CREATOR_LANGUAGE_OPTIONS}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            creativeInformation: { ...current.creativeInformation, primaryLanguage: value },
          }))
        }
      />

      <div>
        <FieldLabel>Portfolio Links</FieldLabel>
        <div className="space-y-3">
          {draft.creativeInformation.portfolioLinks.map((link, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1">
                <InputField
                  label={`Portfolio Link ${index + 1}`}
                  value={link}
                  onChange={(value) =>
                    onChange((current) => {
                      const portfolioLinks = [...current.creativeInformation.portfolioLinks];
                      portfolioLinks[index] = value;
                      return {
                        ...current,
                        creativeInformation: {
                          ...current.creativeInformation,
                          portfolioLinks: compactLinks(portfolioLinks),
                        },
                      };
                    })
                  }
                  placeholder="https://youtube.com/@creator or https://tiktok.com/@creator"
                  icon={<LinkIcon className="h-4 w-4" />}
                  optional={index > 0}
                />
              </div>
              {draft.creativeInformation.portfolioLinks.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      creativeInformation: {
                        ...current.creativeInformation,
                        portfolioLinks: current.creativeInformation.portfolioLinks.filter((_, itemIndex) => itemIndex !== index),
                      },
                    }))
                  }
                  className="mt-7 rounded-xl border border-[#e2e8f0] px-3 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {draft.creativeInformation.portfolioLinks.length < 3 ? (
          <button
            type="button"
            onClick={() =>
              onChange((current) => ({
                ...current,
                creativeInformation: {
                  ...current.creativeInformation,
                  portfolioLinks: [...current.creativeInformation.portfolioLinks, ""],
                },
              }))
            }
            className="mt-3 text-sm font-semibold text-[#1876f2] hover:text-[#1669da]"
          >
            + Add another link
          </button>
        ) : null}
      </div>

      <div>
        <FieldLabel>Creator Bio / Studio Introduction</FieldLabel>
        <textarea
          rows={6}
          maxLength={1000}
          value={draft.creativeInformation.bio}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              creativeInformation: { ...current.creativeInformation, bio: event.target.value },
            }))
          }
          placeholder="Introduce your creative background, target audience, and notable work."
          className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:bg-white"
        />
        <p className="mt-2 text-right text-xs text-[#94a3b8]">{draft.creativeInformation.bio.length} / 1000</p>
      </div>
    </SectionCard>
  );
}

function StepIdentity({
  draft,
  onChange,
}: {
  draft: CreatorApplicationDraft;
  onChange: (updater: (current: CreatorApplicationDraft) => CreatorApplicationDraft) => void;
}) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const verificationOptions =
    draft.basicInformation.creatorType === "company"
      ? VERIFICATION_OPTIONS.filter((option) => option.value === "business_license")
      : VERIFICATION_OPTIONS.filter((option) => option.value !== "business_license");
  const showSecondaryUpload =
    draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id";

  return (
    <SectionCard
      title="Identity verification"
      description={
        draft.basicInformation.creatorType === "company"
          ? "Upload the company registration document used to verify the legal entity before creator access is activated."
          : "Upload the identity document that matches your creator profile. TinyTale uses this to verify the applicant before uploads and payouts are enabled."
      }
    >
      <div>
        <FieldLabel>Verification Document</FieldLabel>
        <div className={`grid gap-3 ${verificationOptions.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {verificationOptions.map((option) => {
            const active =
              draft.basicInformation.creatorType === "company"
                ? option.value === "business_license"
                : draft.identityVerification.verificationType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    identityVerification: {
                      ...current.identityVerification,
                      verificationType: option.value,
                    },
                  }))
                }
                className={`rounded-2xl border-2 p-3.5 text-left transition ${
                  active ? "border-[#1876f2] bg-[#eff6ff]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }`}
              >
                <p className={`text-sm font-bold ${active ? "text-[#1d4ed8]" : "text-[#0f172a]"}`}>{option.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#64748b]">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-4 ${showSecondaryUpload ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        <UploadCard
          label={getIdentityPrimaryUploadLabel(draft)}
          fileName={draft.identityVerification.frontDocumentFileName}
          inputRef={frontInputRef}
          onSelect={(file) =>
            onChange((current) => ({
              ...current,
              identityVerification: {
                ...current.identityVerification,
                frontDocumentFileName: file.name,
              },
            }))
          }
        />
        {showSecondaryUpload ? (
          <UploadCard
            label={getIdentitySecondaryUploadLabel(draft)}
            fileName={draft.identityVerification.backDocumentFileName}
            inputRef={secondaryInputRef}
            onSelect={(file) =>
              onChange((current) => ({
                ...current,
                identityVerification: {
                  ...current.identityVerification,
                  backDocumentFileName: file.name,
                },
              }))
            }
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-sm leading-6 text-[#1e3a8a]">
        {draft.basicInformation.creatorType === "company"
          ? "Company accounts submit one registration file in this step. Registration ID, address, country, and region stay linked to the first step and are preserved when you move backward."
          : draft.identityVerification.verificationType === "passport"
            ? "Passport verification requires one passport image or PDF. Your Step 1 identity details stay intact if you go back to edit them."
            : "Government ID verification requires both the front and back of the ID card. Your Step 1 profile details stay intact if you go back to edit them."}
      </div>
    </SectionCard>
  );
}

function UploadCard({
  label,
  fileName,
  inputRef,
  onSelect,
  optional,
}: {
  label: string;
  fileName: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onSelect: (file: File) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center hover:border-[#93c5fd] hover:bg-[#f0f7ff]"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-[#94a3b8]" />
        <p className="mt-2 text-sm font-semibold text-[#334155]">{fileName || `Select ${label}`}</p>
        <p className="mt-1 text-xs text-[#94a3b8]">JPG, PNG, or PDF up to 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
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
  const agreementRef = useRef<HTMLDivElement>(null);

  function markAgreementReviewed() {
    if (draft.agreement.hasReviewedFullAgreement) return;
    onChange((current) => ({
      ...current,
      agreement: { ...current.agreement, hasReviewedFullAgreement: true },
    }));
  }

  return (
    <SectionCard
      title="Creator agreement"
      description="The creator agreement must be reviewed in-page. TinyTale records the acceptance timestamp once you submit the application."
    >
      <div className="rounded-[24px] border border-[#e2e8f0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
            <FileText className="h-4 w-4 text-[#64748b]" />
            TinyTale Creator Cooperation Agreement
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.agreement.hasReviewedFullAgreement ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#eff6ff] text-[#1d4ed8]"}`}>
            {draft.agreement.hasReviewedFullAgreement ? "Reviewed" : "Scroll to review"}
          </span>
        </div>
        <div
          ref={agreementRef}
          onScroll={(event) => {
            const target = event.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 12) {
              markAgreementReviewed();
            }
          }}
          className="max-h-[420px] space-y-5 overflow-y-auto px-4 py-4 text-sm leading-7 text-[#334155]"
        >
          <AgreementSection title="1. Rights and authorization">
            You confirm that all submitted content, promotional materials, and uploaded media are original or properly licensed. TinyTale receives the platform distribution rights defined in the agreement, while your original ownership remains unchanged unless a separate contract states otherwise.
          </AgreementSection>
          <AgreementSection title="2. Revenue share and settlement basis">
            Creator earnings are calculated from the net settlement base after payment channel fees are deducted. All creator-facing revenue is displayed in USD, and future contract upgrades may change the creator split ratio according to the signed version in effect.
          </AgreementSection>
          <AgreementSection title="3. Content review and moderation">
            Every drama submission is reviewed for compliance, rights ownership, metadata quality, and age rating accuracy. TinyTale can request changes, reject a submission, or suspend published content when policy violations are confirmed.
          </AgreementSection>
          <AgreementSection title="4. DMCA and platform enforcement">
            You agree to cooperate with copyright reviews, DMCA notices, and counter-notice procedures. Confirmed repeat infringement may trigger suspension or permanent termination according to platform policy.
          </AgreementSection>
          <AgreementSection title="5. Banking, payouts, and tax responsibilities">
            Bank account verification is required before payout processing. Creators are responsible for local tax reporting and ensuring their payout information remains accurate and current.
          </AgreementSection>
          <AgreementSection title="6. Termination and account lifecycle">
            TinyTale may suspend creator access for policy violations, unresolved disputes, or confirmed DMCA strikes. Creator-initiated deactivation follows the platform cooldown and final settlement rules in the latest policy version.
          </AgreementSection>
        </div>
      </div>

      <div className="space-y-4 rounded-[24px] border border-[#e2e8f0] bg-white p-4">
        <label className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.agreement.acceptedTerms}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                agreement: { ...current.agreement, acceptedTerms: event.target.checked },
              }))
            }
            className="mt-1 h-4 w-4 rounded border-[#cbd5e1] text-[#1876f2]"
          />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">I have read and agree to the TinyTale Creator Cooperation Agreement.</p>
            <p className="mt-1 text-sm text-[#64748b]">You must review the agreement above before this checkbox is considered valid.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.agreement.acceptedAuthenticity}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                agreement: { ...current.agreement, acceptedAuthenticity: event.target.checked },
              }))
            }
            className="mt-1 h-4 w-4 rounded border-[#cbd5e1] text-[#1876f2]"
          />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">I confirm the submitted content and materials are authentic and rights-cleared.</p>
            <p className="mt-1 text-sm text-[#64748b]">This includes portfolio links, uploaded identity files, and future drama uploads.</p>
          </div>
        </label>

        <InputField
          label="Signature Name"
          value={draft.agreement.signatureName}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              agreement: { ...current.agreement, signatureName: value },
            }))
          }
          placeholder="Type your full legal or representative name"
          icon={<BadgeCheck className="h-4 w-4" />}
        />
      </div>
    </SectionCard>
  );
}

function AgreementSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
      <p className="mt-2">{children}</p>
    </section>
  );
}

function StepReview({
  draft,
  onEdit,
  onSubmit,
  onSaveDraft,
  submitting,
}: {
  draft: CreatorApplicationDraft;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  submitting: boolean;
}) {
  const primaryName = draft.basicInformation.creatorType === "company" ? draft.basicInformation.companyName || "-" : draft.basicInformation.legalName || "-";

  return (
    <div className="space-y-5">
      <ReviewCard title="Basic Information" icon={<User className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(1)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label="Applicant Type" value={draft.basicInformation.creatorType === "company" ? "Company / Studio" : "Individual Creator"} />
          <ReviewField label={draft.basicInformation.creatorType === "company" ? "Company Name" : "Full Name"} value={primaryName} />
          {draft.basicInformation.creatorType === "company" ? (
            <>
              <ReviewField label="Business Type" value={draft.basicInformation.businessType || "-"} />
              <ReviewField label="Registration ID" value={draft.basicInformation.registrationId || "-"} />
              <ReviewField label="Company Address" value={draft.basicInformation.companyAddress || "-"} />
              <ReviewField label="Region" value={draft.basicInformation.region || "-"} />
            </>
          ) : (
            <>
              <ReviewField label="Age" value={draft.basicInformation.age || "-"} />
              <ReviewField label="ID Number" value={draft.basicInformation.idNumber || "-"} />
            </>
          )}
          <ReviewField label="Email" value={draft.basicInformation.email || "-"} />
          <ReviewField label="Phone Number" value={draft.basicInformation.phone || "-"} />
          <ReviewField label="Country / Region" value={draft.basicInformation.country || "-"} />
        </div>
      </ReviewCard>

      <ReviewCard title="Creative Profile" icon={<Globe2 className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(2)}>
        <ReviewField label="Genres" value={draft.creativeInformation.genres.join(", ") || "-"} />
        <ReviewField label="Primary Language" value={draft.creativeInformation.primaryLanguage || "-"} />
        <ReviewField label="Portfolio Links" value={draft.creativeInformation.portfolioLinks.filter((value) => value.trim()).join("\n") || "-"} preserveLineBreaks />
        <ReviewField label="Bio" value={draft.creativeInformation.bio || "-"} preserveLineBreaks />
      </ReviewCard>

      <ReviewCard title="Identity Verification" icon={<ShieldCheck className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(3)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label="Verification Type" value={getIdentityVerificationTitle(draft)} />
          <ReviewField label={getIdentityPrimaryUploadLabel(draft)} value={draft.identityVerification.frontDocumentFileName || "-"} />
          {draft.basicInformation.creatorType === "individual" && draft.identityVerification.verificationType === "government_id" ? (
            <ReviewField label={getIdentitySecondaryUploadLabel(draft)} value={draft.identityVerification.backDocumentFileName || "-"} />
          ) : null}
        </div>
      </ReviewCard>

      <ReviewCard title="Agreement Confirmation" icon={<FileText className="h-5 w-5 text-[#1876f2]" />} onEdit={() => onEdit(4)}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewField label="Agreement Reviewed" value={draft.agreement.hasReviewedFullAgreement ? "Yes" : "No"} />
          <ReviewField label="Rights Confirmed" value={draft.agreement.acceptedAuthenticity ? "Yes" : "No"} />
          <ReviewField label="Agreement Accepted" value={draft.agreement.acceptedTerms ? "Yes" : "No"} />
          <ReviewField label="Signature Name" value={draft.agreement.signatureName || "-"} />
        </div>
      </ReviewCard>

      <div className="rounded-[24px] bg-[#0f172a] px-5 py-6 text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)] md:px-6">
        <h3 className="text-lg font-bold">Submit for manual review</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cbd5e1]">
          TinyTale will manually review the application, creator profile, identity materials, and agreement confirmation before enabling the creator dashboard. Review SLA target is within 48 hours.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0f172a] hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
          {icon}
          {title}
        </div>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#1876f2] hover:text-[#1669da]">
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ReviewField({ label, value, preserveLineBreaks }: { label: string; value: string; preserveLineBreaks?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{label}</p>
      <p className={`text-sm font-medium text-[#0f172a] ${preserveLineBreaks ? "whitespace-pre-line" : ""}`}>{value || "-"}</p>
    </div>
  );
}
