"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import {
  CREATOR_TICKET_CATEGORY_OPTIONS,
  getCreatorTicketCategoryDescription,
} from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import type { CreatorTicketCategory, CreatorTicketPriority } from "@/types/creator";

const PRIORITY_OPTIONS: Array<{ value: CreatorTicketPriority; label: string; helper: string }> = [
  { value: "low", label: "Low", helper: "General questions with no active blocker." },
  { value: "medium", label: "Medium", helper: "Normal creator operations request." },
  { value: "high", label: "High", helper: "Revenue, review, or publishing blocker." },
  { value: "urgent", label: "Urgent", helper: "Critical issue affecting multiple titles or payouts." },
];

function getSuggestedReferences(category: CreatorTicketCategory): string[] {
  switch (category) {
    case "payment":
      return ["Settlement cycle", "Statement ID", "Affected drama title", "Expected vs actual amount"];
    case "content":
      return ["Drama title", "Review status", "Rejection or suspension note", "Requested correction"];
    case "policy":
      return ["Claim or notice number", "Rights owner name", "Affected title", "Supporting links"];
    case "account":
      return ["Account email", "Bank review state", "Profile change needed", "Steps already tried"];
    case "technical":
      return ["Drama or episode title", "Upload step", "Error text", "Browser or device"];
    default:
      return ["What happened", "When it started", "What is blocked", "Preferred outcome"];
  }
}

export default function CreatorTicketCreatePage() {
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuth();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<CreatorTicketCategory>("payment");
  const [priority, setPriority] = useState<CreatorTicketPriority>("medium");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedPriority = PRIORITY_OPTIONS.find((option) => option.value === priority) || PRIORITY_OPTIONS[1];
  const selectedCategory = CREATOR_TICKET_CATEGORY_OPTIONS.find((option) => option.value === category) || CREATOR_TICKET_CATEGORY_OPTIONS[0];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setError("Subject is required");
      return;
    }
    if (!cleanMessage) {
      setError("Message is required");
      return;
    }
    if (!token) {
      setError("Login required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res: any = await creatorApi.createTicket(token, {
        subject: cleanSubject,
        category,
        priority,
        message: cleanMessage,
      });
      const ticketId = res?.data?._id;
      if (ticketId) {
        router.push(localizePath(`/creator/tickets/${ticketId}`, locale));
        return;
      }
      router.push(localizePath("/creator/tickets", locale));
    } catch (err: any) {
      setError(err?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={localizePath("/creator/tickets", locale)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-semibold text-[#334155]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <section className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Creator Support</p>
            <h1 className="mt-2 text-[30px] font-black leading-[1.08] tracking-[-0.02em] text-[#0f172a] md:text-[34px]">Create Ticket</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              Use creator tickets when a settlement, review result, rights issue, account state, or upload problem needs manual support.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-[#475569] lg:max-w-sm">
            Tickets now follow the creator workflow. Pick the category that best matches the blocked operation so support can route it correctly.
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {CREATOR_TICKET_CATEGORY_OPTIONS.map((option) => {
            const active = option.value === category;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`rounded-2xl border p-3.5 text-left transition-colors ${
                  active ? "border-[#93c5fd] bg-[#f8fbff]" : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
                }`}
              >
                <p className="text-sm font-bold text-[#0f172a]">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{option.description}</p>
              </button>
            );
          })}
        </div>

        <form className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">Subject</label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={160}
                placeholder="Example: February settlement amount looks lower than expected"
                className="h-10 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#334155]">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as CreatorTicketCategory)}
                  className="h-10 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
                >
                  {CREATOR_TICKET_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-[#64748b]">{getCreatorTicketCategoryDescription(category)}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#334155]">Priority</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as CreatorTicketPriority)}
                  className="h-10 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-[#64748b]">{selectedPriority.helper}</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">Message</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                maxLength={2000}
                placeholder="Describe what happened, what is blocked, and what outcome you need from creator support."
                className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
              />
            </div>

            {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

            <div className="flex justify-end gap-3 pt-1">
              <Link
                href={localizePath("/creator/tickets", locale)}
                className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#334155]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[#1876f2] px-4 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1876f2]">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{selectedCategory.label}</p>
                <p className="text-xs text-[#64748b]">Recommended references</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#475569]">
              {getSuggestedReferences(category).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1876f2]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </form>
      </section>
    </div>
  );
}
