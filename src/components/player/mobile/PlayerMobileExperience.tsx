'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Captions,
  Check,
  ChevronLeft,
  Ellipsis,
  Flag,
  Heart,
  MessageCircle,
  Music2,
  PlayCircle,
  Send,
  Share2,
  Smile,
  Volume2,
  X,
} from 'lucide-react';
import type { Comment, Drama, Episode, User } from '@/types';
import { commentsApi, contactApi, userApi } from '@/lib/api';
import { localizePath, type SupportedLocale } from '@/lib/i18n';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { BottomTabBar } from '@/components/mobile/BottomTabBar';
import MobilePlayer from '@/components/player/MobilePlayer';
import { useToast } from '@/components/ui/Toast';
import { copyText, shareContent } from '@/lib/capacitor-bridge';
import { cn } from '@/lib/utils';
import { resolveSafeImageUrl } from '@/lib/safe-image';
import type { NormalizedPlaybackSource, PlaybackAudioOption } from '@/lib/playback-adapters';

type FeedMode = 'for-you' | 'following';
type OptionsView = 'root' | 'speed' | 'subtitles' | 'audio' | 'report';
type PlaybackEntryMode = 'feed' | 'drama';
const PLAYER_NAV_TOP_OFFSET = 'calc(4.75rem + env(safe-area-inset-bottom))';

type PlayerFeedItem = {
  key: string;
  dramaId: string;
  episodeId: string;
  dramaTitle: string;
  episodeTitle: string;
  description: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar?: string;
  creatorIsVip: boolean;
  likeCount: number | null;
  commentCount: number;
  favoriteCount: number | null;
  poster?: string;
};

