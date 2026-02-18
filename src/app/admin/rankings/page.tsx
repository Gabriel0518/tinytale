"use client";

import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────
type RecommendationStatus = "Active" | "Scheduled" | "Expired";

interface Recommendation {
  id: string;
  spotName: string;
  drama: {
    title: string;
    thumbnail: string;
  };
  startDate: string;
  endDate: string;
  status: RecommendationStatus;
}

interface RankingCard {
  title: string;
  icon: "fire" | "sparkle" | "trending";
  frequency: string;
  lastUpdate: string;
}

// ── Icons ──────────────────────────────────────────────
function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────
const RANKING_CARDS: RankingCard[] = [
  { title: "Hot Rankings", icon: "fire", frequency: "Updates hourly", lastUpdate: "2026-02-18 14:00" },
  { title: "New Releases", icon: "sparkle", frequency: "Updates every 6 hours", lastUpdate: "2026-02-18 12:00" },
  { title: "Trending", icon: "trending", frequency: "Real-time", lastUpdate: "2026-02-18 14:32" },
];

const ICON_MAP: Record<RankingCard["icon"], React.FC<{ className?: string }>> = {
  fire: FireIcon,
  sparkle: SparkleIcon,
  trending: TrendingUpIcon,
};

const ICON_COLOR_MAP: Record<RankingCard["icon"], string> = {
  fire: "text-orange-400",
  sparkle: "text-yellow-400",
  trending: "text-emerald-400",
};

const STATUS_STYLES: Record<RecommendationStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-400",
  Scheduled: "bg-blue-500/20 text-blue-400",
  Expired: "bg-gray-500/20 text-gray-400",
};

// ── Mock Data ──────────────────────────────────────────
const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    spotName: "Homepage Banner",
    drama: { title: "Love in the Moonlight", thumbnail: "LM" },
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    status: "Active",
  },
  {
    id: "r2",
    spotName: "Category Featured",
    drama: { title: "CEO's Secret Wife", thumbnail: "CS" },
    startDate: "2026-02-10",
    endDate: "2026-03-10",
    status: "Active",
  },
  {
    id: "r3",
    spotName: "Homepage Banner",
    drama: { title: "Dragon's Heir", thumbnail: "DH" },
    startDate: "2026-03-01",
    endDate: "2026-04-01",
    status: "Scheduled",
  },
  {
    id: "r4",
    spotName: "Search Spotlight",
    drama: { title: "Revenge of the Bride", thumbnail: "RB" },
    startDate: "2026-02-05",
    endDate: "2026-02-28",
    status: "Active",
  },
  {
    id: "r5",
    spotName: "Category Featured",
    drama: { title: "My Billionaire Ex", thumbnail: "MB" },
    startDate: "2025-12-01",
    endDate: "2026-01-31",
    status: "Expired",
  },
  {
    id: "r6",
    spotName: "Homepage Carousel",
    drama: { title: "Werewolf Academy", thumbnail: "WA" },
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    status: "Scheduled",
  },
  {
    id: "r7",
    spotName: "New Arrivals Strip",
    drama: { title: "The Last Empress", thumbnail: "LE" },
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    status: "Expired",
  },
  {
    id: "r8",
    spotName: "Homepage Banner",
    drama: { title: "Fated to My Enemy", thumbnail: "FE" },
    startDate: "2026-02-14",
    endDate: "2026-03-14",
    status: "Active",
  },
];

const PAGE_SIZE = 5;

// ── Component ──────────────────────────────────────────
export default function AdminRankingsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return MOCK_RECOMMENDATIONS;
    return MOCK_RECOMMENDATIONS.filter(
      (r) =>
        r.spotName.toLowerCase().includes(q) ||
        r.drama.title.toLowerCase().includes(q)
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-gray-300 cursor-pointer">Content</span>
        <span>/</span>
        <span className="text-gray-300">Rankings</span>
      </nav>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">Rankings &amp; Curation</h1>

      {/* Auto Rankings Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RANKING_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon];
          const iconColor = ICON_COLOR_MAP[card.icon];
          return (
            <div
              key={card.title}
              className="rounded-xl bg-[#1a1a2e] p-5 border border-gray-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {card.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400">{card.frequency}</p>
              <p className="mt-2 text-xs text-gray-500">
                Last updated: {card.lastUpdate}
              </p>
            </div>
          );
        })}
      </div>

      {/* Editor Recommendations Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">
            Editor Recommendations
          </h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-9 w-64 rounded-lg border border-gray-700 bg-[#1a1a2e] pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {/* Refresh Rules */}
            <button className="h-9 rounded-lg border border-gray-700 px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
              Refresh Rules
            </button>
            {/* Create Recommendation */}
            <button className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              Create Recommendation
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-[#1a1a2e] border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Spot Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Drama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      item.status === "Expired" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                      {item.spotName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-700 text-xs font-bold text-gray-300">
                          {item.drama.thumbnail}
                        </div>
                        <span className="text-sm text-gray-200">
                          {item.drama.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {item.startDate} – {item.endDate}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No recommendations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-800 px-6 py-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-medium text-gray-300">
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-300">
                  {filtered.length}
                </span>{" "}
                results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
