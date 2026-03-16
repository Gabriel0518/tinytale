"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { creatorApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { CreatorTicketCategory, CreatorTicketPriority } from "@/types/creator";

const CATEGORY_OPTIONS: Array<{ value: CreatorTicketCategory; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "content", label: "Content" },
  { value: "payment", label: "Payment" },
  { value: "account", label: "Account" },
  { value: "policy", label: "Policy" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS: Array<{ value: CreatorTicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function CreatorTicketCreatePage() {
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuth();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<CreatorTicketCategory>("other");
  const [priority, setPriority] = useState<CreatorTicketPriority>("medium");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={localizePath("/creator/tickets", locale)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-semibold text-[#334155]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <h1 className="text-3xl font-black leading-[1.1] tracking-[-0.02em] text-[#0f172a] md:text-[42px]">Create Ticket</h1>
        <p className="mt-2 text-sm text-[#64748b]">Describe your issue and our support team will respond soon.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#334155]">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
              placeholder="Briefly describe your issue"
              className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as CreatorTicketCategory)}
                className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">Priority</label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as CreatorTicketPriority)}
                className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#334155]">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              maxLength={2000}
              placeholder="Include as much detail as possible so we can help quickly."
              className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#0f172a] outline-none focus:border-[#1876f2]"
            />
          </div>

          {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <Link
              href={localizePath("/creator/tickets", locale)}
              className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#334155]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#1876f2] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
