"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dramasApi, episodesApi } from "@/lib/api";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { useLocale } from "@/hooks/useLocale";
import { useRouter } from "next/navigation";
import { prefetchPlayFeedBootstrap, readPrefetchedPlayFeedBootstrap } from "@/lib/play-feed-prefetch";
import { readPlayFeedSession } from "@/lib/play-feed-session";
import { readPlaybackSession } from "@/components/mobile/PlaybackSession";
import type { Drama, Episode } from "@/types";

const PLAY_GATE_COPY: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    errorTitle: "No playable episode was found",
    errorBody: "Once more episodes are available, this tab will jump straight into playback.",
    tryAgain: "Try Again",
    browse: "Browse Library",
  },
  zh: {
    errorTitle: "暂时没有可播放的剧集",
    errorBody: "等更多剧集上线后，这个入口会直接跳到播放页面。",
    tryAgain: "重新随机",
    browse: "去浏览片库",
  },
  ja: {
    errorTitle: "再生できるエピソードが見つかりませんでした",
    errorBody: "エピソードが追加されると、このタブから直接再生に入れます。",
    tryAgain: "もう一度",
    browse: "ライブラリを見る",
  },
  es: {
    errorTitle: "No se encontró un episodio reproducible",
    errorBody: "Cuando haya más episodios disponibles, esta pestaña te llevará directo al reproductor.",
    tryAgain: "Intentar otra vez",
    browse: "Explorar catálogo",
  },
  pt: {
    errorTitle: "Nenhum episódio reproduzível foi encontrado",
    errorBody: "Quando houver mais episódios disponíveis, esta aba abrirá direto no player.",
    tryAgain: "Tentar novamente",
    browse: "Explorar catálogo",
  },
  hi: {
    errorTitle: "चलाने योग्य एपिसोड नहीं मिला",
    errorBody: "जैसे ही और एपिसोड उपलब्ध होंगे, यह टैब सीधे प्लेयर खोल देगा।",
    tryAgain: "फिर से कोशिश करें",
    browse: "लाइब्रेरी देखें",
  },
  id: {
    errorTitle: "Belum ada episode yang bisa diputar",
    errorBody: "Saat lebih banyak episode tersedia, tab ini akan langsung membuka player.",
    tryAgain: "Coba lagi",
    browse: "Jelajahi katalog",
  },
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildFeedPlayerHref(dramaId: string, episodeId: string, locale: SupportedLocale) {
  return localizePath(`/drama/${dramaId}/play/${episodeId}?source=feed`, locale);
}

