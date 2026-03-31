"use client";

import { useEffect, useState } from "react";
import { getNativePlatform, isNativeApp } from "@/lib/capacitor-bridge";

const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

type PlatformState = {
  isMobile: boolean;
  isApp: boolean;
  isAndroid: boolean;
  isIOS: boolean;
};

const INITIAL_PLATFORM_STATE: PlatformState = {
  isMobile: false,
  isApp: false,
  isAndroid: false,
  isIOS: false,
};

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
  };
}

export function usePlatform() {
  // Keep the first client render aligned with SSR, then promote to the real runtime state.
  const [platform, setPlatform] = useState<PlatformState>(INITIAL_PLATFORM_STATE);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updatePlatform = () => setPlatform(readPlatformState());

    updatePlatform();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePlatform);
      return () => mediaQuery.removeEventListener("change", updatePlatform);
    }

    mediaQuery.addListener(updatePlatform);
    return () => mediaQuery.removeListener(updatePlatform);
  }, []);

  return platform;
}
