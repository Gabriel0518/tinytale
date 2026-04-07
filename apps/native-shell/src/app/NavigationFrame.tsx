import { useEffect } from 'react';
import { Bookmark, ChevronLeft, Compass, Home, PlayCircle, Search, User } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useNativeAuth } from '../providers/AuthProvider';
import { routeBuilders } from '../router/route-builders';

const tabs = [
  { key: 'home', label: 'Home', to: routeBuilders.home(), icon: Home },
  { key: 'browse', label: 'Browse', to: routeBuilders.browse(), icon: Compass },
  { key: 'play', label: 'Play', to: routeBuilders.play(), icon: PlayCircle },
  { key: 'watchlist', label: 'Watch list', to: routeBuilders.favorites(), icon: Bookmark },
  { key: 'profile', label: 'Profile', to: routeBuilders.profile(), icon: User },
];

export function NavigationFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOffline } = useNetworkStatus();
  const { user } = useNativeAuth();
  const pathname = location.pathname;
  const showTabbar = !pathname.startsWith('/auth') && !pathname.startsWith('/play/');
  const primaryHeaderRoutes = new Set([
    routeBuilders.home(),
    routeBuilders.browse(),
    routeBuilders.play(),
    routeBuilders.favorites(),
    routeBuilders.profile(),
  ]);
  const usePrimaryHeader = primaryHeaderRoutes.has(pathname);
  const headerTitle =
    pathname === routeBuilders.search()
      ? 'Search'
      : pathname.startsWith('/category/')
        ? 'Category'
        : pathname === routeBuilders.rankings()
          ? 'Rankings'
          : pathname.startsWith('/drama/')
            ? 'Drama'
            : pathname.startsWith('/play/')
              ? 'Playback'
              : pathname === routeBuilders.favorites()
                ? 'Watch list'
                : pathname === routeBuilders.profile()
                  ? 'Profile'
              : pathname === routeBuilders.notifications()
                ? 'Notifications'
                : pathname === routeBuilders.history()
                  ? 'History'
                  : pathname === routeBuilders.purchases()
                    ? 'Purchases'
                    : pathname === routeBuilders.settings()
                      ? 'Settings'
                      : pathname === routeBuilders.coins()
                        ? 'Coins'
                        : pathname === routeBuilders.subscription()
                          ? 'Subscription'
                          : pathname === routeBuilders.login()
                            ? 'Sign In'
                            : pathname === routeBuilders.register()
                              ? 'Create Account'
                              : pathname === routeBuilders.resetPassword()
                                ? 'Reset Password'
                                : pathname.startsWith('/auth/reset-password/verify')
                                  ? 'Set Password'
                                  : 'TinyTale';

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routeBuilders.home());
  }

  function resolveActiveTab() {
    if (pathname === routeBuilders.home()) return 'home';
    if (
      pathname === routeBuilders.browse() ||
      pathname === routeBuilders.search() ||
      pathname.startsWith('/category/') ||
      pathname === routeBuilders.rankings() ||
      pathname.startsWith('/drama/')
    ) {
      return 'browse';
    }
    if (pathname === routeBuilders.play() || pathname.startsWith('/play/')) return 'play';
    if (pathname.startsWith(routeBuilders.favorites())) return 'watchlist';
    if (pathname.startsWith('/user/')) return 'profile';
    return '';
  }

  const activeTab = resolveActiveTab();

  useEffect(() => {
    document.body.classList.toggle('has-bottom-bar', showTabbar);
    return () => document.body.classList.remove('has-bottom-bar');
  }, [showTabbar]);

  return (
    <div className={`shell-root ${usePrimaryHeader ? 'shell-root-brand-search' : 'shell-root-default'}`}>
      <header className="app-header">
        {usePrimaryHeader ? (
          <div className="app-header-row">
            <button className="app-search-trigger" onClick={() => navigate(routeBuilders.search())} type="button">
              <Search className="app-search-icon" size={16} />
              <span>Search dramas, genres, actors...</span>
            </button>

            <Link className="app-wallet-card" to={user ? routeBuilders.coins() : routeBuilders.login()}>
              <span className="app-wallet-badge">$</span>
              <span className="app-wallet-value">{Number(user?.coins || 0).toFixed(0)}</span>
            </Link>
          </div>
        ) : (
          <div className="app-header-row app-header-row-compact">
            <button className="app-back-button" onClick={handleBack} type="button">
              <ChevronLeft size={18} />
            </button>
            <div className="app-header-title-block">
              <p className="app-kicker">TinyTale</p>
              <h1 className="app-page-title">{headerTitle}</h1>
            </div>
            <Link className="app-wallet-card app-wallet-card-compact" to={user ? routeBuilders.coins() : routeBuilders.login()}>
              <span className="app-wallet-badge">$</span>
              <span className="app-wallet-value">{Number(user?.coins || 0).toFixed(0)}</span>
            </Link>
          </div>
        )}
      </header>

      <OfflineBanner visible={isOffline} />

      <main className="shell-main">
        <Outlet />
      </main>

      {showTabbar ? (
        <div className="shell-tabbar-wrap">
          <nav className="shell-tabbar mobile-bottom-tab" aria-label="Primary">
            <div className="shell-tabbar-grid">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <Link
                    key={tab.key}
                    className={`shell-tab ${isActive ? 'shell-tab-active' : ''}`}
                    to={tab.to}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive ? <span className="shell-tab-glow" /> : null}
                    <div className={`shell-tab-icon-wrap ${isActive ? 'shell-tab-icon-wrap-active' : ''}`}>
                      <Icon className="shell-tab-icon" size={27} strokeWidth={2.1} />
                    </div>
                    <span className="sr-only">{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
