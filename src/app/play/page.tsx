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

function PlayRedirectGate() {
  const locale = useLocale();
  const copy = resolveLocaleCopy(PLAY_GATE_COPY, locale);
  const router = useRouter();

  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const redirectToRandomEpisode = async () => {
      setFailed(false);

      try {
        try {
          const cachedBootstrap = readPrefetchedPlayFeedBootstrap('for-you');
          if (cachedBootstrap?.window?.current?.dramaId && cachedBootstrap?.window?.current?.episodeId) {
            router.replace(
              localizePath(
                `/drama/${cachedBootstrap.window.current.dramaId}/play/${cachedBootstrap.window.current.episodeId}`,
                locale
              )
            );
            return;
          }

          const bootstrap = await prefetchPlayFeedBootstrap('for-you');
          const bootstrapCurrent = bootstrap?.window?.current;
          if (!active) return;

          if (bootstrapCurrent?.dramaId && bootstrapCurrent?.episodeId) {
            router.replace(localizePath(`/drama/${bootstrapCurrent.dramaId}/play/${bootstrapCurrent.episodeId}`, locale));
            return;
          }

          const randomPlayable = await episodesApi.getRandomPlayable();
          const payload = (randomPlayable as any)?.data ?? randomPlayable;
          const redirectPath = String(payload?.redirectPath || '').trim();
          const resolvedDramaId = String(payload?.dramaId || '').trim();
          const resolvedEpisodeId = String(payload?.episodeId || '').trim();

          if (!active) return;

          if (redirectPath) {
            router.replace(localizePath(redirectPath, locale));
            return;
          }

          if (resolvedDramaId && resolvedEpisodeId) {
            router.replace(localizePath(`/drama/${resolvedDramaId}/play/${resolvedEpisodeId}`, locale));
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
          setFailed(true);
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

            router.replace(localizePath(`/drama/${drama?._id || dramaSummary._id}/play/${episode._id}`, locale));
            return;
          } catch {
            continue;
          }
        }

        if (!active) return;
        setFailed(true);
      } catch {
        if (!active) return;
        setFailed(true);
      }
    };

    void redirectToRandomEpisode();

    return () => {
      active = false;
    };
  }, [attempt, locale, router]);

  return (
    failed ? (
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
      <main aria-hidden="true" className="fixed inset-0 bg-black" />
    )
  );
}

export default function PlayPage() {
  return <PlayRedirectGate />;
}
