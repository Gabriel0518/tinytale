import { createHashRouter } from 'react-router-dom';
import { NavigationFrame } from '../app/NavigationFrame';
import { ProtectedRoutes } from './protected-routes';
import { routeBuilders } from './route-builders';
import { BrowseScreen } from '../screens/core/BrowseScreen';
import { CategoryScreen } from '../screens/core/CategoryScreen';
import { DramaDetailScreen } from '../screens/core/DramaDetailScreen';
import { HomeScreen } from '../screens/core/HomeScreen';
import { PlayScreen } from '../screens/core/PlayScreen';
import { PlaybackScreen } from '../screens/core/PlaybackScreen';
import { RankingsScreen } from '../screens/core/RankingsScreen';
import { SearchScreen } from '../screens/core/SearchScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ResetVerifyScreen } from '../screens/auth/ResetVerifyScreen';
import { CoinsScreen } from '../screens/user/CoinsScreen';
import { FavoritesScreen } from '../screens/user/FavoritesScreen';
import { HistoryScreen } from '../screens/user/HistoryScreen';
import { NotificationsScreen } from '../screens/user/NotificationsScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { PurchasesScreen } from '../screens/user/PurchasesScreen';
import { SettingsScreen } from '../screens/user/SettingsScreen';
import { SubscriptionScreen } from '../screens/user/SubscriptionScreen';

export function createAppRouter() {
  return createHashRouter([
    {
      path: '/',
      element: <NavigationFrame />,
      children: [
        { index: true, element: <HomeScreen /> },
        { path: 'browse', element: <BrowseScreen /> },
        { path: 'play', element: <PlayScreen /> },
        { path: 'search', element: <SearchScreen /> },
        { path: 'category/:categoryId', element: <CategoryScreen /> },
        { path: 'rankings', element: <RankingsScreen /> },
        { path: 'drama/:dramaId', element: <DramaDetailScreen /> },
        { path: 'play/:dramaId/:episodeId', element: <PlaybackScreen /> },
        { path: 'auth/login', element: <LoginScreen /> },
        { path: 'auth/register', element: <RegisterScreen /> },
        { path: 'auth/reset-password', element: <ForgotPasswordScreen /> },
        { path: 'auth/reset-password/verify', element: <ResetVerifyScreen /> },
        {
          element: <ProtectedRoutes />,
          children: [
            { path: 'user/profile', element: <ProfileScreen /> },
            { path: 'user/favorites', element: <FavoritesScreen /> },
            { path: 'user/history', element: <HistoryScreen /> },
            { path: 'user/notifications', element: <NotificationsScreen /> },
            { path: 'user/purchases', element: <PurchasesScreen /> },
            { path: 'user/settings', element: <SettingsScreen /> },
            { path: 'user/coins', element: <CoinsScreen /> },
            { path: 'user/subscription', element: <SubscriptionScreen /> },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <NavigationFrame />,
      children: [{ index: true, element: <HomeScreen /> }],
    },
  ]);
}

export const appRouteSamples = {
  home: routeBuilders.home(),
  browse: routeBuilders.browse(),
  play: routeBuilders.play(),
  search: routeBuilders.search(),
  rankings: routeBuilders.rankings(),
};
