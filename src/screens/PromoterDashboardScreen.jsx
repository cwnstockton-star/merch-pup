import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './PromoterDashboardScreen.css';

export default function PromoterDashboardScreen() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState(null); // null = loading, { connected, chargesEnabled }
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    async function loadAll() {
      const [eventsResult, statusResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('date', { ascending: true }),
        supabase.functions.invoke('get-connect-status'),
      ]);

      setEvents(eventsResult.data || []);
      if (!statusResult.error && statusResult.data) {
        setStripeStatus(statusResult.data);
      } else {
        setStripeStatus({ connected: false, chargesEnabled: false });
      }
      setLoading(false);
    }
    loadAll();
  }, [session.user.id]);

  async function handleConnectStripe() {
    setConnectError('');
    setConnectLoading(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          returnUrl: `${origin}/promoter/dashboard`,
          refreshUrl: `${origin}/promoter/dashboard`,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data.error);
      window.location.href = data.url;
    } catch (err) {
      setConnectError(err.message || 'Could not start Stripe onboarding.');
      setConnectLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className="promoter-dash screen">
      <header className="promoter-dash__header">
        <Logo size="sm" />
        <button className="promoter-dash__signout" onClick={handleSignOut}>Sign out</button>
      </header>

      {/* ── Stripe Connect banner ── */}
      {!loading && stripeStatus && (
        stripeStatus.chargesEnabled ? (
          <div className="promoter-dash__stripe-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Stripe payments connected
          </div>
        ) : (
          <div className="promoter-dash__stripe-banner">
            <div className="promoter-dash__stripe-banner-text">
              <strong>Connect Stripe to accept payments.</strong>
              <span> Fans can't check out until your Stripe account is set up.</span>
            </div>
            {connectError && <p className="auth-error" style={{ marginTop: 6, marginBottom: 0 }}>{connectError}</p>}
            <button
              className="btn btn-accent promoter-dash__stripe-btn"
              onClick={handleConnectStripe}
              disabled={connectLoading}
            >
              {connectLoading ? 'Redirecting…' : 'Connect Stripe →'}
            </button>
          </div>
        )
      )}

      <div className="promoter-dash__top">
        <div>
          <span className="badge">Promoter Portal</span>
          <h1 className="promoter-dash__title">Your Events</h1>
        </div>
        <button
          className="btn btn-primary promoter-dash__create-btn"
          onClick={() => navigate('/promoter/events/new')}
        >
          + Create
        </button>
      </div>

      <div className="promoter-dash__content">
        {loading ? (
          <p className="promoter-dash__state-msg">Loading your events…</p>
        ) : events.length === 0 ? (
          <div className="promoter-dash__empty">
            <p className="promoter-dash__state-msg">No events yet.</p>
            <p className="promoter-dash__state-sub">Create your first event to start selling merch.</p>
            <button
              className="btn btn-accent"
              onClick={() => navigate('/promoter/events/new')}
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <ul className="promoter-dash__list">
            {events.map((event) => (
              <li key={event.id} className="promoter-event-card">
                <div className="promoter-event-card__body">
                  <h2 className="promoter-event-card__name">{event.artist || event.name}</h2>
                  <p className="promoter-event-card__meta">
                    {event.venue_name}{event.city ? ` · ${event.city}` : ''} · {formatDate(event.date)}
                  </p>
                  <div className="promoter-event-card__code-row">
                    <span className="promoter-event-card__code-label">Code</span>
                    <span className="promoter-event-card__code">{event.event_code}</span>
                  </div>
                </div>
                <button
                  className="promoter-event-card__arrow"
                  onClick={() => navigate(`/promoter/events/${event.id}`)}
                  aria-label={`Manage ${event.artist || event.name}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
