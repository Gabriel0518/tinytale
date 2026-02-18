"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

interface CoinPackage {
  _id: string;
  coins: number;
  price: number;
  bonus: number;
  tag: string | null;
  originalPrice: number | null;
}

type PaymentMethod = "stripe" | "paypal" | "apple_pay";

export default function CoinsPage() {
  const { user, token, updateUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [redeemCode, setRedeemCode] = useState("");
  const [showRedeem, setShowRedeem] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    const load = async () => {
      try {
        const res = await coinsApi.getPackages();
        const pkgs = res.data || [];
        setPackages(pkgs);
        setIsFallback(false);
        if (pkgs.length > 0) setSelectedPkg(pkgs[1]?._id || pkgs[0]._id);
      } catch {
        setPackages([
          { _id: "p1", coins: 100, price: 0.99, bonus: 0, tag: null, originalPrice: null },
          { _id: "p2", coins: 550, price: 4.99, bonus: 50, tag: "Popular", originalPrice: 5.99 },
          { _id: "p3", coins: 1200, price: 9.99, bonus: 200, tag: null, originalPrice: 12.99 },
          { _id: "p4", coins: 2500, price: 19.99, bonus: 500, tag: "Best Value", originalPrice: 24.99 },
          { _id: "p5", coins: 5500, price: 49.99, bonus: 1000, tag: null, originalPrice: 59.99 },
          { _id: "p6", coins: 12000, price: 99.99, bonus: 3000, tag: null, originalPrice: 129.99 },
        ]);
        setIsFallback(true);
        setSelectedPkg("p2");
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const selected = packages.find(p => p._id === selectedPkg);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePay = () => {
    if (!selected) return;
    setShowPaymentModal(true);
  };

  const handleRedeem = async () => {
    if (!token || !redeemCode.trim()) return;
    try {
      const res = await coinsApi.redeem(token, redeemCode.trim());
      const d = res.data;
      const newBal = balance + (d.coins || 0);
      setBalance(newBal);
      if (user) updateUser({ ...user, coins: newBal });
      toast(d.message || `Redeemed ${d.coins} coins!`, "success");
      setRedeemCode("");
      setShowRedeem(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast(message || "Invalid or expired code", "error");
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-[length:200%_auto] animate-shine bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)]">Gold Recharge</span>
          </h1>
          <p className="text-gray-400 mt-2">Purchase gold coins to unlock premium episodes and exclusive content</p>
        </div>

        {/* Balance Banner */}
        <div className="relative mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 border border-yellow-500/20 p-6 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.1),transparent_70%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/70 mb-1">Current Balance</p>
              <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                <span className="text-4xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-shine bg-[linear-gradient(90deg,#FFD700_0%,#FFF8DC_25%,#FFD700_50%,#FFF8DC_75%,#FFD700_100%)]">{balance.toLocaleString()}</span>
                <span className="text-yellow-300/60 text-lg">coins</span>
              </div>
            </div>
            <Link href="/user/purchases" className="flex items-center gap-2 text-sm text-yellow-300/70 hover:text-yellow-200 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Transaction History
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Package Grid */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-5">Select a Package</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => {
                const isSelected = selectedPkg === pkg._id;
                return (
                  <button
                    key={pkg._id}
                    onClick={() => setSelectedPkg(pkg._id)}
                    aria-pressed={isSelected}
                    className={`relative rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                      isSelected
                        ? "bg-gradient-to-b from-yellow-900/30 to-yellow-950/20 border-2 border-yellow-500/60 shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                        : "bg-zinc-900/60 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Tag */}
                    {pkg.tag && (
                      <span className={`absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        pkg.tag === "Popular" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                      }`}>{pkg.tag === "Popular" ? "Most Popular" : "Best Value"}</span>
                    )}
                    {/* Coin icon + amount */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-7 h-7 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad2)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                      <span className={`text-2xl font-bold ${isSelected ? "text-yellow-300" : "text-white"}`}>{pkg.coins.toLocaleString()}</span>
                    </div>
                    {/* Bonus */}
                    {pkg.bonus > 0 && (
                      <p className="text-xs text-red-400 font-medium mb-2">+{pkg.bonus.toLocaleString()} Bonus</p>
                    )}
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">${pkg.price}</span>
                      {pkg.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">${pkg.originalPrice}</span>
                      )}
                    </div>
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-3 left-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info Notes */}
            <div className="mt-8 p-5 bg-zinc-900/40 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Coins are non-refundable once purchased.</p>
                  <p>Bonus coins are valid for 30 days from the date of purchase.</p>
                  <p>All prices are in USD. Taxes may apply based on your region.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-5">
              {/* Order Summary Card */}
              <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 relative shadow-[inset_0_1px_0_rgba(255,215,0,0.15)]">
                <h3 className="text-lg font-semibold mb-5">Order Summary</h3>
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#coinGrad3)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="coinGrad3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                        <span className="text-sm">{selected.coins.toLocaleString()} Coins</span>
                      </div>
                      <span className="text-sm font-medium">${selected.price}</span>
                    </div>
                    {selected.bonus > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Bonus Coins</span>
                        <span className="text-green-400">+{selected.bonus.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-yellow-400">${selected.price}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Select a package to continue</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Payment Method</h3>
                <div className="space-y-2.5">
                  {([
                    ["stripe", "Credit / Debit Card", <svg key="s" className="w-6 h-6" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M1 10h22" stroke="currentColor" strokeWidth="1.5" /><path d="M5 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>],
                    ["paypal", "PayPal", <svg key="pp" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" opacity="0.7" /></svg>],
                    ["apple_pay", "Apple Pay", <svg key="ap" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>],
                  ] as [PaymentMethod, string, React.ReactNode][]).map(([id, label, icon]) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      aria-pressed={paymentMethod === id}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition ${
                        paymentMethod === id
                          ? "border-yellow-500/60 bg-yellow-500/10"
                          : "border-white/10 bg-zinc-800/50 hover:border-white/20"
                      }`}
                    >
                      <span className={paymentMethod === id ? "text-yellow-400" : "text-gray-400"}>{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === id ? "border-yellow-500" : "border-gray-600"}`}>
                        {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={!selected || isFallback}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
              >
                {isFallback ? (
                  "Unavailable"
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Pay Securely {selected ? `$${selected.price}` : ""}
                  </>
                )}
              </button>

              {/* Redeem Code */}
              <div className="text-center">
                <button onClick={() => setShowRedeem(!showRedeem)} className="text-sm text-yellow-400/70 hover:text-yellow-300 transition inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  Have a redeem code?
                </button>
                {showRedeem && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      aria-label="Redeem code"
                      className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <button onClick={handleRedeem} disabled={!redeemCode.trim()} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition disabled:opacity-50">Redeem</button>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                Secured by 256-bit SSL encryption
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {/* Payment Unavailable Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 id="payment-modal-title" className="text-xl font-bold text-white mb-3">Payment Not Available</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Third-party payment services (Stripe, PayPal, Apple Pay) have not been integrated yet. This feature will be available once the payment gateway is configured.
            </p>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-8 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-semibold rounded-xl transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}