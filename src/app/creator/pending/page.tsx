"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, FileSearch, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import {
  CREATOR_APPLICATION_PROGRESS_LABELS,
  getCreatorApplicationProgress,
  getCreatorApplicationStatusMeta,
  normalizeCreatorApplicationStatus,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorApplicationStatus } from "@/types/creator";

function formatRelativeTime(value?: string): string {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CreatorPendingPage() {
  const { token } = useAuth();
  const locale = useLocale();
  const [status, setStatus] = useState<CreatorApplicationStatus>("under_review");
  const [applicationId, setApplicationId] = useState("TT-00000");
  const [updatedAt, setUpdatedAt] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!token) return;

    creatorApi
      .getApplicationStatus(token)
      .then((res: any) => {
        const normalized = normalizeCreatorApplicationStatus(
          res?.data?.applicationStatus || res?.data?.status || res?.data?.application?.status || res?.data?.creator?.status
        );
        setStatus(normalized);

        const rawId = res?.data?.applicationId || res?.data?.application?.applicationNo || res?.data?.application?.id || res?.data?.id;
        if (rawId) {
          const cleaned = String(rawId).replace(/^#?/, "").replace(/^TT-/, "TT-");
          setApplicationId(cleaned.startsWith("TT-") ? cleaned : `TT-${cleaned.slice(-5).toUpperCase()}`);
        }

        const updated = res?.data?.application?.updatedAt || res?.data?.application?.submittedAt || res?.data?.updatedAt || "";
        setUpdatedAt(updated);
        setRejectionReason(String(res?.data?.application?.rejectionReason || ""));
      })
      .catch(() => undefined);
  }, [token]);

  const progress = getCreatorApplicationProgress(status);
  const meta = getCreatorApplicationStatusMeta(status);
  const bannerTone = meta.tone === "warning" ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]" : meta.tone === "danger" ? "border-[#fecaca] bg-[#fff1f2] text-[#9f1239]" : meta.tone === "success" ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]" : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";
  const BannerIcon = meta.tone === "danger" ? CircleAlert : meta.tone === "success" ? CheckCircle2 : FileSearch;
  const progressWidth = useMemo(() => `${(progress / Math.max(CREATOR_APPLICATION_PROGRESS_LABELS.length - 1, 1)) * 100}%`, [progress]);

  return (
    <div className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#f5f7f8] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_34%)]" />
      <section className="relative mx-auto w-full max-w-[760px] rounded-[24px] border border-[#dbe2ea] bg-white p-5 shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Creator Application</p>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em] text-[#0f172a] md:text-[34px]">Application Status</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">Track your creator onboarding review. Approval unlocks the creator dashboard, drama uploads, analytics, and settlement views.</p>
          </div>
          <div className="rounded-full bg-[#eff6ff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">{applicationId}</div>
        </div>

        <div className={`mt-5 rounded-[20px] border px-4 py-3.5 ${bannerTone}`}>
          <div className="flex items-start gap-3">
            <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-[15px] font-bold">{meta.title}</p>
              <p className="mt-1 text-sm leading-6">{meta.description}</p>
              {rejectionReason ? <p className="mt-2 text-sm font-medium">Review note: {rejectionReason}</p> : null}
            </div>
          </div>
        </div>

        <div className="relative mt-6 rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-5">
          <div className="absolute left-[10%] right-[10%] top-[29px] h-1 rounded-full bg-[#e2e8f0]" />
          <div className="absolute left-[10%] top-[29px] h-1 rounded-full bg-[#1876f2]" style={{ width: progressWidth }} />
          <div className="grid grid-cols-4 gap-2">
            {CREATOR_APPLICATION_PROGRESS_LABELS.map((label, index) => {
              const active = index <= progress;
              const current = index === progress;
              return (
                <div key={label} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${active ? "border-[#1876f2] bg-white text-[#1876f2]" : "border-[#dbe2ea] bg-[#f8fafc] text-[#94a3b8]"}`}>
                    {active ? <ShieldCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.08em] ${current ? "text-[#1876f2]" : active ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Review Checklist</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#475569]">
              <li>Identity and contact information</li>
              <li>Creative genres and portfolio proof</li>
              <li>Document verification upload</li>
              <li>In-page creator agreement acceptance</li>
            </ul>
          </div>
          <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Last Update</p>
            <p className="mt-3 text-[18px] font-bold text-[#0f172a]">{formatRelativeTime(updatedAt)}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Standard target is within 48 hours, though revisions or additional checks may extend review.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-5">
          <Link href={localizePath("/creator", locale)} className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc]">
            <ArrowLeft className="h-4 w-4" />
            Back to Creator Home
          </Link>
          {status === "need_more_info" || status === "rejected" ? (
            <Link href={localizePath("/creator/apply/review", locale)} className="rounded-full bg-[#1876f2] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1669da]">
              Update Application
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
