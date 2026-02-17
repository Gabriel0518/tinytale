"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { profileApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { ArrowLeft, Coins, Crown, Film } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

interface Purchase {
  _id: string;
  type: "coin_recharge" | "episode_unlock" | "subscription";
  amount: number;
  coins?: number;
  drama?: { title: string; cover: string };
  episode?: { episodeNumber: number };
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
}

export default function PurchasesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user && !loading) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!token) return;
      try {
        const params = filter !== "all" ? { type: filter } : undefined;
        const res: any = await profileApi.getPurchases(token, params);
        setPurchases(res.data?.purchases || res.data || []);
      } catch (err) {
        console.error("Failed to fetch purchases:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPurchases();
  }, [token, filter]);

  const filters = [
    { id: "all", label: "All" },
    { id: "coin_recharge", label: "Recharges" },
    { id: "episode_unlock", label: "Unlocks" },
    { id: "subscription", label: "Subscriptions" },
  ];

  const statusVariant = (s: string) => {
    switch (s) {
      case "completed": return "success" as const;
      case "pending": return "warning" as const;
      case "failed": return "error" as const;
      case "refunded": return "default" as const;
      default: return "default" as const;
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "coin_recharge": return <Coins size={18} className="text-accent-gold" />;
      case "subscription": return <Crown size={18} className="text-accent-gold" />;
      default: return <Film size={18} className="text-accent-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-20 pb-12">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="mb-6 text-2xl font-bold text-white">Purchase History</h1>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.id
                  ? "bg-accent-primary text-white"
                  : "bg-bg-elevated text-text-secondary hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : purchases.length > 0 ? (
          <div className="space-y-3">
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center gap-4 rounded-xl bg-bg-secondary p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
                  {typeIcon(p.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {p.type === "coin_recharge" && `${p.coins} Coins Recharge`}
                      {p.type === "episode_unlock" && `Unlocked ${p.drama?.title || "Episode"}`}
                      {p.type === "subscription" && "VIP Subscription"}
                    </span>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-semibold text-white">${p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Coins size={48} />}
            title="No Purchases Yet"
            description="Your purchase history will appear here"
          />
        )}
      </main>
    </div>
  );
}
