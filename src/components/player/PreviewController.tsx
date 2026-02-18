'use client';

import { useRef, useEffect } from 'react';

interface PreviewControllerProps {
  previewSeconds: number;
  currentTime: number;
  isActive: boolean;
  onPreviewEnd: () => void;
}

export default function PreviewController({
  previewSeconds,
  currentTime,
  isActive,
  onPreviewEnd,
}: PreviewControllerProps) {
  const hasFiredRef = useRef(false);
  const onPreviewEndRef = useRef(onPreviewEnd);

  // Keep callback ref in sync
  useEffect(() => {
    onPreviewEndRef.current = onPreviewEnd;
  }, [onPreviewEnd]);

  // Reset trigger when isActive transitions to false
  useEffect(() => {
    if (!isActive) {
      hasFiredRef.current = false;
    }
  }, [isActive]);

  // Fire onPreviewEnd once when time exceeds preview limit
  useEffect(() => {
    if (isActive && !hasFiredRef.current && currentTime >= previewSeconds) {
      hasFiredRef.current = true;
      onPreviewEndRef.current();
    }
  }, [isActive, currentTime, previewSeconds]);

  // Countdown UI
  if (!isActive) return null;

  const remaining = Math.max(0, Math.ceil(previewSeconds - currentTime));

  if (remaining > 10 || remaining <= 0) return null;

  return (
    <div className="absolute right-4 top-4 z-40 animate-pulse rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
      Preview ends in {remaining}s
    </div>
  );
}
