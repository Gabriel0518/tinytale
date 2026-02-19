"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { subscriptionApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

interface Plan {
  _id: string;
  name: string;
  price: number;
  period: string;
  duration: number;
  features: string[];
  recommended: boolean;
  savings: string | null;
  monthlyEquivalent: string | null;
}

type PaymentMethod = "stripe" | "paypal" | "apple_pay";

const PERKS = [
  { icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5", title: "Ad-Free Viewing", desc: "Enjoy uninterrupted streaming without any ads" },
  { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z", title: "4K Ultra HD", desc: "Crystal clear streaming in stunning 4K quality" },
  { icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", title: "Early Access", desc: "Watch new episodes before anyone else" },
  { icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3", title: "Offline Download", desc: "Download and watch anywhere, anytime" },
  { icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", title: "Exclusive Content", desc: "Access VIP-only dramas and special episodes" },
  { icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", title: "Priority Support", desc: "Get help faster with dedicated VIP support" },
];

export default function SubscriptionPage() {
  const { user, token, updateUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("sp2");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const selected = plans.find(p => p._id === selectedPlan);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const plansRes = await subscriptionApi.getPlans();
        setPlans(plansRes.data || []);
        if (plansRes.data?.length) {
          const rec = plansRes.data.find((p: Plan) => p.recommended);
          if (rec) setSelectedPlan(rec._id);
        }
      } catch {
        setPlans([
          { _id: "sp1", name: "Monthly", price: 9.99, period: "month", duration: 30, features: ["Unlimited access", "Ad-free", "HD streaming"], recommended: false, savings: null, monthlyEquivalent: null },
          { _id: "sp2", name: "Annual", price: 99.99, period: "year", duration: 365, features: ["Everything in Monthly", "Early access", "Offline download", "Exclusive content", "500 bonus coins/month"], recommended: true, savings: "Save 16%", monthlyEquivalent: "$8.33/month" },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleSubscribe = async () => {
    if (!token || !selectedPlan) return;
    setProcessing(true);
    try {
      await subscriptionApi.subscribe(token, selectedPlan, paymentMethod);
      const durationDays = selected?.duration || 30;
      if (user) updateUser({ ...user, vipStatus: "active", vipExpireDate: new Date(Date.now() + durationDays * 86400000).toISOString() });
      toast("Welcome to TinyTale Premium! Enjoy your VIP benefits.", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast(message || "Subscription failed. Please try again.", "error");
    } finally { setProcessing(false); }
  };

  const isVip = user?.vipStatus === "active";

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <style jsx>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes goldShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-text {
          background: linear-gradient(90deg, #D4AF37 0%, #FFF8DC 30%, #D4AF37 60%, #FFF8DC 80%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: goldShine 3s linear infinite;
        }
        .gold-glow { box-shadow: 0 0 30px rgba(212,175,55,0.2), 0 0 60px rgba(212,175,55,0.1); }
      `}</style>
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 mb-5 shadow-[0_0_30px_rgba(212,175,55,0.4)]" style={{ animation: "float 3s ease-in-out infinite" }}>
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
          </div>
          {isVip ? (
            <>
              <h1 className="text-4xl font-black tracking-tight mb-3"><span className="gold-text">YOU&apos;RE A VIP MEMBER</span></h1>
              <p className="text-gray-400 max-w-md mx-auto">You&apos;re enjoying all premium benefits. Manage your subscription below.</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-black tracking-tight mb-3"><span className="gold-text">UNLOCK PREMIUM</span></h1>
              <p className="text-gray-400 max-w-md mx-auto">Get unlimited access to exclusive dramas, ad-free viewing, and premium features</p>
            </>
          )}
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-14">
          {PERKS.map(perk => (
            <div key={perk.title} className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={perk.icon} /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{perk.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Current Plan Info (VIP users) */}
        {isVip && (
          <div className="mb-14 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-950/10 p-8 text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
                <span className="text-lg font-bold text-yellow-400">Active VIP Membership</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                Your VIP membership is active{user.vipExpireDate ? ` until ${new Date(user.vipExpireDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.
              </p>
              <p className="text-xs text-gray-500">You have access to all premium features listed above.</p>
              <Link href="/user/settings" className="mt-6 inline-block rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {/* Pricing Cards (non-VIP) */}
        {!isVip && (
          <>
        <div className="mb-10">
          <h2 className="text-xl font-bold text-center mb-6">Choose Your Plan</h2>
          <div className="grid grid-cols-2 gap-5 max-w-2xl mx-auto">
            {plans.map(plan => {
              const isSelected = selectedPlan === plan._id;
              const isRec = plan.recommended;
              return (
                <button
                  key={plan._id}
                  onClick={() => setSelectedPlan(plan._id)}
                  aria-pressed={selectedPlan === plan._id}
                  className={`relative rounded-2xl p-6 text-left transition-all duration-200 ${
                    isSelected && isRec
                      ? "border-2 border-yellow-500/60 bg-gradient-to-b from-yellow-900/20 to-yellow-950/10 gold-glow"
                      : isSelected
                      ? "border-2 border-blue-500/60 bg-blue-500/5"
                      : "border border-white/10 bg-zinc-900/40 hover:border-white/20"
                  }`}
                >
                  {isRec && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold rounded-full whitespace-nowrap">Best Value</span>
                  )}
                  <div className="mb-4 mt-1">
                    <p className={`text-lg font-bold ${isRec && isSelected ? "text-yellow-300" : "text-white"}`}>{plan.name}</p>
                    {plan.savings && <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">{plan.savings}</span>}
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-black text-white">${plan.price}</span>
                    <span className="text-sm text-gray-500">/{plan.period}</span>
                  </div>
                  {plan.monthlyEquivalent && (
                    <p className="text-xs text-gray-500 mb-4">Equivalent to {plan.monthlyEquivalent}</p>
                  )}
                  {!plan.monthlyEquivalent && <div className="mb-4" />}
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className={`w-3.5 h-3.5 shrink-0 ${isRec ? "text-yellow-400" : "text-blue-400"}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* Radio indicator */}
                  <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? (isRec ? "border-yellow-500 bg-yellow-500" : "border-blue-500 bg-blue-500") : "border-gray-600"}`}>
                    {isSelected && <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="max-w-md mx-auto text-center">
          <button
            onClick={handleSubscribe}
            disabled={processing || isVip}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-lg rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)]"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isVip ? (
              "Already Subscribed"
            ) : (
              <>
                Subscribe Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </>
            )}
          </button>

          {/* Payment Methods */}
          <div className="flex items-center justify-center gap-6 mt-5">
            {([
              ["stripe", <svg key="s" className="w-10 h-5" viewBox="0 0 60 25" fill="currentColor"><path d="M5 11.2C5 9.5 6.3 8.8 8.3 8.8c1.8 0 4 .5 5.8 1.5V5.6c-2-.8-3.9-1.1-5.8-1.1C3.6 4.5 0 7.1 0 11.4c0 6.7 9.2 5.6 9.2 8.5 0 2-1.7 2.6-4.1 2.6-1.8 0-4.2-.7-6.1-1.7v4.8c2.1.9 4.2 1.3 6.1 1.3 5 0 8.4-2.5 8.4-6.8C13.5 13.2 5 14.5 5 11.2z" /><path d="M22.5 1.5l-4.8 1V7h-2.2v4h2.2v6.4c0 3.7 1.8 5.2 5 5.2 1.5 0 2.6-.3 3.2-.7v-3.8c-.5.2-1.2.4-2 .4-1.1 0-1.5-.4-1.5-1.7V11h2v-4h-2V1.5z" /><path d="M33.5 4.5c-1.5 0-2.5.7-3 1.2l-.2-1h-4.3v18h4.9v-12c.6-.8 1.6-1.3 2.7-1.3.4 0 .8 0 1.2.1V4.6c-.4-.1-.9-.1-1.3-.1z" /><path d="M39 0c-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9S40.6 0 39 0zm-2.4 22.7h4.9V7h-4.9v15.7z" /><path d="M52.5 4.5c-2 0-3.3.9-4 1.6l-.3-1.3h-4.3v22.5l4.9-1V21c.7.5 1.8 1.2 3.5 1.2 3.5 0 6.7-2.8 6.7-9.1 0-5.7-3.3-8.6-6.5-8.6zm-1.1 13.2c-1.2 0-1.9-.4-2.4-1V10c.5-.6 1.2-1.1 2.4-1.1 1.8 0 3.1 2 3.1 4.4 0 2.5-1.2 4.4-3.1 4.4z" /></svg>],
              ["paypal", <svg key="pp" className="w-10 h-5" viewBox="0 0 60 18" fill="currentColor" opacity="0.7"><path d="M22.2 3.7h-5.3c-.4 0-.7.3-.7.6L14 16.5c0 .3.2.5.4.5h2.5c.4 0 .7-.3.7-.6l.6-3.6c0-.3.3-.6.7-.6h1.6c3.4 0 5.4-1.6 5.9-4.9.2-1.4 0-2.5-.7-3.3-.7-.8-2-1.3-3.5-1.3zm.6 4.8c-.3 1.8-1.7 1.8-3 1.8h-.8l.5-3.4c0-.2.2-.3.4-.3h.4c.9 0 1.8 0 2.2.5.3.3.4.8.3 1.4z" /><path d="M39.2 8.4h-2.5c-.2 0-.4.1-.4.3l-.1.7-.2-.2c-.5-.8-1.7-1-2.9-1-2.7 0-5 2-5.5 4.9-.2 1.4.1 2.8.9 3.7.7.9 1.8 1.2 3 1.2 2.1 0 3.3-1.4 3.3-1.4l-.1.7c0 .3.2.5.4.5h2.3c.4 0 .7-.3.7-.6l1.4-8.2c.1-.3-.1-.6-.3-.6zm-3.3 4.8c-.3 1.4-1.4 2.3-2.8 2.3-.7 0-1.3-.2-1.6-.6-.4-.4-.5-1-.4-1.7.2-1.4 1.4-2.3 2.8-2.3.7 0 1.3.2 1.6.6.4.5.5 1 .4 1.7z" /><path d="M50.5 8.4h-2.6c-.2 0-.4.1-.5.3l-3 4.4-1.3-4.2c-.1-.3-.4-.5-.7-.5h-2.5c-.3 0-.5.3-.4.6l2.4 7-2.2 3.2c-.2.3 0 .7.4.7h2.5c.2 0 .4-.1.5-.3l7.2-10.4c.2-.3 0-.8-.4-.8z" /></svg>],
              ["apple_pay", <svg key="ap" className="w-10 h-5" viewBox="0 0 60 25" fill="currentColor"><path d="M11.2 3.5c-.7.8-1.8 1.5-2.9 1.4-.1-1.2.4-2.4 1.1-3.2C10.1.9 11.3.2 12.3.1c.1 1.2-.4 2.4-1.1 3.4zm1.1 1.7c-1.6-.1-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.8 3.4-.8 1.5 0 2 .8 3.4.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4 0-2.5 2.1-3.7 2.2-3.8-1.2-1.8-3.1-2-3.8-2z" /><path d="M25.6 1.2c4.6 0 7.8 3.2 7.8 7.8s-3.3 7.9-7.9 7.9h-5.1v8.2h-3.7V1.2h8.9zm-5.2 12.5h4.2c3.2 0 5-1.7 5-4.7s-1.8-4.7-5-4.7h-4.2v9.4z" /><path d="M34.8 18.8c0-2.8 2.1-4.5 5.9-4.7l4.4-.3v-1.2c0-1.8-1.2-2.8-3.2-2.8-1.9 0-3.1.9-3.4 2.3h-3.4c.2-3 2.8-5.3 6.9-5.3 4.1 0 6.7 2.2 6.7 5.6v11.7h-3.4v-2.8h-.1c-1 1.9-3.2 3.1-5.4 3.1-3.4 0-5.7-2.1-5.7-5.3v-.3zm10.3-1.4v-1.3l-3.9.2c-2 .1-3.1 1-3.1 2.4 0 1.4 1.2 2.4 3 2.4 2.4 0 4-1.6 4-3.7z" /><path d="M52.3 28.5v-2.9c.3.1.9.1 1.1.1 1.6 0 2.5-.7 3-2.4l.3-1.1-6.1-16.9h3.9l4.2 13.3h.1l4.2-13.3H67l-6.4 17.8c-1.5 4.1-3.1 5.4-6.6 5.4-.3 0-.9 0-1.2-.1h-.5z" /></svg>],
            ] as [PaymentMethod, React.ReactNode][]).map(([id, icon]) => (
              <button key={id} onClick={() => setPaymentMethod(id)} aria-pressed={paymentMethod === id} aria-label={`Pay with ${id === 'apple_pay' ? 'Apple Pay' : id.charAt(0).toUpperCase() + id.slice(1)}`} className={`p-2 rounded-lg transition ${paymentMethod === id ? "text-white bg-white/10" : "text-gray-600 hover:text-gray-400"}`}>
                {icon}
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-gray-600 leading-relaxed">
            By subscribing, you agree to our <Link href="/help?tab=terms" className="text-gray-400 hover:text-white underline">Terms of Service</Link> and <Link href="/help?tab=privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</Link>.
            Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            You can manage or cancel your subscription anytime from <Link href="/user/settings" className="text-gray-400 hover:text-white underline">Account Settings</Link>.
          </p>
        </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
