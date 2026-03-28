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

function readPlatformState(): PlatformState {
  if (typeof window === "undefined") {
    return { isMobile: false, isApp: false, isAndroid: false, isIOS: false };
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
  const [platform, setPlatform] = useState<PlatformState>(readPlatformState);

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
