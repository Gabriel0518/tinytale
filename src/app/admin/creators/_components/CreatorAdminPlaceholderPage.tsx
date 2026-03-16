"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Layers3, ShieldAlert } from "lucide-react";

interface CreatorAdminPlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  phase: "P2" | "P3";
  sections: Array<{
    title: string;
    description: string;
  }>;
}

export default function CreatorAdminPlaceholderPage({
  eyebrow,
  title,
  description,
  phase,
  sections,
}: CreatorAdminPlaceholderPageProps) {
  return (
    <div className="space-y-6 text-gray-200">
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>
          </div>
          <div className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">
            {phase} scope scaffolded
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <Layers3 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Spec-aligned IA</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">Navigation, routes, and page-level information architecture are in place for this Creator admin capability.</p>
        </article>
        <article className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
            <Clock3 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Phase-gated delivery</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">This surface belongs to {phase}. P1 operational pages are fully built; the remaining areas are staged for the next backend and workflow pass.</p>
        </article>
        <article className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Shared model contract</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">The admin routes are aligned to the Creator portal spec, so these screens can attach to `/api/admin/*` without path drift later.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-5">
            <h2 className="text-base font-semibold text-white">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">{section.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-gray-700/50 bg-[#0f0f17] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Work with available P1 pages</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Use the operational P1 surfaces to review creator applications, inspect creator accounts, and monitor the initial management dashboard while the rest of the module is phased in.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/creators/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/creators/applications" className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]">
              Review Applications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
