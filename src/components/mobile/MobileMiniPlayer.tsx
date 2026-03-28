'use client';

import Image from 'next/image';
import { ChevronUp, ListVideo, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  PlaybackQueueItem,
  PlaybackSession,
  usePlaybackSession,
} from '@/components/mobile/PlaybackSession';
import { usePlatform } from '@/hooks/usePlatform';
import { localizePath, removeLocalePrefix } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';
import { triggerHaptic } from '@/lib/capacitor-bridge';

const MINI_PLAYER_HIDDEN_PREFIXES = ['/admin', '/affiliate', '/creator', '/auth', '/help'];

function shouldShowMiniPlayer(pathname: string) {
  if (!pathname) return false;
  if (pathname.includes('/play/')) return false;
  if (pathname.startsWith('/user/coins/checkout')) return false;
  if (MINI_PLAYER_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  return true;
}

function formatMiniTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function buildEpisodeHref(locale: ReturnType<typeof useLocale>, item: PlaybackQueueItem | PlaybackSession, currentTime = 0) {
  const baseHref = localizePath(`/drama/${item.dramaId}/play/${item.episodeId}`, locale);
  return currentTime > 0 ? `${baseHref}?t=${Math.floor(currentTime)}` : baseHref;
}

export function MobileMiniPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { isMobile } = usePlatform();
  const { session, recentSessions, clearSession, resumeSession, updateSession } = usePlaybackSession();
  const normalizedPath = removeLocalePrefix(pathname || '/');
  const [sheetOpen, setSheetOpen] = useState(false);

  const isVisible = Boolean(isMobile && session && shouldShowMiniPlayer(normalizedPath));
  const resumeHref = session
    ? buildEpisodeHref(locale, session, session.currentTime || 0)
    : null;

  const progress = useMemo(() => {
    if (!session?.duration) return 0;
    return Math.max(0, Math.min(100, (session.currentTime / session.duration) * 100));
  }, [session]);

  const previousEpisode = session?.currentIndex && session.currentIndex > 0
    ? session.queue[session.currentIndex - 1]
    : null;
  const nextEpisode = session && session.currentIndex >= 0 && session.currentIndex < session.queue.length - 1
    ? session.queue[session.currentIndex + 1]
    : null;
  const upcomingQueue = session?.queue.filter((_, index) => index !== session.currentIndex) || [];
  const recentQueue = recentSessions.filter(
    (item) => item.dramaId !== session?.dramaId || item.episodeId !== session?.episodeId
  );

  useEffect(() => {
    document.body.classList.toggle('has-mini-player', isVisible);
    return () => document.body.classList.remove('has-mini-player');
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setSheetOpen(false);
    }
  }, [isVisible]);

  const openEpisode = (item: PlaybackQueueItem | PlaybackSession, currentTime = 0) => {
    void triggerHaptic('light');

    if ('queue' in item) {
      resumeSession({
        ...item,
        currentTime,
        updatedAt: Date.now(),
      });
    } else if (session) {
      const targetIndex = session.queue.findIndex((episode) => episode.episodeId === item.episodeId);
      updateSession({
        episodeId: item.episodeId,
        episodeTitle: item.episodeTitle,
        episodeNumber: item.episodeNumber,
        poster: item.poster,
        duration: item.duration,
        currentTime,
        currentIndex: targetIndex,
        isPlaying: true,
      });
    }

    router.push(buildEpisodeHref(locale, item, currentTime));
    setSheetOpen(false);
  };

  if (!isVisible || !session || !resumeHref) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom)+0.6rem)] z-[55] px-3 md:hidden">
        <div className="mobile-mini-player pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-[24px] border border-white/10 bg-[#0f172a]/92 shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-3 py-3">
            <button
              type="button"
              onClick={() => openEpisode(session, session.currentTime || 0)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/40">
                <Image
                  src={session.poster || '/placeholder-cover.svg'}
                  alt={session.episodeTitle}
                  fill
                  className="object-cover"
                  unoptimized={Boolean(session.poster?.startsWith('blob:'))}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase tracking-[0.18em] text-white/35">{session.dramaTitle}</p>
                <p className="truncate text-sm font-semibold text-white">{session.episodeTitle}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-white/45">
                  {formatMiniTime(session.currentTime)} / {formatMiniTime(session.duration)}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => previousEpisode && openEpisode(previousEpisode)}
                disabled={!previousEpisode}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white disabled:opacity-35"
                aria-label="Previous episode"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void triggerHaptic('light');
                  updateSession({ isPlaying: !session.isPlaying });
                  router.push(resumeHref);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label={session.isPlaying ? 'Pause playback' : 'Resume playback'}
              >
                {session.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => nextEpisode && openEpisode(nextEpisode)}
                disabled={!nextEpisode}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white disabled:opacity-35"
                aria-label="Next episode"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void triggerHaptic('selection');
                  setSheetOpen((prev) => !prev);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/80"
                aria-label="Open queue"
              >
                {sheetOpen ? <ChevronUp className="h-4 w-4" /> : <ListVideo className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  void triggerHaptic('medium');
                  clearSession();
                  setSheetOpen(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/70"
                aria-label="Close mini player"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom)+5.6rem)] z-[54] px-3 md:hidden">
          <div className="mx-auto max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#08111f]/96 shadow-[0_22px_60px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
            <div className="border-b border-white/8 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">Playback Queue</p>
              <p className="mt-1 text-sm text-white/70">Switch episodes or jump back into recent plays.</p>
            </div>

            <div className="max-h-[46vh] overflow-y-auto px-3 py-3">
              {upcomingQueue.length > 0 ? (
                <div>
                  <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Up Next</p>
                  <div className="space-y-2">
                    {upcomingQueue.map((item) => (
                      <button
                        key={`${item.dramaId}-${item.episodeId}`}
                        type="button"
                        onClick={() => openEpisode(item)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-left"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/30">
                          <Image
                            src={item.poster || '/placeholder-cover.svg'}
                            alt={item.episodeTitle}
                            fill
                            className="object-cover"
                            unoptimized={Boolean(item.poster?.startsWith('blob:'))}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">EP {item.episodeNumber}</p>
                          <p className="truncate text-xs text-white/55">{item.episodeTitle}</p>
                        </div>
                        <span className="text-[11px] text-white/35">{formatMiniTime(item.duration)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {recentQueue.length > 0 ? (
                <div className={upcomingQueue.length > 0 ? 'mt-5' : ''}>
                  <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Recent Plays</p>
                  <div className="space-y-2">
                    {recentQueue.map((item) => (
                      <button
                        key={`${item.dramaId}-${item.episodeId}`}
                        type="button"
                        onClick={() => openEpisode(item, item.currentTime)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-left"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/30">
                          <Image
                            src={item.poster || '/placeholder-cover.svg'}
                            alt={item.episodeTitle}
                            fill
                            className="object-cover"
                            unoptimized={Boolean(item.poster?.startsWith('blob:'))}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{item.dramaTitle}</p>
                          <p className="truncate text-xs text-white/55">EP {item.episodeNumber} · {item.episodeTitle}</p>
                        </div>
                        <span className="text-[11px] text-white/35">{formatMiniTime(item.currentTime)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
