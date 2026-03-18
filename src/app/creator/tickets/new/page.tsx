"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  List,
  MessageSquareMore,
  PlaySquare,
  UploadCloud,
  X,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { creatorApi } from "@/lib/api";
import { CREATOR_TICKET_CATEGORY_OPTIONS } from "@/lib/creator";
import { localizePath } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import type { CreatorTicketCategory, CreatorTicketPriority } from "@/types/creator";
import { useCreatorI18n } from "../../_lib/creator-i18n";

const INPUT_CLASS_NAME =
  "h-[46px] w-full rounded-full border border-[#d9e2ef] bg-[#fbfdff] px-4 text-[14px] text-[#18233a] outline-none transition placeholder:text-[#9aa8bc] focus:border-[#2d7af0]";

const PRIORITY_OPTIONS: Array<{ value: CreatorTicketPriority; label: string }> = [
  { value: "low", label: "Low - General Question" },
  { value: "medium", label: "Medium - Standard Issue" },
  { value: "high", label: "High - Important Blocker" },
  { value: "urgent", label: "Urgent - Critical Account Issue" },
];

function FooterHelpCard({
  icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#d9e2ef] bg-[#edf4fd] px-5 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="text-[#2d7af0]">{icon}</div>
      <h3 className="mt-5 text-[15px] font-bold text-[#18233a]">{title}</h3>
      <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{description}</p>
      <Link href={href} className="mt-4 inline-flex text-[13px] font-semibold text-[#2d7af0] transition hover:text-[#165fcc]">
        {cta}
      </Link>
    </article>
  );
}

async function uploadTicketAttachments(token: string, files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const uploaded = await Promise.all(files.map((file) => creatorApi.uploadTicketAttachment(token, file)));
  return uploaded.map((item) => item.data.url);
}

