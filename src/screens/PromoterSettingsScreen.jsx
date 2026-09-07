import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';

export default function PromoterSettingsScreen() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const [email, setEmail] = useState(session?.user?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        setEmailError(error.message);
      } else {
        setEmailSuccess('Check your inbox to confirm the new email address.');
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password updated.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
        <button
          className="create__back"
          onClick={() => navigate('/promoter/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Logo size="sm" />
        <div style={{ width: 32 }} />
      </div>

      <div className="create__content">
        <div className="create__heading-wrap">
          <div className="create__heading-highlight" aria-hidden="true" />
          <h1 className="create__heading">
            Account<br />Settings.
          </h1>
        </div>

        <form className="promoter-form" onSubmit={handleEmailSubmit}>
          <div className="promoter-form__section">
            <h2 className="promoter-form__section-title">Email</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email address</label>
              <input
                className="input-field"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {emailError && <p className="auth-error">{emailError}</p>}
            {emailSuccess && <p className="auth-error" style={{ color: 'var(--color-primary)' }}>{emailSuccess}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={emailLoading}>
              {emailLoading ? 'Updating…' : 'Update Email'}
            </button>
          </div>
        </form>

        <form className="promoter-form" onSubmit={handlePasswordSubmit} style={{ marginTop: 24 }}>
          <div className="promoter-form__section">
            <h2 className="promoter-form__section-title">Password</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="password">New password</label>
              <input
                className="input-field"
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Confirm new password</label>
              <input
                className="input-field"
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passwordError && <p className="auth-error">{passwordError}</p>}
            {passwordSuccess && <p className="auth-error" style={{ color: 'var(--color-primary)' }}>{passwordSuccess}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={passwordLoading}>
              {passwordLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>

        <div className="create__actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
