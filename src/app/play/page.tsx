"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { dramasApi } from "@/lib/api";
import { MobilePageShell } from "@/components/mobile/MobilePageShell";
import { mockDramas } from "@/lib/mockData";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { useLocale } from "@/hooks/useLocale";
import { useRouter } from "next/navigation";
import type { Drama, Episode } from "@/types";

const PLAY_GATE_COPY: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    loadingTitle: "Finding a random episode",
    loadingBody: "We're picking a drama and dropping you into the swipeable player.",
    errorTitle: "No playable episode was found",
    errorBody: "Once more episodes are available, this tab will jump straight into playback.",
    tryAgain: "Try Again",
    browse: "Browse Library",
  },
  zh: {
    loadingTitle: "正在随机匹配剧集",
    loadingBody: "正在挑选一部短剧，并为你直接进入可上下滑切换的播放页。",
    errorTitle: "暂时没有可播放的剧集",
    errorBody: "等更多剧集上线后，这个入口会直接跳到播放页面。",
    tryAgain: "重新随机",
    browse: "去浏览片库",
  },
  ja: {
    loadingTitle: "ランダムエピソードを探しています",
    loadingBody: "作品を選んで、上下スワイプできるプレイヤーへ移動します。",
    errorTitle: "再生できるエピソードが見つかりませんでした",
    errorBody: "エピソードが追加されると、このタブから直接再生に入れます。",
    tryAgain: "もう一度",
    browse: "ライブラリを見る",
  },
  es: {
    loadingTitle: "Buscando un episodio aleatorio",
    loadingBody: "Estamos eligiendo un drama y llevándote al reproductor vertical.",
    errorTitle: "No se encontró un episodio reproducible",
    errorBody: "Cuando haya más episodios disponibles, esta pestaña te llevará directo al reproductor.",
    tryAgain: "Intentar otra vez",
    browse: "Explorar catálogo",
  },
  pt: {
    loadingTitle: "Buscando um episódio aleatório",
    loadingBody: "Estamos escolhendo um drama e abrindo o player vertical para você.",
    errorTitle: "Nenhum episódio reproduzível foi encontrado",
    errorBody: "Quando houver mais episódios disponíveis, esta aba abrirá direto no player.",
    tryAgain: "Tentar novamente",
    browse: "Explorar catálogo",
  },
  hi: {
    loadingTitle: "रैंडम एपिसोड खोजा जा रहा है",
    loadingBody: "हम एक ड्रामा चुनकर आपको स्वाइपेबल प्लेयर में ले जा रहे हैं।",
    errorTitle: "चलाने योग्य एपिसोड नहीं मिला",
    errorBody: "जैसे ही और एपिसोड उपलब्ध होंगे, यह टैब सीधे प्लेयर खोल देगा।",
    tryAgain: "फिर से कोशिश करें",
    browse: "लाइब्रेरी देखें",
  },
  id: {
    loadingTitle: "Mencari episode acak",
    loadingBody: "Kami sedang memilih drama dan membawamu ke player vertikal.",
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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const redirectToRandomEpisode = async () => {
      setLoading(true);
      setFailed(false);

      try {
        const dramasRes = await dramasApi.getAll({ limit: 40 });
        const dramaList: Drama[] = dramasRes.data?.dramas?.length ? dramasRes.data.dramas : mockDramas;
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
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void redirectToRandomEpisode();

    return () => {
      active = false;
    };
  }, [attempt, locale, router]);

  return (
    <MobilePageShell
      activePath="/play"
      title={copy.loadingTitle}
      variant="transparent"
      mobileHeaderVariant="brand-search"
      className="bg-[#0f1115]"
      contentClassName="bg-[#0f1115]"
    >
      <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,59,92,0.18),_transparent_28%),#0f1115] px-6 pb-24">
        <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ff3b5c]/12 text-[#ff3b5c]">
            <RefreshCw className={`h-7 w-7 ${loading ? "animate-spin" : ""}`} />
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            {failed ? copy.errorTitle : copy.loadingTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {failed ? copy.errorBody : copy.loadingBody}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {failed ? (
              <>
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
              </>
            ) : null}
          </div>
        </div>
      </main>
    </MobilePageShell>
  );
}

export default function PlayPage() {
  return <PlayRedirectGate />;
}
