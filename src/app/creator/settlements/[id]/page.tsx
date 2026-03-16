"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  CircleCheck,
  Download,
  Equal,
  Loader2,
} from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/components/ui/Toast";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorSettlementDetail } from "@/types/creator";

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

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

function statusBadgeClass(status: CreatorSettlementDetail["statement"]["status"]) {
  switch (status) {
    case "paid":
      return "bg-[#dcfce7] text-[#166534]";
    case "confirmed":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "generated":
      return "bg-[#fef3c7] text-[#b45309]";
    case "disputed":
      return "bg-[#fee2e2] text-[#b91c1c]";
    default:
      return "bg-[#ede9fe] text-[#6d28d9]";
  }
}

function BreakdownCard({
  title,
  amount,
  helper,
  tone = "neutral",
}: {
  title: string;
  amount: string;
  helper: string;
  tone?: "neutral" | "negative" | "positive";
}) {
  const palette =
    tone === "negative"
      ? "border-[#fecaca] bg-[#fff8f8] text-[#dc2626]"
      : tone === "positive"
        ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1876f2]"
        : "border-[#edf2f7] bg-[#f8fafc] text-[#0f172a]";

  return (
    <div className={`min-w-[200px] rounded-[22px] border px-6 py-5 text-center ${palette}`}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em]">{title}</p>
      <p className="mt-3 text-[28px] font-black tracking-[-0.04em]">{amount}</p>
      <p className="mt-3 text-[13px] leading-6 opacity-80">{helper}</p>
    </div>
  );
}

function PlaceholderThumb({ src, alt }: { src: string; alt: string }) {
  if (src) {
    return <Image src={src} alt={alt} width={48} height={48} className="h-12 w-12 rounded-[18px] object-cover" />;
  }
  return <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f8fafc] text-sm text-[#cbd5e1]">--</div>;
}

