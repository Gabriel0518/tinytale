import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useNativeAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return nickname.trim().length >= 2 && EMAIL_REGEX.test(email.trim()) && password.length >= 8 && password === confirmPassword;
  }, [confirmPassword, email, nickname, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email.');
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
      await register(email.trim().toLowerCase(), password, nickname.trim());
      navigate(routeBuilders.profile(), { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="app-hero-card auth-card">
      <p className="app-kicker">Create account</p>
      <h2 className="app-hero-title">Join TinyTale</h2>
      <p className="app-hero-subtitle">Create your account and land directly inside the native profile flow.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="shell-input-block">
          <span className="shell-input-label">Nickname</span>
          <input className="shell-input" onChange={(event) => setNickname(event.target.value)} placeholder="How should we call you?" value={nickname} />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Email</span>
          <input className="shell-input" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" value={email} />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Password</span>
          <input
            className="shell-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Use at least 8 characters"
            type="password"
            value={password}
          />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Confirm Password</span>
          <input
            className="shell-input"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            type="password"
            value={confirmPassword}
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="app-primary-button shell-button-reset auth-submit" disabled={!canSubmit || submitting} type="submit">
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-link-row">
        <Link className="app-secondary-button" to={routeBuilders.login()}>
          Back to Login
        </Link>
      </div>
    </section>
  );
}
