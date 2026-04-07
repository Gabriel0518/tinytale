import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShellApi } from '../../hooks/useShellApi';
import { routeBuilders } from '../../router/route-builders';

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const api = useShellApi();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function handleSendCode() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await api.password.sendResetCode(email.trim().toLowerCase());
      setCountdown(60);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to send code.');
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError('Enter both email and verification code.');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      await api.password.verifyCode(email.trim().toLowerCase(), code.trim());
      window.sessionStorage.setItem('tinytale.native.reset-code', code.trim());
      navigate(routeBuilders.resetPasswordVerify(undefined, email.trim().toLowerCase()));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Code verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className="app-hero-card auth-card">
      <p className="app-kicker">Reset password</p>
      <h2 className="app-hero-title">Recover your account</h2>
      <p className="app-hero-subtitle">Request a code first, then finish the password reset on the next screen.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="shell-input-block">
          <span className="shell-input-label">Email</span>
          <input className="shell-input" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" value={email} />
        </label>
        <label className="shell-input-block">
          <span className="shell-input-label">Verification Code</span>
          <div className="auth-inline-row">
            <input
              className="shell-input"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
              value={code}
            />
            <button
              className="app-secondary-button shell-button-reset auth-inline-button"
              disabled={sending || countdown > 0}
              onClick={() => {
                void handleSendCode();
              }}
              type="button"
            >
              {sending ? 'Sending...' : countdown > 0 ? `${countdown}s` : 'Send Code'}
            </button>
          </div>
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="app-primary-button shell-button-reset auth-submit" disabled={verifying} type="submit">
          {verifying ? 'Verifying...' : 'Verify Code'}
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
