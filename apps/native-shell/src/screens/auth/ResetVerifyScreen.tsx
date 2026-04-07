import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useShellApi } from '../../hooks/useShellApi';
import { routeBuilders } from '../../router/route-builders';

export function ResetVerifyScreen() {
  const navigate = useNavigate();
  const api = useShellApi();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const savedCode = useMemo(() => window.sessionStorage.getItem('tinytale.native.reset-code') || '', []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !savedCode) {
      setError('Reset session expired. Request a new code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.password.resetPassword(email, savedCode, password);
      window.sessionStorage.removeItem('tinytale.native.reset-code');
      navigate(`${routeBuilders.login()}?reset=success`, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="app-hero-card auth-card">
      <p className="app-kicker">Set new password</p>
      <h2 className="app-hero-title">Create a new password</h2>
      <p className="app-hero-subtitle">Set your new password here, then jump back to sign in.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="shell-input-block">
          <span className="shell-input-label">New Password</span>
          <input
            className="shell-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Confirm Password</span>
          <input
            className="shell-input"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat the new password"
            type="password"
            value={confirmPassword}
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="app-primary-button shell-button-reset auth-submit" disabled={submitting} type="submit">
          {submitting ? 'Updating password...' : 'Update Password'}
        </button>
      </form>

      <div className="auth-link-row">
        <Link className="app-secondary-button" to={routeBuilders.resetPassword()}>
          Back to Reset
        </Link>
      </div>
    </section>
  );
}
