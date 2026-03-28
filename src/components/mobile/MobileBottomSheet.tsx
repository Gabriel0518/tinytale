'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
}

export function MobileBottomSheet({
  open,
  onClose,
  children,
  className,
  contentClassName,
  closeOnBackdrop = true,
}: MobileBottomSheetProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-[80] flex items-end', className)}>
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div
        className={cn(
          'relative z-[1] max-h-[78dvh] w-full overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#0f1119]/96 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl',
          contentClassName
        )}
      >
        <div className="sticky top-0 z-10 flex justify-center bg-inherit px-4 pt-3">
          <div className="h-1.5 w-14 rounded-full bg-white/15" />
        </div>
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
