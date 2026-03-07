"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

export default function AffiliateLandingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [ctaLoading, setCtaLoading] = useState(false);

  const handleCTA = async () => {
    if (ctaLoading) return;

    // Not logged in — redirect to login
    if (!token || !user) {
      router.push("/auth/login?redirect=/affiliate/apply");
      return;
    }

    // Logged in — check promoter status
    setCtaLoading(true);
    try {
      const res = await promoterApi.getProfile(token);
      const status = res.data?.applicationStatus;

      if (status === "approved") {
        router.push("/affiliate/dashboard");
      } else if (status === "pending") {
        router.push("/affiliate/pending");
      } else {
        router.push("/affiliate/apply");
      }
    } catch {
      // No promoter record
      router.push("/affiliate/apply");
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/affiliate" className="text-xl font-bold tracking-tight">
            <span className="text-purple-400">TinyTale</span>{" "}
            <span className="text-gray-300">Affiliate</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium">
                  {user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden text-sm text-gray-300 sm:inline">
                  {user.nickname || user.email}
                </span>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login?redirect=/affiliate"
                  className="rounded-lg px-4 py-2 text-sm text-gray-300 transition hover:text-white"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleCTA}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium transition hover:bg-purple-700"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#0a0a12] to-[#0a0a12]" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-32 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Monetize the Drama.{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              50% RevShare
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-400">
            Join TinyTale&apos;s affiliate program and earn commissions on every
            referral. Share drama, earn revenue.
          </p>
          <button
            onClick={handleCTA}
            disabled={ctaLoading}
            className="mt-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-600/25 transition hover:shadow-purple-600/40 disabled:opacity-60"
          >
            {ctaLoading ? "Checking..." : "Create Affiliate Account"}
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* High Commission */}
          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-2xl text-purple-400">
              $
            </div>
            <h3 className="text-lg font-semibold">High Commission</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Earn up to 8% on every transaction from your referrals. The more
              you promote, the more you earn.
            </p>
          </div>

          {/* 30-Day Cookie */}
          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">30-Day Cookie</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Your referrals are tracked for 30 days after clicking your link.
              Plenty of time to convert.
            </p>
          </div>

          {/* Global Reach */}
          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Global Reach</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Promote to audiences worldwide with localized content. Drama has
              no borders.
            </p>
          </div>
        </div>
      </section>

      {/* Real-Time Tracking Section */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real-Time Tracking &{" "}
              <span className="text-purple-400">Revenue Analytics</span>
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Monitor your performance with a comprehensive dashboard. Track
              clicks, conversions, and earnings in real time. Get detailed
              breakdowns by campaign, geography, and content to optimize your
              strategy.
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Dashboard Preview</span>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">Total Clicks</p>
                <p className="mt-1 text-2xl font-bold">12,847</p>
                <p className="mt-1 text-xs text-green-400">+23.5%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">Conversions</p>
                <p className="mt-1 text-2xl font-bold">1,429</p>
                <p className="mt-1 text-xs text-green-400">+18.2%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="mt-1 text-2xl font-bold">$4,280</p>
                <p className="mt-1 text-xs text-green-400">+31.7%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">Conv. Rate</p>
                <p className="mt-1 text-2xl font-bold">11.1%</p>
                <p className="mt-1 text-xs text-green-400">+2.4%</p>
              </div>
            </div>
            {/* Mini chart placeholder */}
            <div className="mt-4 flex h-20 items-end gap-1">
              {[35, 50, 40, 65, 55, 80, 70, 90, 75, 95, 85, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-purple-600/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-[#0a0a12] to-purple-900/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start earning?
          </h2>
          <p className="mt-4 text-gray-400">
            Join hundreds of affiliates already earning with TinyTale.
          </p>
          <button
            onClick={handleCTA}
            disabled={ctaLoading}
            className="mt-8 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-600/25 transition hover:shadow-purple-600/40 disabled:opacity-60"
          >
            {ctaLoading ? "Checking..." : "Create Affiliate Account"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TinyTale. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
