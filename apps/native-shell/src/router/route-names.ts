export const routeNames = {
  home: 'home',
  browse: 'browse',
  search: 'search',
  category: 'category',
  rankings: 'rankings',
  dramaDetail: 'dramaDetail',
  playEpisode: 'playEpisode',
  login: 'login',
  register: 'register',
  resetPassword: 'resetPassword',
  profile: 'profile',
} as const;

export type RouteName = (typeof routeNames)[keyof typeof routeNames];
