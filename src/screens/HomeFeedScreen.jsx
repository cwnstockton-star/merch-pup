import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatEventDate } from '../lib/utils';
import './HomeFeedScreen.css';

const LOCATIONS = ['Tampa, FL', 'Orlando, FL', 'Miami, FL', 'Nashville, TN', 'Austin, TX'];

export default function HomeFeedScreen() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [location, setLocation] = useState('Tampa, FL');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [allEvents, setAllEvents] = useState([]);
  const [connectedEvents, setConnectedEvents] = useState([]);
  const [connectedMerch, setConnectedMerch] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [{ data: events }, { data: connections }] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }).limit(10),
        supabase.from('event_connections')
          .select('event_id, events(*)')
          .eq('fan_id', session.user.id)
          .order('connected_at', { ascending: false }),
      ]);

      setAllEvents(events || []);

      const connected = (connections || []).map((c) => c.events).filter(Boolean);
      setConnectedEvents(connected);

      // Load the first merch item for each connected event
      if (connected.length > 0) {
        const eventIds = connected.map((e) => e.id);
        const { data: merch } = await supabase
          .from('merch_items')
          .select('*')
          .in('event_id', eventIds)
          .order('created_at');

        // Index by event_id — keep the first item per event
        const merchMap = {};
        (merch || []).forEach((item) => {
          if (!merchMap[item.event_id]) merchMap[item.event_id] = item;
        });
        setConnectedMerch(merchMap);
      }

      setLoading(false);
    }
    loadData();
  }, [session.user.id]);

  const firstName = profile?.name?.split(' ')[0] || 'there';

  return (
    <div className="home screen">
      {/* ── Sticky header ── */}
      <header className="home__header">
        <div className="home__header-row">
          <Logo size="sm" />

          <div className="home__header-right">
            {/* Location picker */}
            <div className="home__loc-wrap">
              <button
                className="home__loc-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                </svg>
                {location}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <>
                  <div className="home__loc-backdrop" onClick={() => setDropdownOpen(false)} />
                  <ul className="home__loc-dropdown" role="listbox" aria-label="Select city">
                    {LOCATIONS.map((loc) => (
                      <li key={loc} role="option" aria-selected={loc === location}>
                        <button
                          className={`home__loc-option ${loc === location ? 'home__loc-option--active' : ''}`}
                          onClick={() => { setLocation(loc); setDropdownOpen(false); }}
                        >
                          {loc === location && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {loc}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <CartButton />
          </div>
        </div>

        {/* Search bar */}
        <button
          className="home__search"
          onClick={() => navigate('/events')}
          aria-label="Search for merch"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="home__search-placeholder">Search for merch...</span>
        </button>
      </header>

      {/* ── Scrollable content ── */}
      <main className="home__content">

        <div className="home__greeting">
          <h1 className="home__greeting-text">
            Hey, <span className="home__greeting-name">{firstName}.</span>
          </h1>
          <p className="home__greeting-sub">Here's what's happening near you.</p>
        </div>

        {/* ── Upcoming Events carousel ── */}
        <section className="home__section">
          <h2 className="home__section-title">Upcoming Events</h2>

          {loading ? (
            <p style={{ color: 'var(--color-gray-400)', fontSize: 14, padding: '0 4px' }}>Loading…</p>
          ) : allEvents.length === 0 ? (
            <p style={{ color: 'var(--color-gray-400)', fontSize: 14, padding: '0 4px' }}>No events yet.</p>
          ) : (
            <div className="home__carousel" role="list">
              {allEvents.map((event) => (
                <article
                  key={event.id}
                  className="home__event-card"
                  role="listitem"
                  onClick={() => navigate(`/events/${event.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                  aria-label={`${event.artist} at ${event.venue_name}, ${formatEventDate(event.date)}`}
                >
                  <div
                    className="home__event-img"
                    style={event.image_url
                      ? { backgroundImage: `url(${event.image_url})` }
                      : { background: 'linear-gradient(160deg, #1a1a1a 0%, #444 100%)' }
                    }
                  >
                    <span className="home__event-date-badge">{formatEventDate(event.date)}</span>
                  </div>
                  <div className="home__event-info">
                    <span className="home__event-artist">{event.artist || event.name}</span>
                    <span className="home__event-venue">{event.venue_name}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Connected Shows ── */}
        {!loading && connectedEvents.length > 0 && (
          <section className="home__section">
            <h2 className="home__section-title">Your Connected Shows</h2>

            <div className="home__follow-list">
              {connectedEvents.map((event) => {
                const drop = connectedMerch[event.id];
                if (!drop) return (
                  <article key={event.id} className="home__drop-card"
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{ cursor: 'pointer' }}>
                    <div className="home__drop-card-inner">
                      <div className="home__drop-text">
                        <div className="home__drop-meta">
                          <span className="home__drop-artist">{event.artist || event.name}</span>
                        </div>
                        <p className="home__drop-name">{event.venue_name}</p>
                        <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>{formatEventDate(event.date)}</p>
                      </div>
                    </div>
                  </article>
                );
                return (
                  <article key={event.id} className="home__drop-card">
                    <div className="home__drop-card-inner">
                      <div className="home__drop-text">
                        <div className="home__drop-meta">
                          <span className="badge">Merch Available</span>
                          <span className="home__drop-artist">{event.artist || event.name}</span>
                        </div>
                        <p className="home__drop-name">{drop.name}</p>
                        <p className="home__drop-price">${parseFloat(drop.price).toFixed(2)}</p>
                        <button
                          className="btn btn-accent home__drop-cta"
                          onClick={() => navigate(`/events/${event.id}/merch/${drop.id}`)}
                        >
                          Pre-Order
                        </button>
                      </div>
                      <div
                        className="home__drop-thumb"
                        style={drop.image_url
                          ? { backgroundImage: `url(${drop.image_url})` }
                          : { background: 'var(--color-gray-100)' }
                        }
                        aria-hidden="true"
                      />
                    </div>
                    <div className="home__drop-footer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                      </svg>
                      {event.venue_name} · {formatEventDate(event.date)}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Empty connected shows nudge ── */}
        {!loading && connectedEvents.length === 0 && (
          <section className="home__section">
            <h2 className="home__section-title">Your Connected Shows</h2>
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--color-gray-600)', marginBottom: 12 }}>
                No shows connected yet. Enter your event code to get started.
              </p>
              <button
                className="btn btn-accent"
                style={{ fontSize: 14, padding: '12px 20px' }}
                onClick={() => navigate('/connect-event')}
              >
                Connect to an Event
              </button>
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
