"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

export default function CreatorApplyStatusPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const result = String(searchParams.get("result") || "").toLowerCase();
  const failed = result === "failed";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-[960px] items-center px-4 py-10 md:px-6">
      <div className="w-full rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-1 text-sm font-semibold text-[#c2410c]">
          <AlertTriangle className="h-4 w-4" />
          Application Feedback
        </div>
        <h1 className="text-3xl font-bold text-[#0f172a]">
          {failed ? "Submission Failed" : "Application Status"}
        </h1>
        <p className="mt-3 text-base text-[#64748b]">
          {failed
            ? "We could not submit your application this time. Please review your details and try again."
            : "Your application has been received. You can continue to monitor review progress from the pending page."}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {failed ? (
            <Link
              href={localizePath("/creator/apply/review", locale)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1668d1]"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry Submission
            </Link>
          ) : (
            <Link
              href={localizePath("/creator/pending", locale)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1668d1]"
            >
              View Pending Status
            </Link>
          )}

          <Link
            href={localizePath("/creator", locale)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Landing
          </Link>
        </div>
      </div>
    </section>
  );
}
