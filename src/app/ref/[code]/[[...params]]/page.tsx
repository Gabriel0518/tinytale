"use client";

export const dynamic = 'force-dynamic';

import { useEffect} from "react";
import { useParams, useRouter} from "next/navigation";
import { promoterApi } from "@/lib/api";
import {localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

export default function RefPage() {
  const params = useParams<{ code: string; params?: string[] }>();
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const code = params?.code || "";
    const extraParams = params?.params;
    const dramaId = extraParams?.[0];

    if (code) {
      localStorage.setItem("ref_code", code);
      document.cookie = `ref_code=${code}; path=/; max-age=${30 * 24 * 60 * 60}`;
      promoterApi.trackClick(code).catch(() => {});
    }

    if (dramaId) {
      router.replace(localizePath(`/drama/${dramaId}`, locale));
    } else {
      router.replace(localizePath("/", locale));
    }
  }, [params, router, locale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141414]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );
}
