"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  X,
  ArrowRight,
  Banknote,
  Building2,
  CircleHelp,
  Download,
  Loader2,
} from "lucide-react";
import { creatorApi } from "@/lib/api";
import { CreatorAirwallexBeneficiaryForm } from "@/components/features/CreatorAirwallexBeneficiaryForm";
import { SettlementRulesExplanation } from "@/components/features/SettlementRulesExplanation";
import { CreatorTierBadge } from "@/components/creator/CreatorTierBadge";
import { ReserveBalanceDisplay } from "@/components/creator/ReserveBalanceDisplay";
import { getAirwallexVerificationDetail } from "@/lib/airwallex";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type {
  CreatorSettlementOverview,
  CreatorSettlementStatement,
} from "@/types/creator";
import { useCreatorI18n } from "../_lib/creator-i18n";

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

type StatementFilter = "all" | "paid" | "pending" | "generated" | "confirmed" | "processing" | "disputed" | "held" | "rejected";
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
  if (status === "generated") return "generated";
  if (status === "confirmed") return "confirmed";
  if (status === "processing") return "processing";
  if (status === "disputed") return "disputed";
  if (status === "held") return "held";
  if (status === "rejected") return "rejected";
  return "pending";
}

export default function CreatorSettlementsPage() {
  const locale = useLocale();
  const { t, formatCurrency, formatDate } = useCreatorI18n();
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [beneficiaryDefaults, setBeneficiaryDefaults] = useState<Record<string, unknown> | null>(null);
  const [beneficiaryTransferMethods, setBeneficiaryTransferMethods] = useState<string[]>([]);
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
    return overview.statements.reduce((sum, statement) => {
      if (
        statement.status === "confirmed"
        || statement.status === "generated"
        || statement.status === "processing"
      ) {
        return sum + statement.creatorShareUsd;
      }
      return sum;
    }, 0);
  }, [overview]);

  const manageBankAccountLabel = useMemo(
    () => (overview?.bankAccount.airwallexBeneficiary?.beneficiaryId ? t("Change bank account") : t("Add bank account")),
    [overview?.bankAccount.airwallexBeneficiary?.beneficiaryId, t],
  );
  const bankAccountChangeLocked = Boolean(overview?.summary.bankAccountChangeLocked && overview?.bankAccount.airwallexBeneficiary?.beneficiaryId);
  const bankAccountChangeBlockedReason = overview?.summary.bankAccountChangeBlockedReason || "";
  const airwallexVerificationDetail = useMemo(
    () => getAirwallexVerificationDetail({
      code: overview?.bankAccount.airwallexBeneficiary?.verificationCode,
      message: overview?.bankAccount.airwallexBeneficiary?.verificationMessage,
      accountNameMatchResult: overview?.bankAccount.airwallexBeneficiary?.verificationAccountNameMatchResult,
    }),
    [
      overview?.bankAccount.airwallexBeneficiary?.verificationAccountNameMatchResult,
      overview?.bankAccount.airwallexBeneficiary?.verificationCode,
      overview?.bankAccount.airwallexBeneficiary?.verificationMessage,
    ],
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

  const handleOpenAirwallexForm = async () => {
    if (!token) {
      toast(t("Please sign in again to manage your payout account."), "error");
      return;
    }
    if (bankAccountChangeLocked) {
      toast(bankAccountChangeBlockedReason || t("Finish or cancel the current payout before changing this bank account."), "info");
      return;
    }

    try {
      setPayoutActionLoading(true);
      const beneficiaryId = overview?.bankAccount.airwallexBeneficiary?.beneficiaryId;
      if (beneficiaryId) {
        const response = await creatorApi.getAirwallexSettlementBeneficiary(token);
        setBeneficiaryDefaults((response.data?.beneficiary as Record<string, unknown> | null) || null);
        setBeneficiaryTransferMethods(response.data?.transferMethods || []);
      } else {
        setBeneficiaryDefaults(null);
        setBeneficiaryTransferMethods(["LOCAL"]);
      }
      setShowBeneficiaryForm(true);
    } catch (error) {
      toast(error instanceof Error ? error.message : t("Failed to open Airwallex beneficiary form."), "error");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleAirwallexSaved = async () => {
    await refreshOverview();
    setShowBeneficiaryForm(false);
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
          {t("Export Data")}
        </button>
      </div>

      <section className={`${cardClassName} relative overflow-hidden p-6 md:p-7`}>
        <div className="absolute right-0 top-0 h-full w-[240px] bg-[linear-gradient(135deg,rgba(24,118,242,0.15),rgba(24,118,242,0.04))] [clip-path:polygon(30%_0,100%_0,100%_65%,10%_45%)]" />
        <button
          type="button"
          onClick={() => setShowRulesModal(true)}
          className="absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe3ec] bg-white/90 text-[#475569] shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:border-[#bfdbfe] hover:text-[#1876f2] md:right-6 md:top-6"
          aria-label={t("Open settlement rules")}
        >
          <CircleHelp className="h-5 w-5" />
        </button>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{t("Current Balance")}</p>
            <p className="mt-2 text-[46px] font-black tracking-[-0.05em] text-[#0f172a]">{formatCurrency(overview?.summary.availableBalanceUsd || 0)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-6 text-[15px] text-[#64748b]">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Next Payout")}</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatDate(overview?.summary.nextSettlementDate)}</p>
              </div>
              <div className="h-10 w-px bg-[#e2e8f0]" />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Estimated")}</p>
                <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{formatCurrency(estimatedPayout)}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#monthly-statements"
                className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-6 text-[15px] font-bold text-white transition hover:bg-[#1669da]"
              >
                {t("Withdraw Funds")}
              </Link>
              <Link
                href="#monthly-statements"
                className="inline-flex h-11 items-center rounded-2xl bg-[#e8f1ff] px-6 text-[15px] font-bold text-[#1876f2] transition hover:bg-[#dbeafe]"
              >
                {t("View Payout History")}
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

      {/* Creator Tier Badge */}
      {overview?.tier && (
        <section className={`${cardClassName} p-6 md:p-7`}>
          <CreatorTierBadge tier={overview.tier} showDetails={true} />
        </section>
      )}

      {/* Reserve Balance Display */}
      {overview?.reserveBalance && (
        <section className={`${cardClassName} p-6 md:p-7`}>
          <ReserveBalanceDisplay
            currentReserveUsd={overview.reserveBalance.currentReserveUsd}
            expectedReturnDate={overview.reserveBalance.expectedReturnDate}
            lastMonthRefundsUsd={overview.reserveBalance.lastMonthRefundsUsd}
          />
        </section>
      )}

      <section className={`${cardClassName} p-6 md:p-7`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">{t("Bank Account")}</h2>
          <button
            type="button"
            onClick={handleOpenAirwallexForm}
            disabled={payoutActionLoading}
            className={`inline-flex h-11 items-center rounded-2xl px-5 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${bankAccountChangeLocked ? "bg-[#94a3b8] hover:bg-[#94a3b8]" : "bg-[#1876f2] hover:bg-[#1669da]"}`}
          >
            {payoutActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Opening Airwallex...")}
              </>
            ) : (
              manageBankAccountLabel
            )}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="rounded-[24px] border border-[#d9e9ff] bg-[linear-gradient(180deg,#f8fbff,#ffffff)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1876f2]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[18px] font-bold text-[#0f172a]">
                    {overview?.bankAccount.bankName || t("No bank account connected")}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(overview?.bankAccount.verificationStatus || "missing")}`}>
                    {overview?.bankAccount.verificationLabel ? t(overview.bankAccount.verificationLabel) : t("Missing")}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Account holder")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-[#0f172a]">
                      {overview?.bankAccount.accountHolderName || t("Not added yet")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Account number")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-[#0f172a]">
                      {overview?.bankAccount.accountNumberMasked || t("Not added yet")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Country")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-[#0f172a]">
                      {overview?.bankAccount.country || t("Not added yet")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Currency")}</p>
                    <p className="mt-2 text-[15px] font-semibold text-[#0f172a]">
                      {overview?.bankAccount.currency || t("Not added yet")}
                    </p>
                  </div>
                </div>
                {overview?.bankAccount.airwallexBeneficiary?.email ? (
                  <p className="mt-4 text-[14px] text-[#64748b]">{overview.bankAccount.airwallexBeneficiary.email}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#f8fafc] p-4">
            <div className="rounded-[20px] bg-white p-5 shadow-[inset_0_0_0_1px_#edf2f7]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{t("Account Management")}</p>
              <p className="mt-3 text-[18px] font-bold text-[#0f172a]">
                {overview?.bankAccount.airwallexBeneficiary?.beneficiaryId ? t("Bank account connected") : t("Add your payout bank account")}
              </p>
              <p className="mt-2 text-[14px] text-[#64748b]">
                {bankAccountChangeLocked
                  ? bankAccountChangeBlockedReason
                  : overview?.bankAccount.updatedAt
                  ? t("Last updated __ARG_0__", formatDate(overview.bankAccount.updatedAt))
                  : t("No bank account information added yet")}
              </p>
              {airwallexVerificationDetail ? (
                <p className="mt-3 text-[13px] text-[#b45309]">
                  {airwallexVerificationDetail}
                </p>
              ) : null}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleOpenAirwallexForm}
                  disabled={payoutActionLoading}
                  className={`inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${bankAccountChangeLocked ? "bg-[#94a3b8] hover:bg-[#94a3b8]" : "bg-[#1876f2] hover:bg-[#1669da]"}`}
                >
                  {payoutActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Opening Airwallex...")}
                    </>
                  ) : (
                    manageBankAccountLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="monthly-statements" className={`${cardClassName} overflow-hidden`}>
        <div className="border-b border-[#edf2f7] px-6 py-5 md:px-7">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">{t("Monthly Settlement Statements")}</h2>
          <div className="mt-5 inline-flex rounded-full bg-[#f1f5f9] p-1">
            {([
              ["all", "All"],
              ["paid", "Paid"],
              ["pending", "Pending"],
              ["generated", "Generated"],
              ["confirmed", "Confirmed"],
              ["processing", "Processing"],
              ["held", "Held"],
              ["disputed", "Disputed"],
              ["rejected", "Rejected"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${filter === value ? "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.06)]" : "text-[#64748b] hover:text-[#0f172a]"}`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#fbfdff] text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                <th className="px-6 py-4 md:px-7">{t("Settlement Period")}</th>
                <th className="px-6 py-4">{t("Statement ID")}</th>
                <th className="px-6 py-4">{t("Total Earnings")}</th>
                <th className="px-6 py-4">{t("Status")}</th>
                <th className="px-6 py-4 text-right">{t("Action")}</th>
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
                        {t("Review")}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownloadStatementPdf(statement.id)}
                        disabled={downloadingId === statement.id}
                        className="text-[16px] font-semibold text-[#1876f2] hover:text-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingId === statement.id ? t("Downloading...") : t("Download")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredStatements.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[14px] text-[#64748b]">
                    {t("No statements found for this filter.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-5 text-[14px] text-[#64748b] md:px-7">
          <span>{t("Showing __ARG_0__ of __ARG_1__ statements", filteredStatements.length, overview?.statements.length || 0)}</span>
          <div className="flex items-center gap-2">
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe3ec] bg-white text-[#94a3b8]">‹</button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe3ec] bg-white text-[#475569]">›</button>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <section className={`${cardClassName} p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569]">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0f172a]">{t("Payment Inquiry?")}</h3>
              <p className="mt-2 max-w-[460px] text-[15px] leading-7 text-[#64748b]">
                {t("If you notice any discrepancies in your settlement, our finance support team is here to help.")}
              </p>
              <Link href={localizePath("/creator/tickets/new", locale)} className="mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-[#0f172a] hover:text-[#1876f2]">
                {t("Contact Finance Support")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {showBeneficiaryForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/45 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowBeneficiaryForm(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[calc(100vh-48px)] w-full max-w-[1080px] overflow-y-auto">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBeneficiaryForm(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0f172a] shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:bg-white"
                aria-label={t("Close bank account form")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CreatorAirwallexBeneficiaryForm
              token={token || ""}
              locale={locale}
              existingSummary={overview?.bankAccount.airwallexBeneficiary || null}
              existingBeneficiary={beneficiaryDefaults}
              existingTransferMethods={beneficiaryTransferMethods}
              onSaved={handleAirwallexSaved}
              onClose={() => setShowBeneficiaryForm(false)}
            />
          </div>
        </div>
      ) : null}

      {showRulesModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/45 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowRulesModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[calc(100vh-48px)] w-full max-w-[1040px] flex-col overflow-hidden rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-5 py-4 md:px-6">
              <div>
                <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#0f172a]">{t("Settlement Rules")}</h2>
                <p className="mt-1 text-sm text-[#64748b]">{t("Review the payout logic without leaving the settlement workflow.")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe3ec] bg-white text-[#475569] transition hover:border-[#bfdbfe] hover:text-[#1876f2]"
                aria-label={t("Close settlement rules")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5 md:px-6 md:py-6">
              <SettlementRulesExplanation />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
