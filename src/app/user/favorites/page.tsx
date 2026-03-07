"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { userApi, dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

type SortOption = "newest" | "oldest" | "title-az" | "title-za";

function getStatusBadge(drama: Drama) {
  if (!drama.isCompleted && drama.viewCount && drama.viewCount > 5000)
    return { label: "HOT", color: "bg-red-500" };
  if (!drama.isCompleted) return { label: "ONGOING", color: "bg-green-600" };
  if (drama.createdAt && Date.now() - new Date(drama.createdAt).getTime() < 30 * 86400000)
    return { label: "NEW", color: "bg-blue-500" };
  return { label: "COMPLETED", color: "bg-gray-600" };
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function FavoritesPage() {
  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      try {
        const res = await userApi.getFavorites(token);
        const favData = res.data;
        if (Array.isArray(favData)) {
          setFavorites(favData);
        } else if (favData?.favorites) {
          const dramaResults = await Promise.all(
            favData.favorites.map((fav: { dramaId: string }) => dramasApi.getById(fav.dramaId))
          );
          setFavorites(dramaResults.map((r: { data?: { drama?: Drama } }) => r.data?.drama).filter((d): d is Drama => Boolean(d)));
        }
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchFavorites();
    else setLoading(false);
  }, [token]);

  const handleRemove = async (dramaId: string) => {
    if (!token) return;
    const removedDrama = favorites.find((d) => d._id === dramaId);
    try {
      await userApi.removeFavorite(token, dramaId);
      setFavorites((prev) => prev.filter((d) => d._id !== dramaId));
      toast("Removed from favorites", "success");
      // Store undo data so user can re-add if needed
      if (removedDrama) {
        (window as any).__lastRemovedFavorite = {
          drama: removedDrama,
          restore: async () => {
            try {
              await userApi.addFavorite(token, dramaId);
              setFavorites((prev) => [...prev, removedDrama]);
              toast("Restored to favorites", "success");
            } catch {
              toast("Failed to restore favorite", "error");
            }
          },
        };
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...favorites];
    switch (sort) {
      case "newest": return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "oldest": return arr.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case "title-az": return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "title-za": return arr.sort((a, b) => b.title.localeCompare(a.title));
      default: return arr;
    }
  }, [favorites, sort]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Watchlist
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {favorites.length} titles saved
            </p>
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-4 pr-10 text-sm text-gray-300 focus:border-[#D4AF37] focus:outline-none transition"
            >
              <option value="newest">Date Added (Newest)</option>
              <option value="oldest">Date Added (Oldest)</option>
              <option value="title-az">Title (A-Z)</option>
              <option value="title-za">Title (Z-A)</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visible.map((drama) => {
                const badge = getStatusBadge(drama);
                return (
                  <div key={drama._id} className="group relative">
                    <Link href={`/drama/${drama._id}`}>
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
                        <Image
                          src={drama.cover}
                          alt={drama.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {/* Status Badge */}
                        <span className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${badge.color}`}>
                          {badge.label}
                        </span>

                        {/* VIP Badge */}
                        {drama.episodes?.some(ep => !ep.isFree) && (
                          <span className="absolute right-2.5 top-2.5 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                            VIP
                          </span>
                        )}

                        {/* Rating on hover */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="text-xs font-medium text-white">{drama.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Remove Button (hover) */}
                    <button
                      onClick={() => handleRemove(drama._id)}
                      className="absolute right-2.5 bottom-[4.5rem] rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                      title="Remove from watchlist"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Info */}
                    <div className="mt-2.5 px-0.5">
                      <h3 className="text-sm font-medium text-white truncate">{drama.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {drama.categories?.[0] || "Drama"} · {drama.totalEpisodes || "?"} eps{drama.createdAt ? ` · ${timeAgo(drama.createdAt)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + 10)}
                  className="rounded-lg border border-white/10 bg-white/5 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">No Favorites Yet</h2>
            <p className="mt-2 text-sm text-gray-500">Start adding dramas to your watchlist to see them here</p>
            <Link href="/browse" className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700">
              Browse Dramas
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}