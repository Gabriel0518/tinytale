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
