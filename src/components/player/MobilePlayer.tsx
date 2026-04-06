'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ChevronDown, ChevronsDownUp, ChevronsUpDown, Forward, PictureInPicture2, Play, RotateCcw, Rewind } from 'lucide-react';
import CloudflarePlayer, { CloudflarePlayerHandle } from '@/components/player/CloudflarePlayer';
import { SimplePlayerHandle } from '@/components/player/SimplePlayer';
import NativeHlsPlayer, { NativeHlsPlayerHandle } from '@/components/player/NativeHlsPlayer';
import { cn, formatDuration } from '@/lib/utils';
import type { SubtitleTrack } from '@/types';
import type { PlaybackAudioOption } from '@/lib/playback-adapters';
import {
  lockNativeScreenOrientation,
  setNativeKeepAwake,
  triggerHaptic,
  unlockNativeScreenOrientation,
} from '@/lib/capacitor-bridge';
import {
  buildPlaybackProgressKey,
  readSavedPlaybackProgress,
  writeSavedPlaybackProgress,
} from '@/lib/playback-progress-cache';

interface MobilePlayerProps {
  episodeId?: string;
  videoUrl?: string;
  streamVideoId?: string;
  signedToken?: string;
  quality?: string;
  subtitles?: SubtitleTrack[];
  activeSubtitleLanguage?: string | null;
  selectedAudioId?: string;
  onAvailableAudioOptionsChange?: (options: PlaybackAudioOption[]) => void;
  poster?: string;
  title: string;
  subtitle?: string;
  autoplay?: boolean;
  initialSeekTime?: number;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
  className?: string;
  labels?: {
    pictureInPicture: string;
    pictureInPictureExit: string;
    playbackSpeed: string;
    tapToPause: string;
    tapToPlay: string;
    holdForSpeed: string;
    nextEpisode: string;
    previousEpisode: string;
    refreshFeed: string;
    speedBoost: (rate: number) => string;
  };
  showInternalChrome?: boolean;
  showInternalSpeedMenu?: boolean;
  showInternalProgress?: boolean;
  progressBarOffset?: string;
  onRefreshFeed?: () => void;
}

type GestureZone = 'left' | 'center' | 'right';
type GestureFeedback =
  | { type: 'seek'; label: string }
  | { type: 'navigation'; label: string }
  | { type: 'speed'; label: string }
  | null;

type PlayerHandleLike = Pick<
  CloudflarePlayerHandle,
  | 'play'
  | 'pause'
  | 'seek'
  | 'seekBy'
  | 'setMuted'
  | 'setPlaybackRate'
  | 'getPlaybackRate'
  | 'getDuration'
  | 'enterPictureInPicture'
  | 'exitPictureInPicture'
  | 'isPictureInPictureActive'
  | 'isPictureInPictureSupported'
> | Pick<
  SimplePlayerHandle,
  | 'play'
  | 'pause'
  | 'seek'
  | 'seekBy'
  | 'setMuted'
  | 'setPlaybackRate'
  | 'getPlaybackRate'
  | 'getDuration'
  | 'enterPictureInPicture'
  | 'exitPictureInPicture'
  | 'isPictureInPictureActive'
  | 'isPictureInPictureSupported'
> | Pick<
  NativeHlsPlayerHandle,
  | 'play'
  | 'pause'
  | 'seek'
  | 'seekBy'
  | 'setMuted'
  | 'setPlaybackRate'
  | 'getPlaybackRate'
  | 'getDuration'
  | 'enterPictureInPicture'
  | 'exitPictureInPicture'
  | 'isPictureInPictureActive'
  | 'isPictureInPictureSupported'
>;

const PLAYBACK_RATES = [1, 1.25, 1.5, 2];
const DOUBLE_TAP_WINDOW = 260;
const SWIPE_THRESHOLD = 72;
const LONG_PRESS_MS = 380;
const CHROME_AUTO_HIDE_MS = 2400;

