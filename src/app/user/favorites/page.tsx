"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi, dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";

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
  const router = useRouter();
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!user && !loading) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      try {
        const res: any = await userApi.getFavorites(token);
        const favData = res.data;
        if (Array.isArray(favData)) {
          setFavorites(favData);
        } else if (favData?.favorites) {
          const dramaResults = await Promise.all(
            favData.favorites.map((fav: any) => dramasApi.getById(fav.dramaId))
          );
          setFavorites(dramaResults.map((r: any) => r.data?.drama).filter(Boolean));
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
    try {
      await userApi.removeFavorite(token, dramaId);
      setFavorites((prev) => prev.filter((d) => d._id !== dramaId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...favorites];
    switch (sort) {
      case "newest": return arr.reverse();
      case "oldest": return arr;
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
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          loading="lazy"
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

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0b0e] py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">T</div>
                <span className="text-base font-bold text-white">TinyTale</span>
              </div>
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Your go-to platform for the hottest short dramas from around the world.
              </p>
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
          <div className="mt-8 border-t border-white/5 pt-6 text-center">
            <p className="text-xs text-gray-600">&copy; 2025 TinyTale. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}