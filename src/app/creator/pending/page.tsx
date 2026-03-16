"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, Flag, Info, Lock } from "lucide-react";
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
      <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#2A79F4] shadow-[0_10px_18px_-8px_rgba(42,121,244,0.85)]">
        <Check className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
      </div>
    );
  }

  if (isCurrent) {
    return (
      <div className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[4px] border-[#2A79F4] bg-white shadow-[0_0_0_5px_rgba(42,121,244,0.24)]">
        <span className="h-[9px] w-[9px] rounded-full bg-[#2A79F4]" />
      </div>
    );
  }

  const Icon = index === 4 ? Flag : Lock;
  return (
    <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-[#D0DAE8] bg-[#F8FAFD] text-[#A0AEC5]">
      <Icon className="h-[16px] w-[16px]" strokeWidth={1.8} />
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

    creatorApi
      .getApplicationStatus(token)
      .then((res: any) => {
        const currentStatus = String(
          res?.data?.applicationStatus ||
            res?.data?.status ||
            res?.data?.application?.status ||
            res?.data?.creator?.status ||
            "under_review"
        ).toLowerCase();

        setStatus(currentStatus);

        const id =
          res?.data?.applicationId ||
          res?.data?.application?.id ||
          res?.data?.id ||
          "";
        if (id) {
          setApplicationId(`#TT-${String(id).slice(-5).toUpperCase()}`);
        }

        const updated =
          res?.data?.updatedAt ||
          res?.data?.application?.updatedAt ||
          "";

        if (!updated) return;

        const diff = Date.now() - new Date(updated).getTime();
        const hours = Math.floor(diff / 3600000);

        if (hours < 1) {
          setLastUpdated("a few moments ago");
        } else if (hours < 24) {
          setLastUpdated(`${hours} hour${hours > 1 ? "s" : ""} ago`);
        } else {
          const days = Math.floor(hours / 24);
          setLastUpdated(`${days} day${days > 1 ? "s" : ""} ago`);
        }
      })
      .catch(() => {
        // Keep fallback values when status API fails.
      });
  }, [token]);

  const activeStep = statusToStep(status);
  const { title, description } = statusLabel(status);
  const progressSteps = Math.min(activeStep, STEPS.length - 1);
  const progressWidth = (progressSteps / (STEPS.length - 1)) * 80;

  return (
    <div className="relative min-h-[calc(100vh-65px)]">
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-[rgba(148,158,176,0.56)] backdrop-blur-[9px]">
        <div className="absolute inset-x-0 top-0 h-[72px] border-b border-[rgba(203,213,225,0.58)] bg-[rgba(255,255,255,0.34)]" />
        <div className="absolute left-10 top-4 flex items-center gap-3 opacity-70">
          <div className="h-8 w-8 rounded-full bg-[#2A79F4]" />
          <div className="h-4 w-20 rounded-full bg-[#4F5E78]" />
        </div>
        <div className="absolute right-10 top-4 h-8 w-8 rounded-full bg-[#8E9EB6] opacity-70" />

        <div className="mx-auto mt-28 w-full max-w-[1040px] px-8 opacity-55">
          <div className="h-12 w-72 rounded-2xl bg-[#9AA8BF]" />
          <div className="mt-7 h-3.5 w-full rounded-lg bg-[#9AA8BF]" />
          <div className="mt-3 h-3.5 w-3/4 rounded-lg bg-[#9AA8BF]" />
          <div className="mt-14 h-[258px] rounded-[26px] bg-[#9AA8BF]" />
        </div>
      </div>

      <div className="relative z-50 flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-8 md:py-10">
        <section className="w-full max-w-[724px] overflow-hidden rounded-[28px] border border-[#E1E8F2] bg-[#F8FAFD] shadow-[0_36px_86px_-30px_rgba(15,23,42,0.64)]">
          <div className="px-5 pb-7 pt-8 sm:px-7 md:px-9 md:pb-8 md:pt-10">
            <div className="flex items-start justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-[#131C31] sm:text-[38px] md:text-[42px]">
                  Application Status
                </h1>
                <p className="mt-2 text-[14px] leading-[1.35] text-[#617593] md:text-[15px]">
                  Check the progress of your TinyTale submission.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-[#E6EEF9] px-4 py-2 text-[14px] font-semibold leading-none text-[#2A79F4] sm:px-5 sm:py-2.5 sm:text-[16px]">
                ID: {applicationId}
              </div>
            </div>

            <div className="mt-7 rounded-[17px] border border-[#B9D3FB] bg-[#EAF1F8] px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <Info className="mt-[1px] h-[22px] w-[22px] shrink-0 text-[#2A79F4]" strokeWidth={2} />
                <div>
                  <p className="text-[20px] font-semibold leading-[1.2] text-[#1A2438] sm:text-[22px]">
                    {title}
                  </p>
                  <p className="mt-1 text-[15px] leading-[1.3] text-[#617593]">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-9 pb-1 md:mt-11">
              <div className="absolute left-[10%] right-[10%] top-[21px] h-[4px] rounded-full bg-[#E2E8F0]" />
              <div
                className="absolute left-[10%] top-[21px] h-[4px] rounded-full bg-[#2A79F4] transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              />

              <div className="grid grid-cols-5">
                {STEPS.map((step, i) => {
                  const isCurrent = i === activeStep;
                  const isCompleted = i < activeStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <StepIcon index={i} activeStep={activeStep} />
                      <p
                        className={`mt-4 whitespace-nowrap text-[12px] leading-none sm:text-[13px] md:text-[15px] ${
                          isCurrent
                            ? "font-semibold text-[#2A79F4]"
                            : isCompleted
                              ? "font-semibold text-[#1A2438]"
                              : "font-semibold text-[#93A3BC]"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-6 sm:px-7 md:px-9 md:py-8">
            <p className="flex items-center gap-2.5 text-[13px] text-[#647896] md:text-[14px]">
              <Clock3 className="h-[16px] w-[16px] text-[#7389A8]" strokeWidth={2} />
              Last updated {lastUpdated}
            </p>

            <Link
              href={localizePath("/creator", locale)}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#0E1A3E] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#111F48] md:px-8 md:py-3"
            >
              <ArrowLeft className="h-[16px] w-[16px]" strokeWidth={2.2} />
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
