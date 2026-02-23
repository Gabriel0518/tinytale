"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";

// ─── Types ───────────────────────────────────────────────
interface OrderData {
  orderId: string;
  status: string;
  createdAt: string;
  paidAt: string;
  product: string;
  type: string;
  price: string;
  baseCoins: number;
  bonusCoins: number;
  totalReceived: number;
  user: {
    id: string;
    name: string;
    email: string;
    region: string;
    coinBalance: number;
    isVip: boolean;
  };
  payment: {
    channel: string;
    method: string;
    transactionId: string;
    timeline: { label: string; time: string; status?: string }[];
  };
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [coinHandling, setCoinHandling] = useState("auto_deduct");
  const [refundReason, setRefundReason] = useState("");
  const [refundDetails, setRefundDetails] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const { toast } = useToast();

  // ─── Fetch Order ────────────────────────────────────────
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res: any = await adminApi.getTransaction(id as string);
        const txn = res?.data || res;
        if (txn) {
          setOrder({
            orderId: txn.orderId || txn._id || (id as string),
            status: txn.status || "Unknown",
            createdAt: txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "",
            paidAt: txn.paidAt ? new Date(txn.paidAt).toLocaleString() : "",
            product: txn.description || txn.product || "",
            type: capitalize(txn.type || "recharge"),
            price: txn.amount ? `$${txn.amount}` : "$0.00",
            baseCoins: txn.coinAmount || 0,
            bonusCoins: txn.bonusCoins || 0,
            totalReceived: (txn.coinAmount || 0) + (txn.bonusCoins || 0),
            user: {
              id: typeof txn.userId === "object" ? txn.userId?._id : txn.userId || "",
              name: txn.userId?.nickname || txn.user?.nickname || txn.userName || "Unknown",
              email: txn.userId?.email || txn.user?.email || txn.userEmail || "",
              region: txn.userId?.region || txn.user?.region || "",
              coinBalance: txn.userId?.coins || txn.user?.coins || 0,
              isVip: txn.userId?.vipStatus === "active" || txn.user?.vipStatus === "active" || false,
            },
            payment: {
              channel: formatPaymentMethod(txn.paymentMethod || "stripe"),
              method: txn.paymentType || txn.paymentMethod || "Credit Card",
              transactionId: txn.stripePaymentIntentId || txn.transactionId || "",
              timeline: (txn.timeline || []).map((t: any) => ({
                ...t,
                time: t.time ? new Date(t.time).toLocaleString() : "",
              })),
            },
          });
        } else {
          setOrder(null);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  // ─── Copy to Clipboard ─────────────────────────────────
  const copyTransactionId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // ─── Refund Handler ─────────────────────────────────────
  const openRefundModal = () => {
    if (!order) return;
    setRefundAmount(order.price.replace("$", ""));
    setCoinHandling("auto_deduct");
    setRefundReason("");
    setRefundDetails("");
    setRefundModalOpen(true);
  };

  const closeRefundModal = () => setRefundModalOpen(false);

  const submitRefund = async () => {
    if (!order || !refundReason) return;
    setRefundLoading(true);
    try {
      await adminApi.refundOrder(id as string, {
        refundAmount: Number(refundAmount),
        coinHandling,
        reason: refundReason,
        details: refundDetails,
      });
      setOrder((prev) => (prev ? { ...prev, status: "Refunded" } : prev));
      closeRefundModal();
      toast("Refund processed successfully", "success");
    } catch (err: any) {
      toast(err?.message || "Refund failed. Please try again.", "error");
    } finally {
      setRefundLoading(false);
    }
  };

  const priceNum = order ? Number(order.price.replace("$", "")) : 0;
  const refundRatio = priceNum > 0 ? Number(refundAmount) / priceNum : 0;
  const coinClawback = order ? Math.round(order.totalReceived * (isNaN(refundRatio) ? 0 : Math.min(refundRatio, 1))) : 0;

  // ─── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-gray-700" />
          <div className="h-10 w-96 rounded bg-gray-700" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-[#13131d]" />
              <div className="h-64 rounded-xl bg-[#13131d]" />
            </div>
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-[#13131d]" />
              <div className="h-64 rounded-xl bg-[#13131d]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0f0f17] p-6">
        <p className="text-gray-400">Order not found.</p>
      </div>
    );
  }

  const truncatedTxnId = order.payment.transactionId.length > 12
    ? `${order.payment.transactionId.slice(0, 12)}...`
    : order.payment.transactionId;

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0f0f17]">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/orders" className="hover:text-white transition-colors">Orders</Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">Recharge Orders</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Order Details</span>
      </nav>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Order #{order.orderId}</h1>
          <p className="mt-1 text-sm text-gray-400">View details for recharge transaction</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openRefundModal}
            disabled={order.status.toLowerCase() === "refunded"}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Refund
          </button>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Back to List
          </Link>
        </div>
      </div>

      {/* ── Two-Column Layout ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left Column ─────────────────────────────── */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Basic Information</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Order ID</span>
                <span className="text-sm font-mono text-white">{order.orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(order.status)}`}>
                  {capitalize(order.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Created At</span>
                <span className="text-sm text-gray-300">{order.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Paid At</span>
                <span className="text-sm text-gray-300">{order.paidAt}</span>
              </div>
            </div>
          </div>

          {/* Product Details Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Product Details</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Product</span>
                <span className="text-sm text-white">{order.product}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Type</span>
                <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                  {order.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Price</span>
                <span className="text-sm font-semibold text-white">{order.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Base Coins</span>
                <span className="text-sm text-gray-300">{order.baseCoins.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Bonus Coins</span>
                <span className="text-sm text-yellow-400">+{order.bonusCoins.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-700/50 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Total Received</span>
                <span className="text-sm font-semibold text-white">{order.totalReceived.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ────────────────────────────── */}
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-4 text-base font-semibold text-white">User Profile</h2>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                {order.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{order.user.name}</span>
                  {order.user.isVip && (
                    <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                      VIP
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">User ID</span>
                <span className="text-sm font-mono text-gray-300">{order.user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm text-gray-300">{order.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Region</span>
                <span className="text-sm text-gray-300">{order.user.region}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Coin Balance</span>
                <span className="text-sm text-yellow-400">{order.user.coinBalance.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-700/50 pt-3">
                <Link
                  href={`/admin/users/${order.user.id}`}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Payment Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Payment Channel</span>
                <span className="text-sm text-white">
                  {order.payment.channel} ({order.payment.method})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-300">{truncatedTxnId}</span>
                  <button
                    onClick={() => copyTransactionId(order.payment.transactionId)}
                    className="rounded p-1 text-gray-500 hover:bg-[#1a1a2e] hover:text-gray-300 transition-colors"
                    title="Copy Transaction ID"
                  >
                    {copied ? (
                      <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-gray-400">Payment Timeline</h3>
              <div className="relative space-y-4 pl-6">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-700/50" />
                {order.payment.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                      step.status === 'failed' ? 'border-red-500 bg-red-500/30' :
                      step.status === 'completed' ? 'border-green-500 bg-green-500/30' :
                      'border-yellow-500 bg-yellow-500/30'
                    }`} />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm text-gray-300">{step.label}</span>
                      <span className="text-xs text-gray-500">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Refund Modal ──────────────────────────────────────── */}
      {refundModalOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-[#13131d] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Process Refund</h3>
                <p className="text-sm text-gray-400">Order #{order.orderId}</p>
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
                  <p className="text-xl font-bold text-white">{order.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">{order.user.name.charAt(0)}</div>
                  <span className="text-sm text-gray-300">{order.user.name}</span>
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
                    max={priceNum}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2.5 pl-7 pr-14 text-sm text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USD</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Max refundable: {order.price}</p>
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
                        Refunding ${Number(refundAmount || 0).toFixed(2)} of {order.price} ({Math.round((isNaN(refundRatio) ? 0 : Math.min(refundRatio, 1)) * 100)}%) will claw back <span className="font-semibold text-amber-200">{coinClawback.toLocaleString()} coins</span> from the user&apos;s {order.totalReceived.toLocaleString()} coins received.
                      </p>
                      <p className="mt-1">User current balance: <span className="font-semibold text-amber-200">{order.user.coinBalance.toLocaleString()} coins</span></p>
                      {coinHandling === "auto_deduct" && coinClawback > order.user.coinBalance && (
                        <p className="mt-1 text-red-400 font-medium">Warning: User balance ({order.user.coinBalance.toLocaleString()}) is less than clawback amount ({coinClawback.toLocaleString()}). Auto-deduct will fail.</p>
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

function getStatusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-green-500/20 text-green-400";
  if (s === "pending") return "bg-yellow-500/20 text-yellow-400";
  if (s === "failed") return "bg-red-500/20 text-red-400";
  if (s === "refunded") return "bg-gray-500/20 text-gray-400";
  return "bg-gray-500/20 text-gray-400";
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    stripe: "Stripe",
    credit_card: "Credit Card",
    paypal: "PayPal",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    coins: "Coins",
    system: "System",
  };
  return map[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : "Unknown");
}
