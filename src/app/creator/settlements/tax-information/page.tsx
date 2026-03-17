"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { ChevronLeft, FileText, Loader2, ShieldCheck } from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { useCountryCatalog } from "@/hooks/useCountryCatalog";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorSettlementTaxInfo } from "@/types/creator";

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const inputClassName =
  "h-[50px] w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 text-[15px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:ring-4 focus:ring-[rgba(24,118,242,0.12)]";

const emptyForm: CreatorSettlementTaxInfo = {
  legalName: "",
  businessName: "",
  taxClassification: "individual",
  taxIdType: "ssn",
  taxIdNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateOrRegion: "",
  postalCode: "",
  country: "United States",
  certificationName: "",
  status: "missing",
  updatedAt: null,
};

const taxClassificationOptions: Array<{ value: CreatorSettlementTaxInfo["taxClassification"]; label: string }> = [
  { value: "individual", label: "Individual / Sole owner" },
  { value: "sole_proprietor", label: "Sole proprietor" },
  { value: "llc", label: "LLC" },
  { value: "c_corp", label: "C Corporation" },
  { value: "s_corp", label: "S Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust_estate", label: "Trust / Estate" },
  { value: "other", label: "Other" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[14px] font-semibold text-[#0f172a]">{children}</label>;
}

function formatDate(value: string | null) {
  if (!value) return "Not submitted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not submitted";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function CreatorSettlementTaxInformationPage() {
  const locale = useLocale();
  const { options: countryOptions } = useCountryCatalog(locale);
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreatorSettlementTaxInfo>(emptyForm);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const authToken: string = token;
    let cancelled = false;

    async function fetchTaxInfo() {
      setLoading(true);
      try {
        const response = await creatorApi.getSettlementTaxInfo(authToken);
        if (!response.success || cancelled) return;
        setForm(response.data);
      } catch (error) {
        if (!cancelled) {
          toast(error instanceof Error ? error.message : "Failed to load tax information.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTaxInfo();
    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const authToken: string = token;

    try {
      setSaving(true);
      const response = await creatorApi.updateSettlementTaxInfo(authToken, {
        legalName: form.legalName.trim(),
        businessName: form.businessName.trim(),
        taxClassification: form.taxClassification,
        taxIdType: form.taxIdType,
        taxIdNumber: form.taxIdNumber.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        stateOrRegion: form.stateOrRegion.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        certificationName: form.certificationName.trim(),
      });
      setForm(response.data);
      toast("Tax information saved.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save tax information.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
          Loading tax information...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <div className="flex items-center gap-4">
        <Link
          href={localizePath("/creator/settlements", locale)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#334155] transition hover:bg-[#f8fafc]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[15px] font-semibold text-[#64748b]">Settlement</p>
          <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#0f172a] md:text-[40px]">Tax Information / W-9</h1>
        </div>
      </div>

      <section className="rounded-[28px] bg-[linear-gradient(135deg,#edf5ff,#f8fbff)] px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)] md:px-8 md:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[760px]">
            <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Compliance Profile</p>
            <p className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#0f172a]">Submit the tax profile used for creator settlement and annual statements.</p>
            <p className="mt-3 text-[16px] leading-7 text-[#64748b]">
              This information is used for settlement review, payout reconciliation, and PDF earnings statements.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-[24px] border border-[#dbe7f6] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Current Status</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{form.status === "submitted" ? "Submitted" : "Missing"}</p>
              </div>
            </div>
            <div className="rounded-[18px] bg-[#f8fafc] px-4 py-3 text-[14px] text-[#64748b]">
              Last updated: <span className="font-semibold text-[#0f172a]">{formatDate(form.updatedAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <form className={`${cardClassName} p-6 md:p-7`} onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">W-9 Details</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#64748b]">
              Enter the name, taxpayer identification number, and mailing address that should appear on your settlement documentation.
            </p>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2] md:flex">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Legal Name</FieldLabel>
            <input className={inputClassName} value={form.legalName} onChange={(event) => setForm((prev) => ({ ...prev, legalName: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>Business Name / DBA</FieldLabel>
            <input className={inputClassName} value={form.businessName} onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>Federal Tax Classification</FieldLabel>
            <select
              className={inputClassName}
              value={form.taxClassification}
              onChange={(event) => setForm((prev) => ({ ...prev, taxClassification: event.target.value as CreatorSettlementTaxInfo["taxClassification"] }))}
            >
              {taxClassificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
            <div>
              <FieldLabel>Tax ID Type</FieldLabel>
              <select
                className={inputClassName}
                value={form.taxIdType}
                onChange={(event) => setForm((prev) => ({ ...prev, taxIdType: event.target.value as CreatorSettlementTaxInfo["taxIdType"] }))}
              >
                <option value="ssn">SSN</option>
                <option value="ein">EIN</option>
              </select>
            </div>
            <div>
              <FieldLabel>Tax ID Number</FieldLabel>
              <input className={inputClassName} value={form.taxIdNumber} onChange={(event) => setForm((prev) => ({ ...prev, taxIdNumber: event.target.value }))} />
            </div>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Address Line 1</FieldLabel>
            <input className={inputClassName} value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Address Line 2</FieldLabel>
            <input className={inputClassName} value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>City</FieldLabel>
            <input className={inputClassName} value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>State / Region</FieldLabel>
            <input className={inputClassName} value={form.stateOrRegion} onChange={(event) => setForm((prev) => ({ ...prev, stateOrRegion: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>Postal Code</FieldLabel>
            <input className={inputClassName} value={form.postalCode} onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <select
              className={inputClassName}
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
            >
              <option value="">Select country</option>
              {countryOptions.map((option) => (
                <option key={`${option.alpha2}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Certification Signature</FieldLabel>
            <input className={inputClassName} value={form.certificationName} onChange={(event) => setForm((prev) => ({ ...prev, certificationName: event.target.value }))} />
            <p className="mt-2 text-[13px] leading-6 text-[#94a3b8]">
              By signing, you certify that the taxpayer information provided is accurate and may be used on settlement statements.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#edf2f7] pt-5">
          <Link
            href={localizePath("/creator/settlements", locale)}
            className="inline-flex h-11 items-center rounded-2xl border border-[#dbe3ec] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
          >
            Back
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-5 text-[14px] font-bold text-white transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save W-9 Information"}
          </button>
        </div>
      </form>
    </div>
  );
}