export default function CreatorTicketCreatePage() {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const router = useRouter();
  const { token } = useAuth();
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<CreatorTicketCategory>("payment");
  const [priority, setPriority] = useState<CreatorTicketPriority>("low");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setError(t("Subject is required"));
      return;
    }
    if (!cleanMessage) {
      setError(t("Description is required"));
      return;
    }
    if (!token) {
      setError(t("Login required"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const attachmentUrls = await uploadTicketAttachments(token, attachments);
      const res: any = await creatorApi.createTicket(token, {
        subject: cleanSubject,
        category,
        priority,
        message: cleanMessage,
        attachments: attachmentUrls,
      });
      const ticketId = res?.data?._id;
      if (ticketId) {
        router.push(localizePath(`/creator/tickets/${ticketId}`, locale));
        return;
      }
      router.push(localizePath("/creator/tickets", locale));
    } catch (err: any) {
      setError(err?.message || t("Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleAttachmentSelect(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files).filter((file) => file.size <= 10 * 1024 * 1024).slice(0, 5);
    setAttachments(selected);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8">
      <nav className="flex items-center gap-2 text-[14px] text-[#7d8da4]">
        <Link href={localizePath("/creator/tickets", locale)} className="transition hover:text-[#2d7af0]">
          {t("Support Tickets")}
        </Link>
        <span>›</span>
        <span className="font-medium text-[#4a5b75]">{t("Submit New Ticket")}</span>
      </nav>

      <section>
        <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.04em] text-[#18233a]">{t("Submit New Ticket")}</h1>
        <p className="mt-3 max-w-[680px] text-[15px] leading-7 text-[#70819c]">
          {t("Fill out the form below and our creator support team will get back to you within 24 hours. Please be as descriptive as possible to help us resolve your issue quickly.")}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
        <div className="space-y-6 px-6 py-8 md:px-8 md:py-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-3 block text-[15px] font-semibold text-[#334155]">{t("Category")}</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as CreatorTicketCategory)}
                className={`${INPUT_CLASS_NAME} appearance-none pr-10`}
              >
                {CREATOR_TICKET_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-3 block text-[15px] font-semibold text-[#334155]">{t("Priority Level")}</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as CreatorTicketPriority)}
                className={`${INPUT_CLASS_NAME} appearance-none pr-10`}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-3 block text-[15px] font-semibold text-[#334155]">{t("Subject")}</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
              placeholder={t("Summary of the issue")}
              className={INPUT_CLASS_NAME}
            />
          </label>

          <label className="block">
            <span className="mb-3 block text-[15px] font-semibold text-[#334155]">{t("Description")}</span>
            <div className="overflow-hidden rounded-[24px] border border-[#d9e2ef] bg-[#fbfdff]">
              <div className="flex items-center gap-0.5 border-b border-[#e9eff6] px-3 py-2 text-[#5c6d88]">
                {[Bold, Italic, List, Link2, ImagePlus, Code2].map((Icon, index) => (
                  <button
                    key={`${Icon.displayName || Icon.name}-${index}`}
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#eef4fb]"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                maxLength={2000}
                placeholder={t("Describe your issue in detail...")}
                className="min-h-[122px] w-full resize-none bg-transparent px-4 py-4 text-[14px] leading-7 text-[#18233a] outline-none placeholder:text-[#9aa8bc]"
              />
            </div>
          </label>

          <div>
            <span className="mb-3 block text-[15px] font-semibold text-[#334155]">{t("Attachments (Screenshots or Logs)")}</span>
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log,.csv,.json,.zip"
              className="hidden"
              onChange={(event) => handleAttachmentSelect(event.target.files)}
            />
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="flex min-h-[172px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d7e2ef] bg-white px-6 text-center transition hover:border-[#bfd3ee] hover:bg-[#fbfdff]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#2d7af0]">
                <UploadCloud className="h-5 w-5" />
              </span>
              <span className="mt-4 text-[18px] font-semibold text-[#18233a]">{t("Click to upload or drag and drop")}</span>
              <span className="mt-1 text-[13px] text-[#7b8aa0]">{t("JPG, PNG, WebP, PDF, TXT, CSV, JSON or ZIP up to 10MB each")}</span>
            </button>

            {attachments.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <span
                    key={`${file.name}-${file.size}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7e2ef] bg-[#f8fbff] px-3 py-1.5 text-[12px] font-medium text-[#4a5b75]"
                  >
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((current) => current.filter((item) => item !== file))}
                      className="rounded-full p-0.5 text-[#8ea0b6] transition hover:bg-[#eef4fb] hover:text-[#42536b]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2f7] px-6 py-5 md:flex-row md:items-center md:justify-end md:px-8">
          {error ? <p className="text-[13px] text-[#dc2626] md:mr-auto">{error}</p> : <div className="md:mr-auto" />}
          <Link
            href={localizePath("/creator/tickets", locale)}
            className="inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-[14px] font-semibold text-[#4a5b75] transition hover:bg-[#f8fbff]"
          >
            {t("Cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#2d7af0] px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(45,122,240,0.28)] transition hover:bg-[#1d6ee8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("Submitting...") : t("Submit Ticket")}
          </button>
        </div>
      </form>

      <section className="grid gap-4 xl:grid-cols-3">
        <FooterHelpCard
          icon={<MessageSquareMore className="h-5 w-5" />}
          title={t("Knowledge Base")}
          description={t("Search our library of creator guides, payout policies, and troubleshooting notes.")}
          cta={t("Browse docs")}
          href={localizePath("/help", locale)}
        />
        <FooterHelpCard
          icon={<MessageSquareMore className="h-5 w-5" />}
          title={t("Community Forum")}
          description={t("Get help from fellow creators while waiting for a support agent reply.")}
          cta={t("Join discussion")}
          href={localizePath("/creator/tickets", locale)}
        />
        <FooterHelpCard
          icon={<PlaySquare className="h-5 w-5" />}
          title={t("Video Tutorials")}
          description={t("Watch guided walkthroughs for common upload, subtitle, and review issues.")}
          cta={t("Watch now")}
          href={localizePath("/creator/dashboard", locale)}
        />
      </section>
    </div>
  );
}
