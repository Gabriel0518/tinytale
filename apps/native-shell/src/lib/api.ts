import {
  createApiClient,
  createCategoriesApi,
  createCoinsApi,
  createDramasApi,
  createEpisodesApi,
  createPasswordApi,
  createProfileApi,
  createReviewsApi,
  createSettingsApi,
  createSubscriptionApi,
  createUserApi,
} from '@api';
import type { SupportedLocale } from '@i18n';
import { nativeShellFetch } from './native-fetch';
import { getNativeShellApiBaseUrl } from './runtime-config';

export function createShellApi(locale: SupportedLocale) {
  const client = createApiClient(
    () => ({
      baseUrl: getNativeShellApiBaseUrl(),
      locale,
      platform: 'native-shell',
    }),
    nativeShellFetch
  );

  return {
    dramas: createDramasApi(client),
    categories: createCategoriesApi(client),
    coins: createCoinsApi(client),
    episodes: createEpisodesApi(client),
    password: createPasswordApi(client),
    profile: createProfileApi(client),
    reviews: createReviewsApi(client),
    settings: createSettingsApi(client),
    subscription: createSubscriptionApi(client),
    user: createUserApi(client),
  };
}

export { getNativeShellApiBaseUrl as getApiBaseUrl };
