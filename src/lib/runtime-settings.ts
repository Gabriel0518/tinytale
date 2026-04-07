import {
  RUNTIME_SETTINGS_EVENT,
  RUNTIME_SETTINGS_STORAGE_KEY,
  createRuntimeSettingsRepository,
  type NotificationRuntimeSettings,
  type PlaybackRuntimeSettings,
  type RuntimeSettingsSnapshot,
} from '@runtime';
import { createBrowserKeyValueStore } from '@storage';

export {
  RUNTIME_SETTINGS_EVENT,
  RUNTIME_SETTINGS_STORAGE_KEY,
};
export type {
  NotificationRuntimeSettings,
  PlaybackRuntimeSettings,
  RuntimeSettingsSnapshot,
};

const repository = createRuntimeSettingsRepository({
  kvStore: createBrowserKeyValueStore('localStorage'),
  onChange: (snapshot) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(RUNTIME_SETTINGS_EVENT, { detail: snapshot }));
  },
});

export const readRuntimeSettings = () => repository.read();
export const writeRuntimeSettings = (snapshot: RuntimeSettingsSnapshot) => repository.write(snapshot);
export const mergeRuntimeSettings = (partial: RuntimeSettingsSnapshot) => repository.merge(partial);
export const readPlaybackRuntimeSettings = () => repository.readPlayback();
export const updatePlaybackRuntimeSettings = (partial: Partial<PlaybackRuntimeSettings>) =>
  repository.updatePlayback(partial);
