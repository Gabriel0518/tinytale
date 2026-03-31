'use client';

import { ReactNode, TouchEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnSwipe?: boolean;
  swipeThreshold?: number;
}

export function MobileBottomSheet({
  open,
  onClose,
  children,
  className,
  contentClassName,
  closeOnBackdrop = true,
  closeOnSwipe = true,
  swipeThreshold = 90,
}: MobileBottomSheetProps) {
  const touchStartYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const resetDrag = () => {
    setDragOffset(0);
    setIsDragging(false);
    touchStartYRef.current = null;
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!closeOnSwipe) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!closeOnSwipe) return;
    if (touchStartYRef.current === null) return;

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = Math.max(0, currentY - touchStartYRef.current);
    setDragOffset(deltaY);
  };

  const handleTouchEnd = () => {
    if (!closeOnSwipe) return;

    if (dragOffset >= swipeThreshold) {
      resetDrag();
      onClose();
      return;
    }

    resetDrag();
  };

  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-[80] flex items-end', className)}>
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/72"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div
        className={cn(
          'relative z-[1] flex w-full flex-col overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#0f1119] shadow-[0_-10px_24px_rgba(0,0,0,0.28)]',
          contentClassName
        )}
        style={{
          maxHeight: 'min(78dvh, calc(100dvh - env(safe-area-inset-top) - var(--tinytale-keyboard-inset, 0px) - 12px))',
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 160ms ease-out',
        }}
      >
        <div
          className="sticky top-0 z-10 flex justify-center bg-inherit px-4 pt-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="h-5 w-20 touch-pan-y"
          >
            <span className="mx-auto mt-1 block h-1.5 w-14 rounded-full bg-white/15" />
          </button>
        </div>
        <div className="keyboard-safe-scroll min-h-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom)+min(var(--tinytale-keyboard-inset),14rem))] pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
