"use client";

import { useEffect, useState } from "react";
import { getNativePlatform, isNativeApp } from "@/lib/capacitor-bridge";

const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

type PlatformState = {
  isMobile: boolean;
  isApp: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isReady: boolean;
};

const INITIAL_PLATFORM_STATE: PlatformState = {
  isMobile: false,
  isApp: false,
  isAndroid: false,
  isIOS: false,
  isReady: false,
};

let cachedClientPlatformState: PlatformState | null = null;
let canReuseCachedClientPlatformState = false;
let cacheReuseWarmupScheduled = false;

function readPlatformState(): PlatformState {
  if (typeof window === "undefined") {
    return INITIAL_PLATFORM_STATE;
  }

  const nativePlatform = getNativePlatform();
  const isApp = isNativeApp();
  const isMobileViewport = window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;

  return {
    isMobile: isApp || isMobileViewport,
    isApp,
    isAndroid: nativePlatform === "android",
    isIOS: nativePlatform === "ios",
    isReady: true,
  };
}

function readInitialPlatformState(): PlatformState {
  if (typeof window === "undefined") {
    return INITIAL_PLATFORM_STATE;
  }

  if (!canReuseCachedClientPlatformState) {
    return INITIAL_PLATFORM_STATE;
  }

  return cachedClientPlatformState || INITIAL_PLATFORM_STATE;
}

export function usePlatform() {
  // Keep hydration aligned with SSR. App Router can hydrate route boundaries after
  // parent effects have already populated the cache, so we only reuse cached
  // client platform state after the initial hydration window has passed.
  const [platform, setPlatform] = useState<PlatformState>(readInitialPlatformState);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updatePlatform = () => {
      const nextPlatform = readPlatformState();
      cachedClientPlatformState = nextPlatform;
      setPlatform(nextPlatform);
    };

    updatePlatform();

    if (!cacheReuseWarmupScheduled) {
      cacheReuseWarmupScheduled = true;
      window.setTimeout(() => {
        canReuseCachedClientPlatformState = true;
      }, 1500);
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePlatform);
      return () => mediaQuery.removeEventListener("change", updatePlatform);
    }

    mediaQuery.addListener(updatePlatform);
    return () => mediaQuery.removeListener(updatePlatform);
  }, []);

  return platform;
}