interface PlayerMobileExperienceProps {
  dramaId: string;
  drama: Drama | null;
  currentEpisode: Episode;
  locale: SupportedLocale;
  user: User | null;
  token?: string | null;
  initialSeekTime?: number;
  playbackSource: NormalizedPlaybackSource;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  activeFeedMode?: FeedMode;
  isFeedLoading?: boolean;
  canOpenFollowingFeed?: boolean;
  onSelectFeedMode?: (mode: FeedMode) => void | Promise<void>;
  onSkipCurrentFeedItem?: () => void | Promise<void>;
  autoplayNextEpisode?: boolean;
  onAutoplayNextEpisodeChange?: (enabled: boolean) => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  onRefreshFeed?: () => void;
  playbackMode?: PlaybackEntryMode;
  parentHref?: string;
  onBackToParent?: () => void;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatCompactCount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${value}`;
}

function getLocaleCopy(locale: SupportedLocale) {
  const isZh = locale === 'zh';
  return {
    forYou: isZh ? 'For You' : 'For You',
    following: isZh ? 'Following' : 'Following',
    comments: isZh ? '评论' : 'Comments',
    addComment: isZh ? '添加评论...' : 'Add a comment...',
    maxCommentHint: isZh ? '最多 1024 个字符' : 'Max 1024 characters',
    send: isZh ? '发送' : 'Send',
    favoriteAdded: isZh ? '已加入收藏' : 'Added to favorites',
    favoriteRemoved: isZh ? '已取消收藏' : 'Removed from favorites',
    signInRequired: isZh ? '请先登录后再操作' : 'Please sign in first',
    followingEmpty: isZh ? 'Following 暂无可播放内容' : 'No episodes available in Following yet',
    shareTo: isZh ? '分享至' : 'Share to',
    options: isZh ? '更多选项' : 'Options',
    speed: isZh ? '播放速度' : 'Playback speed',
    subtitles: isZh ? '字幕' : 'Subtitles',
    audio: isZh ? '语音' : 'Audio',
    notInterested: isZh ? '不感兴趣' : 'Not Interested',
    report: isZh ? '报告问题' : 'Report',
    copyLink: isZh ? '复制链接' : 'Copy Link',
    stories: isZh ? '动态' : 'Stories',
    noComments: isZh ? '还没有评论，来做第一个发言的人。' : 'No comments yet. Be the first to join the conversation.',
    reply: isZh ? '回复' : 'Reply',
    reportTitle: isZh ? '反馈播放问题' : 'Report a playback issue',
    reportPlaceholder: isZh ? '请描述你遇到的问题，例如卡顿、字幕错误、音画不同步等。' : 'Describe the issue you found, like buffering, subtitle mismatch, or audio sync problems.',
    reportSubmitted: isZh ? '反馈已提交' : 'Feedback submitted',
    reportSubmit: isZh ? '提交反馈' : 'Submit report',
    reportType: isZh ? '播放问题' : 'Playback issue',
    noSubtitle: isZh ? '关闭字幕' : 'Off',
    noSubtitleTracks: isZh ? '当前剧集还没有可用字幕文件' : 'No subtitle tracks available for this episode yet',
    noAlternateAudio: isZh ? '当前片源没有可切换音轨，暂时仅支持原始音频' : 'No alternate audio tracks are available for this source yet',
    autoplayNextEpisode: isZh ? '自动换集' : 'Auto-play next episode',
    autoplayNextEpisodeHint: isZh ? '视频结束后立即播放下一集' : 'Play the next episode immediately when this one ends',
    enabled: isZh ? '已开启' : 'On',
    disabled: isZh ? '已关闭' : 'Off',
    creatorPro: 'PRO',
    whatsApp: 'WhatsApp',
    facebook: 'Facebook',
    originalAudio: isZh ? '原始音轨' : 'Original',
  };
}

function extractDramaList(payload: any): Drama[] {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dramas)) return data.dramas;
  if (Array.isArray(data?.favorites)) return data.favorites;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function buildCreatorHandle(drama: Drama | null) {
  const base = drama?.creatorName || drama?.director || drama?.actors?.[0] || drama?.title || 'creator';
  return `@${base.toLowerCase().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'creator'}`;
}

function buildFeedItem(drama: Drama | null, episode: Episode): PlayerFeedItem {
  return {
    key: `${drama?._id || episode.dramaId}:${episode._id}`,
    dramaId: drama?._id || String(episode.dramaId),
    episodeId: episode._id,
    dramaTitle: drama?.title || episode.title,
    episodeTitle: episode.title,
    description: episode.description || drama?.description || '',
    creatorName: drama?.creatorName || drama?.director || drama?.actors?.[0] || drama?.title || 'Creator',
    creatorHandle: buildCreatorHandle(drama),
    creatorAvatar: drama?.creatorAvatar || undefined,
    creatorIsVip: Boolean((drama?.rating || 0) >= 4.7),
    likeCount: null,
    commentCount: 0,
    favoriteCount: null,
    poster: episode.thumbnail || drama?.cover,
  };
}

function isVipComment(comment: Comment) {
  const user = comment.userId as User | undefined;
  return user?.vipStatus === 'active' || user?.role === 'admin';
}

function getCommentAuthor(comment: Comment) {
  const user = comment.userId as User | undefined;
  return {
    name: user?.nickname || 'User',
    avatar: user?.avatar,
  };
}

export default function PlayerMobileExperience({
  dramaId,
  drama,
  currentEpisode,
  locale,
  user,
  token,
  initialSeekTime = 0,
  playbackSource,
  onTimeUpdate,
  onEnded,
  onError,
  onPlay,
  onPause,
  activeFeedMode = 'for-you',
  isFeedLoading = false,
  canOpenFollowingFeed = false,
  onSelectFeedMode,
  onSkipCurrentFeedItem,
  autoplayNextEpisode = true,
  onAutoplayNextEpisodeChange,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
  onNextEpisode,
  onPreviousEpisode,
  onRefreshFeed,
  playbackMode = 'feed',
  parentHref,
  onBackToParent,
}: PlayerMobileExperienceProps) {
  const copy = useMemo(() => getLocaleCopy(locale), [locale]);
  const router = useRouter();
  const { toast } = useToast();
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionsView, setOptionsView] = useState<OptionsView>('root');
  const [reportMessage, setReportMessage] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSubtitleLanguage, setActiveSubtitleLanguage] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState(playbackSource.audioOptions[0]?.id || 'default');
  const [availableAudioOptions, setAvailableAudioOptions] = useState<PlaybackAudioOption[]>(playbackSource.audioOptions);
  const [playbackProgress, setPlaybackProgress] = useState({
    currentTime: initialSeekTime,
    duration: currentEpisode.duration || 0,
  });
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  const canOpenDramaDetail = playbackMode === 'feed';
  const canSwipeBackToParent = playbackMode === 'drama';
  const edgeSwipeRef = useRef<{ startX: number; startY: number; edge: 'left' | 'right' | null } | null>(null);

  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const screenW = window.innerWidth;
    const isLeftEdge = touch.clientX < screenW * 0.15;
    const isRightEdge = touch.clientX > screenW * 0.85;

    if (canOpenDramaDetail && isRightEdge) {
      edgeSwipeRef.current = { startX: touch.clientX, startY: touch.clientY, edge: 'right' };
      return;
    }

    if (canSwipeBackToParent && isLeftEdge) {
      edgeSwipeRef.current = { startX: touch.clientX, startY: touch.clientY, edge: 'left' };
      return;
    }

    edgeSwipeRef.current = null;
  }, [canOpenDramaDetail, canSwipeBackToParent]);

  const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    const ref = edgeSwipeRef.current;
    edgeSwipeRef.current = null;
    if (!ref?.edge) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - ref.startX;
    const dy = Math.abs(touch.clientY - ref.startY);

    if (ref.edge === 'right' && canOpenDramaDetail) {
      const leftSwipeDistance = ref.startX - touch.clientX;
      if (leftSwipeDistance > 60 && leftSwipeDistance > dy * 1.5) {
        router.push(localizePath(`/drama/${dramaId}`, locale));
      }
      return;
    }

    if (ref.edge === 'left' && canSwipeBackToParent && deltaX > 60 && deltaX > dy * 1.5) {
      if (onBackToParent) {
        onBackToParent();
        return;
      }
      if (parentHref) {
        router.push(parentHref);
      }
    }
  }, [canOpenDramaDetail, canSwipeBackToParent, dramaId, locale, onBackToParent, parentHref, router]);

  const currentFeedItem = useMemo(
    () => buildFeedItem(drama, currentEpisode),
    [currentEpisode, drama]
  );
  const displayedCommentCount = comments.length;

  useEffect(() => {
    setCommentInput('');
    setShowComments(false);
    setShowOptions(false);
    setOptionsView('root');
    setReportMessage('');
    setPlaybackRate(1);
    setActiveSubtitleLanguage(null);
    setSelectedAudioId(playbackSource.audioOptions[0]?.id || 'default');
    setAvailableAudioOptions(playbackSource.audioOptions);
    setPlaybackProgress({
      currentTime: initialSeekTime,
      duration: currentEpisode.duration || 0,
    });
  }, [currentEpisode._id, currentEpisode.duration, initialSeekTime, playbackSource.audioOptions]);

  useEffect(() => {
    if (availableAudioOptions.some((track) => track.id === selectedAudioId)) return;
    setSelectedAudioId(availableAudioOptions[0]?.id || 'default');
  }, [availableAudioOptions, selectedAudioId]);

  useEffect(() => {
    const likeStorageKey = `tinytale:episode-like:${currentEpisode._id}`;
    const followStorageKey = `tinytale:follow-drama:${dramaId}`;
    const liked = typeof window !== 'undefined' && window.localStorage.getItem(likeStorageKey) === '1';
    const following = typeof window !== 'undefined' && window.localStorage.getItem(followStorageKey) === '1';

    setIsLiked(liked);
    setIsFollowingCreator(following);
    setLikeCount(liked ? 1 : 0);
  }, [currentEpisode._id, dramaId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFavoriteState() {
      if (!token) {
        setIsFavorited(false);
        return;
      }

      try {
        const res = await userApi.getFavorites(token);
        const favorites = extractDramaList(res);
        if (!cancelled) {
          setIsFavorited(favorites.some((item) => item._id === dramaId));
        }
      } catch {
        if (!cancelled) {
          setIsFavorited(false);
        }
      }
    }

    void loadFavoriteState();

    return () => {
      cancelled = true;
    };
  }, [dramaId, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const res = await commentsApi.getByDrama(dramaId, currentEpisode._id);
        const data = (res as any)?.data ?? res;
        const items = Array.isArray(data) ? data : Array.isArray(data?.comments) ? data.comments : [];
        if (!cancelled) {
          setComments(items.filter((item: Comment) => item.status !== 'rejected'));
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [currentEpisode._id, dramaId]);

  const requireAuth = useCallback(() => {
    if (token) return true;
    toast(copy.signInRequired, 'info');
    if (typeof window !== 'undefined') {
      router.push(`${localizePath('/auth/login', locale)}?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    return false;
  }, [copy.signInRequired, locale, router, toast, token]);

  const handleToggleFavorite = useCallback(async () => {
    if (!requireAuth()) return;

    try {
      if (isFavorited) {
        await userApi.removeFavorite(token as string, dramaId);
        setIsFavorited(false);
        toast(copy.favoriteRemoved, 'success');
      } else {
        await userApi.addFavorite(token as string, dramaId);
        setIsFavorited(true);
        toast(copy.favoriteAdded, 'success');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : copy.favoriteRemoved, 'error');
    }
  }, [copy.favoriteAdded, copy.favoriteRemoved, dramaId, isFavorited, requireAuth, toast, token]);

  const handleToggleLike = useCallback(() => {
    if (!requireAuth()) return;
    const nextLiked = !isLiked;
    const storageKey = `tinytale:episode-like:${currentEpisode._id}`;
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    if (typeof window !== 'undefined') {
      if (nextLiked) {
        window.localStorage.setItem(storageKey, '1');
      } else {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, [currentEpisode._id, isLiked, requireAuth]);

  const handleFollowCreator = useCallback(() => {
    if (!requireAuth()) return;
    const storageKey = `tinytale:follow-drama:${dramaId}`;
    setIsFollowingCreator(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, '1');
    }
  }, [dramaId, requireAuth]);

  const handleOpenCreatorHome = useCallback(() => {
    router.push(localizePath(`/creator-home/${dramaId}`, locale));
  }, [dramaId, locale, router]);

  const handleSendComment = useCallback(async () => {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 1024) {
      toast(copy.maxCommentHint, 'error');
      return;
    }
    if (!requireAuth()) return;

    setIsSendingComment(true);
    try {
      const res = await commentsApi.add(token as string, dramaId, currentEpisode._id, trimmed);
      const data = (res as any)?.data ?? res;
      const createdComment = data?.comment ?? data ?? {
        _id: `local-${Date.now()}`,
        userId: user,
        dramaId,
        episodeId: currentEpisode,
        content: trimmed,
        status: 'approved',
        likes: 0,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [createdComment as Comment, ...prev]);
      setCommentInput('');
    } catch (error) {
      toast(error instanceof Error ? error.message : copy.send, 'error');
    } finally {
      setIsSendingComment(false);
    }
  }, [commentInput, copy.maxCommentHint, copy.send, currentEpisode, dramaId, requireAuth, toast, token, user]);

  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!requireAuth()) return;
    const alreadyLiked = likedCommentIds.has(commentId);
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) { next.delete(commentId); } else { next.add(commentId); }
      return next;
    });
    setComments((prev) => prev.map((comment) => (
      comment._id === commentId
        ? { ...comment, likes: Math.max(0, (comment.likes || 0) + (alreadyLiked ? -1 : 1)) }
        : comment
    )));
    try {
      await commentsApi.like(token as string, commentId);
    } catch {
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) { next.add(commentId); } else { next.delete(commentId); }
        return next;
      });
      setComments((prev) => prev.map((comment) => (
        comment._id === commentId
          ? { ...comment, likes: Math.max(0, (comment.likes || 0) + (alreadyLiked ? 1 : -1)) }
          : comment
      )));
    }
  }, [likedCommentIds, requireAuth, token]);

  const handleShare = useCallback(async (channel: 'native' | 'copy' | 'whatsapp' | 'facebook' | 'stories') => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (!currentUrl) return;

    const shareText = `${currentFeedItem.dramaTitle} - ${currentFeedItem.episodeTitle}`;

    if (channel === 'copy') {
      await copyText(currentUrl);
      toast(copy.copyLink, 'success');
      return;
    }

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (channel === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    const shared = await shareContent({
      title: currentFeedItem.dramaTitle,
      text: shareText,
      url: currentUrl,
      dialogTitle: channel === 'stories' ? copy.stories : copy.shareTo,
    });

    if (!shared) {
      await copyText(currentUrl);
      toast(copy.copyLink, 'success');
    }
  }, [copy.copyLink, copy.shareTo, copy.stories, currentFeedItem.dramaTitle, currentFeedItem.episodeTitle, toast]);

  const handleSubmitReport = useCallback(async () => {
    const trimmed = reportMessage.trim();
    if (!trimmed) return;
    setIsSubmittingReport(true);
    try {
      await contactApi.submitInquiry({
        name: user?.nickname || 'TinyTale User',
        email: user?.email || 'support@tinytale.top',
        subject: `Playback issue · ${currentFeedItem.dramaTitle} · ${currentFeedItem.episodeTitle}`,
        message: `Drama ID: ${dramaId}\nEpisode ID: ${currentEpisode._id}\n\n${trimmed}`,
        type: copy.reportType,
      });
      toast(copy.reportSubmitted, 'success');
      setReportMessage('');
      setShowOptions(false);
      setOptionsView('root');
    } catch (error) {
      toast(error instanceof Error ? error.message : copy.reportSubmitted, 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  }, [copy.reportSubmitted, copy.reportType, currentEpisode._id, currentFeedItem.dramaTitle, currentFeedItem.episodeTitle, dramaId, reportMessage, toast, user?.email, user?.nickname]);

  const handleSelectFeed = useCallback(async (mode: FeedMode) => {
    if (mode === activeFeedMode) return;
    if (mode === 'following' && !canOpenFollowingFeed) {
      toast(copy.followingEmpty, 'info');
      return;
    }
    await onSelectFeedMode?.(mode);
  }, [activeFeedMode, canOpenFollowingFeed, copy.followingEmpty, onSelectFeedMode, toast]);

  const handleNotInterested = useCallback(() => {
    setShowOptions(false);
    setOptionsView('root');
    if (onSkipCurrentFeedItem) {
      void onSkipCurrentFeedItem();
      return;
    }
    onNextEpisode?.();
  }, [onNextEpisode, onSkipCurrentFeedItem]);

  const openOptionsView = useCallback((view: OptionsView) => {
    setShowOptions(true);
    setOptionsView(view);
  }, []);

  const renderSheetHeader = (title: string) => (
    <div className="mb-4 flex items-center gap-3">
      {optionsView !== 'root' ? (
        <button
          type="button"
          onClick={() => setOptionsView('root')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">{copy.options}</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
      </div>
    </div>
  );

  const subtitleOptions = playbackSource.subtitles;
  const audioOptions = availableAudioOptions;
  const actionButtonClassName = 'pointer-events-auto flex min-h-[54px] flex-col items-center gap-[3px]';
  const actionIconClassName = 'inline-flex h-10 w-10 items-center justify-center text-[#c6cad2] transition duration-200 hover:scale-105 hover:text-[#e4e8ef]';
  const actionLabelClassName = 'min-h-[12px] text-xs font-bold tracking-[0.08em] text-[#c5cad2] leading-none';
  const optionTileBaseClassName = 'rounded-[22px] border border-white/10 bg-[#25282e] px-4 py-4 text-left text-sm font-semibold text-[#c2c7d0] transition';
  const optionTileActiveClassName = 'border-[#ff4a6a]/55 bg-[#25282e] text-[#e3e7ee] shadow-[0_0_0_1px_rgba(255,74,106,0.3)]';
  const optionTileInactiveClassName = 'hover:border-white/20 hover:text-[#e3e7ee]';

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden bg-black text-[#d6d9df]"
      style={{ ['--player-nav-top-offset' as string]: PLAYER_NAV_TOP_OFFSET }}
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >
      {canOpenDramaDetail ? (
        <div className="pointer-events-none absolute right-0 top-1/2 z-[60] h-16 w-1 -translate-y-1/2 rounded-l-full bg-white/15" />
      ) : null}
      {canSwipeBackToParent ? (
        <div className="pointer-events-none absolute left-0 top-1/2 z-[60] h-16 w-1 -translate-y-1/2 rounded-r-full bg-white/15" />
      ) : null}
      <MobilePlayer
        streamVideoId={playbackSource.streamVideoId}
        videoUrl={playbackSource.playbackUrl || playbackSource.rawVideoUrl}
        signedToken={playbackSource.signedToken}
        quality="auto"
        subtitles={playbackSource.subtitles}
        activeSubtitleLanguage={activeSubtitleLanguage}
        selectedAudioId={selectedAudioId}
        onAvailableAudioOptionsChange={setAvailableAudioOptions}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        poster={currentFeedItem.poster}
        autoplay
        initialSeekTime={initialSeekTime}
        title={currentFeedItem.dramaTitle}
        subtitle={currentFeedItem.episodeTitle}
        onTimeUpdate={(time, duration) => {
          setPlaybackProgress({ currentTime: time, duration });
          onTimeUpdate?.(time, duration);
        }}
        onEnded={onEnded}
        onError={onError}
        onPlay={onPlay}
        onPause={onPause}
        onNextEpisode={onNextEpisode}
        onPreviousEpisode={onPreviousEpisode}
        hasNextEpisode={hasNextEpisode}
        hasPreviousEpisode={hasPreviousEpisode}
        onRefreshFeed={playbackMode === 'feed' ? onRefreshFeed : undefined}
        showInternalChrome={false}
        showInternalSpeedMenu={false}
        showInternalProgress
        progressBarOffset="var(--player-nav-top-offset)"
        className="h-[calc(100dvh-var(--player-nav-top-offset))] w-full"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,74,106,0.18),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.28),transparent_24%,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.9)_100%)]" />

      {playbackMode === 'feed' ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[55] flex justify-center px-6 pt-[calc(0.9rem+10px+env(safe-area-inset-top))]">
          <nav className="pointer-events-auto inline-flex items-center gap-8 text-lg font-bold tracking-tight">
            <button
              type="button"
              disabled={isFeedLoading}
              onClick={() => handleSelectFeed('for-you')}
              className={cn(
                'border-b-2 pb-1 transition disabled:opacity-45',
                activeFeedMode === 'for-you' ? 'border-[#d8dbe1] text-[#e3e6ec]' : 'border-transparent text-[#8d93a0]'
              )}
            >
              {copy.forYou}
            </button>
            <button
              type="button"
              disabled={isFeedLoading}
              onClick={() => handleSelectFeed('following')}
              className={cn(
                'border-b-2 pb-1 transition disabled:opacity-45',
                activeFeedMode === 'following' ? 'border-[#d8dbe1] text-[#e3e6ec]' : 'border-transparent text-[#8d93a0]'
              )}
            >
              {copy.following}
            </button>
          </nav>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[55] flex items-start justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => {
              if (onBackToParent) {
                onBackToParent();
                return;
              }
              if (parentHref) {
                router.push(parentHref);
              }
            }}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-[#e3e6ec] backdrop-blur-md"
            aria-label="Back to drama"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="pointer-events-none rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-right backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">{currentFeedItem.dramaTitle}</p>
            <p className="mt-1 text-sm font-semibold text-[#e0e4eb]">{currentFeedItem.episodeTitle}</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-4 bottom-[calc(var(--player-nav-top-offset)+3rem)] z-[56] flex flex-col items-center gap-[15px]">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={handleOpenCreatorHome}
            className="relative block h-12 w-12 overflow-hidden rounded-full border-2 border-[#d0d4dc] shadow-lg"
            aria-label="Open creator home"
          >
            {currentFeedItem.creatorAvatar ? (
              <Image
                src={resolveSafeImageUrl(currentFeedItem.creatorAvatar)}
                alt={currentFeedItem.creatorName}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized={Boolean(currentFeedItem.creatorAvatar.startsWith('blob:'))}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#ff4a6a] text-sm font-black">
                {currentFeedItem.creatorName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </button>
          {!isFollowingCreator ? (
            <button
              type="button"
              onClick={handleFollowCreator}
              className="absolute -bottom-2 left-1/2 inline-flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#ff4a6a] text-white shadow-[0_8px_20px_rgba(255,74,106,0.45)]"
            >
              <span className="text-sm leading-none">+</span>
            </button>
          ) : null}
        </div>

        <button type="button" onClick={handleToggleLike} className={actionButtonClassName}>
          <span className={cn(actionIconClassName, isLiked && 'text-[#ff4a6a]')}>
            <Heart className={cn('h-6 w-6', isLiked && 'fill-current')} />
          </span>
          <span className={cn(actionLabelClassName, likeCount > 0 ? 'opacity-100' : 'opacity-0')}>
            {formatCompactCount(Math.max(0, likeCount))}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowComments(true);
            setShowOptions(false);
            setOptionsView('root');
          }}
          className={actionButtonClassName}
        >
          <span className={actionIconClassName}>
            <MessageCircle className="h-6 w-6" />
          </span>
          <span className={cn(actionLabelClassName, displayedCommentCount > 0 ? 'opacity-100' : 'opacity-0')}>
            {formatCompactCount(Math.max(0, displayedCommentCount))}
          </span>
        </button>

        <button type="button" onClick={handleToggleFavorite} className={actionButtonClassName}>
          <span className={cn(actionIconClassName, isFavorited && 'text-[#ff4a6a]')}>
            <Bookmark className={cn('h-6 w-6', isFavorited && 'fill-current')} />
          </span>
          <span
            className={cn(
              actionLabelClassName,
              (currentFeedItem.favoriteCount || 0) > 0 ? 'opacity-100' : 'opacity-0'
            )}
          >
            {formatCompactCount(Math.max(0, currentFeedItem.favoriteCount || 0))}
          </span>
        </button>

        <button type="button" onClick={() => openOptionsView('root')} className={actionButtonClassName}>
          <span className={actionIconClassName}>
            <Ellipsis className="h-6 w-6" />
          </span>
          <span className={cn(actionLabelClassName, 'opacity-0')}>0</span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--player-nav-top-offset)+0.15rem)] z-[55] px-4">
        <div className="bg-gradient-to-t from-black/72 via-black/28 to-transparent pb-3">
          <div className="max-w-[78%]">
            <h1 className="mt-2 text-lg font-extrabold leading-tight text-[#e0e4eb]">{currentFeedItem.dramaTitle}</h1>
            {currentFeedItem.description ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#b4bac4]">{currentFeedItem.description}</p>
            ) : null}
            <div className="mt-3 flex items-center gap-2 overflow-hidden text-sm text-[#b2b8c2]">
              <Music2 className="h-4 w-4 shrink-0" />
              <div className="overflow-hidden whitespace-nowrap">
                <span className="animate-player-marquee inline-block">
                  {currentFeedItem.episodeTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{currentFeedItem.episodeTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        contentClassName="max-h-[82dvh] rounded-t-[32px] bg-[#25282e]"
      >
        <div className="flex min-h-[58dvh] flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#dde1e8]">{formatCompactCount(displayedCommentCount)} {copy.comments}</h2>
            <button
              type="button"
              onClick={() => setShowComments(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2c2f36] hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {comments.length > 0 ? comments.map((comment) => {
              const author = getCommentAuthor(comment);
              const vip = isVipComment(comment);
              const avatar = author.avatar ? resolveSafeImageUrl(author.avatar) : null;
              const commentLiked = likedCommentIds.has(comment._id);

              return (
                <div key={comment._id} className="flex gap-3">
                  <div className={cn(
                    'relative h-10 w-10 shrink-0 overflow-hidden rounded-full',
                    vip ? 'border-2 border-[#FFD700]' : 'border border-white/10'
                  )}>
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={author.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized={avatar.startsWith('blob:')}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#2c3140] text-xs font-black text-[#e1e4ea]">
                        {author.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-bold', vip ? 'text-[#FFD700]' : 'text-[#d8dde5]')}>
                        {author.name}
                      </span>
                      {vip ? (
                        <svg className="h-3.5 w-3.5 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/></svg>
                      ) : null}
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#b8bec8]">{comment.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleLikeComment(comment._id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold transition',
                          commentLiked ? 'text-[#FF3B5C]' : 'text-white/56 hover:text-[#FF3B5C]'
                        )}
                      >
                        <Heart className={cn('h-4 w-4', commentLiked && 'fill-current')} />
                        <span>{formatCompactCount(comment.likes || 0)}</span>
                      </button>
                      <span className="text-xs font-semibold text-white/42">{copy.reply}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-6 text-sm leading-6 text-[#979eaa]">
                {copy.noComments}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-white/8 pt-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value.slice(0, 1024))}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSendComment(); } }}
                placeholder={copy.addComment}
                className="w-full rounded-full border-none bg-[#2c2f36] py-2.5 pl-5 pr-20 text-sm text-[#d5d9df] outline-none ring-0 placeholder:text-[#7f8793] focus:ring-2 focus:ring-[#FF3B5C]/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-3">
                <Smile className="h-5 w-5 Claude Code-pointer text-white/50 transition hover:text-white" />
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={isSendingComment || !commentInput.trim()}
                  className="text-[#FF3B5C] transition hover:scale-110 disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-medium text-white/36">{commentInput.length}/1024</p>
          </div>
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        open={showOptions}
        onClose={() => {
          setShowOptions(false);
          setOptionsView('root');
        }}
        contentClassName="max-h-[76dvh] rounded-t-[32px] bg-[#0f1115]/85 backdrop-blur-xl border-t border-white/10"
      >
        {optionsView === 'root' ? (
          <div>
            <div className="mb-6 border-b border-white/10 pb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">{copy.shareTo}</p>
              <div className="mt-4 grid grid-cols-4 gap-4">
                {[
                  { key: 'whatsapp', label: copy.whatsApp, icon: <MessageCircle className="h-5 w-5" /> },
                  { key: 'facebook', label: copy.facebook, icon: <Share2 className="h-5 w-5" /> },
                  { key: 'copy', label: copy.copyLink, icon: <Send className="h-5 w-5" /> },
                  { key: 'stories', label: copy.stories, icon: <Share2 className="h-5 w-5" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleShare(item.key as 'whatsapp' | 'facebook' | 'copy' | 'stories')}
                    className="flex flex-col items-center gap-2"
                  >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2c2f36] text-[#d0d5de] hover:bg-white/15 transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-medium text-[#9ca4b0]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-4 px-1">
              {[
                { key: 'subtitles', label: copy.subtitles, icon: <Captions className="h-5 w-5" /> },
                { key: 'audio', label: copy.audio, icon: <Volume2 className="h-5 w-5" /> },
                { key: 'speed', label: copy.speed, icon: <Share2 className="h-5 w-5" /> },
                { key: 'autoplay-next', label: copy.autoplayNextEpisode, icon: <PlayCircle className="h-5 w-5" />, active: autoplayNextEpisode },
                { key: 'not-interested', label: copy.notInterested, icon: <Check className="h-5 w-5" /> },
                { key: 'report', label: copy.report, icon: <Flag className="h-5 w-5" /> },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === 'not-interested') {
                      handleNotInterested();
                      return;
                    }
                    if (item.key === 'autoplay-next') {
                      onAutoplayNextEpisodeChange?.(!autoplayNextEpisode);
                      return;
                    }
                    openOptionsView(item.key as OptionsView);
                  }}
                  className="flex w-[64px] shrink-0 flex-col items-center gap-2"
                >
                  <span className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full bg-[#2c2f36] text-[#d0d5de] transition-colors',
                    item.active ? 'text-[#ff4a6a]' : 'hover:bg-white/15'
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    'text-center text-[11px] font-medium text-[#9ca4b0]',
                    item.active && 'text-[#ff8398]'
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
              </div>
            </div>
          </div>
        ) : null}

        {optionsView === 'speed' ? (
          <div>
            {renderSheetHeader(copy.speed)}
            <div className="grid grid-cols-2 gap-3">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackRate(speed)}
                className={cn(
                  optionTileBaseClassName,
                  playbackRate === speed ? optionTileActiveClassName : optionTileInactiveClassName
                )}
              >
                {speed}x
              </button>
              ))}
            </div>
          </div>
        ) : null}

        {optionsView === 'subtitles' ? (
          <div>
            {renderSheetHeader(copy.subtitles)}
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setActiveSubtitleLanguage(null)}
                className={cn(
                  optionTileBaseClassName,
                  activeSubtitleLanguage === null ? optionTileActiveClassName : optionTileInactiveClassName
                )}
              >
                {copy.noSubtitle}
              </button>
              {subtitleOptions.map((track) => (
                <button
                  key={track.language}
                  type="button"
                  onClick={() => setActiveSubtitleLanguage(track.language)}
                  className={cn(
                    optionTileBaseClassName,
                    activeSubtitleLanguage === track.language ? optionTileActiveClassName : optionTileInactiveClassName
                  )}
                >
                  {track.label}
                </button>
              ))}
              {subtitleOptions.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-[#25282e] px-4 py-4 text-sm leading-6 text-white/52">
                  {copy.noSubtitleTracks}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {optionsView === 'audio' ? (
          <div>
            {renderSheetHeader(copy.audio)}
            <div className="grid gap-3">
              {audioOptions.map((track: PlaybackAudioOption) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedAudioId(track.id)}
                  className={cn(
                    optionTileBaseClassName,
                    selectedAudioId === track.id ? optionTileActiveClassName : optionTileInactiveClassName
                  )}
                >
                  {track.label || copy.originalAudio}
                </button>
              ))}
              {audioOptions.length <= 1 ? (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-[#25282e] px-4 py-4 text-sm leading-6 text-white/52">
                  {copy.noAlternateAudio}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {optionsView === 'report' ? (
          <div>
            {renderSheetHeader(copy.reportTitle)}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
              <textarea
                value={reportMessage}
                onChange={(event) => setReportMessage(event.target.value)}
                rows={6}
                placeholder={copy.reportPlaceholder}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/32"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={isSubmittingReport || !reportMessage.trim()}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#ff4a6a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.reportSubmit}
            </button>
          </div>
        ) : null}
      </MobileBottomSheet>

      {playbackMode === 'feed' ? (
        <BottomTabBar forceVisible />
      ) : (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(100%+env(safe-area-inset-bottom))] bg-[#111116]/95" />
          <div className="pointer-events-auto relative mx-auto max-w-md rounded-t-[28px] border-t border-white/10 bg-[#111116]/95 px-5 pb-safe-bottom pt-3 shadow-[0_-18px_36px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">{currentFeedItem.dramaTitle}</p>
                <h2 className="mt-1 truncate text-sm font-semibold text-[#e0e4eb]">{currentFeedItem.episodeTitle}</h2>
                <p className="mt-1 text-xs text-[#aeb4be]">
                  Episode {currentEpisode.episodeNumber}
                </p>
              </div>
              <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-[#d2d7df]">
                {Math.max(0, Math.round(playbackProgress.duration || currentEpisode.duration || 0))}s
              </div>
            </div>
            {currentFeedItem.description ? (
              <p className="mt-2 line-clamp-1 text-xs text-[#8f97a3]">{currentFeedItem.description}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
