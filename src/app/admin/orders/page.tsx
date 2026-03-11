"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  amount: number;
  integrationCurrency: string;
  presentmentCurrency: string;
  presentmentAmount: number;
  countryCode: string;
  pricingTier: number;
  adaptivePricingApplied: boolean;
  coins: number;
  channel: string;
  status: "Completed" | "Pending" | "Failed" | "Refunded";
  createdAt: string;
}

interface Filters {
  orderId: string;
  userSearch: string;
  channel: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  integrationCurrency: string;
  presentmentCurrency: string;
  countryCode: string;
  pricingTier: string;
  adaptivePricingApplied: string;
}

const CHANNELS = ["All", "Stripe", "Credit Card", "PayPal", "Apple Pay", "Google Pay", "Coins", "System"];
const STATUSES = ["All", "Completed", "Pending", "Failed", "Refunded"];
const CURRENCIES = ["All", "USD", "EUR", "GBP", "JPY", "KRW", "CAD", "AUD", "BRL", "INR", "IDR", "MXN"];
const TIERS = ["All", "1", "2", "3"];
const ADAPTIVE_OPTIONS = ["All", "Applied", "Not Applied"];
const PAGE_SIZE = 10;

const emptyFilters: Filters = {
  orderId: "",
  userSearch: "",
  channel: "All",
  status: "All",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  integrationCurrency: "All",
  presentmentCurrency: "All",
  countryCode: "",
  pricingTier: "All",
  adaptivePricingApplied: "All",
};

// ── Status badge colours ───────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
  Completed: "bg-green-500/20 text-green-400",
  Pending: "bg-yellow-500/20 text-yellow-400",
  Failed: "bg-red-500/20 text-red-400",
  Refunded: "bg-gray-500/20 text-gray-400",
};

