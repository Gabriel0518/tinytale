"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Clock, Trash2, Play } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface HistoryItem {
  dramaId: string;
  episodeId: string;
  drama?: { _id: string; title: string; cover: string };
  episode?: { episodeNumber: number; title: string };
  watchedAt: string;
  progress?: number;
}

export default function HistoryPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          {history.length > 0 && (
            <button className="text-sm text-text-tertiary hover:text-accent-error transition-colors">
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-24 w-40 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div key={i} className="group flex gap-4 rounded-xl bg-bg-secondary p-4 transition hover:bg-bg-elevated">
                <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={item.drama?.cover || "https://picsum.photos/seed/drama/320/180"}
                    alt={item.drama?.title}
                    className="h-full w-full object-cover"
                  />
                  {item.progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-accent-primary" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  <Link
                    href={`/drama/${item.dramaId}/play/${item.episodeId}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
                  >
                    <Play size={24} className="text-white" fill="white" />
                  </Link>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/drama/${item.dramaId}`} className="font-medium text-white hover:text-accent-primary">
                      {item.drama?.title || "Unknown Drama"}
                    </Link>
                    <p className="mt-1 text-sm text-text-tertiary">
                      Episode {item.episode?.episodeNumber || "-"}
                      {item.episode?.title && ` - ${item.episode.title}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">{formatDate(item.watchedAt)}</span>
                    <button className="text-text-tertiary opacity-0 transition hover:text-accent-error group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Clock size={48} />}
            title="No Watch History"
            description="Start watching dramas and your history will appear here"
            action={
              <Link href="/browse" className="rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                Browse Dramas
              </Link>
            }
          />
        )}
      </main>
    </div>
  );
}
