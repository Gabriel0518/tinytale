"use client";

export const dynamic = 'force-dynamic';

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar";
import AffiliateHeader from "@/components/affiliate/AffiliateHeader";

// Pages that use the full sidebar layout (approved promoters only)
const sidebarPages = ["/affiliate/dashboard", "/affiliate/reports", "/affiliate/creatives", "/affiliate/payments"];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      // Landing page: if logged in, check status and redirect accordingly
      if (pathname === "/affiliate") {
        if (token) {
          try {
            const res = await promoterApi.getProfile(token);
            const status = res.data?.applicationStatus;
            if (status === 'approved') {
              router.push("/affiliate/dashboard");
              return;
            }
            if (status === 'pending') {
              router.push("/affiliate/pending");
              return;
            }
          } catch {
            // No promoter record — show landing page
          }
        }
        setChecking(false);
        return;
      }

      // All other pages require login
      if (!token) {
        router.push(`/auth/login?redirect=${pathname}`);
        return;
      }

      try {
        const res = await promoterApi.getProfile(token);
        const status = res.data?.applicationStatus;

        // Route based on status
        if (pathname === "/affiliate/apply" && status === 'approved') {
          router.push("/affiliate/dashboard");
          return;
        }
        if (pathname === "/affiliate/apply" && status === 'pending') {
          router.push("/affiliate/pending");
          return;
        }
        if (pathname === "/affiliate/pending" && status === 'approved') {
          router.push("/affiliate/dashboard");
          return;
        }
        if (sidebarPages.some(p => pathname?.startsWith(p)) && status !== 'approved') {
          if (status === 'pending') router.push("/affiliate/pending");
          else router.push("/affiliate/apply");
          return;
        }
      } catch {
        // No promoter record — allow apply page
        if (sidebarPages.some(p => pathname?.startsWith(p))) {
          router.push("/affiliate/apply");
          return;
        }
      }

      setChecking(false);
    }

    checkStatus();
  }, [pathname, token, router]);

  if (checking && pathname !== "/affiliate") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a12]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // Sidebar layout for approved promoter pages
  const useSidebar = sidebarPages.some(p => pathname?.startsWith(p));

  if (useSidebar) {
    return (
      <div className="min-h-screen bg-[#0f0f17]">
        <AffiliateSidebar />
        <div className="ml-60">
          <header className="flex items-center justify-between px-6 py-3 bg-[#13131d] border-b border-gray-800/50">
            <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              Back to TinyTale
            </Link>
            <span className="text-sm text-gray-400">{user?.nickname || user?.email || "Promoter"}</span>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    );
  }

  // Simple header layout for landing/apply/pending
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {pathname !== "/affiliate" && <AffiliateHeader />}
      {children}
    </div>
  );
}
