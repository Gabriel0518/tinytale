"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Circle,
  Clock,
  Flag,
  Info,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

const STEPS = [
  { label: "Submission", key: "submission" },
  { label: "Screening", key: "screening" },
  { label: "Creative Review", key: "creative_review" },
  { label: "Final Approval", key: "final_approval" },
  { label: "Completed", key: "completed" },
] as const;

function statusToStep(status: string): number {
  switch (status) {
    case "pending":
      return 1;
    case "under_review":
    case "in_review":
      return 2;
    case "final_review":
      return 3;
    case "approved":
    case "completed":
      return 5;
    default:
      return 1;
  }
}

function statusLabel(status: string): { title: string; description: string } {
  switch (status) {
    case "pending":
      return {
        title: "Submitted",
        description:
          "Your application has been received and is waiting for initial screening.",
      };
    case "under_review":
    case "in_review":
      return {
        title: "Under Review",
        description:
          "Your application is currently being evaluated by our creative team.",
      };
    case "final_review":
      return {
        title: "Final Review",
        description:
          "Your application is in the final approval stage. Almost there!",
      };
    default:
      return {
        title: "Under Review",
        description:
          "Your application is currently being evaluated by our creative team.",
      };
  }
}

function StepIcon({
  index,
  activeStep,
}: {
  index: number;
  activeStep: number;
}) {
  const isCompleted = index < activeStep;
  const isCurrent = index === activeStep;

  if (isCompleted) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1876f2] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
        <Check className="h-[11px] w-[11px] text-white" strokeWidth={3} />
      </div>
    );
  }

  if (isCurrent) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#1876f2] bg-white shadow-[0_0_0_4px_rgba(24,118,242,0.2),0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
        <Circle className="h-2 w-2 fill-[#1876f2] text-[#1876f2]" />
      </div>
    );
  }

  const icons = [null, null, null, Lock, Flag];
  const Icon = icons[index] || Lock;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white text-[#94a3b8]">
      <Icon className="h-[14px] w-[11px]" />
    </div>
  );
}

export default function CreatorPendingPage() {
  const { token } = useAuth();
  const locale = useLocale();
  const [status, setStatus] = useState("under_review");
  const [applicationId, setApplicationId] = useState("#TT-00000");
  const [lastUpdated, setLastUpdated] = useState("a few moments ago");

  useEffect(() => {
    if (!token) return;
    creatorApi.getApplicationStatus(token).then((res: any) => {
      const s = String(
        res?.data?.applicationStatus ||
          res?.data?.status ||
          res?.data?.application?.status ||
          res?.data?.creator?.status ||
          "under_review"
      ).toLowerCase();
      setStatus(s);

      const id =
        res?.data?.applicationId ||
        res?.data?.application?.id ||
        res?.data?.id ||
        "";
      if (id) setApplicationId(`#TT-${String(id).slice(-5).toUpperCase()}`);

      const updated =
        res?.data?.updatedAt ||
        res?.data?.application?.updatedAt ||
        "";
      if (updated) {
        const diff = Date.now() - new Date(updated).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) setLastUpdated("a few moments ago");
        else if (hours < 24) setLastUpdated(`${hours} hour${hours > 1 ? "s" : ""} ago`);
        else {
          const days = Math.floor(hours / 24);
          setLastUpdated(`${days} day${days > 1 ? "s" : ""} ago`);
        }
      }
    }).catch(() => {});
  }, [token]);

  const activeStep = statusToStep(status);
  const { title, description } = statusLabel(status);
  const progressPercent = Math.min(
    (activeStep / (STEPS.length - 1)) * 100,
    100
  );

  return (
    <div className="relative flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#f5f7f8]">
      {/* Blurred background content (simulated) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden blur-[2px]">
        <div className="absolute inset-0 bg-white/20 mix-blend-saturation" />
        <div className="mx-auto mt-[81px] w-full max-w-[1024px] px-10">
          <div className="mt-20 h-12 w-64 rounded-2xl bg-[#e2e8f0]" />
          <div className="mt-[24px] h-4 w-full rounded-lg bg-[#e2e8f0]" />
          <div className="mt-2 h-4 w-4/5 rounded-lg bg-[#e2e8f0]" />
          <div className="mt-16 grid grid-cols-3 gap-6">
            <div className="h-64 rounded-3xl bg-[#e2e8f0]" />
            <div className="h-64 rounded-3xl bg-[#e2e8f0]" />
            <div className="h-64 rounded-3xl bg-[#e2e8f0]" />
          </div>
        </div>
      </div>

      {/* Modal overlay backdrop */}
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[6px]" />

      {/* Application Status Modal */}
      <div className="relative z-10 mx-4 w-full max-w-[672px] overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white p-px shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-8 pb-4 pt-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#0f172a]">
              Application Status
            </h1>
            <p className="text-base text-[#64748b]">
              Check the progress of your TinyTale submission.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-[rgba(24,118,242,0.1)] px-4 py-2 text-sm font-semibold text-[#1876f2]">
            ID: {applicationId}
          </div>
        </div>

        {/* Current State Banner */}
        <div className="mx-8 mb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(24,118,242,0.2)] bg-[rgba(24,118,242,0.05)] p-[17px]">
            <Info className="h-5 w-5 shrink-0 text-[#1876f2]" />
            <div>
              <p className="text-base font-medium text-[#0f172a]">{title}</p>
              <p className="text-sm text-[#64748b]">{description}</p>
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="relative mx-8 flex items-center justify-between py-10">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[#f1f5f9]" />
          {/* Active progress line */}
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-[#1876f2] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />

          {STEPS.map((step, i) => {
            const isCurrent = i === activeStep;
            const isCompleted = i < activeStep;
            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center"
              >
                <StepIcon index={i} activeStep={activeStep} />
                <p
                  className={`mt-4 whitespace-nowrap text-xs ${
                    isCurrent
                      ? "font-bold text-[#1876f2]"
                      : isCompleted
                        ? "font-semibold text-[#0f172a]"
                        : "font-semibold text-[#94a3b8]"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer / Action Area */}
        <div className="flex items-center justify-between border-t border-[#f1f5f9] px-8 py-8">
          <p className="flex items-center gap-2 text-sm text-[#64748b]">
            <Clock className="h-3 w-3" />
            Last updated {lastUpdated}
          </p>
          <Link
            href={localizePath("/creator", locale)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
          >
            <ArrowLeft className="h-[9px] w-[9px]" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
