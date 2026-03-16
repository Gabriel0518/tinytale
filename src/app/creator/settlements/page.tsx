"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  ChevronRight,
  CircleHelp,
  Download,
  FileSpreadsheet,
  Landmark,
  Loader2,
} from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorSettlementOverview, CreatorSettlementStatement } from "@/types/creator";

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const inputClassName =
  "h-[50px] w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 text-[15px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:ring-4 focus:ring-[rgba(24,118,242,0.12)]";

type StatementFilter = "all" | "paid" | "pending" | "disputed";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", opts || { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function statusBadgeClass(status: CreatorSettlementStatement["status"] | CreatorSettlementOverview["summary"]["bankStatus"]) {
  switch (status) {
    case "paid":
    case "verified":
      return "bg-[#dcfce7] text-[#166534]";
    case "confirmed":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "generated":
      return "bg-[#fef3c7] text-[#b45309]";
    case "disputed":
    case "rejected":
      return "bg-[#fee2e2] text-[#b91c1c]";
    case "pending_review":
    case "pending":
      return "bg-[#ede9fe] text-[#6d28d9]";
    default:
      return "bg-[#f1f5f9] text-[#475569]";
  }
}

function mapStatementFilter(status: CreatorSettlementStatement["status"]): StatementFilter {
  if (status === "paid") return "paid";
  if (status === "disputed") return "disputed";
  return "pending";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-[14px] font-semibold text-[#0f172a]">{children}</label>;
}

export default function CreatorSettlementsPage() {
  const locale = useLocale();
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showBankEditor, setShowBankEditor] = useState(false);
  const [filter, setFilter] = useState<StatementFilter>("all");
  const [overview, setOverview] = useState<CreatorSettlementOverview | null>(null);
  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    bankAddress: "",
    country: "",
    currency: "USD",
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const authToken: string = token;
    let cancelled = false;

    async function fetchOverview() {
      setLoading(true);
      try {
        const response = await creatorApi.getSettlementOverview(authToken);
        if (!response.success || cancelled) return;
        const nextOverview = response.data;
        setOverview(nextOverview);
        setForm({
          accountHolderName: nextOverview.bankAccount.accountHolderName || "",
          bankName: nextOverview.bankAccount.bankName || "",
          accountNumber: nextOverview.bankAccount.accountNumber || "",
          routingNumber: nextOverview.bankAccount.routingNumber || "",
          swiftCode: nextOverview.bankAccount.swiftCode || "",
          bankAddress: nextOverview.bankAccount.bankAddress || "",
          country: nextOverview.bankAccount.country || "",
          currency: nextOverview.bankAccount.currency || "USD",
        });
      } catch (error) {
        if (!cancelled) toast(error instanceof Error ? error.message : "Failed to load settlements.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOverview();
    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  const filteredStatements = useMemo(() => {
    const statements = overview?.statements || [];
    if (filter === "all") return statements;
    return statements.filter((statement) => mapStatementFilter(statement.status) === filter);
  }, [overview, filter]);

  const estimatedPayout = useMemo(() => {
    if (!overview) return 0;
    const candidate = overview.statements.find((statement) => statement.status === "confirmed" || statement.status === "generated");
    return candidate?.creatorShareUsd || 0;
  }, [overview]);

  const handleExportData = () => {
    if (!overview?.statements.length) {
      toast("No statement data available to export.", "info");
      return;
    }

    const headers = ["statement_no", "period_start", "period_end", "creator_share_usd", "status"];
    const rows = overview.statements.map((statement) => [
      statement.statementNo,
      statement.periodStart,
      statement.periodEnd,
      statement.creatorShareUsd.toFixed(2),
      statement.status,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "creator-settlements.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveBankAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!form.accountHolderName.trim() || !form.bankName.trim() || !form.accountNumber.trim() || !form.country.trim()) {
      toast("Account holder, bank name, account number, and country are required.", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await creatorApi.updateSettlementBankAccount(token, {
        accountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        routingNumber: form.routingNumber.trim(),
        swiftCode: form.swiftCode.trim(),
        bankAddress: form.bankAddress.trim(),
        country: form.country.trim(),
        currency: (form.currency.trim() || "USD").toUpperCase(),
      });

      setOverview((current) => current
        ? {
            ...current,
            bankAccount: response.data,
            summary: {
              ...current.summary,
              bankStatus: response.data.verificationStatus,
              bankStatusLabel: response.data.verificationLabel,
              payoutMethodLabel: response.data.bankName ? "Bank Transfer" : current.summary.payoutMethodLabel,
            },
          }
        : current);
      setShowBankEditor(false);
      toast("Payout method updated.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update payout method.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadStatementPdf = async (statementId: string) => {
    if (!token) return;
    try {
      setDownloadingId(statementId);
      const { blob, filename } = await creatorApi.downloadSettlementPdf(token, statementId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to download statement PDF.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
          Loading settlements...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#0f172a] md:text-[40px]">Settlement Center</h1>
          <p className="mt-2 max-w-[760px] text-[16px] leading-7 text-[#64748b] md:text-[18px]">
            Manage your story earnings, view reports, and configure payouts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportData}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dbe3ec] bg-white px-4 text-[14px] font-semibold text-[#0f172a] transition hover:bg-[#f8fafc]"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      <section className={`${cardClassName} relative overflow-hidden p-6 md:p-7`}>
        <div className="absolute right-0 top-0 h-full w-[240px] bg-[linear-gradient(135deg,rgba(24,118,242,0.15),rgba(24,118,242,0.04))] [clip-path:polygon(30%_0,100%_0,100%_65%,10%_45%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Current Balance</p>
            <p className="mt-2 text-[46px] font-black tracking-[-0.05em] text-[#0f172a]">{formatUsd(overview?.summary.availableBalanceUsd || 0)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-6 text-[15px] text-[#64748b]">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Next Payout</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatDate(overview?.summary.nextSettlementDate)}</p>
              </div>
              <div className="h-10 w-px bg-[#e2e8f0]" />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Estimated</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatUsd(estimatedPayout)}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#monthly-statements"
                className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-6 text-[15px] font-bold text-white transition hover:bg-[#1669da]"
              >
                Withdraw Funds
              </Link>
              <Link
                href="#monthly-statements"
                className="inline-flex h-11 items-center rounded-2xl bg-[#e8f1ff] px-6 text-[15px] font-bold text-[#1876f2] transition hover:bg-[#dbeafe]"
              >
                View Payout History
              </Link>
            </div>
          </div>

          <div className="relative flex h-[148px] w-full max-w-[232px] items-center justify-center self-end rounded-[28px] border border-[#dbe7f6] bg-[radial-gradient(circle_at_center,rgba(24,118,242,0.16),rgba(24,118,242,0.04))] text-[#1876f2]">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[rgba(24,118,242,0.15)] bg-[rgba(255,255,255,0.35)]">
              <Banknote className="h-10 w-10" />
            </div>
          </div>
        </div>
      </section>

      <section className={`${cardClassName} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">Bank Account</h2>
          </div>
          <Landmark className="h-5 w-5 text-[#94a3b8]" />
        </div>

        <div className="mt-5 rounded-[22px] bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between gap-4 rounded-[18px] bg-white px-4 py-4 shadow-[inset_0_0_0_1px_#edf2f7]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#0f172a]">
                  {overview?.bankAccount.bankName ? `${overview.bankAccount.bankName} ${overview.bankAccount.accountNumberMasked}` : "No bank account on file"}
                </p>
                <p className="mt-1 text-[14px] text-[#64748b]">
                  {overview?.bankAccount.accountHolderName || "Primary account"}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(overview?.bankAccount.verificationStatus || "missing")}`}>
              {overview?.bankAccount.verificationLabel || "Missing"}
            </span>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#edf2f7]">
          <button
            type="button"
            onClick={() => setShowBankEditor((value) => !value)}
            className="flex w-full items-center justify-between py-4 text-left"
          >
            <span className="text-[15px] font-semibold text-[#0f172a]">Update Payout Method</span>
            <ChevronRight className={`h-4 w-4 text-[#94a3b8] transition ${showBankEditor ? "rotate-90" : ""}`} />
          </button>
          <Link href={localizePath("/creator/settlements/tax-information", locale)} className="flex items-center justify-between py-4">
            <span className="text-[15px] font-semibold text-[#0f172a]">Tax Information (W-9)</span>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(overview?.taxInfo.status === "submitted" ? "verified" : "missing")}`}>
                {overview?.taxInfo.status === "submitted" ? "Submitted" : "Missing"}
              </span>
              <ChevronRight className="h-4 w-4 text-[#94a3b8]" />
            </div>
          </Link>
        </div>

        {showBankEditor ? (
          <form className="mt-5 grid gap-4 border-t border-[#edf2f7] pt-5 md:grid-cols-2" onSubmit={handleSaveBankAccount}>
            <div>
              <FieldLabel>Account Holder Name</FieldLabel>
              <input className={inputClassName} value={form.accountHolderName} onChange={(event) => setForm((prev) => ({ ...prev, accountHolderName: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Bank Name</FieldLabel>
              <input className={inputClassName} value={form.bankName} onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Account Number / IBAN</FieldLabel>
              <input className={inputClassName} value={form.accountNumber} onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Routing Number</FieldLabel>
              <input className={inputClassName} value={form.routingNumber} onChange={(event) => setForm((prev) => ({ ...prev, routingNumber: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>SWIFT / BIC</FieldLabel>
              <input className={inputClassName} value={form.swiftCode} onChange={(event) => setForm((prev) => ({ ...prev, swiftCode: event.target.value.toUpperCase() }))} />
            </div>
            <div>
              <FieldLabel>Bank Country</FieldLabel>
              <input className={inputClassName} value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Bank Address</FieldLabel>
              <input className={inputClassName} value={form.bankAddress} onChange={(event) => setForm((prev) => ({ ...prev, bankAddress: event.target.value }))} />
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <input className={inputClassName} value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowBankEditor(false)} className="inline-flex h-11 items-center rounded-2xl border border-[#dbe3ec] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f8fafc]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-5 text-[14px] font-bold text-white transition hover:bg-[#1669da] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payout Method"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section id="monthly-statements" className={`${cardClassName} overflow-hidden`}>
        <div className="border-b border-[#edf2f7] px-6 py-5 md:px-7">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">Monthly Settlement Statements</h2>
          <div className="mt-5 inline-flex rounded-full bg-[#f1f5f9] p-1">
            {([
              ["all", "All"],
              ["paid", "Paid"],
              ["pending", "Pending"],
              ["disputed", "Disputed"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${filter === value ? "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.06)]" : "text-[#64748b] hover:text-[#0f172a]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#fbfdff] text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                <th className="px-6 py-4 md:px-7">Settlement Period</th>
                <th className="px-6 py-4">Statement ID</th>
                <th className="px-6 py-4">Total Earnings</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatements.map((statement) => (
                <tr key={statement.id} className="border-t border-[#edf2f7] text-[15px] text-[#0f172a]">
                  <td className="px-6 py-5 md:px-7">
                    <p className="text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{new Date(statement.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                    <p className="mt-1 text-[14px] text-[#64748b]">{formatDate(statement.periodStart, { month: "short", day: "numeric" })} - {formatDate(statement.periodEnd, { month: "short", day: "numeric" })}</p>
                  </td>
                  <td className="px-6 py-5 text-[16px] text-[#334155]">#{statement.statementNo}</td>
                  <td className="px-6 py-5 text-[18px] font-bold text-[#0f172a]">{formatUsd(statement.creatorShareUsd)}</td>
                  <td className="px-6 py-5">
                    <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${statusBadgeClass(statement.status)}`}>
                      {statement.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {statement.status === "disputed" ? (
                      <Link href={localizePath(`/creator/settlements/${statement.id}`, locale)} className="text-[16px] font-semibold text-[#1876f2] hover:text-[#1669da]">
                        Review
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownloadStatementPdf(statement.id)}
                        disabled={downloadingId === statement.id}
                        className="text-[16px] font-semibold text-[#1876f2] hover:text-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingId === statement.id ? "Downloading..." : "Download"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredStatements.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[14px] text-[#64748b]">
                    No statements found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-5 text-[14px] text-[#64748b] md:px-7">
          <span>Showing {filteredStatements.length} of {overview?.statements.length || 0} statements</span>
          <div className="flex items-center gap-2">
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe3ec] bg-white text-[#94a3b8]">‹</button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe3ec] bg-white text-[#475569]">›</button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[24px] border border-[#bfd8ff] bg-[linear-gradient(180deg,#edf5ff,#f7fbff)] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(24,118,242,0.12)] text-[#1876f2]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0f172a]">Need a detailed tax report?</h3>
              <p className="mt-2 max-w-[460px] text-[15px] leading-7 text-[#64748b]">
                Download your consolidated annual earning statement for tax filing purposes.
              </p>
              <button type="button" onClick={handleExportData} className="mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-[#1876f2] hover:text-[#1669da]">
                Download Annual Report
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className={`${cardClassName} p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569]">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0f172a]">Payment Inquiry?</h3>
              <p className="mt-2 max-w-[460px] text-[15px] leading-7 text-[#64748b]">
                If you notice any discrepancies in your settlement, our finance support team is here to help.
              </p>
              <Link href={localizePath("/creator/tickets/new", locale)} className="mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-[#0f172a] hover:text-[#1876f2]">
                Contact Finance Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
