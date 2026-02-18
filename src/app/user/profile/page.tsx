"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userApi, profileApi } from "@/lib/api";
import { Drama, User } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

type Tab = "library" | "wallet";

interface WatchHistoryItem {
  _id?: string;
  dramaId?: string;
  title?: string;
  cover?: string;
  lastEpisode?: number;
  drama?: { title?: string; cover?: string };
  episode?: { episodeNumber?: number };
}

const TOPUP_PACKAGES = [
  { id: "pkg-500", coins: 500, price: 4.99, label: "500" },
  { id: "pkg-1000", coins: 1000, price: 9.99, label: "1,000", best: true },
  { id: "pkg-2500", coins: 2500, price: 24.99, label: "2,500" },
  { id: "pkg-5000", coins: 5000, price: 49.99, label: "5,000" },
  { id: "pkg-10000", coins: 10000, price: 99.99, label: "10,000" },
];

const MOCK_TRANSACTIONS = [
  { id: "tx1", date: "2025-01-15", desc: "Infinite Rebirth - C87 x Reborn...", type: "spend", amount: -30 },
  { id: "tx2", date: "2025-01-14", desc: "Top Up 1000 Coins Recharge", type: "topup", amount: 1000 },
  { id: "tx3", date: "2025-01-13", desc: "Daily Login Reward", type: "earn", amount: 10 },
  { id: "tx4", date: "2025-01-12", desc: "Exiled Episode - Alpha x...", type: "spend", amount: -30 },
];

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [favRes, histRes] = await Promise.all([
          userApi.getFavorites(token),
          userApi.getHistory(token),
        ]);
        const favData = favRes.data;
        if (Array.isArray(favData)) setFavorites(favData);
        else if (favData?.favorites) setFavorites(favData.favorites);

        const histData = histRes.data;
        setHistory(Array.isArray(histData) ? histData : []);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-[#0F1014] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const isVip = user.vipStatus === "active";

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Profile Hero */}
        <div className="border-b border-white/5 bg-[#141519] py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              {/* Avatar */}
              <div className="relative">
                <div className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold text-white ${isVip ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-[#141519]" : "bg-gray-700"}`}
                  style={{ background: "linear-gradient(135deg, #374151, #1f2937)" }}>
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.nickname} fill className="rounded-full object-cover" />
                  ) : (
                    user.nickname?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                {isVip && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-0.5 text-[10px] font-bold text-black">
                    VIP
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <h1 className="text-2xl font-bold text-white">{user.nickname}</h1>
                  {isVip && (
                    <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-500">VIP</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">ID: {user._id?.slice(-8).toUpperCase()}</p>
                <p className="mt-1 text-sm text-gray-400">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href="/user/settings" className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  Edit Profile
                </Link>
                <Link href="/user/settings" className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <svg className="inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/5">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex gap-8" role="tablist">
              {(["library", "wallet"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-selected={activeTab === tab}
                  role="tab"
                  className={`relative py-4 text-sm font-medium transition ${
                    activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "library" ? "My Library" : "My Wallet"}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-auto max-w-7xl px-4 mt-8">
          {activeTab === "library" && <LibraryTab favorites={favorites} history={history} />}
          {activeTab === "wallet" && <WalletTab user={user} isVip={isVip} customAmount={customAmount} setCustomAmount={setCustomAmount} token={token} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Library Tab ─── */
function LibraryTab({ favorites, history }: { favorites: Drama[]; history: WatchHistoryItem[] }) {
  const [sub, setSub] = useState<"favorites" | "history">("favorites");

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <button onClick={() => setSub("favorites")} aria-pressed={sub === "favorites"} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sub === "favorites" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
          Favorites ({favorites.length})
        </button>
        <button onClick={() => setSub("history")} aria-pressed={sub === "history"} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sub === "history" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
          History ({history.length})
        </button>
      </div>

      {sub === "favorites" && (
        favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((drama) => (
              <Link key={drama._id} href={`/drama/${drama._id}`}>
                <div className="group relative aspect-[2/3] overflow-hidden rounded-lg">
                  <Image src={drama.cover} alt={drama.title} fill className="object-cover transition group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                    <p className="text-sm font-medium text-white truncate">{drama.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            No favorites yet. Start exploring dramas!
          </div>
        )
      )}

      {sub === "history" && (
        history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, i) => (
              <Link key={i} href={`/drama/${item._id || item.dramaId}`} className="flex gap-4 rounded-xl bg-white/[0.03] border border-white/5 p-4 transition hover:bg-white/[0.06]">
                <Image src={item.cover || item.drama?.cover || "https://picsum.photos/seed/drama/200/300"} alt={item.title || item.drama?.title || "Drama"} width={56} height={80} className="h-20 w-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{item.title || item.drama?.title || "Unknown"}</h3>
                  <p className="mt-1 text-sm text-gray-500">Episode {item.lastEpisode || item.episode?.episodeNumber || "-"}</p>
                  <span className="mt-2 inline-block text-xs text-red-500">Continue Watching →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            No watch history yet
          </div>
        )
      )}
    </div>
  );
}

/* ─── Wallet Tab ─── */
function WalletTab({ user, isVip, customAmount, setCustomAmount, token }: { user: User; isVip: boolean; customAmount: string; setCustomAmount: (v: string) => void; token: string | null }) {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        const res = await profileApi.getPurchases(token);
        const data = (res as { data?: { purchases?: unknown[] } }).data?.purchases || (res as { data?: unknown[] }).data || [];
        if (Array.isArray(data) && data.length > 0) {
          setTransactions((data as Record<string, string | number | undefined>[]).slice(0, 4).map((tx) => ({
            id: String(tx._id || tx.id || ""),
            date: String(tx.date || tx.createdAt || ""),
            desc: String(tx.itemName || tx.description || tx.desc || "Transaction"),
            type: tx.type === "purchase" ? "topup" : tx.type === "unlock" ? "spend" : String(tx.type || "spend"),
            amount: Number(tx.amountCoins || tx.amount || 0),
          })));
        }
      } catch {
        // Keep mock data as fallback
      }
    };
    fetchTransactions();
  }, [token]);

  return (
    <div>
      {/* Balance + VIP Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Balance Card */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-[#1a1c23] to-[#141519] border border-white/5 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total Balance</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{(user.coins || 0).toLocaleString()}</span>
            <span className="rounded-full bg-yellow-500/20 px-3 py-0.5 text-sm font-semibold text-yellow-500">Coins</span>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/user/coins" className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
              Top Up Now
            </Link>
            <Link href="/user/coins" className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              Redeem Code
            </Link>
          </div>
        </div>

        {/* VIP Card */}
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
            <span className="text-sm font-bold text-yellow-500">VIP Membership</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {isVip
              ? `Active until ${user.vipExpireDate ? new Date(user.vipExpireDate).toLocaleDateString() : "N/A"}`
              : "Enjoy ad-free streaming, exclusive content, and bonus coins every month."}
          </p>
          <Link href="/user/subscription" className="mt-4 block rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-2 text-center text-sm font-bold text-black transition hover:from-yellow-600 hover:to-yellow-700">
            {isVip ? "Renew Membership" : "Become a Member"}
          </Link>
        </div>
      </div>

      {/* Top Up Packages */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
          <h2 className="text-lg font-bold text-white">Top Up Packages</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {TOPUP_PACKAGES.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/user/coins?package=${pkg.coins}`}
              className={`relative flex flex-col items-center rounded-xl border p-5 transition hover:scale-[1.02] ${
                pkg.best
                  ? "border-red-500 bg-red-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              {pkg.best && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                  BEST VALUE
                </div>
              )}
              <span className="text-xl font-bold text-white">{pkg.label}</span>
              <span className="mt-1 text-xs text-gray-500">Coins</span>
              <span className="mt-3 text-sm font-semibold text-green-400">${pkg.price}</span>
            </Link>
          ))}
          {/* Custom Amount */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5">
            <svg className="mb-2 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            <span className="text-xs text-gray-500">Custom</span>
            <span className="text-xs text-gray-600">Amount</span>
          </div>
        </div>
      </div>

      {/* Support & More + Transaction History Row */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {/* Support & More */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-white">Support & More</h2>
          <div className="space-y-2">
            {[
              { label: "Help Center & FAQ", href: "/help", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
              { label: "Contact Support", href: "/help", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
              { label: "My Coupons", href: "/user/purchases", icon: "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" },
              { label: "Account Privacy", href: "/user/settings", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-sm text-gray-300">{item.label}</span>
                <svg className="ml-auto h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Transaction History</h2>
            <Link href="/user/purchases" className="text-xs text-gray-500 hover:text-white transition">View All →</Link>
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">{tx.desc}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Promo Banner */}
          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-900/10 to-transparent p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-500">Watch & Win: Get 500 Free Coins!</p>
              <p className="mt-1 text-xs text-gray-500">Complete daily challenges and earn bonus coins every week.</p>
            </div>
            <Link href="/browse" className="shrink-0 rounded-lg bg-yellow-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-yellow-600">
              Join Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
