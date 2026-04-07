import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, loading, user } = useNativeAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const returnTo = useMemo(() => {
    const stateReturnTo =
      location.state && typeof location.state === 'object' && 'returnTo' in location.state
        ? String(location.state.returnTo || '')
        : '';
    return stateReturnTo || searchParams.get('redirect') || routeBuilders.profile();
  }, [location.state, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email.trim().toLowerCase(), password);
      navigate(returnTo, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo, { replace: true });
    }
  }, [loading, navigate, returnTo, user]);

  return (
    <section className="app-hero-card auth-card">
      <p className="app-kicker">Sign in</p>
      <h2 className="app-hero-title">Welcome back</h2>
      <p className="app-hero-subtitle">Sign in and return straight to the page you were trying to open.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="shell-input-block">
          <span className="shell-input-label">Email</span>
          <input
            autoComplete="email"
            className="shell-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Password</span>
          <input
            autoComplete="current-password"
            className="shell-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}
        {searchParams.get('reset') === 'success' ? (
          <div className="auth-success">Password updated. Sign in with your new credentials.</div>
        ) : null}

        <button className="app-primary-button shell-button-reset auth-submit" disabled={submitting} type="submit">
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-link-row">
        <Link className="app-secondary-button" to={routeBuilders.register()}>
          Create Account
        </Link>
        <Link className="app-secondary-button" to={routeBuilders.resetPassword()}>
          Forgot Password
        </Link>
      </div>
    </section>
  );
}
