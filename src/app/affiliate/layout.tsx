"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar";
import AffiliateHeader from "@/components/affiliate/AffiliateHeader";

// Pages that use the full sidebar layout (approved promoters only)
const sidebarPages = ["/affiliate/dashboard", "/affiliate/reports", "/affiliate/creatives", "/affiliate/payments"];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      // Landing page is always accessible
      if (pathname === "/affiliate") {
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
