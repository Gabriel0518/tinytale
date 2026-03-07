"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userApi, profileApi, coinsApi } from "@/lib/api";
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

interface TransactionItem {
  id: string;
  date: string;
  desc: string;
  type: string;
  amount: number;
  status: string;
}

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("wallet");
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
                    <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-500">VIP Member</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">ID: {user._id?.slice(-6).toUpperCase()}</p>
                <p className="mt-1 text-sm text-gray-400">Short drama enthusiast. Currently watching: The CEO&apos;s Secret Contract...</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href="/user/settings" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                  Edit Profile
                </Link>
                <Link href="/user/settings" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
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
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-auto max-w-7xl px-4 mt-8">
          {activeTab === "library" && <LibraryTab favorites={favorites} history={history} />}
          {activeTab === "wallet" && <WalletTab user={user} isVip={isVip} token={token} />}
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
function WalletTab({ user, isVip, token }: { user: User; isVip: boolean; token: string | null }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        const res = await coinsApi.getTransactions(token, { limit: 4 });
        const data = res.data?.transactions || res.data || [];
        if (Array.isArray(data)) {
          setTransactions(data.map((tx: any) => ({
            id: String(tx._id || tx.id || ""),
            date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            desc: tx.type === "recharge" ? "Coin Recharge" : tx.type === "unlock" ? "Episode Unlock" : tx.type === "refund" ? "Refund" : tx.type || "Transaction",
            type: tx.type === "recharge" ? "topup" : tx.type === "unlock" ? "spend" : tx.type || "spend",
            amount: Number(tx.amount || 0),
            status: tx.status === "completed" ? "Success" : tx.status || "Pending",
          })));
        }
      } catch {
        // Leave empty on error
      }
    };
    fetchTransactions();
  }, [token]);

  // Calculate VIP expiry days
  const vipDaysLeft = user.vipExpireDate
    ? Math.max(0, Math.ceil((new Date(user.vipExpireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const vipProgress = user.vipExpireDate ? Math.min(100, Math.max(0, (vipDaysLeft / 30) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left Column */}
      <div className="space-y-8">
        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1c23] to-[#141519] border border-white/5 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total Balance</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-4xl font-bold text-white">{(user.coins || 0).toLocaleString()}</span>
              <span className="rounded-full bg-yellow-500/20 px-3 py-0.5 text-sm font-semibold text-yellow-500">Coins</span>
            </div>
            {/* Green $ circle icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
              <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link href="/user/coins" className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
              Top Up Now
            </Link>
            <button className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              Redeem Code
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Transaction History</h2>
            <Link href="/user/purchases" className="text-xs text-yellow-500 hover:text-yellow-400 transition">View All →</Link>
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
                      {tx.amount > 0 ? "+" : ""}{tx.amount} Coins
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* VIP Membership Card */}
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
            <span className="text-sm font-bold text-yellow-500">VIP Membership</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {isVip
              ? "Enjoy ad-free viewing, early access to episodes, and daily bonus coins."
              : "Enjoy ad-free streaming, exclusive content, and bonus coins every month."}
          </p>
          {isVip && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Current Plan</span>
                <span>Expires in {vipDaysLeft} days</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all" style={{ width: `${vipProgress}%` }} />
              </div>
            </div>
          )}
          <Link href="/user/subscription" className="mt-4 block rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-2.5 text-center text-sm font-bold text-black transition hover:from-yellow-600 hover:to-yellow-700">
            {isVip ? "Renew Membership" : "Become a Member"}
          </Link>
        </div>

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

        {/* Event Banner */}
        <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-transparent overflow-hidden">
          <div className="relative h-36 w-full bg-gradient-to-br from-[#2a1f0a] to-[#1a1519]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="h-10 w-10 text-yellow-500/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-yellow-500">Watch & Win: Get 500 Free Coins this weekend!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
