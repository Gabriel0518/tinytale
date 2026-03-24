"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type {
  CreatorSettlementBankStatus,
  CreatorSettlementOverview,
  CreatorSettlementStatement,
} from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

type StatementFilter = "all" | "paid" | "pending" | "processing" | "disputed" | "held";
function statusBadgeClass(status: CreatorSettlementStatement["status"] | CreatorSettlementOverview["summary"]["bankStatus"]) {
  switch (status) {
    case "paid":
    case "verified":
      return "bg-[#dcfce7] text-[#166534]";
    case "processing":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "confirmed":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "generated":
      return "bg-[#fef3c7] text-[#b45309]";
    case "held":
      return "bg-[#fee2e2] text-[#b91c1c]";
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
  if (status === "processing") return "processing";
  if (status === "disputed") return "disputed";
  if (status === "held") return "held";
  return "pending";
}

function getStripePayoutAction(status: CreatorSettlementBankStatus) {
  switch (status) {
    case "verified":
      return {
        primaryLabel: "Manage Stripe Payout Account",
        secondaryLabel: "Review Stripe Status",
        helper:
          "Your payout profile is already on file. Use Stripe to update account details, ownership information, or payout settings without re-entering banking data in TinyTale.",
      };
    case "pending_review":
      return {
        primaryLabel: "Continue Stripe Onboarding",
        secondaryLabel: "Review Stripe Status",
        helper:
          "Your payout setup is in progress. Finish the Stripe-hosted onboarding flow to confirm banking details and clear any remaining verification requirements.",
      };
    case "rejected":
      return {
        primaryLabel: "Fix Payout Details in Stripe",
        secondaryLabel: "Review Stripe Status",
        helper:
          "Stripe or finance still needs updated payout information. Re-open the hosted payout flow to correct the blocked details instead of editing a local bank form.",
      };
    default:
      return {
        primaryLabel: "Create Stripe Payout Account",
        secondaryLabel: "Why Stripe Setup?",
        helper:
          "TinyTale now uses Stripe-hosted onboarding for payout setup. Stripe collects and manages your payout details securely so banking verification can happen outside the creator dashboard.",
      };
  }
}

export default function CreatorSettlementsPage() {
  const locale = useLocale();
  const { t, formatCurrency, formatDate } = useCreatorI18n();
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payoutActionLoading, setPayoutActionLoading] = useState<"create" | "manage" | "status" | null>(null);
  const [filter, setFilter] = useState<StatementFilter>("all");
  const [overview, setOverview] = useState<CreatorSettlementOverview | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const authToken: string = token;
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      try {
        const response = await creatorApi.getSettlementOverview(authToken);
        if (!response.success || cancelled) return;
        setOverview(response.data);
      } catch (error) {
        if (!cancelled) {
          toast(error instanceof Error ? error.message : t("Failed to load settlements."), "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [t, toast, token]);

  async function refreshOverview() {
    if (!token) return null;
    const authToken: string = token;
    try {
      const response = await creatorApi.getSettlementOverview(authToken);
      if (!response.success) return null;
      setOverview(response.data);
      return response.data;
    } catch (error) {
      toast(error instanceof Error ? error.message : t("Failed to load settlements."), "error");
      return null;
    }
  }

  const filteredStatements = useMemo(() => {
    const statements = overview?.statements || [];
    if (filter === "all") return statements;
    return statements.filter((statement) => mapStatementFilter(statement.status) === filter);
  }, [overview, filter]);

  const estimatedPayout = useMemo(() => {
    if (!overview) return 0;
    const candidate = overview.statements.find(
      (statement) =>
        statement.status === "confirmed"
        || statement.status === "generated"
        || statement.status === "processing",
    );
    return candidate?.creatorShareUsd || 0;
  }, [overview]);

  const stripePayoutAction = useMemo(
    () => getStripePayoutAction(overview?.bankAccount.verificationStatus || "missing"),
    [overview?.bankAccount.verificationStatus],
  );

  const handleExportData = () => {
    if (!overview?.statements.length) {
      toast(t("No statement data available to export."), "info");
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

  const handleStripePayoutAction = async (mode: "create" | "manage" | "status") => {
    if (!token) {
      toast(t("Please sign in again to manage your payout account."), "error");
      return;
    }

    const bankStatus = overview?.bankAccount.verificationStatus || "missing";

    try {
      setPayoutActionLoading(mode);

      if (mode === "status") {
        if (bankStatus === "missing") {
          toast(
            t("Stripe-hosted onboarding collects and verifies your payout account securely. Start onboarding from the primary button when you are ready."),
            "info",
          );
          return;
        }

        await refreshOverview();
        toast(t("Stripe payout status has been refreshed."), "success");
        return;
      }

      const shouldUseOnboarding =
        mode === "create" || bankStatus === "pending_review" || bankStatus === "rejected";
      const response = shouldUseOnboarding
        ? await creatorApi.createStripeSettlementOnboardingLink(token)
        : await creatorApi.createStripeSettlementDashboardLink(token);

      const launchUrl = response.data?.url;
      if (!launchUrl) {
        throw new Error(t("Stripe did not return a payout link."));
      }

      window.location.href = launchUrl;
    } catch (error) {
      toast(error instanceof Error ? error.message : t("Failed to open Stripe payout flow."), "error");
    } finally {
      setPayoutActionLoading(null);
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
      toast(error instanceof Error ? error.message : t("Failed to download statement PDF."), "error");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
          {t("Loading settlements...")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#0f172a] md:text-[40px]">{t("Settlement Center")}</h1>
          <p className="mt-2 max-w-[760px] text-[16px] leading-7 text-[#64748b] md:text-[18px]">
            {t("Manage your story earnings, view reports, and configure payouts.")}
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
            <p className="mt-2 text-[46px] font-black tracking-[-0.05em] text-[#0f172a]">{formatCurrency(overview?.summary.availableBalanceUsd || 0)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-6 text-[15px] text-[#64748b]">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Next Payout</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatDate(overview?.summary.nextSettlementDate)}</p>
              </div>
              <div className="h-10 w-px bg-[#e2e8f0]" />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Estimated</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatCurrency(estimatedPayout)}</p>
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
            <p className="mt-2 max-w-[720px] text-[15px] leading-7 text-[#64748b]">
              {t("Use Stripe-hosted onboarding to create and manage your payout account. TinyTale keeps the settlement workflow here, while Stripe handles payout-account collection and verification.")}
            </p>
          </div>
          <Landmark className="h-5 w-5 text-[#94a3b8]" />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[24px] border border-[#d9e9ff] bg-[linear-gradient(180deg,#f4f9ff,#ffffff)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f1ff] px-3 py-1 text-[12px] font-semibold text-[#1876f2]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Stripe-hosted onboarding
                </div>
                <h3 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-[#0f172a]">
                  {t(stripePayoutAction.primaryLabel)}
                </h3>
                <p className="mt-2 max-w-[640px] text-[15px] leading-7 text-[#64748b]">
                  {t(stripePayoutAction.helper)}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1876f2] shadow-[inset_0_0_0_1px_#d9e9ff]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-white px-4 py-4 shadow-[inset_0_0_0_1px_#edf2f7]">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Current payout profile</p>
                <p className="mt-2 text-[16px] font-bold text-[#0f172a]">
                  {overview?.bankAccount.bankName ? `${overview.bankAccount.bankName} ${overview.bankAccount.accountNumberMasked}` : t("No Stripe payout account connected")}
                </p>
                <p className="mt-1 text-[14px] text-[#64748b]">
                  {overview?.bankAccount.accountHolderName || t("Stripe setup starts from this card")}
                </p>
                {overview?.bankAccount.stripeConnect?.email ? (
                  <p className="mt-1 text-[13px] text-[#94a3b8]">
                    {overview.bankAccount.stripeConnect.email}
                  </p>
                ) : null}
              </div>
              <div className="rounded-[18px] bg-white px-4 py-4 shadow-[inset_0_0_0_1px_#edf2f7]">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Verification status</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(overview?.bankAccount.verificationStatus || "missing")}`}>
                    {overview?.bankAccount.verificationLabel || "Missing"}
                  </span>
                </div>
                <p className="mt-2 text-[14px] text-[#64748b]">
                  {overview?.bankAccount.updatedAt
                    ? t("Last synced __ARG_0__", formatDate(overview.bankAccount.updatedAt))
                    : t("The payout setup has not been started yet.")}
                </p>
                {overview?.bankAccount.stripeConnect?.requirementsCurrentlyDue?.length ? (
                  <p className="mt-1 text-[13px] text-[#b45309]">
                    {t("__ARG_0__ Stripe verification item(s) still need attention.", String(overview.bankAccount.stripeConnect.requirementsCurrentlyDue.length))}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleStripePayoutAction(overview?.bankAccount.verificationStatus === "missing" ? "create" : "manage")}
                disabled={payoutActionLoading !== null}
                className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-5 text-[14px] font-bold text-white transition hover:bg-[#1669da]"
              >
                {payoutActionLoading === "create" || payoutActionLoading === "manage" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Opening Stripe...")}
                  </>
                ) : (
                  t(stripePayoutAction.primaryLabel)
                )}
              </button>
              <button
                type="button"
                onClick={() => handleStripePayoutAction("status")}
                disabled={payoutActionLoading !== null}
                className="inline-flex h-11 items-center rounded-2xl border border-[#dbe3ec] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {payoutActionLoading === "status" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Refreshing...")}
                  </>
                ) : (
                  t(stripePayoutAction.secondaryLabel)
                )}
              </button>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#f8fafc] p-4">
            <div className="rounded-[20px] bg-white p-5 shadow-[inset_0_0_0_1px_#edf2f7]">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eff6ff] text-[#1876f2]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-[#0f172a]">
                    {overview?.bankAccount.bankName ? `${overview.bankAccount.bankName} ${overview.bankAccount.accountNumberMasked}` : t("No Stripe payout account connected")}
                  </p>
                  <p className="mt-1 text-[14px] text-[#64748b]">
                    {overview?.bankAccount.accountHolderName || t("Primary payout profile will appear here after Stripe setup")}
                  </p>
                  {overview?.bankAccount.providerLabel ? (
                    <p className="mt-1 text-[13px] text-[#94a3b8]">{overview.bankAccount.providerLabel}</p>
                  ) : null}
                </div>
                <span className={`ml-auto rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(overview?.bankAccount.verificationStatus || "missing")}`}>
                  {overview?.bankAccount.verificationLabel || "Missing"}
                </span>
              </div>
              <div className="mt-5 space-y-3 text-[14px] leading-6 text-[#64748b]">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#1876f2]" />
                  <p>{t("Create the payout account in Stripe from this page instead of typing full banking details into TinyTale.")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#1876f2]" />
                  <p>{t("Update or fix payout information from the same bank account card after onboarding has started.")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#1876f2]" />
                  <p>{t("Tax information still stays inside TinyTale so settlement review and statement confirmation remain in one workflow.")}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-[#edf2f7] pt-2">
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
            </div>
          </div>
        </div>
      </section>

      <section id="monthly-statements" className={`${cardClassName} overflow-hidden`}>
        <div className="border-b border-[#edf2f7] px-6 py-5 md:px-7">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">Monthly Settlement Statements</h2>
          <div className="mt-5 inline-flex rounded-full bg-[#f1f5f9] p-1">
            {([
              ["all", "All"],
              ["paid", "Paid"],
              ["pending", "Pending"],
              ["processing", "Processing"],
              ["held", "Held"],
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
                    <p className="text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{formatDate(statement.periodStart, { month: "long", year: "numeric" })}</p>
                    <p className="mt-1 text-[14px] text-[#64748b]">{formatDate(statement.periodStart, { month: "short", day: "numeric" })} - {formatDate(statement.periodEnd, { month: "short", day: "numeric" })}</p>
                  </td>
                  <td className="px-6 py-5 text-[16px] text-[#334155]">#{statement.statementNo}</td>
                  <td className="px-6 py-5 text-[18px] font-bold text-[#0f172a]">{formatCurrency(statement.creatorShareUsd)}</td>
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
