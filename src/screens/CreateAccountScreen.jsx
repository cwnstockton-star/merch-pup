import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import './CreateAccountScreen.css';

export default function CreateAccountScreen() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error, needsConfirmation } = await signUp(form.email, form.password, {
        name: form.name,
        phone: form.phone,
        role: 'fan',
      });
      if (error) {
        setError(error.message);
      } else if (needsConfirmation) {
        setConfirmed(true); // show "check your email" message
      } else {
        navigate('/connect-event');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="create screen">
        <div className="splash__grain" aria-hidden="true" />
        <div className="splash__top-bar" />
        <div className="create__nav">
          <div style={{ width: 32 }} />
          <Logo size="sm" />
          <div style={{ width: 32 }} />
        </div>
        <div className="create__content" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="create__heading-wrap">
            <div className="create__heading-highlight" aria-hidden="true" />
            <h1 className="create__heading">Check your<br />email.</h1>
          </div>
          <p className="create__sub" style={{ marginTop: 16 }}>
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <div className="create__actions" style={{ marginTop: 32 }}>
            <button
              className="btn btn-primary btn-lg btn-block create__cta"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create screen">
      {/* Grain overlay */}
      <div className="splash__grain" aria-hidden="true" />

      {/* Yellow top bar */}
      <div className="splash__top-bar" />

      {/* Nav row */}
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
        {/* Spacer keeps logo visually centered */}
        <div style={{ width: 32 }} />
      </div>

      {/* Content */}
      <div className="create__content">

        {/* Heading with yellow slab */}
        <div className="create__heading-wrap">
          <div className="create__heading-highlight" aria-hidden="true" />
          <h1 className="create__heading">
            Let's fetch<br />your details.
          </h1>
        </div>

        <p className="create__sub">
          One account. Every show. All your merch - waiting at the table.
        </p>

        {/* Form */}
        <form className="create__form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <input
              className="input-field"
              id="name"
              name="name"
              type="text"
              placeholder="Jordan Lee"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="phone">Phone Number</label>
            <input
              className="input-field"
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (813) 555-0182"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

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
              autoComplete="new-password"
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="create__signin">
              Already have an account?{' '}
              <button
                type="button"
                className="text-link text-link--bold"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
            </p>

            <p className="create__signin">
              Are you a promoter?{' '}
              <button
                type="button"
                className="text-link text-link--bold"
                onClick={() => navigate('/promoter/signup')}
              >
                Create a promoter account
              </button>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
