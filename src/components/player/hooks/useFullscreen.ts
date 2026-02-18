'use client';

import { useCallback, useEffect, useState, RefObject } from 'react';

interface FullscreenAPI {
  requestFullscreen: string;
  exitFullscreen: string;
  fullscreenElement: string;
  fullscreenchange: string;
}

function getFullscreenAPI(): FullscreenAPI | null {
  const doc = document as unknown as Record<string, unknown>;

  if (typeof doc.fullscreenEnabled !== 'undefined') {
    return {
      requestFullscreen: 'requestFullscreen',
      exitFullscreen: 'exitFullscreen',
      fullscreenElement: 'fullscreenElement',
      fullscreenchange: 'fullscreenchange',
    };
  }

  if (typeof doc.webkitFullscreenEnabled !== 'undefined') {
    return {
      requestFullscreen: 'webkitRequestFullscreen',
      exitFullscreen: 'webkitExitFullscreen',
      fullscreenElement: 'webkitFullscreenElement',
      fullscreenchange: 'webkitfullscreenchange',
    };
  }

  return null;
}

export function useFullscreen(containerRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const api = getFullscreenAPI();
    const container = containerRef.current;
    if (!api || !container) return;

    try {
      const doc = document as unknown as Record<string, unknown>;
      if (doc[api.fullscreenElement]) {
        await (document as unknown as Record<string, () => Promise<void>>)[api.exitFullscreen]();
      } else {
        await (container as unknown as Record<string, () => Promise<void>>)[api.requestFullscreen]();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, [containerRef]);

  useEffect(() => {
    const api = getFullscreenAPI();
    if (!api) return;

    const handleChange = () => {
      const doc = document as unknown as Record<string, unknown>;
      setIsFullscreen(!!doc[api.fullscreenElement]);
    };

    document.addEventListener(api.fullscreenchange, handleChange);
    return () => document.removeEventListener(api.fullscreenchange, handleChange);
  }, []);

  return { isFullscreen, toggleFullscreen };
}
