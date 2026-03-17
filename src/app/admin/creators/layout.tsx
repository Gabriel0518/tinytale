"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin/creators/dashboard", label: "Dashboard", match: ["/admin/creators", "/admin/creators/dashboard"] },
      { href: "/admin/creators/list", label: "Creator List", match: ["/admin/creators/list"] },
      { href: "/admin/creators/applications", label: "Applications", match: ["/admin/creators/applications"] },
    ],
  },
  {
    label: "Content & Risk",
    items: [
      { href: "/admin/creators/content", label: "Content Review", match: ["/admin/creators/content"] },
      { href: "/admin/creators/dmca", label: "DMCA", match: ["/admin/creators/dmca"] },
      { href: "/admin/creators/tickets", label: "Tickets", match: ["/admin/creators/tickets"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/creators/revenue", label: "Revenue", match: ["/admin/creators/revenue"] },
      { href: "/admin/creators/bank-accounts", label: "Bank Accounts", match: ["/admin/creators/bank-accounts"] },
      { href: "/admin/creators/settlements", label: "Settlements", match: ["/admin/creators/settlements"] },
      { href: "/admin/creators/payout-requests", label: "Payout Requests", match: ["/admin/creators/payout-requests"] },
      { href: "/admin/creators/policies", label: "Policies", match: ["/admin/creators/policies"] },
    ],
  },
];

function isActivePath(pathname: string, matches: string[]) {
  if (matches.includes("/admin/creators/list")) {
    const detailLikePath = pathname.startsWith("/admin/creators/") && ![
      "/admin/creators/dashboard",
      "/admin/creators/applications",
      "/admin/creators/content",
      "/admin/creators/dmca",
      "/admin/creators/revenue",
      "/admin/creators/bank-accounts",
      "/admin/creators/settlements",
      "/admin/creators/payout-requests",
      "/admin/creators/policies",
      "/admin/creators/tickets",
    ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (detailLikePath) return true;
  }

  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`) || pathname.startsWith(match));
}

export default function CreatorAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
      <section className="rounded-2xl border border-gray-800/60 bg-[#10101a] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">Creator Ops</p>
            <p className="mt-2 text-sm text-gray-400">Unified navigation for onboarding, lifecycle, content, risk, finance, and support workflows.</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 xl:items-end">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{group.label}</span>
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.match);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-indigo-500/60 bg-indigo-500/15 text-white"
                          : "border-gray-700/60 bg-[#161621] text-gray-300 hover:border-gray-500 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}
