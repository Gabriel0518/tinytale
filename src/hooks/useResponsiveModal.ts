"use client";

import { useEffect, useState } from "react";

const MOBILE_MODAL_QUERY = "(max-width: 767px)";

function readShouldUseMobileModal() {
  if (typeof window === "undefined") return false;

  const isNarrowViewport = window.matchMedia(MOBILE_MODAL_QUERY).matches;
  const capacitorRuntime = window.Capacitor;
  const isNativeApp = Boolean(capacitorRuntime?.isNativePlatform?.());

  return isNarrowViewport || isNativeApp;
}

export function useResponsiveModal() {
  const [isMobileModal, setIsMobileModal] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MODAL_QUERY);
    const update = () => setIsMobileModal(readShouldUseMobileModal());

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return isMobileModal;
}