const DEFAULT_LABELS: NonNullable<MobilePlayerProps['labels']> = {
  pictureInPicture: 'PiP',
  pictureInPictureExit: 'Return',
  playbackSpeed: 'Playback Speed',
  tapToPause: 'Tap to pause',
  tapToPlay: 'Tap to play',
  holdForSpeed: 'Hold for 2x',
  nextEpisode: 'Next Episode',
  previousEpisode: 'Previous Episode',
  refreshFeed: 'Refresh Feed',
  speedBoost: (rate) => `${rate}x speed`,
};

function shouldPreferSimplePlayerBackend(videoUrl?: string, streamVideoId?: string) {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/i.test(userAgent);
  const hasStreamId = Boolean(streamVideoId);
  const hasHlsUrl = Boolean(videoUrl?.includes('.m3u8'));

  return isAndroid && (hasStreamId || hasHlsUrl) && Boolean(videoUrl);
}

export default function MobilePlayer({
  episodeId,
  videoUrl,
  streamVideoId,
  signedToken,
  quality = 'auto',
  subtitles = [],
  activeSubtitleLanguage = null,
  selectedAudioId,
  onAvailableAudioOptionsChange,
  poster,
  title,
  subtitle,
  autoplay = true,
  initialSeekTime = 0,
  playbackRate: playbackRateProp,
  onPlaybackRateChange,
  onTimeUpdate,
  onEnded,
  onError,
  onReady,
  onPlay,
  onPause,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
  className,
  labels: labelsProp,
  showInternalChrome = true,
  showInternalSpeedMenu = true,
  showInternalProgress = true,
  progressBarOffset = 'max(env(safe-area-inset-bottom), 0px)',
  onRefreshFeed,
}: MobilePlayerProps) {
  const playerRef = useRef<PlayerHandleLike | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const speedBoostRestoreRateRef = useRef<number | null>(null);
  const tapRef = useRef<{ at: number; zone: GestureZone; timeoutId: ReturnType<typeof setTimeout> | null }>({
    at: 0,
    zone: 'center',
    timeoutId: null,
  });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRateState, setPlaybackRateState] = useState(playbackRateProp ?? 1);
  const [isSpeedBoosting, setIsSpeedBoosting] = useState(false);
  const [feedback, setFeedback] = useState<GestureFeedback>(null);
  const [currentTime, setCurrentTime] = useState(initialSeekTime);
  const [duration, setDuration] = useState(0);
  const [pictureInPictureSupported, setPictureInPictureSupported] = useState(false);
  const [pictureInPictureActive, setPictureInPictureActive] = useState(false);
  const [playerMuted, setPlayerMuted] = useState(() => Boolean(shouldPreferSimplePlayerBackend(videoUrl, streamVideoId) && autoplay));
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showPauseButton, setShowPauseButton] = useState(!autoplay);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(initialSeekTime);
  const pauseButtonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labels = labelsProp || DEFAULT_LABELS;
  const playbackRate = playbackRateProp ?? playbackRateState;
  const preferSimplePlayerBackend = useMemo(
    () => shouldPreferSimplePlayerBackend(videoUrl, streamVideoId),
    [streamVideoId, videoUrl]
  );
  const restoredSeekTime = useMemo(() => {
    if (initialSeekTime > 0) return initialSeekTime;
    return readSavedPlaybackProgress({ episodeId, streamVideoId, videoUrl });
  }, [episodeId, initialSeekTime, streamVideoId, videoUrl]);

  const dismissFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = setTimeout(dismissFeedback, 900);
    return () => clearTimeout(timeoutId);
  }, [dismissFeedback, feedback]);

  useEffect(() => {
    setShowChrome(true);
    setShowSpeedMenu(false);
    setPlaybackRateState(playbackRateProp ?? 1);
    setIsSpeedBoosting(false);
    speedBoostRestoreRateRef.current = null;
    isLongPressActiveRef.current = false;
    setCurrentTime(restoredSeekTime);
    setScrubTime(restoredSeekTime);
    setIsScrubbing(false);
    setHasStartedPlayback(false);
  }, [videoUrl, streamVideoId, restoredSeekTime, playbackRateProp]);

  useEffect(() => {
    setPlayerMuted(Boolean(preferSimplePlayerBackend && autoplay));
  }, [autoplay, preferSimplePlayerBackend, streamVideoId, videoUrl]);

  useEffect(() => {
    if (!preferSimplePlayerBackend || !autoplay || !playerMuted) return;

    // Unmute via imperative handle only — do NOT call setPlayerMuted here.
    // Changing playerMuted would re-trigger NativeHlsPlayer's main useEffect
    // (which has `muted` in its deps), causing a double init + autoplay race.
    const timeoutId = setTimeout(() => {
      playerRef.current?.setMuted(false);
      console.log('[MobilePlayer] native autoplay unmute attempt');
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [autoplay, playerMuted, preferSimplePlayerBackend]);

  useEffect(() => {
    if (playbackRateProp === undefined) return;
    setPlaybackRateState(playbackRateProp);
    playerRef.current?.setPlaybackRate(playbackRateProp);
  }, [playbackRateProp]);

  useEffect(() => {
    if (!preferSimplePlayerBackend || !isLandscape) return;
    setIsLandscape(false);
  }, [isLandscape, preferSimplePlayerBackend]);

  useEffect(() => {
    const currentPlayer = playerRef.current;

    return () => {
      try {
        currentPlayer?.pause();
      } catch {
        // Ignore teardown failures while leaving the route.
      }
    };
  }, []);

  // === 功能 1: 播放进度记忆 ===
  const progressKey = useMemo(() => {
    return buildPlaybackProgressKey({ episodeId, streamVideoId, videoUrl });
  }, [episodeId, streamVideoId, videoUrl]);

  // 恢复进度
  useEffect(() => {
    if (!progressKey || restoredSeekTime <= 0) return;
    try {
      playerRef.current?.seek(restoredSeekTime);
    } catch { /* ignore */ }
  }, [progressKey, restoredSeekTime]);

  // 保存进度 (每 5 秒)
  const progressTick = Math.floor(currentTime / 5);
  useEffect(() => {
    if (!progressKey || !isPlaying || currentTime < 1) return;
    writeSavedPlaybackProgress({ episodeId, streamVideoId, videoUrl }, currentTime);
  }, [currentTime, episodeId, isPlaying, progressKey, progressTick, streamVideoId, videoUrl]);

  // 离开前保存
  useEffect(() => {
    return () => {
      if (progressKey && currentTime > 1) {
        writeSavedPlaybackProgress({ episodeId, streamVideoId, videoUrl }, currentTime);
      }
    };
  }, [currentTime, episodeId, progressKey, streamVideoId, videoUrl]);

  // === 功能 2: 暂停按钮显示逻辑 ===
  useEffect(() => {
    if (pauseButtonTimerRef.current) clearTimeout(pauseButtonTimerRef.current);
    if (!isPlaying) {
      setShowPauseButton(true);
    } else {
      // 播放时短暂显示后隐藏
      pauseButtonTimerRef.current = setTimeout(() => setShowPauseButton(false), 300);
    }
    return () => { if (pauseButtonTimerRef.current) clearTimeout(pauseButtonTimerRef.current); };
  }, [isPlaying]);

  // === 功能 3: 横屏播放 ===
  const enterLandscape = useCallback(async () => {
    setIsLandscape(true);
    try {
      const screenOrientation = (screen as any).orientation;
      if (screenOrientation?.lock) {
        await screenOrientation.lock('landscape');
      }
    } catch { /* not supported */ }
  }, []);

  const exitLandscape = useCallback(async () => {
    setIsLandscape(false);
    try {
      const screenOrientation = (screen as any).orientation;
      if (screenOrientation?.unlock) {
        screenOrientation.unlock();
      }
    } catch { /* not supported */ }
  }, []);

  useEffect(() => {
    if (!showChrome || showSpeedMenu || !isPlaying) return undefined;
    const timeoutId = setTimeout(() => {
      setShowChrome(false);
    }, CHROME_AUTO_HIDE_MS);

    return () => clearTimeout(timeoutId);
  }, [isPlaying, showChrome, showSpeedMenu]);

  useEffect(() => {
    void lockNativeScreenOrientation('portrait');

    return () => {
      void setNativeKeepAwake(false);
      void unlockNativeScreenOrientation();
    };
  }, []);

  useEffect(() => {
    void setNativeKeepAwake(isPlaying);
  }, [isPlaying]);

  const togglePlayback = useCallback(() => {
    if (!playerRef.current) return;
    if (!hasStartedPlayback) {
      if (preferSimplePlayerBackend) {
        playerRef.current.setMuted(false);
        setPlayerMuted(false);
      }
      playerRef.current.play();
      setShowChrome(true);
      setShowSpeedMenu(false);
      return;
    }
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
    setShowChrome(true);
    setShowSpeedMenu(false);
  }, [hasStartedPlayback, isPlaying, preferSimplePlayerBackend]);

  const showSeekFeedback = useCallback((deltaSeconds: number) => {
    const minutes = formatDuration(Math.abs(deltaSeconds));
    setFeedback({
      type: 'seek',
      label: `${deltaSeconds > 0 ? '+' : '-'}${minutes}`,
    });
    void triggerHaptic('selection');
  }, []);

  const performEpisodeNavigation = useCallback((direction: 'next' | 'previous') => {
    if (direction === 'next') {
      if (hasNextEpisode) {
        void triggerHaptic('light');
        onNextEpisode?.();
        setFeedback({ type: 'navigation', label: labels.nextEpisode });
      }
      return;
    }

    if (hasPreviousEpisode) {
      void triggerHaptic('light');
      onPreviousEpisode?.();
      setFeedback({ type: 'navigation', label: labels.previousEpisode });
      return;
    }

    if (onRefreshFeed) {
      void triggerHaptic('medium');
      onRefreshFeed();
      setFeedback({ type: 'navigation', label: labels.refreshFeed });
    }
  }, [hasNextEpisode, hasPreviousEpisode, labels.nextEpisode, labels.previousEpisode, labels.refreshFeed, onNextEpisode, onPreviousEpisode, onRefreshFeed]);

  const applyPlaybackRate = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    void triggerHaptic('selection');
    speedBoostRestoreRateRef.current = null;
    isLongPressActiveRef.current = false;
    setIsSpeedBoosting(false);
    setPlaybackRateState(rate);
    onPlaybackRateChange?.(rate);
    setShowSpeedMenu(false);
    setFeedback({ type: 'speed', label: labels.speedBoost(rate) });
  }, [labels, onPlaybackRateChange]);

  const endSpeedBoost = useCallback(() => {
    if (speedBoostRestoreRateRef.current === null) return;
    playerRef.current?.setPlaybackRate(speedBoostRestoreRateRef.current);
    setPlaybackRateState(speedBoostRestoreRateRef.current);
    setIsSpeedBoosting(false);
    isLongPressActiveRef.current = false;
    speedBoostRestoreRateRef.current = null;
  }, []);

  const beginSpeedBoost = useCallback(() => {
    if (isLongPressActiveRef.current) return;
    const baseRate = playerRef.current?.getPlaybackRate() || playbackRate;
    speedBoostRestoreRateRef.current = baseRate;
    isLongPressActiveRef.current = true;
    setShowChrome(true);
    setShowSpeedMenu(false);
    setIsSpeedBoosting(true);
    playerRef.current?.setPlaybackRate(2);
    setPlaybackRateState(2);
    setFeedback({ type: 'speed', label: labels.speedBoost(2) });
    void triggerHaptic('medium');
  }, [labels, playbackRate]);

  const togglePictureInPicture = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      if (playerRef.current.isPictureInPictureActive()) {
        await playerRef.current.exitPictureInPicture();
        setPictureInPictureActive(false);
      } else {
        await playerRef.current.enterPictureInPicture();
        setPictureInPictureActive(true);
      }
      void triggerHaptic('selection');
    } catch {
      setPictureInPictureActive(playerRef.current.isPictureInPictureActive());
    }
  }, []);

  const resolveZone = useCallback((clientX: number, width: number): GestureZone => {
    if (clientX < width * 0.3) return 'left';
    if (clientX > width * 0.7) return 'right';
    return 'center';
  }, []);

  const handleSingleTap = useCallback((zone: GestureZone) => {
    if (zone === 'center') {
      togglePlayback();
      return;
    }
    setShowSpeedMenu(false);
    setShowChrome((prev) => !prev);
  }, [togglePlayback]);

  const handleDoubleTap = useCallback((zone: GestureZone) => {
    if (zone === 'center') {
      togglePlayback();
      return;
    }

    const delta = zone === 'left' ? -10 : 10;
    playerRef.current?.seekBy(delta);
    showSeekFeedback(delta);
  }, [showSeekFeedback, togglePlayback]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearPendingTap = useCallback(() => {
    if (tapRef.current.timeoutId) {
      clearTimeout(tapRef.current.timeoutId);
      tapRef.current.timeoutId = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearLongPress();
      clearPendingTap();
      endSpeedBoost();
    };
  }, [clearLongPress, clearPendingTap, endSpeedBoost]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (isScrubbing) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, at: Date.now() };

    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      beginSpeedBoost();
    }, LONG_PRESS_MS);
  }, [beginSpeedBoost, clearLongPress, isScrubbing]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (isScrubbing) return;
    const touch = event.touches[0];
    const start = touchStartRef.current;
    if (!start) return;

    const movedEnough =
      Math.abs(touch.clientX - start.x) > 10 ||
      Math.abs(touch.clientY - start.y) > 10;

    if (movedEnough) {
      clearLongPress();
      endSpeedBoost();
    }
  }, [clearLongPress, endSpeedBoost, isScrubbing]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (isScrubbing) return;
    clearLongPress();

    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    if (isLongPressActiveRef.current) {
      endSpeedBoost();
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDy > SWIPE_THRESHOLD && absDy > absDx * 1.2) {
      performEpisodeNavigation(dy < 0 ? 'next' : 'previous');
      return;
    }

    if (absDx > 14 || absDy > 14) {
      return;
    }

    const zone = resolveZone(touch.clientX, event.currentTarget.clientWidth);
    const now = Date.now();

    // On Android WebView, play() must stay inside the original user gesture stack.
    // Waiting for the single/double-tap timeout causes the first playback attempt
    // to lose gesture context and gets blocked by autoplay policy.
    if (zone === 'center' && !hasStartedPlayback) {
      clearPendingTap();
      tapRef.current.at = 0;
      tapRef.current.zone = zone;
      handleSingleTap(zone);
      return;
    }

    if (tapRef.current.at && tapRef.current.zone === zone && now - tapRef.current.at < DOUBLE_TAP_WINDOW) {
      clearPendingTap();
      tapRef.current.at = 0;
      handleDoubleTap(zone);
      return;
    }

    tapRef.current.at = now;
    tapRef.current.zone = zone;
    tapRef.current.timeoutId = setTimeout(() => {
      handleSingleTap(zone);
      tapRef.current.at = 0;
      tapRef.current.timeoutId = null;
    }, DOUBLE_TAP_WINDOW);
  }, [
    clearLongPress,
    clearPendingTap,
    handleDoubleTap,
    handleSingleTap,
    hasStartedPlayback,
    isScrubbing,
    performEpisodeNavigation,
    resolveZone,
    endSpeedBoost,
  ]);

  const handleTouchCancel = useCallback(() => {
    if (isScrubbing) return;
    clearLongPress();
    clearPendingTap();
    touchStartRef.current = null;
    endSpeedBoost();
  }, [clearLongPress, clearPendingTap, endSpeedBoost, isScrubbing]);

  const timeLabel = useMemo(() => {
    const displayedTime = isScrubbing ? scrubTime : currentTime;
    return `${formatDuration(displayedTime)} / ${formatDuration(duration || 0)}`;
  }, [currentTime, duration, isScrubbing, scrubTime]);
  const progressPercent = useMemo(() => {
    const displayedTime = isScrubbing ? scrubTime : currentTime;
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(100, (displayedTime / duration) * 100));
  }, [currentTime, duration, isScrubbing, scrubTime]);

  const resolveSeekTimeFromClientX = useCallback((clientX: number) => {
    const element = progressBarRef.current;
    if (!element || !duration || duration <= 0) return 0;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0) return 0;

    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent * duration;
  }, [duration]);

  const applySeek = useCallback((nextTime: number) => {
    playerRef.current?.seek(nextTime);
    setCurrentTime(nextTime);
    setScrubTime(nextTime);
  }, []);

  const beginScrub = useCallback((clientX: number) => {
    if (!duration || duration <= 0) return;
    setShowChrome(true);
    setShowSpeedMenu(false);
    setIsScrubbing(true);
    applySeek(resolveSeekTimeFromClientX(clientX));
  }, [applySeek, duration, resolveSeekTimeFromClientX]);

  const updateScrub = useCallback((clientX: number) => {
    if (!isScrubbing) return;
    applySeek(resolveSeekTimeFromClientX(clientX));
  }, [applySeek, isScrubbing, resolveSeekTimeFromClientX]);

  const endScrub = useCallback((clientX: number) => {
    if (!isScrubbing) return;
    applySeek(resolveSeekTimeFromClientX(clientX));
    setIsScrubbing(false);
  }, [applySeek, isScrubbing, resolveSeekTimeFromClientX]);

  const handleProgressPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!duration || duration <= 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    beginScrub(event.clientX);
  }, [beginScrub, duration]);

  const handleProgressPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();

    updateScrub(event.clientX);
  }, [isScrubbing, updateScrub]);

  const finishProgressScrub = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();

    endScrub(event.clientX);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [endScrub, isScrubbing]);

  const cancelProgressScrub = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();
    setIsScrubbing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [isScrubbing]);

  const handleProgressTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    beginScrub(event.touches[0].clientX);
  }, [beginScrub]);

  const handleProgressTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();
    updateScrub(event.touches[0].clientX);
  }, [isScrubbing, updateScrub]);

  const handleProgressTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();
    endScrub(event.changedTouches[0].clientX);
  }, [endScrub, isScrubbing]);

  const handleProgressTouchCancel = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.preventDefault();
    event.stopPropagation();
    setIsScrubbing(false);
  }, [isScrubbing]);

  return (
    <div
      className={cn('relative h-full w-full touch-none select-none overflow-hidden bg-black', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {preferSimplePlayerBackend && videoUrl ? (
        <NativeHlsPlayer
          ref={playerRef as any}
          videoUrl={videoUrl}
          poster={poster}
          autoplay={autoplay}
          muted={playerMuted}
          controls={false}
          initialSeekTime={restoredSeekTime}
          subtitles={subtitles}
          activeSubtitleLanguage={activeSubtitleLanguage}
          selectedAudioId={selectedAudioId}
          onAvailableAudioOptionsChange={onAvailableAudioOptionsChange}
          onBuffering={setIsBuffering}
          onTimeUpdate={(time, playerDuration) => {
            setCurrentTime(time);
            setDuration(playerDuration);
            onTimeUpdate?.(time, playerDuration);
          }}
          onReady={() => {
            setDuration(playerRef.current?.getDuration() || 0);
            if (restoredSeekTime > 0) {
              playerRef.current?.seek(restoredSeekTime);
            }
            playerRef.current?.setPlaybackRate(playbackRate);
            setPictureInPictureSupported(playerRef.current?.isPictureInPictureSupported() || false);
            setPictureInPictureActive(playerRef.current?.isPictureInPictureActive() || false);
            onReady?.();
          }}
          onEnded={onEnded}
          onError={onError}
          onPlay={() => {
            setHasStartedPlayback(true);
            setIsPlaying(true);
            if (playerMuted) {
              // Unmute imperatively only — don't call setPlayerMuted(false)
              // to avoid re-triggering NativeHlsPlayer's main useEffect.
              playerRef.current?.setMuted(false);
            }
            onPlay?.();
          }}
          onPause={() => {
            setIsPlaying(false);
            onPause?.();
          }}
          className="h-full w-full"
        />
      ) : (
        <CloudflarePlayer
          ref={playerRef as any}
          streamVideoId={streamVideoId}
          videoUrl={videoUrl}
          signedToken={signedToken}
          quality={quality}
          subtitles={subtitles}
          activeSubtitleLanguage={activeSubtitleLanguage}
          poster={poster}
          autoplay={autoplay}
          onBuffering={setIsBuffering}
          onTimeUpdate={(time, playerDuration) => {
            setCurrentTime(time);
            setDuration(playerDuration);
            onTimeUpdate?.(time, playerDuration);
          }}
          onReady={() => {
            setDuration(playerRef.current?.getDuration() || 0);
            if (restoredSeekTime > 0) {
              playerRef.current?.seek(restoredSeekTime);
            }
            playerRef.current?.setPlaybackRate(playbackRate);
            setPictureInPictureSupported(playerRef.current?.isPictureInPictureSupported() || false);
            setPictureInPictureActive(playerRef.current?.isPictureInPictureActive() || false);
            onReady?.();
          }}
          onEnded={onEnded}
          onError={onError}
          onPlay={() => {
            setHasStartedPlayback(true);
            setIsPlaying(true);
            onPlay?.();
          }}
          onPause={() => {
            setIsPlaying(false);
            onPause?.();
          }}
          className="h-full w-full"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

      {/* Buffering spinner */}
      {isBuffering && hasStartedPlayback ? (
        <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
        </div>
      ) : null}

      {/* 暂停时居中播放按钮 */}
      {showPauseButton && !isPlaying && hasStartedPlayback ? (
        <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="h-7 w-7 fill-white text-white ml-1" />
          </div>
        </div>
      ) : null}

      {showInternalChrome ? (
      <div
        className={cn(
          'absolute inset-x-0 top-0 z-10 px-4 pb-6 pt-[calc(0.75rem+env(safe-area-inset-top))] transition-opacity duration-200',
          showChrome ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-none max-w-[72%]">
            <p className="line-clamp-1 text-sm font-semibold text-white">{title}</p>
            {subtitle ? <p className="mt-1 line-clamp-1 text-xs text-white/70">{subtitle}</p> : null}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            {showInternalSpeedMenu ? (
            <button
              type="button"
              onClick={() => {
                setShowChrome(true);
                setShowSpeedMenu((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur-md"
            >
              <span>{playbackRate}x</span>
            </button>
            ) : null}
            {pictureInPictureSupported ? (
              <button
                type="button"
                onClick={togglePictureInPicture}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur-md"
              >
                <PictureInPicture2 className="h-3.5 w-3.5" />
                <span>{pictureInPictureActive ? labels.pictureInPictureExit : labels.pictureInPicture}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
      ) : null}

      {showInternalChrome ? (
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-12 text-xs text-white/85 transition-opacity duration-200',
          showChrome ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span>{timeLabel}</span>
        <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5">
          {hasPreviousEpisode ? <ChevronsDownUp className="h-3.5 w-3.5" /> : null}
          <span>{isPlaying ? labels.tapToPause : labels.tapToPlay}</span>
          {hasNextEpisode ? <ChevronsUpDown className="h-3.5 w-3.5" /> : null}
        </div>
      </div>
      ) : null}
      {showInternalProgress ? (
      <div
        className="absolute inset-x-0 z-[11]"
        style={{ bottom: progressBarOffset }}
      >
        <div
          ref={progressBarRef}
          className="pointer-events-auto relative h-5 touch-none"
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={finishProgressScrub}
          onPointerCancel={cancelProgressScrub}
          onTouchStart={handleProgressTouchStart}
          onTouchMove={handleProgressTouchMove}
          onTouchEnd={handleProgressTouchEnd}
          onTouchCancel={handleProgressTouchCancel}
          role="slider"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={Math.max(duration, 0)}
          aria-valuenow={Math.max(0, Math.min(isScrubbing ? scrubTime : currentTime, duration || 0))}
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/18">
            <div
              className="h-full rounded-full bg-red-500 transition-[width] duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
      ) : null}

      {showInternalChrome && showChrome ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex justify-center px-4">
          <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md">
            {isSpeedBoosting ? labels.speedBoost(2) : labels.holdForSpeed}
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-2xl backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              {feedback.type === 'seek' && feedback.label.startsWith('-') ? <Rewind className="h-4 w-4" /> : null}
              {feedback.type === 'seek' && feedback.label.startsWith('+') ? <Forward className="h-4 w-4" /> : null}
              {feedback.type === 'navigation' ? <ChevronDown className="h-4 w-4" /> : null}
              {feedback.label}
            </span>
          </div>
        </div>
      ) : null}

      {showInternalSpeedMenu && showSpeedMenu ? (
        <div className="absolute inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 rounded-3xl border border-white/10 bg-zinc-950/88 p-4 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{labels.playbackSpeed}</p>
          <div className="grid grid-cols-4 gap-2">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => applyPlaybackRate(rate)}
                className={cn(
                  'rounded-2xl px-3 py-3 text-sm font-semibold transition',
                  playbackRate === rate
                    ? 'bg-red-500 text-white'
                    : 'bg-white/6 text-white/80 hover:bg-white/10'
                )}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 横屏翻转按钮 - 显示在进度条上方 */}
      {showInternalChrome && showChrome && !isLandscape && !preferSimplePlayerBackend ? (
        <button
          type="button"
          onClick={enterLandscape}
          className="pointer-events-auto absolute z-[12] flex h-[28px] w-[28px] items-center justify-center rounded-md bg-black/50 backdrop-blur-sm transition active:scale-90"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)', right: '12px' }}
          aria-label="Landscape mode"
        >
          <RotateCcw className="h-[14px] w-[14px] text-white/80" />
        </button>
      ) : null}

      {/* 横屏全屏播放器 */}
      {isLandscape ? (
        <div className="fixed inset-0 z-[9999] bg-black">
          <div className="relative h-full w-full">
            {/* 视频 */}
            <div className="absolute inset-0 flex items-center justify-center">
              {preferSimplePlayerBackend && videoUrl ? (
                <NativeHlsPlayer
                  ref={playerRef as any}
                  videoUrl={videoUrl}
                  poster={poster}
                  autoplay
                  muted={false}
                  controls={false}
                  subtitles={subtitles}
                  activeSubtitleLanguage={activeSubtitleLanguage}
                  onTimeUpdate={(time, d) => { setCurrentTime(time); setDuration(d); onTimeUpdate?.(time, d); }}
                  onEnded={onEnded}
                  onError={onError}
                  onPlay={() => { setIsPlaying(true); onPlay?.(); }}
                  onPause={() => { setIsPlaying(false); onPause?.(); }}
                  className="h-full w-full object-contain"
                />
              ) : (
                <CloudflarePlayer
                  ref={playerRef as any}
                  streamVideoId={streamVideoId}
                  videoUrl={videoUrl}
                  signedToken={signedToken}
                  quality={quality}
                  subtitles={subtitles}
                  activeSubtitleLanguage={activeSubtitleLanguage}
                  poster={poster}
                  autoplay
                  onTimeUpdate={(time, d) => { setCurrentTime(time); setDuration(d); onTimeUpdate?.(time, d); }}
                  onEnded={onEnded}
                  onError={onError}
                  onPlay={() => { setIsPlaying(true); onPlay?.(); }}
                  onPause={() => { setIsPlaying(false); onPause?.(); }}
                  className="h-full w-full"
                />
              )}
            </div>

            {/* 暂停按钮 */}
            {!isPlaying ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                onClick={togglePlayback}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                  <Play className="h-7 w-7 fill-white text-white ml-1" />
                </div>
              </div>
            ) : null}

            {/* 顶部：返回按钮 + 标题 */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-3">
              <button
                type="button"
                onClick={exitLandscape}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                {subtitle ? <p className="truncate text-xs text-white/60">{subtitle}</p> : null}
              </div>
            </div>

            {/* 底部：进度条 */}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium tabular-nums text-white/80">{formatDuration(currentTime)}</span>
                <div className="relative flex-1 h-1 rounded-full bg-white/20">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#ff3b5c]"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium tabular-nums text-white/80">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
