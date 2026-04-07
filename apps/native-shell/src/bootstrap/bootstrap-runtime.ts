import { createBrowserKeyValueStore } from '@storage';
import { createRuntimeSettingsRepository } from '@runtime';

const repository = createRuntimeSettingsRepository({
  kvStore: createBrowserKeyValueStore('localStorage'),
});

export async function bootstrapRuntime() {
  return {
    runtimeSettings: repository.read(),
  };
}