export default function CreatorSettlementDetailPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { token } = useAuth();
  const { toast } = useToast();
  const statementId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [detail, setDetail] = useState<CreatorSettlementDetail | null>(null);

  useEffect(() => {
    if (!token || !statementId) {
      setLoading(false);
      return;
    }

    const authToken: string = token;
    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      try {
        const response = await creatorApi.getSettlementDetail(authToken, statementId);
        if (!response.success || cancelled) return;
        setDetail(response.data);
      } catch (error) {
        if (!cancelled) toast(error instanceof Error ? error.message : "Failed to load settlement detail.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [statementId, token, toast]);

  const readyLabel = useMemo(() => {
    if (!detail) return "Pending";
    if (detail.statement.readyForPayout) return "Ready for Payout";
    if (detail.statement.status === "disputed") return "Dispute in Review";
    return detail.statement.statusLabel;
  }, [detail]);

  const handleConfirmStatement = async () => {
    if (!token || !detail || !detail.confirmation.canConfirm) return;
    try {
      setConfirming(true);
      const response = await creatorApi.confirmSettlementStatement(token, detail.statement.id);
      setDetail((current) => current
        ? {
            ...current,
            statement: {
              ...current.statement,
              status: "confirmed",
              statusLabel: "Confirmed",
              readyForPayout: true,
            },
            confirmation: response.data,
          }
        : current);
      toast("Statement confirmed. Finance can now schedule payout.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to confirm statement.", "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token || !detail) return;
    try {
      setDownloading(true);
      const { blob, filename } = await creatorApi.downloadSettlementPdf(token, detail.statement.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to download settlement PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
          Loading settlement detail...
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={`${cardClassName} p-8 text-center`}>
        <p className="text-[18px] font-bold text-[#0f172a]">Settlement detail not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={localizePath("/creator/settlements", locale)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#334155] transition hover:bg-[#f8fafc]">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[15px] font-semibold text-[#64748b]">Settlement Details</p>
            <h1 className="text-[30px] font-black tracking-[-0.04em] text-[#0f172a]">Statement #{detail.statement.statementNo}</h1>
          </div>
        </div>
        <button type="button" onClick={handleDownloadPdf} disabled={downloading} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#1876f2] px-5 text-[15px] font-bold text-white transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </button>
      </div>

      <section className="flex flex-col gap-4 rounded-[28px] bg-[#eef3f8] px-6 py-6 md:flex-row md:items-start md:justify-between md:px-8 md:py-7">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${statusBadgeClass(detail.statement.status)}`}>
            {readyLabel}
          </span>
          <p className="mt-4 text-[18px] text-[#64748b]">
            <CalendarDays className="mr-2 inline h-4 w-4" />
            Period: {detail.statement.periodLabel}
          </p>
        </div>
        <div className="min-w-[280px] rounded-[28px] border border-[#dbe7f6] bg-white px-6 py-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Net Payout Amount</p>
          <p className="mt-2 text-[46px] font-black tracking-[-0.05em] text-[#1876f2]">{formatUsd(detail.statement.netPayoutUsd)}</p>
        </div>
      </section>

      <section className={`${cardClassName} overflow-hidden`}>
        <div className="border-b border-[#edf2f7] px-6 py-5 md:px-7">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">Financial Breakdown</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-10 md:px-10">
          <BreakdownCard title="Gross Revenue" amount={formatUsd(detail.financialBreakdown.grossRevenueUsd)} helper="Total ads & subs" />
          <div className="text-[32px] font-black text-[#cbd5e1]">-</div>
          <BreakdownCard title="Platform Fees" amount={`-${formatUsd(detail.financialBreakdown.platformFeesUsd)}`} helper={`${Math.round(detail.financialBreakdown.platformFeeRate * 100)}% standard rate`} tone="negative" />
          <div className="text-[32px] font-black text-[#cbd5e1]">-</div>
          <BreakdownCard title="Withholding Tax" amount={`-${formatUsd(detail.financialBreakdown.withholdingTaxUsd)}`} helper={`${Math.round(detail.financialBreakdown.withholdingTaxRate * 100)}% local withholding`} tone="negative" />
          <Equal className="h-7 w-7 text-[#cbd5e1]" />
          <BreakdownCard title="Net Payout" amount={formatUsd(detail.financialBreakdown.netPayoutUsd)} helper="Final amount" tone="positive" />
        </div>
      </section>

      <section className={`${cardClassName} overflow-hidden`}>
        <div className="flex items-center justify-between gap-4 border-b border-[#edf2f7] px-6 py-5 md:px-7">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">Episode Breakdown</h2>
          <p className="text-[14px] font-medium text-[#64748b]">Sorted by Earnings</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#fbfdff] text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                <th className="px-6 py-4 md:px-7">Series & Episode</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Gross Rev.</th>
                <th className="px-6 py-4">Fees</th>
                <th className="px-6 py-4 text-right">Net Earning</th>
              </tr>
            </thead>
            <tbody>
              {detail.episodeBreakdown.map((row) => (
                <tr key={row.id} className="border-t border-[#edf2f7] text-[15px] text-[#0f172a]">
                  <td className="px-6 py-5 md:px-7">
                    <div className="flex items-center gap-4">
                      <PlaceholderThumb src={row.thumbnail} alt={row.dramaTitle} />
                      <div>
                        <p className="text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{row.dramaTitle}</p>
                        <p className="mt-1 text-[14px] text-[#64748b]">{row.episodeLabel}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[16px] text-[#334155]">{row.views.toLocaleString("en-US")}</td>
                  <td className="px-6 py-5 text-[16px] text-[#334155]">{formatUsd(row.grossRevenueUsd)}</td>
                  <td className="px-6 py-5 text-[16px] text-[#dc2626]">-{formatUsd(row.feesUsd)}</td>
                  <td className="px-6 py-5 text-right text-[18px] font-bold text-[#0f172a]">{formatUsd(row.netEarningUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#bfd8ff] bg-[linear-gradient(180deg,#edf5ff,#f7fbff)] px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#0f172a]">Statement Confirmation</h2>
            <p className="mt-2 max-w-[720px] text-[15px] leading-7 text-[#475569]">
              Please review your financial breakdown. By confirming, you agree to the calculation and payment will be scheduled for the next payout cycle.
            </p>
            {detail.confirmation.confirmedAt ? (
              <p className="mt-3 text-[13px] font-medium text-[#1d4ed8]">Confirmed on {formatDate(detail.confirmation.confirmedAt)}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={localizePath("/creator/tickets/new", locale)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#dbe3ec] bg-white px-5 text-[15px] font-semibold text-[#334155] transition hover:bg-[#f8fafc]">
              <AlertTriangle className="h-4 w-4" />
              Open Dispute
            </Link>
            <button type="button" disabled={!detail.confirmation.canConfirm || confirming} onClick={handleConfirmStatement} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#1876f2] px-6 text-[15px] font-bold text-white transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />}
              {detail.confirmation.confirmedAt ? "Statement Confirmed" : "Confirm Statement"}
            </button>
          </div>
        </div>
      </section>

      <footer className="pb-2 text-center text-[14px] leading-7 text-[#94a3b8]">
        Having issues with your statement? Contact our <Link href={localizePath("/creator/tickets", locale)} className="font-semibold text-[#1876f2]">Creator Support</Link> team or check our <Link href={localizePath("/creator/settlements", locale)} className="font-semibold text-[#1876f2]">Settlement Guide</Link>.
      </footer>
    </div>
  );
}
