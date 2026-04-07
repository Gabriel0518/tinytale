import type { KeyValueStore } from '@storage';
import type {
  NotificationRuntimeSettings,
  PlaybackRuntimeSettings,
  RuntimeSettingsSnapshot,
} from './model';
import { RUNTIME_SETTINGS_STORAGE_KEY } from './model';

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

export function createRuntimeSettingsRepository({
  kvStore,
  onChange,
}: {
  kvStore: KeyValueStore;
  onChange?: (snapshot: RuntimeSettingsSnapshot) => void;
}) {
  function read(): RuntimeSettingsSnapshot | null {
    const raw = kvStore.getItem(RUNTIME_SETTINGS_STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as unknown;
      return isObject(parsed) ? (parsed as RuntimeSettingsSnapshot) : null;
    } catch {
      kvStore.removeItem(RUNTIME_SETTINGS_STORAGE_KEY);
      return null;
    }
  }

  function write(snapshot: RuntimeSettingsSnapshot) {
    kvStore.setItem(RUNTIME_SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
    onChange?.(snapshot);
  }

  function merge(partial: RuntimeSettingsSnapshot) {
    const current = read() || {};
    const nextSnapshot: RuntimeSettingsSnapshot = {
      notifications: mergeNotifications(current.notifications, partial.notifications),
      playback: mergePlayback(current.playback, partial.playback),
    };

    write(nextSnapshot);
    return nextSnapshot;
  }

  function readPlayback() {
    return read()?.playback || null;
  }

  function updatePlayback(partial: Partial<PlaybackRuntimeSettings>) {
    return merge({
      playback: partial as PlaybackRuntimeSettings,
    });
  }

  return {
    read,
    write,
    merge,
    readPlayback,
    updatePlayback,
  };
}