// ── Payment method display name mapping ─────────────────────────────────────────
const channelDisplayName: Record<string, string> = {
  stripe: "Stripe",
  credit_card: "Credit Card",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  coins: "Coins",
  system: "System",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<{
    totalUsdAmount: number;
    totalPresentmentAmount: number;
    adaptivePricingAppliedCount: number;
    adaptivePricingAppliedRate: number;
    currencyBreakdown: Array<{ _id: string; count: number; totalUsdAmount: number; totalPresentmentAmount: number }>;
    pricingTierBreakdown: Array<{ _id: number; count: number; totalUsdAmount: number }>;
    topCountries: Array<{ _id: string; count: number; totalUsdAmount: number }>;
  }>({
    totalUsdAmount: 0,
    totalPresentmentAmount: 0,
    adaptivePricingAppliedCount: 0,
    adaptivePricingAppliedRate: 0,
    currencyBreakdown: [],
    pricingTierBreakdown: [],
    topCountries: [],
  });

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [coinHandling, setCoinHandling] = useState("auto_deduct");
  const [refundReason, setRefundReason] = useState("");
  const [refundDetails, setRefundDetails] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const { toast } = useToast();

  // Fetch orders from API with server-side pagination
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { page: currentPage, limit: PAGE_SIZE };
        const f = appliedFilters;
        if (f.status && f.status !== "All") params.status = f.status.toLowerCase();
        if (f.userSearch) params.search = f.userSearch;
        if (f.orderId) params.search = f.orderId;
        if (f.channel && f.channel !== "All") {
          // Reverse lookup: display name -> backend paymentMethod value
          const reverseChannel = Object.entries(channelDisplayName).find(([, v]) => v === f.channel);
          if (reverseChannel) params.paymentMethod = reverseChannel[0];
        }
        if (f.dateFrom) params.dateFrom = f.dateFrom;
        if (f.dateTo) params.dateTo = f.dateTo;
        if (f.amountMin) params.amountMin = f.amountMin;
        if (f.amountMax) params.amountMax = f.amountMax;
        if (f.integrationCurrency && f.integrationCurrency !== "All") params.integrationCurrency = f.integrationCurrency.toLowerCase();
        if (f.presentmentCurrency && f.presentmentCurrency !== "All") params.presentmentCurrency = f.presentmentCurrency.toLowerCase();
        if (f.countryCode.trim()) params.countryCode = f.countryCode.trim().toUpperCase();
        if (f.pricingTier && f.pricingTier !== "All") params.pricingTier = Number(f.pricingTier);
        if (f.adaptivePricingApplied && f.adaptivePricingApplied !== "All") {
          params.adaptivePricingApplied = f.adaptivePricingApplied === "Applied";
        }

        const res: any = await adminApi.getTransactions(params);
        if (!cancelled) {
          const list = res.data?.transactions ?? res.data ?? [];
          setOrders(
            list.map((t: any) => ({
              id: t._id ?? t.id,
              userId: typeof t.userId === "object" ? t.userId?._id : t.userId,
              userName: t.userId?.nickname ?? t.user?.nickname ?? t.userName ?? "Unknown",
              userEmail: t.userId?.email ?? t.user?.email ?? t.userEmail ?? "",
              type: capitalize(t.type || "recharge"),
              amount: t.amount ?? 0,
              integrationCurrency: (t.integrationCurrency || "usd").toLowerCase(),
              presentmentCurrency: (t.presentmentCurrency || "").toLowerCase(),
              presentmentAmount: t.presentmentAmount ?? 0,
              countryCode: (t.countryCode || "").toUpperCase(),
              pricingTier: Number(t.pricingTier) || 0,
              adaptivePricingApplied: Boolean(t.adaptivePricingApplied),
              coins: (t.coinAmount || 0) + (t.bonusCoins || 0),
              channel: channelDisplayName[t.paymentMethod] || capitalize(t.paymentMethod || "stripe"),
              status: capitalize(t.status) as Order["status"],
              createdAt: t.createdAt,
            }))
          );
          setTotalOrders(res.data?.total ?? list.length);
          setSummary({
            totalUsdAmount: Number(res.data?.summary?.totalUsdAmount || 0),
            totalPresentmentAmount: Number(res.data?.summary?.totalPresentmentAmount || 0),
            adaptivePricingAppliedCount: Number(res.data?.summary?.adaptivePricingAppliedCount || 0),
            adaptivePricingAppliedRate: Number(res.data?.summary?.adaptivePricingAppliedRate || 0),
            currencyBreakdown: Array.isArray(res.data?.summary?.currencyBreakdown) ? res.data.summary.currencyBreakdown : [],
            pricingTierBreakdown: Array.isArray(res.data?.summary?.pricingTierBreakdown) ? res.data.summary.pricingTierBreakdown : [],
            topCountries: Array.isArray(res.data?.summary?.topCountries) ? res.data.summary.topCountries : [],
          });
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setTotalOrders(0);
          setSummary({
            totalUsdAmount: 0,
            totalPresentmentAmount: 0,
            adaptivePricingAppliedCount: 0,
            adaptivePricingAppliedRate: 0,
            currencyBreakdown: [],
            pricingTierBreakdown: [],
            topCountries: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentPage, appliedFilters]);

  // Server-side pagination: orders already filtered and paginated by API
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const pageUsdAmount = useMemo(() => orders.reduce((s, o) => s + o.amount, 0), [orders]);

  // Selection helpers
  const allOnPageSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) orders.forEach((o) => next.delete(o.id));
    else orders.forEach((o) => next.add(o.id));
    setSelectedIds(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    setSelectedIds(next);
  };

  // Refund handler — open modal
  const handleRefund = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setRefundOrder(order);
    setRefundAmount(order.amount.toFixed(2));
    setCoinHandling("auto_deduct");
    setRefundReason("");
    setRefundDetails("");
    setRefundModalOpen(true);
  };

  const closeRefundModal = () => {
    setRefundModalOpen(false);
    setRefundOrder(null);
  };

  const submitRefund = async () => {
    if (!refundOrder || !refundReason) return;
    setRefundLoading(true);
    try {
      await adminApi.refundOrder(refundOrder.id, {
        refundAmount: Number(refundAmount),
        coinHandling,
        reason: refundReason,
        details: refundDetails,
      });
      setOrders((prev) => prev.map((o) => (o.id === refundOrder.id ? { ...o, status: "Refunded" as const } : o)));
      closeRefundModal();
      toast("Refund processed successfully", "success");
    } catch (err: any) {
      toast(err?.message || "Refund failed. Please try again.", "error");
    } finally {
      setRefundLoading(false);
    }
  };

  // Computed refund values
  const refundRatio = refundOrder ? Number(refundAmount) / refundOrder.amount : 0;
  const coinClawback = refundOrder ? Math.round(refundOrder.coins * (isNaN(refundRatio) ? 0 : Math.min(refundRatio, 1))) : 0;

  // Apply / Reset
  const applyFilters = () => { setAppliedFilters({ ...filters }); setCurrentPage(1); };
  const resetFilters = () => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setCurrentPage(1); };

  // Input class
  const inputCls = "w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const selectCls = inputCls + " appearance-none";

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200">
      {/* ── Filter Panel ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-gray-700/50 bg-[#13131d]">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-300 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters
          </span>
          <svg className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {filtersOpen && (
          <div className="border-t border-gray-700/50 px-5 pb-5 pt-4 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Order ID</label>
                <input className={inputCls} placeholder="Search order ID..." value={filters.orderId} onChange={(e) => setFilters({ ...filters, orderId: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">User ID / Email</label>
                <input className={inputCls} placeholder="Search user..." value={filters.userSearch} onChange={(e) => setFilters({ ...filters, userSearch: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Channel</label>
                <select className={selectCls} value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}>
                  {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
                <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Order Time From</label>
                <input type="date" className={inputCls} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Order Time To</label>
                <input type="date" className={inputCls} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount Min ($)</label>
                <input type="number" min={0} step="0.01" className={inputCls} placeholder="0.00" value={filters.amountMin} onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount Max ($)</label>
                <input type="number" min={0} step="0.01" className={inputCls} placeholder="0.00" value={filters.amountMax} onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })} />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Base Currency</label>
                <select className={selectCls} value={filters.integrationCurrency} onChange={(e) => setFilters({ ...filters, integrationCurrency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Presentment Currency</label>
                <select className={selectCls} value={filters.presentmentCurrency} onChange={(e) => setFilters({ ...filters, presentmentCurrency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Country Code</label>
                <input className={inputCls} placeholder="US / JP / BR..." value={filters.countryCode} onChange={(e) => setFilters({ ...filters, countryCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Pricing Tier</label>
                <select className={selectCls} value={filters.pricingTier} onChange={(e) => setFilters({ ...filters, pricingTier: e.target.value })}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Adaptive Pricing</label>
                <select className={selectCls} value={filters.adaptivePricingApplied} onChange={(e) => setFilters({ ...filters, adaptivePricingApplied: e.target.value })}>
                  {ADAPTIVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={resetFilters} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700/40 transition">Reset</button>
              <button onClick={applyFilters} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">Apply Filter</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary Bar ──────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-700/50 bg-[#13131d] px-5 py-3">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            Total Orders: <span className="font-semibold text-gray-200">{totalOrders.toLocaleString()}</span>
            {" \u00B7 "}
            Filtered USD Volume: <span className="font-semibold text-gray-200">{formatMoney(summary.totalUsdAmount || 0, "usd")}</span>
            {" \u00B7 "}
            Current Page USD: <span className="font-semibold text-gray-200">{formatMoney(pageUsdAmount || 0, "usd")}</span>
          </p>
          <p className="text-xs text-gray-500">
            Adaptive Applied: <span className="text-indigo-300">{summary.adaptivePricingAppliedCount.toLocaleString()}</span>
            {" / "}
            <span>{totalOrders.toLocaleString()}</span>
            {" ("}
            <span className="text-indigo-300">{summary.adaptivePricingAppliedRate.toFixed(2)}%</span>
            {")"}
          </p>
          {summary.currencyBreakdown.length > 0 && (
            <p className="text-xs text-gray-500">
              Top currencies: {summary.currencyBreakdown.slice(0, 3).map((item) => `${String(item._id || 'usd').toUpperCase()} (${item.count})`).join(" · ")}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            const headers = ["Order ID", "User", "Email", "Type", "Presentment Amount", "Presentment Currency", "Base Amount (USD)", "Country", "Tier", "Adaptive", "Coins", "Channel", "Status", "Time"];
            const rows = orders.map((o) => [
              o.id,
              o.userName,
              o.userEmail,
              o.type,
              (o.presentmentAmount > 0 ? o.presentmentAmount : o.amount).toFixed(2),
              (o.presentmentCurrency || o.integrationCurrency || "usd").toUpperCase(),
              o.amount.toFixed(2),
              o.countryCode || "",
              o.pricingTier || "",
              o.adaptivePricingApplied ? "yes" : "no",
              o.coins,
              o.channel,
              o.status,
              o.createdAt,
            ].join(","));
            const csv = [headers.join(","), ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700/40 transition"
        >Export Data</button>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/50 bg-[#13131d]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3"><input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] accent-indigo-600" /></th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Presentment</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Coins</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={12} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-700/40" /></td></tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={12} className="px-4 py-16 text-center text-gray-500">No orders found</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#1a1a2e]/60 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleOne(o.id)} className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] accent-indigo-600" /></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-indigo-400">{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">{o.userName.charAt(0)}</div>
                      <div>
                        <div className="font-medium text-gray-200">{o.userName}</div>
                        <div className="text-xs text-gray-500">ID: {o.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-400">{o.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-gray-200">
                      {formatMoney(o.presentmentAmount > 0 ? o.presentmentAmount : o.amount, o.presentmentCurrency || o.integrationCurrency || "usd")}
                    </div>
                    <div className="text-xs text-gray-500">{(o.presentmentCurrency || o.integrationCurrency || "usd").toUpperCase()}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-300">
                    {formatMoney(o.amount, o.integrationCurrency || "usd")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-gray-300">{o.countryCode || "UNKNOWN"}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>Tier {o.pricingTier || "-"}</span>
                      <span className={`rounded-full px-1.5 py-0.5 ${o.adaptivePricingApplied ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-700/40 text-gray-400"}`}>
                        {o.adaptivePricingApplied ? "Adaptive" : "Fixed"}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">{o.coins.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">{o.channel}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">{formatDate(o.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/orders/${o.id}`} className="rounded p-1 text-gray-400 hover:bg-gray-700/40 hover:text-indigo-400 transition" title="View">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      <button onClick={() => handleRefund(o.id)} disabled={o.status === "Refunded"} className="rounded p-1 text-gray-400 hover:bg-gray-700/40 hover:text-red-400 transition disabled:cursor-not-allowed disabled:opacity-30" title="Refund">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 010 10H9m-6-5l-3-3m0 0l3-3m-3 3h18" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {!loading && totalOrders > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalOrders)} of {totalOrders.toLocaleString()} orders
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition">Prev</button>
            {pageNumbers(currentPage, totalPages).map((n, i) =>
              n === "..." ? (
                <span key={`dot-${i}`} className="px-2 text-gray-600">...</span>
              ) : (
                <button key={n} onClick={() => setCurrentPage(n as number)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${currentPage === n ? "bg-indigo-600 text-white" : "border border-gray-700/50 text-gray-400 hover:bg-[#1a1a2e]"}`}>{n}</button>
              )
            )}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a2e] disabled:opacity-30 transition">Next</button>
          </div>
        </div>
      )}
      {/* ── Refund Modal ──────────────────────────────────────── */}
      {refundModalOpen && refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-[#13131d] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Process Refund</h3>
                <p className="text-sm text-gray-400">Order #{refundOrder.id}</p>
              </div>
              <button onClick={closeRefundModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-700/40 hover:text-white transition">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Original Amount Card */}
              <div className="flex items-center justify-between rounded-xl border border-gray-700/50 bg-[#1a1a2e] px-4 py-3">
                <div>
                  <p className="text-xs text-gray-400">Original Amount</p>
                  <p className="text-xl font-bold text-white">${refundOrder.amount.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">{refundOrder.userName.charAt(0)}</div>
                  <span className="text-sm text-gray-300">{refundOrder.userName}</span>
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Refund Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    min={0}
                    max={refundOrder.amount}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-7 pr-14 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USD</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Max refundable: ${refundOrder.amount.toFixed(2)}</p>
              </div>

              {/* Coin Handling */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Coin Handling</label>
                <select
                  value={coinHandling}
                  onChange={(e) => setCoinHandling(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="auto_deduct">Auto-deduct from user balance (Recommended)</option>
                  <option value="manual_deduct">Manual deduction (admin handles separately)</option>
                  <option value="no_deduct">No coin deduction (keep coins)</option>
                </select>
              </div>

              {/* Refund Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Refund Reason <span className="text-red-400">*</span></label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Customer Request">Customer Request</option>
                  <option value="Duplicate Payment">Duplicate Payment</option>
                  <option value="Service Issue">Service Issue</option>
                  <option value="Technical Error">Technical Error</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Additional Details */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Additional Details</label>
                <textarea
                  value={refundDetails}
                  onChange={(e) => setRefundDetails(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes about this refund..."
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Coin Clawback Info Box */}
              {coinHandling !== "no_deduct" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-xs text-amber-200/80">
                      <p className="font-medium text-amber-300">Coin Clawback Logic</p>
                      <p className="mt-1">
                        Refunding ${Number(refundAmount || 0).toFixed(2)} of ${refundOrder.amount.toFixed(2)} ({Math.round((isNaN(refundRatio) ? 0 : Math.min(refundRatio, 1)) * 100)}%) will claw back <span className="font-semibold text-amber-200">{coinClawback.toLocaleString()} coins</span> from the user&apos;s {refundOrder.coins.toLocaleString()} coins received.
                      </p>
                      {coinHandling === "auto_deduct" && (
                        <p className="mt-1">Coins will be automatically deducted from the user&apos;s current balance.</p>
                      )}
                      {coinHandling === "manual_deduct" && (
                        <p className="mt-1">Admin must manually handle the coin deduction separately.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
              <button onClick={closeRefundModal} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700/40 transition">
                Cancel
              </button>
              <button
                onClick={submitRefund}
                disabled={refundLoading || !refundReason || !refundAmount || Number(refundAmount) <= 0}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refundLoading ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatMoney(amount: number, currencyCode: string) {
  const normalized = (currencyCode || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${normalized} ${Number(amount || 0).toFixed(2)}`;
  }
}

function pageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
