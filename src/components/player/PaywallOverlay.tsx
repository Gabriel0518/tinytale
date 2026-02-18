'use client';

import { useCallback } from 'react';

interface PaywallOverlayProps {
  episodeTitle: string;
  episodeNumber: number;
  priceCoins: number;
  userCoins: number;
  onUnlock: () => void;
  onGetCoins: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function PaywallOverlay({
  episodeTitle,
  episodeNumber,
  priceCoins,
  userCoins,
  onUnlock,
  onGetCoins,
  onClose,
  isLoading = false,
}: PaywallOverlayProps) {
  const canAfford = userCoins >= priceCoins;

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close paywall"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Card */}
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl">
        {/* Lock icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-amber-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 id="paywall-title" className="mb-1 text-lg font-semibold text-white">
          Premium Content
        </h2>

        <p className="mb-4 text-sm text-zinc-400">
          Episode {episodeNumber}: {episodeTitle}
        </p>

        {/* Price */}
        <div className="mb-1 text-2xl font-bold text-amber-400">
          {priceCoins} coins
        </div>

        <p className="mb-6 text-xs text-zinc-500">
          Your balance: {userCoins} coins
        </p>

        {/* Action button */}
        {canAfford ? (
          <button
            type="button"
            onClick={onUnlock}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Unlocking…
              </>
            ) : (
              'Unlock Now'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onGetCoins}
            className="inline-flex w-full items-center justify-center rounded-lg border border-amber-500/50 px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
          >
            Get More Coins
          </button>
        )}
      </div>
    </div>
  );
}