type NativePlatform = "web" | "android" | "ios";
type NetworkStatus = {
  connected: boolean;
  connectionType?: string;
};

type ListenerHandle = {
  remove: () => Promise<void> | void;
};

type PushRegistrationResult = {
  token?: string;
  remove: () => void;
};

const APP_LINK_HOSTS = new Set(["tinytale.top", "www.tinytale.top", "localhost", "10.0.2.2"]);
const CUSTOM_APP_SCHEME = "top.tinytale.app";

interface CapacitorRuntime {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
}

declare global {
  interface Window {
    Capacitor?: CapacitorRuntime;
  }
}

function getCapacitorRuntime(): CapacitorRuntime | null {
  if (typeof window === "undefined") return null;
  return window.Capacitor ?? null;
}

export function getNativePlatform(): NativePlatform {
  const runtime = getCapacitorRuntime();
  const platform = runtime?.getPlatform?.();

  if (platform === "android" || platform === "ios") {
    return platform;
  }

  if (runtime?.isNativePlatform?.()) {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android";
  }

  return "web";
}

export function isNativeApp() {
  return getNativePlatform() !== "web";
}

export function isAndroidApp() {
  return getNativePlatform() === "android";
}

export function isIOSApp() {
  return getNativePlatform() === "ios";
}

export const mobileFeatures = {
  hideCreatorPlatform: true,
  hideAffiliate: true,
  useBottomTabNav: true,
  enablePushNotifications: true,
  enableNativeShare: true,
  enableHaptics: true,
};

export async function shareContent(payload: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}) {
  if (isNativeApp()) {
    const { Share } = await import("@capacitor/share");
    await Share.share(payload);
    return true;
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share(payload);
    return true;
  }

  return false;
}

export async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") return;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function triggerHaptic(
  style: "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error" = "light"
) {
  if (!isNativeApp()) return;

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");

    if (style === "selection") {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
      return;
    }

    if (style === "success" || style === "warning" || style === "error") {
      await Haptics.notification({
        type:
          style === "success"
            ? NotificationType.Success
            : style === "warning"
              ? NotificationType.Warning
              : NotificationType.Error,
      });
      return;
    }

    await Haptics.impact({
      style:
        style === "light"
          ? ImpactStyle.Light
          : style === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Heavy,
    });
  } catch {
    // Haptics are optional on unsupported runtimes.
  }
}

export async function syncNativeStatusBar(pathname: string) {
  if (!isNativeApp()) return;

  try {
    const normalizedPath = pathname || "/";
    const isImmersivePlayer = normalizedPath.includes("/play/");
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    if (isImmersivePlayer) {
      await StatusBar.hide();
      await StatusBar.setOverlaysWebView({ overlay: true });
      return;
    }

    await StatusBar.show();
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#141414" });
  } catch {
    // Ignore native chrome sync failures outside supported platforms.
  }
}

export function observeNetworkStatus(onChange: (status: NetworkStatus) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (isNativeApp()) {
    let handle: ListenerHandle | null = null;
    let cancelled = false;

    void import("@capacitor/network").then(async ({ Network }) => {
      if (cancelled) return;
      const status = await Network.getStatus();
      onChange(status);
      handle = await Network.addListener("networkStatusChange", onChange);
    });

    return () => {
      cancelled = true;
      void handle?.remove?.();
    };
  }

  const emitOnline = () => onChange({ connected: true, connectionType: "web" });
  const emitOffline = () => onChange({ connected: false, connectionType: "none" });

  onChange({
    connected: typeof navigator === "undefined" ? true : navigator.onLine,
    connectionType: "web",
  });
  window.addEventListener("online", emitOnline);
  window.addEventListener("offline", emitOffline);

  return () => {
    window.removeEventListener("online", emitOnline);
    window.removeEventListener("offline", emitOffline);
  };
}

