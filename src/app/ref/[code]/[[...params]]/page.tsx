"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { promoterApi } from "@/lib/api";

export default function RefPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.code as string;
    const extraParams = params.params as string[] | undefined;
    const dramaId = extraParams?.[0];

    if (code) {
      // Store referral code
      localStorage.setItem("ref_code", code);
      document.cookie = `ref_code=${code}; path=/; max-age=${30 * 24 * 60 * 60}`;

      // Track click
      promoterApi.trackClick(code).catch(() => {});
    }

    // Redirect
    if (dramaId) {
      router.replace(`/drama/${dramaId}`);
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141414]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );
}
