"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  durationDays?: number;
  features: string[];
  recommended: boolean;
  savings: string | null;
  monthlyEquivalent: string | null;
}

/* Perks matching system VIP privileges only */
const PERKS = [
  { icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5", title: "Ad-Free Viewing", desc: "Enjoy uninterrupted cinematic stories" },
  { icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", title: "Early Access", desc: "Watch new episodes 48h before" },
  { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z", title: "4K Ultra HD", desc: "Breathtaking visual quality" },
  { icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "Coin Purchase Discount", desc: "Save on every coin purchase" },
  { icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 12.75h.008v.008H12v-.008zm0 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m0-3.75h.008v.008H12v-.008z", title: "30 Free Dramas / Month", desc: "Watch 30 dramas free every month" },
  { icon: "M9 14.25l3-3m0 0l3 3m-3-3v8.25M3.75 6.75h16.5", title: "50% Off Over Limit", desc: "Half price beyond free monthly quota" },
];

export default function SubscriptionPage() {
  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("sp2");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const plansRes = await subscriptionApi.getPlans();
        const rawPlans = plansRes.data || [];
        // Normalize API data to match the Plan interface
        const normalized: Plan[] = rawPlans.map((p: any) => {
          const days = p.durationDays || p.duration || 30;
          const isYearly = days >= 365;
          return {
            _id: p._id,
            name: p.name,
            price: p.price,
            period: p.period || (isYearly ? "year" : "month"),
            duration: days,
            durationDays: days,
            features: p.features?.length ? p.features : (isYearly
              ? ["All Standard features", "Early Access (48h prior)", "4K Ultra HD & HDR", "30 Free Dramas / Month", "50% Off Over Limit"]
              : ["Full HD Streaming", "No advertisements", "Cancel anytime"]),
            recommended: p.recommended ?? isYearly,
            savings: p.savings ?? (isYearly ? "Save 16%" : null),
            monthlyEquivalent: p.monthlyEquivalent ?? (isYearly ? `$${(p.price / 12).toFixed(2)}/month` : null),
          };
        });
        setPlans(normalized);
        setApiAvailable(true);
        if (normalized.length) {
          const rec = normalized.find((p: Plan) => p.recommended);
          if (rec) setSelectedPlan(rec._id);
        }
      } catch {
        setApiAvailable(false);
        setPlans([
          { _id: "sp1", name: "Standard", price: 9.99, period: "month", duration: 30, features: ["Full HD Streaming", "No advertisements", "Cancel anytime"], recommended: false, savings: null, monthlyEquivalent: null },
          { _id: "sp2", name: "Pro Annual", price: 99.99, period: "year", duration: 365, features: ["All Standard features", "Early Access (48h prior)", "4K Ultra HD & HDR"], recommended: true, savings: "Save 16%", monthlyEquivalent: "$8.33/month" },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!token) return;
    if (!apiAvailable) {
      toast("Service is temporarily unavailable. Please try again later.", "error");
      return;
    }
    setSelectedPlan(planId);
    setProcessing(true);
    try {
      const res = await subscriptionApi.subscribe(token, planId, "stripe");
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast("Failed to create checkout session", "error");
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "An error occurred";
      const message = raw === "Failed to fetch"
        ? "Unable to connect to the server. Please check your network and try again."
        : raw || "Subscription failed. Please try again.";
      toast(message, "error");
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

  const standardPlan = plans.find(p => !p.recommended) || plans[0];
  const proPlan = plans.find(p => p.recommended) || plans[1];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      <style jsx>{`
        @keyframes goldShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-text {
          background: linear-gradient(90deg, #D4AF37 0%, #FFF8DC 30%, #D4AF37 60%, #FFF8DC 80%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: goldShine 3s linear infinite;
        }
      `}</style>
      <Navbar />

      {/* Close button */}
      <button onClick={() => router.back()} className="fixed top-24 right-6 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Gold gradient hero background */}
        <div className="absolute top-0 left-0 right-0 h-72 overflow-hidden pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(180,140,40,0.15) 0%, rgba(180,140,40,0.05) 40%, transparent 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(180,140,40,0.08) 0px, rgba(180,140,40,0.08) 1px, transparent 1px, transparent 40px)", backgroundSize: "40px 100%" }} />
        </div>

        {/* Hero */}
        <div className="relative text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 border border-yellow-500/30 mb-5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
            <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">Premium Member</span>
          </div>
          {isVip ? (
            <>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-3"><span className="gold-text">YOU&apos;RE A VIP MEMBER</span></h1>
              <p className="text-gray-400 max-w-lg mx-auto">Manage your subscription or renew your premium membership below.</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-3"><span className="gold-text">UNLOCK THE ULTIMATE EXPERIENCE</span></h1>
              <p className="text-gray-400 max-w-lg mx-auto">Join 2M+ members enjoying premium Asian dramas</p>
            </>
          )}
        </div>

        {/* VIP active info */}
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
              <Link href="/user/settings" className="mt-6 inline-block rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {/* API unavailable banner */}
        {!apiAvailable && !isVip && (
          <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-6 py-4 text-center">
            <p className="text-sm text-yellow-400 font-medium">Service is temporarily unavailable. Prices shown are for reference only.</p>
            <p className="text-xs text-gray-400 mt-1">Please try again later or contact support if the issue persists.</p>
          </div>
        )}

        {/* 3-Column Layout: Perks | Standard | Pro Annual */}
        {!isVip && (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_1fr] gap-6 items-stretch">
            {/* Left: Membership Perks */}
            <div className="lg:pt-4">
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-5">Membership Perks</p>
              <div className="space-y-5">
                {PERKS.map(perk => (
                  <div key={perk.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={perk.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{perk.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Standard Plan */}
            {standardPlan && (
              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#12121a] p-7">
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">Standard</p>
                <div className="mb-1">
                  <span className="text-4xl font-black text-white">${standardPlan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/{standardPlan.period === "month" ? "mo" : "yr"}</span>
                </div>
                <div className="h-3" />
                <ul className="space-y-3 flex-1">
                  {["Ad-Free Viewing", "Full HD Streaming", "Coin Purchase Discount", "Cancel anytime"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <svg className="w-4 h-4 shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(standardPlan._id)}
                  disabled={processing && selectedPlan === standardPlan._id}
                  className="mt-8 w-full h-12 rounded-xl border border-white/20 bg-transparent text-sm font-bold text-white uppercase tracking-wider hover:bg-white/5 transition disabled:opacity-50"
                >
                  {processing && selectedPlan === standardPlan._id ? (
                    <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Select Plan"}
                </button>
              </div>
            )}

            {/* Right: Pro Annual Plan */}
            {proPlan && (
              <div className="relative flex flex-col rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-900/10 to-[#12121a] p-7" style={{ boxShadow: "0 0 40px rgba(180,140,40,0.08)" }}>
                {proPlan.savings && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[10px] font-bold rounded-full whitespace-nowrap uppercase tracking-wider">
                    Best Value · {proPlan.savings}
                  </span>
                )}
                <p className="text-[10px] font-bold tracking-[0.2em] text-yellow-400 uppercase mb-4">Pro Annual</p>
                <div className="mb-1">
                  <span className="text-4xl font-black text-white">${proPlan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/{proPlan.period === "year" ? "yr" : "mo"}</span>
                </div>
                {proPlan.monthlyEquivalent && (
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Equivalent to {proPlan.monthlyEquivalent}</p>
                )}
                {!proPlan.monthlyEquivalent && <div className="h-4" />}
                <ul className="space-y-3 mt-4 flex-1">
                  {["All Standard features", "Early Access (48h prior)", "4K Ultra HD & HDR", "30 Free Dramas / Month", "50% Off Over Limit"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <svg className="w-4 h-4 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(proPlan._id)}
                  disabled={processing && selectedPlan === proPlan._id}
                  className="mt-8 w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white uppercase tracking-wider transition disabled:opacity-50"
                >
                  {processing && selectedPlan === proPlan._id ? (
                    <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Select Plan"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase">
            <button className="hover:text-white transition">Restore Purchase</button>
            <Link href="/help?tab=terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/help?tab=privacy" className="hover:text-white transition">Privacy Policy</Link>
          </div>
          <p className="text-[11px] text-gray-600 text-center max-w-xl leading-relaxed">
            Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage or cancel anytime from Account Settings.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
