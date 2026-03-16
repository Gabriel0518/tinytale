"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { localizePath } from "@/lib/i18n";

type PlaceholderMetricTone = "blue" | "green" | "amber" | "slate";

interface CreatorPlaceholderMetric {
  label: string;
  value: string;
  helper?: string;
  tone?: PlaceholderMetricTone;
}

interface CreatorPlaceholderSection {
  title: string;
  description: string;
  items?: string[];
}

interface CreatorPlaceholderAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

interface CreatorPlaceholderPageProps {
  title: string;
  route: string;
  description?: string;
  eyebrow?: string;
  note?: string;
  metrics?: CreatorPlaceholderMetric[];
  sections?: CreatorPlaceholderSection[];
  actions?: CreatorPlaceholderAction[];
  children?: ReactNode;
}

export default function CreatorPlaceholderPage({
  title,
  route,
  description,
  eyebrow = "Creator Center",
  note,
  metrics = [],
  sections = [],
  actions = [],
  children,
}: CreatorPlaceholderPageProps) {
  const locale = useLocale();

  const toneClassNames: Record<PlaceholderMetricTone, string> = {
    blue: "bg-[#eff6ff] text-[#1d4ed8]",
    green: "bg-[#ecfdf5] text-[#047857]",
    amber: "bg-[#fffbeb] text-[#a16207]",
    slate: "bg-[#f1f5f9] text-[#475569]",
  };

  return (
    <section className="mx-auto w-full px-4 py-6 md:px-5 md:py-8 xl:px-0">
      <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:p-6 xl:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#1d4ed8]">
              {eyebrow}
            </div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a] md:text-[28px]">{title}</h1>
            {description ? (
              <p className="mt-3 max-w-4xl text-[13px] leading-6 text-[#64748b] md:text-[14px]">{description}</p>
            ) : null}
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => {
                const primary = action.variant !== "secondary";
                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={localizePath(action.href, locale)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                      primary
                        ? "bg-[#1876f2] text-white hover:bg-[#1669da]"
                        : "border border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {action.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-4 py-3 text-[13px] text-[#1e3a8a]">
          Route: <span className="font-semibold">{route}</span>
        </div>

        {note ? (
          <div className="mt-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-[#475569]">
            {note}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-[#e2e8f0] bg-[#fcfcfd] p-4">
                <div
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    toneClassNames[metric.tone || "slate"]
                  }`}
                >
                  {metric.label}
                </div>
                <p className="mt-4 text-[28px] font-black tracking-[-0.02em] text-[#0f172a]">{metric.value}</p>
                {metric.helper ? <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{metric.helper}</p> : null}
              </article>
            ))}
          </div>
        ) : null}

        {sections.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                <h2 className="text-[17px] font-bold text-[#0f172a]">{section.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#64748b]">{section.description}</p>
                {section.items?.length ? (
                  <ul className="mt-4 space-y-2 text-[13px] leading-6 text-[#475569]">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1876f2]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
