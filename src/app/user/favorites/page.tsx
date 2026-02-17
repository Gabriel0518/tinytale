"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi, dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Heart, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FavoritesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      try {
        const res: any = await userApi.getFavorites(token);
        if (res.data?.favorites) {
          const dramaResults = await Promise.all(
            res.data.favorites.map((fav: any) => dramasApi.getById(fav.dramaId))
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Favorites</h1>
          <span className="text-sm text-text-tertiary">{favorites.length} dramas</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((drama) => (
              <div key={drama._id} className="group relative">
                <Link href={`/drama/${drama._id}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                    <img
                      src={drama.cover}
                      alt={drama.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-medium text-white line-clamp-2">{drama.title}</h3>
                      <p className="mt-1 text-xs text-text-secondary">{drama.totalEpisodes} episodes</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(drama._id)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-accent-error"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={48} />}
            title="No Favorites Yet"
            description="Start adding dramas to your favorites to see them here"
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
