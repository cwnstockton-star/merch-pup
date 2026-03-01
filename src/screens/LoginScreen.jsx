import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import './CreateAccountScreen.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // AuthContext will have fetched the profile; ProtectedRoute will redirect
      // venue users to /venue/dashboard automatically from /home
      navigate('/home');
    }
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
        <button
          className="create__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
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
            Welcome<br />back.
          </h1>
        </div>

        <p className="create__sub">
          Sign in to see your merch, your events, your QR codes.
        </p>

        <form className="create__form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              className="input-field"
              id="email"
              name="email"
              type="email"
              placeholder="jordan@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              className="input-field"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="create__actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block create__cta"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="create__signin">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-link text-link--bold"
                onClick={() => navigate('/create-account')}
              >
                Create one
              </button>
            </p>

            <p className="create__signin">
              Are you a venue?{' '}
              <button
                type="button"
                className="text-link text-link--bold"
                onClick={() => navigate('/venue/signup')}
              >
                Create a venue account
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
