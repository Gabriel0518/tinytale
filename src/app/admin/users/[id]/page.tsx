"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { formatAdminDate, formatAdminDateTime, useAdminLocale } from "@/lib/admin-i18n";

// ─── Types ───────────────────────────────────────────────
interface UserData {
  _id: string;
  nickname: string;
  email: string;
  avatar?: string;
  coins: number;
  silverCoins: number;
  status: "active" | "banned";
  vipStatus: "vip" | "standard" | "none";
  vipExpiry: string | null;
  registrationMethod: "google" | "email" | "apple";
  createdAt: string;
  userId: string;
  totalRecharge: number;
  coinsSpent: number;
  unlockedDramas: number;
  referrer: { name: string; id: string } | null;
}

interface RechargeRow {
  orderId: string;
  product: string;
  amount: string;
  coinsReceived: string;
  channel: string;
  status: "Paid" | "Pending" | "Failed";
  date: string;
}

interface ConsumptionRow {
  date: string;
  type: string;
  drama: string;
  episode: string;
  coins: number;
  balanceAfter: number;
}

interface PlaybackRow {
  drama: string;
  episode: string;
  progress: string;
  duration: string;
  lastWatched: string;
}

interface WatchlistRow {
  drama: string;
  addedDate: string;
  episodes: number;
  status: string;
}

interface CommentRow {
  drama: string;
  comment: string;
  rating: number;
  date: string;
  status: string;
}

interface LoginLogRow {
  date: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  status: string;
}

interface OperationLogRow {
  date: string;
  action: string;
  details: string;
  operator: string;
  ip: string;
}

// ─── Tabs ────────────────────────────────────────────────
const TABS = [
  "Recharge History",
  "Consumption History",
  "Playback History",
  "Watchlist",
  "Comments",
  "Login Logs",
  "Operation Logs",
] as const;
type TabName = (typeof TABS)[number];

// ─── Status Badge Helper ─────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Paid: "bg-green-500/20 text-green-400",
    Success: "bg-green-500/20 text-green-400",
    Approved: "bg-green-500/20 text-green-400",
    Active: "bg-green-500/20 text-green-400",
    Watching: "bg-blue-500/20 text-blue-400",
    Completed: "bg-green-500/20 text-green-400",
    Pending: "bg-yellow-500/20 text-yellow-400",
    "Plan to Watch": "bg-gray-500/20 text-gray-400",
    Failed: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

