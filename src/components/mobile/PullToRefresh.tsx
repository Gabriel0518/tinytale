'use client';

import {
  ReactNode,
  TouchEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const MAX_PULL = 108;
const REFRESH_THRESHOLD = 72;
const TRIGGER_ZONE = 120;

interface PullToRefreshProps {
  children: ReactNode;
  disabled?: boolean;
  onRefresh: () => Promise<void> | void;
  pullLabel: string;
  releaseLabel: string;
  refreshingLabel: string;
  className?: string;
}

export function PullToRefresh({
  children,
  disabled = false,
  onRefresh,
  pullLabel,
  releaseLabel,
  refreshingLabel,
  className,
}: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const canPullRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const reset = useCallback(() => {
    startYRef.current = null;
    canPullRef.current = false;
    setPullDistance(0);
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (disabled || refreshing) return;

      const touch = event.touches[0];
      const isAtTop = window.scrollY <= 2;
      startYRef.current = touch.clientY;
      canPullRef.current = isAtTop && touch.clientY <= TRIGGER_ZONE;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (disabled || refreshing || !canPullRef.current || startYRef.current === null) {
        return;
      }

      const touch = event.touches[0];
      const delta = touch.clientY - startYRef.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }

      const easedDistance = Math.min(MAX_PULL, delta * 0.55);
      setPullDistance(easedDistance);
      event.preventDefault();
    },
    [disabled, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || refreshing) {
      reset();
      return;
    }

    const shouldRefresh = pullDistance >= REFRESH_THRESHOLD;
    if (!shouldRefresh) {
      reset();
      return;
    }

    setRefreshing(true);
    setPullDistance(56);

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      reset();
    }
  }, [disabled, onRefresh, pullDistance, refreshing, reset]);

  const statusLabel = useMemo(() => {
    if (refreshing) return refreshingLabel;
    if (pullDistance >= REFRESH_THRESHOLD) return releaseLabel;
    return pullLabel;
  }, [pullDistance, pullLabel, refreshing, refreshingLabel, releaseLabel]);

  return (
    <div
      className={cn('relative touch-pan-y overscroll-y-contain', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={reset}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center overflow-hidden transition-[height,opacity] duration-200',
          pullDistance > 0 || refreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{ height: `${Math.max(pullDistance, refreshing ? 56 : 0)}px` }}
      >
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/88 px-4 py-2 text-xs font-medium tracking-[0.18em] text-white/70 backdrop-blur-xl">
          <div
            className={cn(
              'h-4 w-4 rounded-full border-2 border-white/20 border-t-white/85 transition-transform duration-200',
              refreshing ? 'animate-spin' : ''
            )}
            style={{
              transform: refreshing ? undefined : `rotate(${Math.min(220, pullDistance * 3)}deg)`,
            }}
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${refreshing ? 56 : pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
