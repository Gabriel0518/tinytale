import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { routeBuilders } from './route-builders';
import { useNativeAuth } from '../providers/AuthProvider';

export function ProtectedRoutes() {
  const { user, loading } = useNativeAuth();
  const location = useLocation();

  if (loading) {
    return <div className="route-skeleton route-skeleton-centered">Restoring local session...</div>;
  }

  if (!user) {
    return <Navigate replace state={{ returnTo: location.pathname }} to={routeBuilders.login()} />;
  }

  return <Outlet />;
}