function withSeekTime(href: string, currentTime = 0) {
  const safeTime = Math.max(0, Math.floor(currentTime));
  if (safeTime <= 0) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}t=${safeTime}`;
}

function resolvePlayableRoute(
  payload: { dramaId?: string; episodeId?: string; redirectPath?: string } | null | undefined,
  locale: SupportedLocale,
) {
  if (!payload) return null;

  const redirectPath = String(payload.redirectPath || "").trim();
  if (redirectPath.includes("/play/")) {
    return localizePath(redirectPath, locale);
  }

  const dramaId = String(payload.dramaId || "").trim();
  const episodeId = String(payload.episodeId || "").trim();
  if (!dramaId || !episodeId) return null;

  return buildFeedPlayerHref(dramaId, episodeId, locale);
}

function resolvePersistedPlayRoute(locale: SupportedLocale) {
  const playbackSession = readPlaybackSession();
  if (playbackSession?.dramaId && playbackSession?.episodeId) {
    return withSeekTime(
      buildFeedPlayerHref(playbackSession.dramaId, playbackSession.episodeId, locale),
      playbackSession.currentTime,
    );
  }

  const persisted = readPlayFeedSession();
  const activeMode = persisted?.activeMode || "for-you";
  const activeWindow = persisted?.windows?.[activeMode];

  if (activeWindow?.current) {
    return buildFeedPlayerHref(
      activeWindow.current.dramaId,
      activeWindow.current.episodeId,
      locale,
    );
  }

  const fallbackWindow = Object.values(persisted?.windows ?? {}).find((window) => window?.current);
  if (!fallbackWindow?.current) return null;

  return buildFeedPlayerHref(
    fallbackWindow.current.dramaId,
    fallbackWindow.current.episodeId,
    locale,
  );
}

function PlayRedirectGate() {
  const locale = useLocale();
  const copy = resolveLocaleCopy(PLAY_GATE_COPY, locale);
  const router = useRouter();

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "empty">("loading");

  useEffect(() => {
    let active = true;

    const redirectToRandomEpisode = async () => {
      setStatus("loading");

      try {
        const persistedRoute = resolvePersistedPlayRoute(locale);
        if (persistedRoute) {
          router.replace(persistedRoute);
          return;
        }

        try {
          const cachedBootstrap = readPrefetchedPlayFeedBootstrap('for-you');
          const cachedRoute = resolvePlayableRoute(cachedBootstrap?.window?.current, locale);
          if (cachedRoute) {
            router.replace(cachedRoute);
            return;
          }

          const bootstrap = await prefetchPlayFeedBootstrap('for-you');
          if (!active) return;

          const bootstrapRoute = resolvePlayableRoute(bootstrap?.window?.current, locale);
          if (bootstrapRoute) {
            router.replace(bootstrapRoute);
            return;
          }

          const randomPlayable = await episodesApi.getRandomPlayable();
          const payload = (randomPlayable as any)?.data ?? randomPlayable;
          if (!active) return;

          const randomPlayableRoute = resolvePlayableRoute(payload, locale);
          if (randomPlayableRoute) {
            router.replace(randomPlayableRoute);
            return;
          }
        } catch {
          // Fall back to legacy drama enumeration so the tab still works
          // against older API servers while local development restarts.
        }

        const dramasRes = await dramasApi.getAll({ limit: 40 });
        const dramaPayload = (dramasRes as any)?.data ?? dramasRes;
        const dramaList: Drama[] = Array.isArray(dramaPayload?.dramas) ? dramaPayload.dramas : [];
        if (!dramaList.length) {
          if (!active) return;
          setStatus("empty");
          return;
        }
        const candidates = shuffle(dramaList).slice(0, 12);

        for (const dramaSummary of candidates) {
          try {
            const response = await dramasApi.getById(dramaSummary._id);
            const payload = response?.data ?? response;
            const drama = payload?.drama ?? payload;
            const episodes = (payload?.episodes || drama?.episodes || []) as Episode[];

            if (!episodes.length) continue;

            const episode = shuffle(
              episodes
                .filter((item) => item?._id)
                .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
            )[0];

            if (!episode?._id || !active) return;

            router.replace(buildFeedPlayerHref(drama?._id || dramaSummary._id, episode._id, locale));
            return;
          } catch {
            continue;
          }
        }

        if (!active) return;
        setStatus("empty");
      } catch {
        if (!active) return;
        setStatus("empty");
      }
    };

    void redirectToRandomEpisode();

    return () => {
      active = false;
    };
  }, [attempt, locale, router]);

  return (
    status === "empty" ? (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1115] px-6 pb-24 pt-12">
        <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {copy.errorTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {copy.errorBody}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex items-center justify-center rounded-full bg-[#ff3b5c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff5070]"
            >
              {copy.tryAgain}
            </button>
            <Link
              href={localizePath("/browse", locale)}
              className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.04]"
            >
              {copy.browse}
            </Link>
          </div>
        </div>
      </main>
    ) : (
      <main className="min-h-screen bg-[#0f1115] px-4 pb-24 pt-6">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-7 w-40 animate-pulse rounded-full bg-white/12" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-white/8" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-white/8" />
          </div>

          <div className="aspect-[9/16] animate-pulse rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)]" />

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/5] animate-pulse rounded-[22px] border border-white/8 bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      </main>
    )
  );
}

export default function PlayPage() {
  return <PlayRedirectGate />;
}
