"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

interface PaymentMethod {
  _id: string;
  type: "paypal" | "bank_transfer" | "usdt";
  isDefault: boolean;
  paypalEmail?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  routingNumber?: string;
  bankAddress?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt: string;
}

interface DashboardData {
  availableBalance: number;
  pendingClearance: number;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400 border border-green-500/20",
  approved: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  paypal: "PayPal",
  bank_transfer: "Bank Transfer",
  usdt: "USDT",
};

function maskValue(val: string | undefined) {
  if (!val || val.length < 6) return val || "****";
  return val.slice(0, 3) + "****" + val.slice(-3);
}

function TypeIcon({ type }: { type: string }) {
  if (type === "paypal")
    return (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    );
  if (type === "bank_transfer")
    return (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    );
  return (
    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
}

/* ─── Withdraw Modal ─── */
function WithdrawModal({
  open,
  onClose,
  balance,
  methods,
  token,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  methods: PaymentMethod[];
  token: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState(methods.find((m) => m.isDefault)?._id || methods[0]?._id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
      setMethodId(methods.find((m) => m.isDefault)?._id || methods[0]?._id || "");
    }
  }, [open, methods]);

  const numAmount = parseFloat(amount) || 0;
  const fee = +(numAmount * 0.02).toFixed(2);
  const net = +(numAmount - fee).toFixed(2);

  const handleSubmit = async () => {
    if (numAmount < 50) return setError("Minimum withdrawal is $50.00");
    if (numAmount > balance) return setError("Insufficient balance");
    if (!methodId) return setError("Select a payment method");
    setLoading(true);
    setError("");
    try {
      await promoterApi.withdraw(token, { amount: numAmount, paymentMethodId: methodId });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-white mb-1">Request Withdrawal</h2>
        <p className="text-gray-400 text-sm mb-5">Available: <span className="text-green-400 font-medium">${balance.toFixed(2)}</span></p>

        <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
        <select
          value={methodId}
          onChange={(e) => setMethodId(e.target.value)}
          className="w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm mb-4 outline-none focus:border-purple-500"
        >
          {methods.map((m) => (
            <option key={m._id} value={m._id}>
              {TYPE_LABELS[m.type] || m.type} {m.isDefault ? "(Default)" : ""}
            </option>
          ))}
        </select>

        <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
        <div className="relative mb-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min={50}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg pl-7 pr-16 py-2.5 text-white text-sm outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={() => setAmount(balance.toFixed(2))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/30"
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Minimum withdrawal: $50.00</p>

        {numAmount > 0 && (
          <div className="bg-[#0f0f17] rounded-lg p-3 mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400"><span>Amount</span><span className="text-white">${numAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Fee (2%)</span><span className="text-red-400">-${fee.toFixed(2)}</span></div>
            <div className="border-t border-gray-700/50 pt-1.5 flex justify-between font-medium"><span className="text-gray-300">Net Amount</span><span className="text-green-400">${net.toFixed(2)}</span></div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit / Add Payment Method Modal ─── */
function EditPaymentModal({
  open,
  onClose,
  method,
  token,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  method: PaymentMethod | null;
  token: string;
  onSuccess: () => void;
}) {
  const isEdit = !!method;
  const [tab, setTab] = useState<"paypal" | "bank_transfer" | "usdt">(method?.type || "paypal");
  const [form, setForm] = useState({
    paypalEmail: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    routingNumber: "",
    bankAddress: "",
    usdtAddress: "",
    usdtNetwork: "TRC20",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && method) {
      setTab(method.type);
      setForm({
        paypalEmail: method.paypalEmail || "",
        bankName: method.bankName || "",
        accountNumber: method.accountNumber || "",
        accountHolderName: method.accountHolderName || "",
        routingNumber: method.routingNumber || "",
        bankAddress: method.bankAddress || "",
        usdtAddress: method.usdtAddress || "",
        usdtNetwork: method.usdtNetwork || "TRC20",
        isDefault: method.isDefault,
      });
    } else if (open) {
      setTab("paypal");
      setForm({ paypalEmail: "", bankName: "", accountNumber: "", accountHolderName: "", routingNumber: "", bankAddress: "", usdtAddress: "", usdtNetwork: "TRC20", isDefault: false });
    }
    setError("");
  }, [open, method]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    setError("");
    const payload: any = { type: tab, isDefault: form.isDefault };
    if (tab === "paypal") {
      if (!form.paypalEmail) { setError("PayPal email is required"); setLoading(false); return; }
      payload.paypalEmail = form.paypalEmail;
    } else if (tab === "bank_transfer") {
      if (!form.bankName || !form.accountNumber || !form.accountHolderName) { setError("Bank name, account number and holder name are required"); setLoading(false); return; }
      payload.bankName = form.bankName;
      payload.accountNumber = form.accountNumber;
      payload.accountHolderName = form.accountHolderName;
      payload.routingNumber = form.routingNumber;
      payload.bankAddress = form.bankAddress;
    } else {
      if (!form.usdtAddress) { setError("USDT address is required"); setLoading(false); return; }
      payload.usdtAddress = form.usdtAddress;
      payload.usdtNetwork = form.usdtNetwork;
    }
    try {
      if (isEdit) {
        await promoterApi.updatePaymentMethod(token, method._id, payload);
      } else {
        await promoterApi.addPaymentMethod(token, payload);
      }
      if (payload.isDefault && !isEdit) {
        // default is set server-side on add
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const tabCls = (t: string) =>
    `flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${tab === t ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-200"}`;
  const inputCls = "w-full bg-[#0f0f17] border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-white mb-5">{isEdit ? "Edit Payment Method" : "Add Payment Method"}</h2>

        <div className="flex gap-1 bg-[#0f0f17] rounded-lg p-1 mb-5">
          <button onClick={() => setTab("paypal")} className={tabCls("paypal")}>PayPal</button>
          <button onClick={() => setTab("bank_transfer")} className={tabCls("bank_transfer")}>Bank Transfer</button>
          <button onClick={() => setTab("usdt")} className={tabCls("usdt")}>USDT</button>
        </div>

        <div className="space-y-3">
          {tab === "paypal" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">PayPal Email</label>
              <input value={form.paypalEmail} onChange={(e) => set("paypalEmail", e.target.value)} placeholder="you@example.com" className={inputCls} />
            </div>
          )}

          {tab === "bank_transfer" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bank Name</label>
                <input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Bank of America" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Account Number</label>
                <input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="1234567890" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Account Holder Name</label>
                <input value={form.accountHolderName} onChange={(e) => set("accountHolderName", e.target.value)} placeholder="John Doe" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Routing Number</label>
                <input value={form.routingNumber} onChange={(e) => set("routingNumber", e.target.value)} placeholder="021000021" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bank Address</label>
                <input value={form.bankAddress} onChange={(e) => set("bankAddress", e.target.value)} placeholder="123 Main St, New York, NY" className={inputCls} />
              </div>
            </>
          )}

          {tab === "usdt" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">USDT Address</label>
                <input value={form.usdtAddress} onChange={(e) => set("usdtAddress", e.target.value)} placeholder="T..." className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Network</label>
                <select value={form.usdtNetwork} onChange={(e) => set("usdtNetwork", e.target.value)} className={inputCls}>
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                </select>
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#0f0f17] text-purple-600 focus:ring-purple-500" />
          <span className="text-sm text-gray-300">Set as default payment method</span>
        </label>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PaymentsPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [wPage, setWPage] = useState(1);
  const [wTotal, setWTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const perPage = 10;

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, wRes, mRes] = await Promise.all([
        promoterApi.getDashboard(token),
        promoterApi.getWithdrawals(token, { page: wPage, limit: perPage }),
        promoterApi.getPaymentMethods(token),
      ]);
      setDashboard(dashRes.data || dashRes);
      const wd = wRes.data || wRes;
      setWithdrawals(wd.withdrawals || wd.items || wd || []);
      setWTotal(wd.total || wd.totalPages || 0);
      setMethods((mRes.data || mRes).methods || mRes.data || mRes || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [token, wPage]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this payment method?")) return;
    try {
      await promoterApi.deletePaymentMethod(token, id);
      fetchAll();
    } catch { /* silent */ }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      await promoterApi.setDefaultPaymentMethod(token, id);
      fetchAll();
    } catch { /* silent */ }
  };

  const totalPages = Math.max(1, Math.ceil(wTotal / perPage));
  const balance = dashboard?.availableBalance ?? 0;
  const pending = dashboard?.pendingClearance ?? 0;

  return (
    <div className="min-h-screen bg-[#0f0f17] text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button
          onClick={() => setShowWithdraw(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          Request Withdrawal
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Min Payout Threshold</p>
          <p className="text-2xl font-bold text-gray-300">$50.00</p>
        </div>
        <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Pending Clearance</p>
          <p className="text-2xl font-bold text-yellow-400">${pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl mb-8">
        <div className="px-5 py-4 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold">Withdrawal History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800/50">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Fee</th>
                <th className="text-left px-5 py-3 font-medium">Net Amount</th>
                <th className="text-left px-5 py-3 font-medium">Method</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/30 animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 w-20 bg-gray-700/40 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">No withdrawals yet</td></tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                    <td className="px-5 py-3 text-gray-300">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-white">${w.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-400">${(w.fee ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-white">${(w.netAmount ?? w.amount - (w.fee ?? 0)).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-300">{w.method || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[w.status] || ""}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800/50">
            <span className="text-sm text-gray-500">Page {wPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={wPage <= 1} onClick={() => setWPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-700/50 text-sm text-gray-400 hover:bg-gray-800/50 disabled:opacity-30">Prev</button>
              <button disabled={wPage >= totalPages} onClick={() => setWPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-700/50 text-sm text-gray-400 hover:bg-gray-800/50 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold">Payment Methods</h2>
          <button
            onClick={() => { setEditMethod(null); setShowPayment(true); }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Add Payment Method
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#0f0f17] rounded-xl p-4 animate-pulse">
                  <div className="h-5 w-32 bg-gray-700/40 rounded mb-3" />
                  <div className="h-4 w-48 bg-gray-700/40 rounded" />
                </div>
              ))}
            </div>
          ) : methods.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payment methods added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map((m) => (
                <div key={m._id} className="bg-[#0f0f17] border border-gray-700/30 rounded-xl p-4 flex items-start gap-3">
                  <div className="mt-0.5"><TypeIcon type={m.type} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{TYPE_LABELS[m.type] || m.type}</span>
                      {m.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 font-medium">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {m.type === "paypal" && maskValue(m.paypalEmail)}
                      {m.type === "bank_transfer" && `${m.bankName || ""} ****${m.accountNumber?.slice(-4) || ""}`}
                      {m.type === "usdt" && `${maskValue(m.usdtAddress)} (${m.usdtNetwork || "TRC20"})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.isDefault && (
                      <button onClick={() => handleSetDefault(m._id)} className="text-xs text-gray-500 hover:text-purple-400 px-2 py-1">Set Default</button>
                    )}
                    <button onClick={() => { setEditMethod(m); setShowPayment(true); }} className="text-xs text-gray-400 hover:text-white px-2 py-1">Edit</button>
                    <button onClick={() => handleDelete(m._id)} className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <WithdrawModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        methods={methods}
        token={token || ""}
        onSuccess={fetchAll}
      />
      <EditPaymentModal
        open={showPayment}
        onClose={() => { setShowPayment(false); setEditMethod(null); }}
        method={editMethod}
        token={token || ""}
        onSuccess={fetchAll}
      />
    </div>
  );
}
