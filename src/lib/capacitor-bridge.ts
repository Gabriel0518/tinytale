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

export type KeyboardState = {
  visible: boolean;
  height: number;
};

const APP_LINK_HOSTS = new Set(["tinytale.top", "www.tinytale.top", "localhost", "10.0.2.2"]);
const CUSTOM_APP_SCHEME = "top.tinytale.app";
const DEV_NATIVE_PUSH_OVERRIDE = process.env.NEXT_PUBLIC_ENABLE_NATIVE_PUSH_DEV === "true";
const DEV_NATIVE_LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

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

function blurActiveTextInput() {
  if (typeof document === "undefined") return;

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement.isContentEditable
  ) {
    activeElement.blur();
  }
}

export const mobileFeatures = {
  hideCreatorPlatform: true,
  hideAffiliate: true,
  useBottomTabNav: true,
  enablePushNotifications:
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === "true",
  enableNativeShare: true,
  enableHaptics: true,
  enableKeepAwake: true,
  enableOrientationLock: true,
};

let nativeKeepAwakeEnabled = false;
let nativeSplashHidden = false;

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

export async function setNativeKeepAwake(enabled: boolean) {
  if (!isNativeApp() || !mobileFeatures.enableKeepAwake) return;

  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    if (enabled) {
      if (nativeKeepAwakeEnabled) return;
      await KeepAwake.keepAwake();
      nativeKeepAwakeEnabled = true;
      return;
    }

    if (!nativeKeepAwakeEnabled) return;
    await KeepAwake.allowSleep();
    nativeKeepAwakeEnabled = false;
  } catch {
    // Keep-awake is optional and should silently fall back on unsupported runtimes.
  }
}

export async function lockNativeScreenOrientation(
  orientation: "portrait" | "portrait-primary" | "portrait-secondary" | "landscape" = "portrait"
) {
  if (!isNativeApp() || !mobileFeatures.enableOrientationLock) return;

  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation });
  } catch {
    // Orientation lock is best-effort for mobile webviews.
  }
}

export async function unlockNativeScreenOrientation() {
  if (!isNativeApp() || !mobileFeatures.enableOrientationLock) return;

  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.unlock();
  } catch {
    // Ignore unlock failures outside supported runtimes.
  }
}

export async function syncNativeStatusBar(pathname: string) {
  if (!isNativeApp()) return;
  void pathname;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#141414" });
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.hide();
  } catch {
    // Ignore native chrome sync failures outside supported platforms.
  }
}

export async function hideNativeSplashScreen() {
  if (!isNativeApp() || nativeSplashHidden) return;

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
    nativeSplashHidden = true;
  } catch {
    // Ignore splash hide failures outside supported runtimes.
  }
}

export async function exitNativeApp() {
  if (!isAndroidApp()) return;

  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    // Ignore exit failures during web fallback.
  }
}

export async function dismissActiveKeyboard(waitMs = 0) {
  blurActiveTextInput();

  if (isNativeApp()) {
    try {
      const { Keyboard } = await import("@capacitor/keyboard");
      await Keyboard.hide();
    } catch {
      // Keyboard hide is best-effort on native runtimes.
    }
  }

  if (waitMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  }
}

export function observeNetworkStatus(onChange: (status: NetworkStatus) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const emitStatus = (status: NetworkStatus) => {
    const isLocalNativeDev =
      process.env.NODE_ENV !== "production" &&
      isNativeApp() &&
      DEV_NATIVE_LOCAL_HOSTS.has(window.location.hostname);

    if (isLocalNativeDev && !status.connected) {
      onChange({
        connected: true,
        connectionType: status.connectionType || "local-dev",
      });
      return;
    }

    onChange(status);
  };

  if (isNativeApp()) {
    let handle: ListenerHandle | null = null;
    let cancelled = false;

    void import("@capacitor/network").then(async ({ Network }) => {
      if (cancelled) return;
      const status = await Network.getStatus();
      emitStatus(status);
      handle = await Network.addListener("networkStatusChange", emitStatus);
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

export function observeKeyboardState(onChange: (state: KeyboardState) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (isNativeApp()) {
    let showHandle: ListenerHandle | null = null;
    let hideHandle: ListenerHandle | null = null;
    let cancelled = false;

    void import("@capacitor/keyboard").then(async ({ Keyboard }) => {
      if (cancelled) return;
      showHandle = await Keyboard.addListener("keyboardDidShow", (event?: { keyboardHeight?: number }) =>
        onChange({
          visible: true,
          height: Math.max(0, Math.round(event?.keyboardHeight ?? 0)),
        })
      );
      hideHandle = await Keyboard.addListener("keyboardDidHide", () =>
        onChange({
          visible: false,
          height: 0,
        })
      );
    });

    return () => {
      cancelled = true;
      void showHandle?.remove?.();
      void hideHandle?.remove?.();
    };
  }

  const viewport = window.visualViewport;
  if (!viewport) {
    onChange({ visible: false, height: 0 });
    return () => undefined;
  }

  let baselineHeight = Math.max(window.innerHeight, viewport.height);
  let lastState: KeyboardState = { visible: false, height: 0 };

  const emitState = () => {
    const currentHeight = Math.max(0, Math.round(viewport.height));
    const nextHeight = Math.max(0, Math.round(baselineHeight - currentHeight));
    const nextVisible = nextHeight > 120;

    if (!nextVisible) {
      baselineHeight = Math.max(baselineHeight, Math.max(window.innerHeight, currentHeight));
    }

    const nextState = {
      visible: nextVisible,
      height: nextVisible ? nextHeight : 0,
    };

    if (nextState.visible === lastState.visible && nextState.height === lastState.height) {
      return;
    }

    lastState = nextState;
    onChange(nextState);
  };

  emitState();

  viewport.addEventListener("resize", emitState);
  viewport.addEventListener("scroll", emitState);

  return () => {
    viewport.removeEventListener("resize", emitState);
    viewport.removeEventListener("scroll", emitState);
  };
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

  // FCM registration is noisy and unreliable on local Android emulator sessions.
  // Keep the app startup stable by skipping it unless explicitly re-enabled for dev debugging.
  if (process.env.NODE_ENV !== "production" && isAndroidApp() && !DEV_NATIVE_PUSH_OVERRIDE) {
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
