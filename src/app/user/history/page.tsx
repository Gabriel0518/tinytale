"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

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
    { label: "Older", color: "bg-gray-700", items: [] },
  ];

  items.forEach((item) => {
    const d = new Date(item.watchedAt);
    if (d >= today) groups[0].items.push(item);
    else if (d >= yesterday) groups[1].items.push(item);
    else if (d >= lastWeek) groups[2].items.push(item);
    else groups[3].items.push(item);
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
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await userApi.getHistory(token);
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

  const handleRemove = async (id: string) => {
    if (!token) return;
    try {
      await userApi.deleteHistoryEntry(token, id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      toast("Removed from history", "info");
    } catch (err) {
      console.error("Failed to remove history entry:", err);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    }
  };

  const handleClearAll = async () => {
    if (!token) return;
    try {
      await userApi.deleteHistory(token);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
    setHistory([]);
    setShowClearConfirm(false);
    toast("History cleared", "info");
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
                  {group.items.map((item) => {
                    const coverUrl = item.cover || item.drama?.cover || "https://picsum.photos/seed/drama/200/300";
                    const title = item.title || item.drama?.title || "Unknown Drama";
                    const epNum = item.episode?.episodeNumber || item.lastEpisode || "?";
                    const epTitle = item.episode?.title || "";
                    const category = item.drama?.categories?.[0] || "Drama";
                    const progress = item.progress ?? 50;
                    const minsLeft = Math.max(1, Math.floor((100 - progress) * 0.3));
                    const itemId = item._id || `${item.dramaId}-${item.episodeId}`;

                    return (
                      <div
                        key={itemId}
                        className="group relative flex gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                      >
                        {/* Cover */}
                        <Link href={`/drama/${item.dramaId}`} className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
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
                          onClick={() => item._id && handleRemove(item._id)}
                          className="absolute right-3 top-3 rounded-full bg-black/50 p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Remove from history"
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
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
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

      <Footer />
    </div>
  );
}
