"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";

interface HistoryItem {
  _id?: string;
  dramaId: string;
  episodeId: string;
  title?: string;
  cover?: string;
  drama?: { _id: string; title: string; cover: string; categories?: string[] };
  episode?: { episodeNumber: number; title: string };
  watchedAt: string;
  progress?: number;
  lastEpisode?: number;
}

function groupByTime(items: HistoryItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; color: string; items: HistoryItem[] }[] = [
    { label: "Today", color: "bg-red-500", items: [] },
    { label: "Yesterday", color: "bg-amber-500", items: [] },
    { label: "Last Week", color: "bg-gray-600", items: [] },
  ];

  items.forEach((item) => {
    const d = new Date(item.watchedAt);
    if (d >= today) groups[0].items.push(item);
    else if (d >= yesterday) groups[1].items.push(item);
    else groups[2].items.push(item);
  });

  return groups.filter((g) => g.items.length > 0);
}

function hoursAgo(dateStr: string) {
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `Updated ${h}h ago`;
  const d = Math.floor(h / 24);
  return `Updated ${d}d ago`;
}

export default function HistoryPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!user && !loading) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res: any = await userApi.getHistory(token);
        setHistory(res.data?.history || res.data || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
    else setLoading(false);
  }, [token]);

  const handleRemove = (index: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setHistory([]);
    setShowClearConfirm(false);
  };

  const groups = useMemo(() => groupByTime(history), [history]);

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Watch History</h1>
            <p className="mt-1 text-sm text-gray-500">
              Resume watching your favorite dramas right where you left off.
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Clear History
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-32 w-24 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                  <div className="h-2 w-full rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Time Group Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-5 w-1 rounded-full ${group.color}`} />
                  <h2 className="text-sm font-semibold text-white">{group.label}</h2>
                </div>

                {/* Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item, idx) => {
                    const coverUrl = item.cover || item.drama?.cover || "https://picsum.photos/seed/drama/200/300";
                    const title = item.title || item.drama?.title || "Unknown Drama";
                    const epNum = item.episode?.episodeNumber || item.lastEpisode || "?";
                    const epTitle = item.episode?.title || "";
                    const category = item.drama?.categories?.[0] || "Drama";
                    const progress = item.progress ?? Math.floor(Math.random() * 80 + 10);
                    const minsLeft = Math.max(1, Math.floor((100 - progress) * 0.3));
                    const globalIdx = history.indexOf(item);

                    return (
                      <div
                        key={`${item.dramaId}-${idx}`}
                        className="group relative flex gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                      >
                        {/* Cover */}
                        <Link href={`/drama/${item.dramaId}`} className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={coverUrl}
                            alt={title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                              <svg className="h-4 w-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/drama/${item.dramaId}`} className="font-medium text-white truncate hover:text-red-400 transition">
                                {title}
                              </Link>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400">
                                {category}
                              </span>
                              <span className="text-xs text-gray-600">{hoursAgo(item.watchedAt)}</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 truncate">
                              Episode {epNum}{epTitle ? `: ${epTitle}` : ""}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-600">{minsLeft}m left</span>
                              <span className="text-[10px] text-gray-600">{progress}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-red-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(globalIdx)}
                          className="absolute right-3 top-3 rounded-full bg-black/50 p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">No Watch History</h2>
            <p className="mt-2 text-sm text-gray-500">Start watching dramas and your history will appear here</p>
            <Link href="/browse" className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700">
              Browse Dramas
            </Link>
          </div>
        )}
      </main>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1c23] p-6">
            <h3 className="text-lg font-semibold text-white">Clear Watch History?</h3>
            <p className="mt-2 text-sm text-gray-400">This will remove all your watch history. This action cannot be undone.</p>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                Cancel
              </button>
              <button onClick={handleClearAll} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0b0e] py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">T</div>
                <span className="text-base font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">The next generation of HD streaming short dramas from around the world.</p>
              <div className="mt-3 flex gap-3">
                {["M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                ].map((d, i) => (
                  <a key={i} href="#" className="text-gray-600 hover:text-white transition">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Discover</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-gray-500 hover:text-white transition">Trending Now</Link>
                <Link href="/rankings" className="block text-sm text-gray-500 hover:text-white transition">Top Rankings</Link>
                <Link href="/browse" className="block text-sm text-gray-500 hover:text-white transition">Editor&apos;s Choice</Link>
                <Link href="/browse" className="block text-sm text-gray-500 hover:text-white transition">Coming Soon</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-500 hover:text-white transition">Help Center</Link>
                <Link href="/help" className="block text-sm text-gray-500 hover:text-white transition">Terms of Service</Link>
                <Link href="/help" className="block text-sm text-gray-500 hover:text-white transition">Privacy Policy</Link>
                <Link href="/help" className="block text-sm text-gray-500 hover:text-white transition">Contact Us</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Get the App</h4>
              <div className="space-y-2">
                <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  App Store
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 1.469L16.8 7.802l-2.302 2.302L5.864 1.47z"/></svg>
                  Google Play
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-6 flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="text-xs text-gray-600">&copy; 2025 TinyTale. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/help" className="text-xs text-gray-600 hover:text-white transition">Privacy</Link>
              <Link href="/help" className="text-xs text-gray-600 hover:text-white transition">Terms</Link>
              <Link href="/help" className="text-xs text-gray-600 hover:text-white transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