export function observeKeyboardState(onChange: (visible: boolean) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (isNativeApp()) {
    let showHandle: ListenerHandle | null = null;
    let hideHandle: ListenerHandle | null = null;
    let cancelled = false;

    void import("@capacitor/keyboard").then(async ({ Keyboard }) => {
      if (cancelled) return;
      showHandle = await Keyboard.addListener("keyboardDidShow", () => onChange(true));
      hideHandle = await Keyboard.addListener("keyboardDidHide", () => onChange(false));
    });

    return () => {
      cancelled = true;
      void showHandle?.remove?.();
      void hideHandle?.remove?.();
    };
  }

  const viewport = window.visualViewport;
  if (!viewport) return () => undefined;

  const initialHeight = viewport.height;
  const handleResize = () => onChange(initialHeight - viewport.height > 120);

  viewport.addEventListener("resize", handleResize);
  return () => viewport.removeEventListener("resize", handleResize);
}

export function observeAppState(onChange: (isActive: boolean) => void) {
  if (!isNativeApp()) {
    return () => undefined;
  }

  let handle: ListenerHandle | null = null;
  let cancelled = false;

  void import("@capacitor/app").then(async ({ App }) => {
    if (cancelled) return;
    handle = await App.addListener("appStateChange", ({ isActive }) => onChange(Boolean(isActive)));
  });

  return () => {
    cancelled = true;
    void handle?.remove?.();
  };
}

export function resolveNativeAppUrl(url: string) {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "");

    if (scheme === CUSTOM_APP_SCHEME) {
      const pathParts = [parsed.hostname, parsed.pathname.replace(/^\/+/, "")]
        .filter(Boolean)
        .join("/");
      return `/${pathParts}${parsed.search}${parsed.hash}`.replace(/\/{2,}/g, "/");
    }

    if ((scheme === "https" || scheme === "http") && APP_LINK_HOSTS.has(parsed.hostname)) {
      return `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Ignore malformed incoming URLs from native wrappers.
  }

  return null;
}

export function observeAppUrlOpen(onOpen: (path: string) => void) {
  if (!isNativeApp()) {
    return () => undefined;
  }

  let handle: ListenerHandle | null = null;
  let cancelled = false;

  void import("@capacitor/app").then(async ({ App }) => {
    if (cancelled) return;

    const launchUrl = await App.getLaunchUrl();
    const initialPath = launchUrl?.url ? resolveNativeAppUrl(launchUrl.url) : null;
    if (!cancelled && initialPath) {
      onOpen(initialPath);
    }

    handle = await App.addListener("appUrlOpen", (event: { url?: string }) => {
      const nextPath = event?.url ? resolveNativeAppUrl(event.url) : null;
      if (nextPath) {
        onOpen(nextPath);
      }
    });
  });

  return () => {
    cancelled = true;
    void handle?.remove?.();
  };
}

export function observeBackButton(onBack: (canGoBack: boolean) => void) {
  if (!isAndroidApp()) {
    return () => undefined;
  }

  let handle: ListenerHandle | null = null;
  let cancelled = false;

  void import("@capacitor/app").then(async ({ App }) => {
    if (cancelled) return;
    handle = await App.addListener("backButton", (event: { canGoBack: boolean }) => {
      onBack(Boolean(event?.canGoBack));
    });
  });

  return () => {
    cancelled = true;
    void handle?.remove?.();
  };
}

export async function registerPushNotifications(onNotificationRoute?: (notification: any) => void): Promise<PushRegistrationResult> {
  if (!isNativeApp() || !mobileFeatures.enablePushNotifications) {
    return {
      remove: () => undefined,
    };
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      return {
        remove: () => undefined,
      };
    }

    let latestToken = "";
    const listeners: ListenerHandle[] = [];

    listeners.push(await PushNotifications.addListener("registration", (token: { value: string }) => {
      latestToken = token.value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tinytale:push-token", token.value);
        window.dispatchEvent(new CustomEvent("tinytale:push-token", { detail: token.value }));
      }
    }));

    listeners.push(await PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tinytale:push-notification-received", { detail: notification }));
      }
    }));

    listeners.push(await PushNotifications.addListener("pushNotificationActionPerformed", (notification: any) => {
      onNotificationRoute?.(notification);
    }));

    await PushNotifications.register();

    return {
      token: latestToken,
      remove: () => {
        listeners.forEach((listener) => {
          void listener.remove?.();
        });
      },
    };
  } catch {
    return {
      remove: () => undefined,
    };
  }
}