// ─── Star Rating Helper ──────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-3.5 w-3.5 ${s <= rating ? "text-yellow-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function UserDetailPage() {
  const { id } = useParams();
  const { locale } = useAdminLocale();

  // ─── State ─────────────────────────────────────────────
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("Recharge History");

  // Recharge filters
  const [searchOrder, setSearchOrder] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  // Coin modal fields
  const [coinType, setCoinType] = useState<"add" | "deduct">("add");
  const [coinWallet, setCoinWallet] = useState<"gold" | "silver">("gold");
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [coinNote, setCoinNote] = useState("");

  // VIP modal fields
  const [vipActionType, setVipActionType] = useState("extend");
  const [vipDuration, setVipDuration] = useState("30");
  const [vipReason, setVipReason] = useState("");

  // Ban modal fields
  const [banDuration, setBanDuration] = useState("7");
  const [banReason, setBanReason] = useState("");
  const [clearSessions, setClearSessions] = useState(true);

  // Tab data states
  const [consumptionData, setConsumptionData] = useState<ConsumptionRow[]>([]);
  const [playbackData, setPlaybackData] = useState<PlaybackRow[]>([]);
  const [watchlistData, setWatchlistData] = useState<WatchlistRow[]>([]);
  const [commentsData, setCommentsData] = useState<CommentRow[]>([]);
  const [loginLogsData, setLoginLogsData] = useState<LoginLogRow[]>([]);
  const [operationLogsData, setOperationLogsData] = useState<OperationLogRow[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // ─── Fetch User ────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res: any = await adminApi.getUser(id as string);
        const u = res.data?.user || res.data;
        setUser({
          _id: u._id || id as string,
          nickname: u.nickname || u.name || "Unknown",
          email: u.email || "",
          avatar: u.avatar || "",
          coins: u.coins || 0,
          silverCoins: u.silverCoins || 0,
          status: u.status || "active",
          vipStatus: u.vipStatus === "active" ? "vip" : u.vipStatus === "expired" ? "none" : u.vipStatus || "none",
          vipExpiry: u.vipExpireDate || u.vipExpiry || null,
          registrationMethod: u.registrationMethod || (u.googleId ? "google" : u.facebookId ? "apple" : "email"),
          createdAt: u.createdAt ? u.createdAt.split("T")[0] : "",
          userId: u._id || u.userId || id as string,
          totalRecharge: u.totalRecharge ?? 0,
          coinsSpent: u.coinsSpent ?? 0,
          unlockedDramas: u.unlockedDramas ?? 0,
          referrer: u.referrer || null,
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  // ─── Recharge data from API ───────────────────────────
  const [rechargeData, setRechargeData] = useState<RechargeRow[]>([]);
  const [totalRechargeItems, setTotalRechargeItems] = useState(0);

  const fetchRecharge = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await adminApi.getUserTransactions(id as string, { page: currentPage, limit: 5, type: "recharge" });
      const items = res.data?.transactions || res.data || [];
      setRechargeData(items.map((t: any) => ({
        orderId: t._id || t.orderId || "",
        product: t.description || t.product || `${t.coinAmount || 0} Coins`,
        amount: t.amount ? `$${t.amount.toFixed(2)}` : "$0.00",
        coinsReceived: t.coinAmount ? t.coinAmount.toLocaleString() : "-",
        channel: t.paymentMethod || "Stripe",
        status: t.status === "completed" ? "Paid" : t.status === "failed" ? "Failed" : "Pending",
        date: t.createdAt ? formatAdminDate(t.createdAt, locale, { month: "short", day: "numeric", year: "numeric" }) : "",
      })));
      setTotalRechargeItems(res.data?.total || items.length);
    } catch {
      setRechargeData([]);
      setTotalRechargeItems(0);
    }
  }, [currentPage, id, locale]);

  useEffect(() => { fetchRecharge(); }, [fetchRecharge]);

  const fetchTabData = useCallback(async (tab: TabName) => {
    if (!id) return;
    setTabLoading(true);
    try {
      switch (tab) {
        case "Consumption History": {
          const res: any = await adminApi.getUserConsumption(id as string, { page: 1, limit: 50 });
          const items = res.data?.consumption || res.data?.records || res.data || [];
          setConsumptionData(items.map((r: any) => ({
            date: (r.unlockedAt || r.createdAt) ? formatAdminDate(r.unlockedAt || r.createdAt, locale, { month: "short", day: "numeric", year: "numeric" }) : "",
            type: r.type || "Unlock",
            drama: r.dramaTitle || "Unknown",
            episode: r.episodeTitle || `Ep ${r.episodeNumber || "?"}`,
            coins: r.price || r.coins || 0,
            balanceAfter: r.balanceAfter || 0,
          })));
          break;
        }
        case "Playback History": {
          const res: any = await adminApi.getUserPlayback(id as string, { page: 1, limit: 50 });
          const items = res.data?.playback || res.data?.records || res.data || [];
          setPlaybackData(items.map((r: any) => ({
            drama: r.dramaTitle || "Unknown",
            episode: r.episodeTitle || `Ep ${r.episodeNumber || "?"}`,
            progress: r.progress ? `${Math.round(r.progress)}%` : "0%",
            duration: r.duration || "N/A",
            lastWatched: (r.lastWatched || r.updatedAt) ? formatAdminDate(r.lastWatched || r.updatedAt, locale, { month: "short", day: "numeric", year: "numeric" }) : "",
          })));
          break;
        }
        case "Watchlist": {
          const res: any = await adminApi.getUserWatchlist(id as string, { page: 1, limit: 50 });
          const items = res.data?.watchlist || res.data?.records || res.data || [];
          setWatchlistData(items.map((r: any) => ({
            drama: r.dramaTitle || "Unknown",
            addedDate: (r.addedAt || r.createdAt) ? formatAdminDate(r.addedAt || r.createdAt, locale, { month: "short", day: "numeric", year: "numeric" }) : "",
            episodes: r.totalEpisodes || 0,
            status: r.status || "Watching",
          })));
          break;
        }
        case "Comments": {
          const res: any = await adminApi.getUserComments(id as string, { page: 1, limit: 50 });
          const items = res.data?.comments || res.data?.records || res.data || [];
          setCommentsData(items.map((r: any) => ({
            drama: r.dramaTitle || "Unknown",
            comment: r.content || "",
            rating: r.rating || 0,
            date: r.createdAt ? formatAdminDate(r.createdAt, locale, { month: "short", day: "numeric", year: "numeric" }) : "",
            status: r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Pending",
          })));
          break;
        }
        case "Login Logs": {
          const res: any = await adminApi.getUserLoginLogs(id as string, { page: 1, limit: 50 });
          const items = res.data?.loginLogs || res.data?.records || res.data || [];
          setLoginLogsData(items.map((r: any) => ({
            date: (r.occurredAt || r.createdAt) ? formatAdminDateTime(r.occurredAt || r.createdAt, locale, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
            ip: r.ip || "-",
            device: r.device || "Unknown",
            browser: r.browser || "Unknown",
            location: r.location || "-",
            status: r.success === false ? "Failed" : "Success",
          })));
          break;
        }
        case "Operation Logs": {
          const res: any = await adminApi.getUserOperationLogs(id as string, { page: 1, limit: 50 });
          const items = res.data?.logs || res.data?.records || res.data || [];
          setOperationLogsData(items.map((r: any) => ({
            date: r.createdAt ? formatAdminDateTime(r.createdAt, locale, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
            action: r.action || "",
            details: typeof r.details === "object" ? JSON.stringify(r.details) : (r.details || ""),
            operator: r.admin?.name || r.adminName || r.operator || "system",
            ip: r.ip || "-",
          })));
          break;
        }
      }
    } catch {
      // Keep empty data on error - no mock fallback
    } finally {
      setTabLoading(false);
    }
  }, [id, locale]);

  useEffect(() => {
    if (activeTab !== "Recharge History") {
      fetchTabData(activeTab);
    }
  }, [activeTab, fetchTabData]);

  const filteredRecharge = useMemo(() => {
    let data = rechargeData;
    if (searchOrder) {
      data = data.filter((r) => r.orderId.toLowerCase().includes(searchOrder.toLowerCase()));
    }
    if (statusFilter !== "All Status") {
      data = data.filter((r) => r.status === statusFilter);
    }
    return data;
  }, [rechargeData, searchOrder, statusFilter]);

  const pageSize = 5;
  const totalPages = Math.ceil(totalRechargeItems / pageSize);

  // ─── Handlers ──────────────────────────────────────────
  const handleCoinAdjust = async () => {
    if (!coinAmount || !coinReason) return;
    const adjustedAmount = coinType === "deduct" ? -Math.abs(Number(coinAmount)) : Math.abs(Number(coinAmount));
    const payload =
      coinWallet === "silver"
        ? {
            silverCoinAdjustment: adjustedAmount,
            reason: coinReason,
            note: coinNote,
          }
        : {
            coinAdjustment: adjustedAmount,
            reason: coinReason,
            note: coinNote,
          };
    try {
      await adminApi.updateUser(id as string, payload);
    } catch {
      // fallback: apply locally
    }
    setUser((prev) =>
      prev
        ? {
            ...prev,
            coins: coinWallet === "gold" ? prev.coins + adjustedAmount : prev.coins,
            silverCoins: coinWallet === "silver" ? prev.silverCoins + adjustedAmount : prev.silverCoins,
          }
        : prev
    );
    setShowCoinModal(false);
    setCoinType("add");
    setCoinWallet("gold");
    setCoinAmount("");
    setCoinReason("");
    setCoinNote("");
  };

  const handleVipAdjust = async () => {
    if (!vipReason) return;
    try {
      await adminApi.updateUser(id as string, {
        vipAction: vipActionType,
        vipDuration: Number(vipDuration),
        vipReason,
      });
    } catch {
      // fallback
    }
    if (vipActionType === "cancel") {
      setUser((prev) => (prev ? { ...prev, vipStatus: "standard", vipExpiry: null } : prev));
    } else {
      setUser((prev) => (prev ? { ...prev, vipStatus: "vip" } : prev));
    }
    setShowVipModal(false);
    setVipActionType("extend");
    setVipDuration("30");
    setVipReason("");
  };

  const handleBan = async () => {
    if (!banReason) return;
    const newStatus = user?.status === "banned" ? "active" : "banned";
    try {
      await adminApi.updateUser(id as string, {
        status: newStatus,
        banReason,
        banDuration: newStatus === "banned" ? (banDuration === "0" ? "permanent" : `${banDuration} days`) : undefined,
        clearSessions: newStatus === "banned" ? clearSessions : undefined,
      });
    } catch {
      // fallback
    }
    setUser((prev) =>
      prev ? { ...prev, status: newStatus as "active" | "banned" } : prev
    );
    setShowBanModal(false);
    setBanDuration("7");
    setBanReason("");
    setClearSessions(true);
  };

  // ─── Loading / Not Found ───────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-gray-700" />
          <div className="h-32 rounded-xl bg-[#13131d]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[#13131d]" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[#13131d]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <p className="text-gray-400">User not found.</p>
      </div>
    );
  }

  const isBanned = user.status === "banned";

  // ─── Registration Method Icon ──────────────────────────
  const regIcon = (method: string) => {
    if (method === "google")
      return (
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
    if (method === "apple")
      return (
        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      );
    return (
      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0f0f17]">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/users" className="hover:text-white transition-colors">Users</Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">User Details</span>
      </nav>

      {/* ── Profile Header Card ─────────────────────────── */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex items-start justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">{user.nickname}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}>
                  {isBanned ? "Banned" : "Active"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-400">
                <span>ID: {user.userId}</span>
                <span>Email: {user.email}</span>
                <span className="flex items-center gap-1.5">
                  {regIcon(user.registrationMethod)}
                  {user.registrationMethod === "google" ? "Google" : user.registrationMethod === "apple" ? "Apple" : "Email"}
                </span>
                <span>Reg: {user.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCoinModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Adjust Coins
            </button>
            <button
              onClick={() => setShowVipModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Adjust VIP
            </button>
            <button
              onClick={() => setShowBanModal(true)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isBanned
                  ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                  : "border-red-500/50 text-red-400 hover:bg-red-500/10"
              }`}
            >
              {isBanned ? "Unban User" : "Ban User"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
        {/* Membership */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Membership</span>
          </div>
          <p className="text-lg font-semibold text-white">{user.vipStatus === "vip" ? "VIP" : "Standard"}</p>
          {user.vipExpiry && <p className="text-xs text-gray-500">Expires: {user.vipExpiry}</p>}
        </div>

        {/* Coins Balance */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.35 5.35 0 01-.491-.921H10a1 1 0 100-2H8.003a7.533 7.533 0 010-1H10a1 1 0 100-2H8.245c.155-.347.335-.665.491-.921z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Coins Balance</span>
          </div>
          <p className="text-lg font-semibold text-white">{user.coins.toLocaleString()}</p>
        </div>

        {/* Silver Coins Balance */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/20">
              <svg className="h-4 w-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2.2a1.1 1.1 0 011.1 1.1v.15a3.35 3.35 0 011.96 1.07.9.9 0 11-1.38 1.16 1.56 1.56 0 00-1.23-.56c-.64 0-1.05.33-1.05.76 0 .45.42.67 1.41.94 1.28.34 2.84.9 2.84 2.78 0 1.5-1.04 2.56-2.65 2.83v.17a1.1 1.1 0 11-2.2 0v-.2a3.62 3.62 0 01-2.31-1.2.9.9 0 111.38-1.16c.4.47 1.03.74 1.71.74.7 0 1.17-.31 1.17-.8 0-.56-.55-.77-1.62-1.07-1.2-.34-2.63-.91-2.63-2.67 0-1.45 1.05-2.5 2.56-2.77v-.12A1.1 1.1 0 0110 4.2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Silver Balance</span>
          </div>
          <p className="text-lg font-semibold text-white">{user.silverCoins.toLocaleString()}</p>
        </div>

        {/* Total Recharge */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
              <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Total Recharge</span>
          </div>
          <p className="text-lg font-semibold text-white">${user.totalRecharge.toFixed(2)}</p>
        </div>

        {/* Coins Spent */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
              <svg className="h-4 w-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Coins Spent</span>
          </div>
          <p className="text-lg font-semibold text-white">{user.coinsSpent.toLocaleString()}</p>
        </div>

        {/* Unlocked */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Unlocked</span>
          </div>
          <p className="text-lg font-semibold text-white">{user.unlockedDramas} dramas</p>
        </div>

        {/* Referrer */}
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20">
              <svg className="h-4 w-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Referrer</span>
          </div>
          {user.referrer ? (
            <>
              <p className="text-lg font-semibold text-white">{user.referrer.name}</p>
              <p className="text-xs text-gray-500">ID: {user.referrer.id}</p>
            </>
          ) : (
            <p className="text-lg font-semibold text-gray-500">None</p>
          )}
        </div>
      </div>

      {/* ── Tabs Section ────────────────────────────────── */}
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-700/50 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* ── Recharge History ─────────────────────────── */}
          {activeTab === "Recharge History" && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
                >
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
                <button className="ml-auto rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2 text-sm text-gray-300 hover:bg-[#22223a] transition-colors">
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-3 font-medium">Order No.</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Coins Received</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {filteredRecharge.map((row) => (
                      <tr key={row.orderId} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-400">{row.orderId}</td>
                        <td className="px-4 py-3">{row.product}</td>
                        <td className="px-4 py-3">{row.amount}</td>
                        <td className="px-4 py-3">{row.coinsReceived}</td>
                        <td className="px-4 py-3">{row.channel}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-gray-500">{row.date}</td>
                        <td className="px-4 py-3">
                          <button className="text-indigo-400 hover:text-indigo-300 text-xs">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Showing 1 to {Math.min(pageSize, filteredRecharge.length)} of {totalRechargeItems} orders</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded px-2 py-1 hover:bg-[#1a1a2e] disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  {[1, 2, 3, 4, 5, 6].map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`rounded px-2.5 py-1 text-xs ${
                        currentPage === p ? "bg-indigo-600 text-white" : "hover:bg-[#1a1a2e] text-gray-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded px-2 py-1 hover:bg-[#1a1a2e] disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Consumption History ─────────────────────── */}
          {activeTab === "Consumption History" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Drama</th>
                    <th className="px-4 py-3 font-medium">Episode</th>
                    <th className="px-4 py-3 font-medium">Coins</th>
                    <th className="px-4 py-3 font-medium">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {consumptionData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.type === "Unlock" ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400"
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.drama}</td>
                      <td className="px-4 py-3">{row.episode}</td>
                      <td className="px-4 py-3 text-red-400">-{row.coins}</td>
                      <td className="px-4 py-3">{row.balanceAfter.toLocaleString()}</td>
                    </tr>
                  ))}
                  {consumptionData.length === 0 && !tabLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No consumption records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Playback History ────────────────────────── */}
          {activeTab === "Playback History" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Drama</th>
                    <th className="px-4 py-3 font-medium">Episode</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Last Watched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {playbackData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3">{row.drama}</td>
                      <td className="px-4 py-3">{row.episode}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-gray-700">
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: row.progress }} />
                          </div>
                          <span className="text-xs text-gray-500">{row.progress}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.duration}</td>
                      <td className="px-4 py-3 text-gray-500">{row.lastWatched}</td>
                    </tr>
                  ))}
                  {playbackData.length === 0 && !tabLoading && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No playback records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Watchlist ───────────────────────────────── */}
          {activeTab === "Watchlist" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Drama</th>
                    <th className="px-4 py-3 font-medium">Added Date</th>
                    <th className="px-4 py-3 font-medium">Episodes</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {watchlistData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3">{row.drama}</td>
                      <td className="px-4 py-3 text-gray-500">{row.addedDate}</td>
                      <td className="px-4 py-3">{row.episodes}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <button className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                  {watchlistData.length === 0 && !tabLoading && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No watchlist items found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Comments ────────────────────────────────── */}
          {activeTab === "Comments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Drama</th>
                    <th className="px-4 py-3 font-medium">Comment</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {commentsData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3">{row.drama}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{row.comment}</td>
                      <td className="px-4 py-3"><StarRating rating={row.rating} /></td>
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <button className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {commentsData.length === 0 && !tabLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No comments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Login Logs ──────────────────────────────── */}
          {activeTab === "Login Logs" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">IP Address</th>
                    <th className="px-4 py-3 font-medium">Device</th>
                    <th className="px-4 py-3 font-medium">Browser</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {loginLogsData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.ip}</td>
                      <td className="px-4 py-3">{row.device}</td>
                      <td className="px-4 py-3">{row.browser}</td>
                      <td className="px-4 py-3">{row.location}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                  {loginLogsData.length === 0 && !tabLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No login logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Operation Logs ──────────────────────────── */}
          {activeTab === "Operation Logs" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a1a2e] text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                    <th className="px-4 py-3 font-medium">Operator</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {operationLogsData.map((row, i) => (
                    <tr key={i} className="text-gray-300 hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3">{row.action}</td>
                      <td className="px-4 py-3">{row.details}</td>
                      <td className="px-4 py-3 text-gray-500">{row.operator}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.ip}</td>
                    </tr>
                  ))}
                  {operationLogsData.length === 0 && !tabLoading && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No operation logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODALS                                             */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* ── Adjust Coins Modal (M3-01) ─────────────────── */}
      {showCoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowCoinModal(false)}>
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Coin Adjustment</h3>
              <button onClick={() => setShowCoinModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Current Balance */}
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                <p className="text-xs text-gray-400 mb-2">User: {user.nickname} (ID: {user.userId})</p>
                <div className="space-y-1">
                  <p className={`text-lg font-semibold ${coinWallet === "gold" ? "text-yellow-400" : "text-gray-300"}`}>
                    Gold: {user.coins.toLocaleString()}
                  </p>
                  <p className={`text-lg font-semibold ${coinWallet === "silver" ? "text-slate-300" : "text-gray-500"}`}>
                    Silver: {user.silverCoins.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Wallet */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Wallet</label>
                <select
                  value={coinWallet}
                  onChange={(e) => setCoinWallet(e.target.value as "gold" | "silver")}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="gold">Gold Coins</option>
                  <option value="silver">Silver Coins</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Type</label>
                <select
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value as "add" | "deduct")}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="add">Add Coins (+)</option>
                  <option value="deduct">Deduct Coins (-)</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 pr-16 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                    {coinWallet === "gold" ? "GOLD" : "SILVER"}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Reason</label>
                <select
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Compensation">Compensation</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Refund">Refund</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Remark */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Remark <span className="text-gray-600">(Optional)</span></label>
                <textarea
                  value={coinNote}
                  onChange={(e) => setCoinNote(e.target.value)}
                  rows={3}
                  placeholder="Enter detailed explanation here..."
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Warning Note */}
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <p className="text-xs text-yellow-400/80">
                  <span className="mr-1">&#9888;</span>
                  Note: Based on your role (Operator), the single adjustment limit is <span className="font-semibold text-yellow-300">5,000 coins</span>. Large adjustments require Super Admin approval.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowCoinModal(false)}
                className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCoinAdjust}
                disabled={!coinAmount || !coinReason}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Adjust VIP Modal (M3-02) ──────────────────── */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVipModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">VIP Member Adjustment</h3>
              <button onClick={() => setShowVipModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Current Status */}
              <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <p className="text-xs text-gray-400 mb-2">User: {user.nickname} (ID: {user.userId})</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                    user.vipStatus === "vip"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {user.vipStatus === "vip" ? (
                      <><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> VIP Gold</>
                    ) : "Standard"}
                  </span>
                  {user.vipExpiry && (
                    <span className="text-xs text-gray-500">Expires: {user.vipExpiry}</span>
                  )}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Action Type</label>
                <select
                  value={vipActionType}
                  onChange={(e) => setVipActionType(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="extend">Extend VIP</option>
                  <option value="upgrade">Upgrade VIP</option>
                  <option value="downgrade">Downgrade VIP</option>
                  <option value="cancel">Cancel VIP</option>
                </select>
              </div>

              {/* Duration */}
              {vipActionType !== "cancel" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-400">Duration</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={vipDuration}
                      onChange={(e) => setVipDuration(e.target.value)}
                      min="1"
                      className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 pr-16 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">DAYS</span>
                  </div>
                </div>
              )}

              {/* Adjustment Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Adjustment Reason <span className="text-red-400">*</span></label>
                <textarea
                  value={vipReason}
                  onChange={(e) => setVipReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a detailed reason for this VIP adjustment..."
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Impact Summary */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <p className="text-xs text-blue-400/80">
                  <span className="mr-1">&#8505;</span>
                  <span className="font-medium">Impact Summary</span> &mdash;{" "}
                  {vipActionType === "cancel"
                    ? "User's VIP membership will be immediately cancelled. They will lose access to VIP-only content."
                    : `User will gain access to VIP-only content for the specified duration. The expiry date will be updated to ${
                        (() => {
                          const d = new Date();
                          d.setDate(d.getDate() + Number(vipDuration || 0));
                          return d.toISOString().split("T")[0];
                        })()
                      }.`}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowVipModal(false)}
                className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVipAdjust}
                disabled={!vipReason}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ban User Modal (M3-03) ────────────────────── */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBanModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-[#13131d] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <div className="flex items-center gap-2">
                {!isBanned && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20">
                    <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">
                  {isBanned ? "Unban User Account" : "Ban User Account"}
                </h3>
              </div>
              <button onClick={() => setShowBanModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Subtitle */}
              <p className="text-sm text-gray-400">
                {isBanned
                  ? <>You are about to restore access for <span className="font-semibold text-white">{user.nickname}</span>.</>
                  : <>You are about to suspend access for <span className="font-semibold text-white">{user.nickname}</span>.</>}
              </p>

              {/* Warning Box */}
              {!isBanned && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-xs text-red-400/90">
                    <span className="mr-1 font-semibold">&#9888; Impact of Banning</span> &mdash; Once banned, the user will be immediately logged out and unable to access any content, recharge, or use accumulated gold coins.
                  </p>
                </div>
              )}

              {/* Ban Duration */}
              {!isBanned && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-400">Ban Duration</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="0">Permanent</option>
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Reason <span className="text-red-400">*</span></label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder={isBanned ? "Please describe the reason for unbanning..." : "Please describe the violation or reason for this action..."}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Clear Sessions Checkbox */}
              {!isBanned && (
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={clearSessions}
                      onChange={(e) => setClearSessions(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={`h-5 w-5 rounded border transition-colors ${
                      clearSessions
                        ? "border-indigo-500 bg-indigo-600"
                        : "border-gray-600 bg-[#1a1a2e]"
                    }`}>
                      {clearSessions && (
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Clear user&apos;s current active sessions</p>
                    <p className="text-xs text-gray-500">Force logout from all devices immediately.</p>
                  </div>
                </label>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={!banReason}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                  isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isBanned ? "Confirm Unban" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
