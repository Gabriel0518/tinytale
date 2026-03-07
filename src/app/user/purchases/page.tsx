"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { profileApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

interface Transaction {
  _id: string;
  type: "purchase" | "unlock" | "reward" | "subscription";
  itemName: string;
  amountFiat?: number;
  amountCoins?: number;
  episodes?: string;
  cover?: string;
  icon: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

type FilterType = "all" | "purchase" | "unlock" | "reward";
type FilterStatus = "all" | "completed" | "pending" | "failed";

export default function PurchasesPage() {
  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [balance, setBalance] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    const load = async () => {
      if (!token) return;
      try {
        const res = await profileApi.getPurchases(token);
        setTransactions(res.data?.purchases || res.data || []);
      } catch { /* fallback empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [user, token]);

  const filtered = transactions.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  const monthlySpent = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions
      .filter(t => {
        if (!t.amountFiat || t.status !== "completed") return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amountFiat || 0), 0);
  })();

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const getTypeIcon = (t: Transaction) => {
    if (t.type === "unlock" && t.cover) {
      return <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden opacity-80"><Image src={t.cover} alt="" width={40} height={40} className="w-full h-full object-cover" /></div>;
    }
    const icons: Record<string, { path: string; color: string; bg: string }> = {
      coins: { path: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-yellow-400", bg: "bg-yellow-500/10" },
      film: { path: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5", color: "text-blue-400", bg: "bg-blue-500/10" },
      gift: { path: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", color: "text-purple-400", bg: "bg-purple-500/10" },
      crown: { path: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    };
    const ic = icons[t.icon] || icons.coins;
    return (
      <div className={`w-10 h-10 rounded-lg ${ic.bg} flex items-center justify-center`}>
        <svg className={`w-5 h-5 ${ic.color}`} fill={t.icon === "crown" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={ic.path} /></svg>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { dot: string; text: string; bg: string; pulse?: boolean }> = {
      completed: { dot: "bg-green-400", text: "text-green-400", bg: "bg-green-400/10" },
      pending: { dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-400/10", pulse: true },
      failed: { dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10" },
    };
    const s = map[status] || map.completed;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.text} ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Header with Balance */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              <span className="text-sm">Back</span>
            </button>
            <h1 className="text-2xl font-bold">Purchase History</h1>
          </div>
          {/* Coin Capsule */}
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#phGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
            <span className="font-bold text-yellow-400">{balance.toLocaleString()}</span>
            <Link href="/user/coins" className="ml-1 px-2.5 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full hover:bg-yellow-400 transition">ADD</Link>
          </div>
        </div>

        {/* Monthly Summary Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800/50 border border-white/5 p-6 relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
          </div>
          <div className="relative">
            <p className="text-sm text-gray-400 mb-1">This Month&apos;s Spending</p>
            <p className="text-3xl font-bold text-white">${monthlySpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{transactions.filter(t => t.status === "completed").length} transactions completed</p>
          </div>
          <button disabled className="absolute right-6 bottom-6 flex items-center gap-2 text-xs text-gray-500 cursor-not-allowed opacity-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Download Invoice (Coming soon)
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#1E1E1E] rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Type:</span>
            {(["all", "purchase", "unlock", "reward"] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterType === f ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-transparent text-gray-400 hover:text-white hover:border-white/10"}`}>
                {f === "all" ? "All" : f === "purchase" ? "Recharges" : f === "unlock" ? "Unlocks" : "Rewards"}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Status:</span>
            {(["all", "completed", "pending", "failed"] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterStatus === f ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-transparent text-gray-400 hover:text-white hover:border-white/10"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(t => {
              const isFailed = t.status === "failed";
              const isPositive = (t.amountCoins || 0) > 0 || t.type === "purchase" || t.type === "subscription";
              return (
                <div key={t._id} className="group rounded-xl hover:bg-[#2A2A2A] transition">
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 items-center gap-4 px-4 py-3.5">
                    <div className="col-span-1">{getTypeIcon(t)}</div>
                    <div className="col-span-4">
                      <p className={`text-sm font-medium ${isFailed ? "line-through text-gray-500" : "text-white"}`}>{t.itemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.episodes && <span className="text-[11px] text-gray-500">Ep. {t.episodes}</span>}
                        <button onClick={() => handleCopyId(t._id)} className="text-[11px] text-gray-600 hover:text-gray-400 font-mono transition" title="Click to copy">
                          {copiedId === t._id ? "Copied!" : t._id}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <span className="text-gray-600 ml-1.5">{new Date(t.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="col-span-2">{getStatusBadge(t.status)}</div>
                    <div className="col-span-2 text-right">
                      {t.amountFiat != null && (
                        <p className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : "-"}${t.amountFiat.toFixed(2)}
                        </p>
                      )}
                      {t.amountCoins != null && (
                        <p className={`text-xs ${(t.amountCoins || 0) >= 0 ? "text-yellow-400/70" : "text-red-400/70"}`}>
                          {(t.amountCoins || 0) >= 0 ? "+" : ""}{t.amountCoins?.toLocaleString()} coins
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-3 px-4 py-3.5">
                    <div className="shrink-0">{getTypeIcon(t)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isFailed ? "line-through text-gray-500" : "text-white"}`}>{t.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {t.episodes && <span> · Ep. {t.episodes}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getStatusBadge(t.status)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {t.amountFiat != null && (
                        <p className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : "-"}${t.amountFiat.toFixed(2)}
                        </p>
                      )}
                      {t.amountCoins != null && (
                        <p className={`text-xs ${(t.amountCoins || 0) >= 0 ? "text-yellow-400/70" : "text-red-400/70"}`}>
                          {(t.amountCoins || 0) >= 0 ? "+" : ""}{t.amountCoins?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
            </div>
            <p className="text-gray-400 font-medium">No transactions found</p>
            <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or make your first purchase</p>
            <Link href="/user/coins" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Get Coins
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
