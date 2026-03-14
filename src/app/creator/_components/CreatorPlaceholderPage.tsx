import type { ReactNode } from "react";

interface CreatorPlaceholderPageProps {
  title: string;
  route: string;
  description?: string;
  children?: ReactNode;
}

export default function CreatorPlaceholderPage({
  title,
  route,
  description,
  children,
}: CreatorPlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:p-8">
        <div className="mb-4 inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#1d4ed8]">
          Creator Center
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748b] md:text-base">{description}</p> : null}

        <div className="mt-6 rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-4 py-3 text-sm text-[#1e3a8a]">
          Route: <span className="font-semibold">{route}</span>
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
