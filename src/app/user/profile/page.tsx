"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { userApi, dramasApi } from "@/lib/api";
import { Drama } from "@/types";
import { Navbar } from "@/components/features/Navbar";

type Tab = "favorites" | "history" | "coins";

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("favorites");
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [favRes, histRes] = await Promise.all([
          userApi.getFavorites(token),
          userApi.getHistory(token),
        ]);

        // Fetch drama details for favorites
        if (favRes.data?.favorites) {
          const dramaPromises = favRes.data.favorites.map((fav: any) =>
            dramasApi.getById(fav.dramaId)
          );
          const dramaResults = await Promise.all(dramaPromises);
          setFavorites(dramaResults.map((r) => r.data?.drama).filter(Boolean));
        }

        setHistory(histRes.data || []);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: "favorites" as const, label: "Favorites", count: favorites.length },
    { id: "history" as const, label: "History", count: history.length },
    { id: "coins" as const, label: "Coins", count: user.coins || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Profile Header */}
        <div className="bg-gray-900 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-center md:flex-row md:gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-700 text-3xl font-bold text-white md:h-32 md:w-32">
                  {user.nickname?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              {/* Info */}
              <div className="mt-4 text-center md:mt-0 md:text-left">
                <h1 className="text-2xl font-bold text-white">{user.nickname}</h1>
                <p className="text-gray-400">{user.email}</p>

                {/* Quick Stats */}
                <div className="mt-4 flex justify-center gap-6 md:justify-start">
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-500">{user.coins || 0}</div>
                    <div className="text-xs text-gray-500">Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{favorites.length}</div>
                    <div className="text-xs text-gray-500">Favorites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{history.length}</div>
                    <div className="text-xs text-gray-500">Watched</div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-4 md:ml-auto flex gap-2">
                <Link href="/user/settings" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Link href="/user/favorites" className="flex items-center gap-3 rounded-xl bg-gray-900 p-4 transition hover:bg-gray-800">
              <span className="text-2xl">❤️</span>
              <div>
                <div className="text-sm font-medium text-white">Favorites</div>
                <div className="text-xs text-gray-500">{favorites.length} dramas</div>
              </div>
            </Link>
            <Link href="/user/history" className="flex items-center gap-3 rounded-xl bg-gray-900 p-4 transition hover:bg-gray-800">
              <span className="text-2xl">🕐</span>
              <div>
                <div className="text-sm font-medium text-white">History</div>
                <div className="text-xs text-gray-500">{history.length} watched</div>
              </div>
            </Link>
            <Link href="/user/purchases" className="flex items-center gap-3 rounded-xl bg-gray-900 p-4 transition hover:bg-gray-800">
              <span className="text-2xl">🧾</span>
              <div>
                <div className="text-sm font-medium text-white">Purchases</div>
                <div className="text-xs text-gray-500">View history</div>
              </div>
            </Link>
            <Link href="/user/settings" className="flex items-center gap-3 rounded-xl bg-gray-900 p-4 transition hover:bg-gray-800">
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="text-sm font-medium text-white">Settings</div>
                <div className="text-xs text-gray-500">Account</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-6 flex gap-2 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "favorites" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-white">My Favorites</h2>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {favorites.map((drama) => (
                      <Link key={drama._id} href={`/drama/${drama._id}`}>
                        <div className="group relative aspect-[2/3] overflow-hidden rounded-lg">
                          <img
                            src={drama.cover}
                            alt={drama.title}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    No favorites yet
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Watch History</h2>
                  <button className="text-sm text-gray-500 hover:text-white">Clear All</button>
                </div>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 rounded-lg bg-gray-900 p-4">
                        <img
                          src={item.drama?.cover || 'https://picsum.photos/seed/drama/200/300'}
                          alt={item.drama?.title}
                          className="h-24 w-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.drama?.title || 'Unknown'}</h3>
                          <p className="text-sm text-gray-400">Episode {item.episode?.episodeNumber || '-'}</p>
                          <Link
                            href={`/drama/${item.dramaId}/play/${item.episodeId}`}
                            className="mt-2 inline-block text-sm text-red-500 hover:underline"
                          >
                            Continue Watching
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    No watch history
                  </div>
                )}
              </div>
            )}

            {activeTab === "coins" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-white">My Coins</h2>

                {/* Current Balance */}
                <div className="mb-8 rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                  <p className="text-sm opacity-80">Current Balance</p>
                  <p className="mt-2 text-4xl font-bold">{user.coins || 0} Coins</p>
                  <Link
                    href="/user/coins"
                    className="mt-4 inline-block rounded-lg bg-white px-6 py-2 font-medium text-red-600 transition hover:bg-gray-100"
                  >
                    Recharge
                  </Link>
                </div>

                {/* Coin Packages */}
                <h3 className="mb-4 text-lg font-semibold text-white">Recharge</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { amount: 100, price: 0.99 },
                    { amount: 500, price: 4.99 },
                    { amount: 1000, price: 9.99 },
                    { amount: 2000, price: 19.99 },
                  ].map((pkg) => (
                    <Link
                      key={pkg.amount}
                      href={`/user/coins?package=${pkg.amount}`}
                      className="flex flex-col items-center rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-red-600"
                    >
                      <div className="text-2xl font-bold text-yellow-500">{pkg.amount}</div>
                      <div className="text-sm text-gray-400">Coins</div>
                      <div className="mt-2 font-medium text-white">${pkg.price}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
