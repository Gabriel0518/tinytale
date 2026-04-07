import { localizePath, type SupportedLocale } from '@i18n';

function withLocale(pathname: string, locale?: SupportedLocale) {
  return locale ? localizePath(pathname, locale) : pathname;
}

export const routeBuilders = {
  home: (locale?: SupportedLocale) => withLocale('/', locale),
  browse: (locale?: SupportedLocale) => withLocale('/browse', locale),
  play: (locale?: SupportedLocale) => withLocale('/play', locale),
  search: (locale?: SupportedLocale) => withLocale('/search', locale),
  category: (id = 'featured', locale?: SupportedLocale) => withLocale(`/category/${id}`, locale),
  rankings: (locale?: SupportedLocale) => withLocale('/rankings', locale),
  dramaDetail: (dramaId = 'demo-drama', locale?: SupportedLocale) => withLocale(`/drama/${dramaId}`, locale),
  playEpisode: (dramaId = 'demo-drama', episodeId = 'demo-episode', locale?: SupportedLocale) =>
    withLocale(`/play/${dramaId}/${episodeId}`, locale),
  login: (locale?: SupportedLocale) => withLocale('/auth/login', locale),
  register: (locale?: SupportedLocale) => withLocale('/auth/register', locale),
  resetPassword: (locale?: SupportedLocale) => withLocale('/auth/reset-password', locale),
  resetPasswordVerify: (locale?: SupportedLocale, email?: string) =>
    withLocale(`/auth/reset-password/verify${email ? `?email=${encodeURIComponent(email)}` : ''}`, locale),
  profile: (locale?: SupportedLocale) => withLocale('/user/profile', locale),
  favorites: (locale?: SupportedLocale) => withLocale('/user/favorites', locale),
  history: (locale?: SupportedLocale) => withLocale('/user/history', locale),
  notifications: (locale?: SupportedLocale) => withLocale('/user/notifications', locale),
  purchases: (locale?: SupportedLocale) => withLocale('/user/purchases', locale),
  settings: (locale?: SupportedLocale) => withLocale('/user/settings', locale),
  coins: (locale?: SupportedLocale) => withLocale('/user/coins', locale),
  subscription: (locale?: SupportedLocale) => withLocale('/user/subscription', locale),
};
