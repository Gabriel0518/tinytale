import Link from "next/link";
import { ArrowLeft, Check, Circle, Flag, Info, Lock, Timer } from "lucide-react";

export default function CreatorPendingPage() {
  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#98a0ae] p-4 md:p-6">
      <div className="w-full max-w-[672px] overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between px-8 pb-4 pt-8">
          <div>
            <h1 className="text-[36px] font-bold leading-none tracking-[-0.04em] text-[#111827]">
              Application Status
            </h1>
            <p className="mt-4 text-2xl font-normal leading-none text-[#64748b]">
              Check the progress of your TinyTale submission.
            </p>
          </div>
          <div className="rounded-2xl bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1876f2]">
            ID: #TT-88291
          </div>
        </div>

        <div className="mx-8 rounded-2xl border border-[#bfd7ff] bg-[#f6fafe] px-4 py-3">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-[#1876f2]" />
            <div>
              <p className="text-2xl font-medium leading-none text-[#111827]">Under Review</p>
              <p className="mt-2 text-lg font-normal leading-none text-[#64748b]">
                Your application is currently being evaluated by our creative team.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-10 pt-10">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[#e5eaf0]" />
            <div className="absolute left-0 right-1/2 top-1/2 h-1 -translate-y-1/2 bg-[#1876f2]" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1876f2] text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
                <Check className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold text-[#111827]">Submission</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1876f2] text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
                <Check className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold text-[#111827]">Screening</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#1876f2] bg-white shadow-[0_0_0_4px_rgba(24,118,242,0.2),0_10px_15px_-3px_rgba(0,0,0,0.1)]">
                <Circle className="h-2 w-2 fill-[#1876f2] text-[#1876f2]" />
              </div>
              <p className="mt-3 text-xs font-bold text-[#1876f2]">Creative Review</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white text-[#94a3b8]">
                <Lock className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs font-semibold text-[#94a3b8]">Final Approval</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white text-[#94a3b8]">
                <Flag className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs font-semibold text-[#94a3b8]">Completed</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#f1f5f9] px-8 py-8">
          <p className="flex items-center gap-2 text-sm text-[#64748b]">
            <Timer className="h-4 w-4" />
            Last updated 2 hours ago
          </p>
          <Link
            href="/creator"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111f3a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
