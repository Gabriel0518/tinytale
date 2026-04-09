'use client';

import Image from 'next/image';
import { resolveSafeImageUrl } from '@/lib/safe-image';

type PlayLoadingShellProps = {
  title?: string | null;
  subtitle?: string | null;
  poster?: string | null;
  loadingLabel?: string | null;
};

export default function PlayLoadingShell({
  title,
  subtitle,
  poster,
  loadingLabel,
}: PlayLoadingShellProps) {
  const safePoster = resolveSafeImageUrl(poster || '');
  const hasPoster = Boolean(safePoster);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {hasPoster ? (
        <div className="absolute inset-0">
          <Image
            src={safePoster}
            alt={title || loadingLabel || 'Loading'}
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            priority
            unoptimized={safePoster.startsWith('blob:')}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,74,106,0.16),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.32),rgba(0,0,0,0.92)_74%)]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,74,106,0.12),transparent_30%),linear-gradient(180deg,#111218,#050506_78%)]" />
      )}

      <div className="relative z-10 flex h-full flex-col justify-between px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(0.85rem+env(safe-area-inset-top))]">
        <div className="h-8 w-20 animate-pulse rounded-full border border-white/10 bg-white/8" />

        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-[9/16] w-full max-w-[390px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.08)_18%,transparent_36%)] animate-[shimmer_1.6s_linear_infinite]" />
            <div className="absolute inset-x-6 bottom-8 space-y-3">
              <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="h-7 w-3/4 animate-pulse rounded-full bg-white/14" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
              <div className="mt-6 flex items-center gap-3">
                <div className="h-11 flex-1 animate-pulse rounded-[18px] bg-white/12" />
                <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[390px]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">
            {loadingLabel || 'Loading'}
          </p>
          <div className="mt-2 h-7 w-3/4 animate-pulse rounded-full bg-white/12" />
          {title ? <p className="mt-3 text-sm text-white/76">{title}</p> : null}
          {subtitle ? <p className="mt-1 text-xs text-white/44">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
