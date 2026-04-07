"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { dramasApi } from "@/lib/api";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import type { Drama } from "@/types";

function extractDrama(payload: unknown): Drama | null {
  const data = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const resolved = (data.data && typeof data.data === "object" ? data.data : data) as Record<string, unknown>;
  const drama = (resolved.drama && typeof resolved.drama === "object" ? resolved.drama : resolved) as Drama | null;
  return drama && typeof drama === "object" && drama._id ? drama : null;
}

export default function CreatorHomeRedirectPage() {
  const params = useParams<{ dramaId: string }>();
  const router = useRouter();
  const locale = useLocale();
  const dramaId = String(params?.dramaId || "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function redirectToCreatorProfile() {
      try {
        const response = await dramasApi.getById(dramaId);
        const drama = extractDrama(response);
        const creatorId = String(drama?.creatorId || "").trim();

        if (!cancelled && creatorId) {
          router.replace(localizePath(`/creator/${creatorId}`, locale));
          return;
        }

        if (!cancelled) {
          setFailed(true);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    if (dramaId) {
      void redirectToCreatorProfile();
    } else {
      setFailed(true);
    }

    return () => {
      cancelled = true;
    };
  }, [dramaId, locale, router]);

  if (!failed) {
    return <main className="fixed inset-0 bg-[#0f1115]" aria-hidden="true" />;
  }

  return (
    <main className="min-h-screen bg-[#0f1115] px-5 pb-28 pt-10 text-white">
      <Link
        href={localizePath(`/drama/${dramaId}`, locale)}
        className="inline-flex items-center gap-2 text-sm text-white/70"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mt-20 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/72">
        Creator profile is unavailable right now.
      </div>
    </main>
  );
}
