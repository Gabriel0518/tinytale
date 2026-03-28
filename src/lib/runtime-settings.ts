export type NotificationRuntimeSettings = {
  push: {
    enabled: boolean;
    newReleases: boolean;
    recommendations: boolean;
    accountActivity: boolean;
    deviceToken?: string;
    platform?: string;
    lastRegisteredAt?: string;
  };
  email: {
    newsletter: boolean;
    promoOffers: boolean;
    weeklyDigests: boolean;
  };
  inApp: {
    systemMessages: boolean;
  };
};

export type PlaybackRuntimeSettings = {
  autoplayNextEpisode: boolean;
  videoQuality: string;
  audioLanguage: string;
  subtitleLanguage: string;
  dataSaver: boolean;
};

export type RuntimeSettingsSnapshot = {
  notifications?: NotificationRuntimeSettings;
  playback?: PlaybackRuntimeSettings;
};

export const RUNTIME_SETTINGS_STORAGE_KEY = 'tinytale:runtime-settings';
export const RUNTIME_SETTINGS_EVENT = 'tinytale:runtime-settings-updated';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeNotifications(
  current: NotificationRuntimeSettings | undefined,
  next: NotificationRuntimeSettings | undefined
): NotificationRuntimeSettings | undefined {
  if (!current && !next) return undefined;

  return {
    push: {
      enabled: next?.push.enabled ?? current?.push.enabled ?? true,
      newReleases: next?.push.newReleases ?? current?.push.newReleases ?? true,
      recommendations: next?.push.recommendations ?? current?.push.recommendations ?? true,
      accountActivity: next?.push.accountActivity ?? current?.push.accountActivity ?? true,
      deviceToken: next?.push.deviceToken ?? current?.push.deviceToken,
      platform: next?.push.platform ?? current?.push.platform,
      lastRegisteredAt: next?.push.lastRegisteredAt ?? current?.push.lastRegisteredAt,
    },
    email: {
      newsletter: next?.email.newsletter ?? current?.email.newsletter ?? false,
      promoOffers: next?.email.promoOffers ?? current?.email.promoOffers ?? true,
      weeklyDigests: next?.email.weeklyDigests ?? current?.email.weeklyDigests ?? false,
    },
    inApp: {
      systemMessages: next?.inApp.systemMessages ?? current?.inApp.systemMessages ?? true,
    },
  };
}

function mergePlayback(
  current: PlaybackRuntimeSettings | undefined,
  next: PlaybackRuntimeSettings | undefined
): PlaybackRuntimeSettings | undefined {
  if (!current && !next) return undefined;

  return {
    autoplayNextEpisode: next?.autoplayNextEpisode ?? current?.autoplayNextEpisode ?? true,
    videoQuality: next?.videoQuality ?? current?.videoQuality ?? 'auto',
    audioLanguage: next?.audioLanguage ?? current?.audioLanguage ?? 'en',
    subtitleLanguage: next?.subtitleLanguage ?? current?.subtitleLanguage ?? 'en',
    dataSaver: next?.dataSaver ?? current?.dataSaver ?? false,
  };
}

export function readRuntimeSettings(): RuntimeSettingsSnapshot | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(RUNTIME_SETTINGS_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isObject(parsed) ? (parsed as RuntimeSettingsSnapshot) : null;
  } catch {
    window.localStorage.removeItem(RUNTIME_SETTINGS_STORAGE_KEY);
    return null;
  }
}

export function writeRuntimeSettings(snapshot: RuntimeSettingsSnapshot) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(RUNTIME_SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent(RUNTIME_SETTINGS_EVENT, { detail: snapshot }));
}

export function mergeRuntimeSettings(partial: RuntimeSettingsSnapshot) {
  const current = readRuntimeSettings() || {};
  const nextSnapshot: RuntimeSettingsSnapshot = {
    notifications: mergeNotifications(current.notifications, partial.notifications),
    playback: mergePlayback(current.playback, partial.playback),
  };

  writeRuntimeSettings(nextSnapshot);
  return nextSnapshot;
}
