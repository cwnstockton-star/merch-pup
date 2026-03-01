import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatEventDate } from '../lib/utils';
import './EventsListScreen.css';

export default function EventsListScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [{ data: events }, { data: connections }] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('event_connections').select('event_id').eq('fan_id', session.user.id),
      ]);
      setAllEvents(events || []);
      setConnectedIds(new Set((connections || []).map((c) => c.event_id)));
      setLoading(false);
    }
    loadData();
  }, [session.user.id]);

  const filtered = allEvents.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.artist || '').toLowerCase().includes(q) ||
      (e.venue_name || '').toLowerCase().includes(q) ||
      (e.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="events-list screen">

      {/* ── Sticky header ── */}
      <header className="events-list__header">
        <div className="events-list__header-row">
          <h1 className="events-list__title">Explore Events</h1>
          <CartButton />
        </div>

        <div className="events-list__search-wrap">
          <svg className="events-list__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input-field events-list__search-input"
            type="search"
            placeholder="Search artists, venues, cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search events"
            autoFocus
          />
          {search && (
            <button
              className="events-list__search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <p className="events-list__count" aria-live="polite">
          {loading ? 'Loading events…' : search
            ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
            : `${filtered.length} upcoming event${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </header>

      {/* ── Event cards ── */}
      <main className="events-list__content">
        {filtered.length > 0 ? (
          <ul className="events-list__list">
            {filtered.map((event) => (
              <li key={event.id}>
                <article className="event-card">

                  <div
                    className="event-card__img"
                    style={event.image_url
                      ? { backgroundImage: `url(${event.image_url})` }
                      : { background: 'linear-gradient(160deg, #1a1a1a 0%, #444 100%)' }
                    }
                    role="img"
                    aria-label={`${event.artist} event photo`}
                  >
                    {connectedIds.has(event.id) && (
                      <span className="event-card__following-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Connected
                      </span>
                    )}
                  </div>

                  <div className="event-card__body">
                    <div className="event-card__meta">
                      <span className="event-card__date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatEventDate(event.date)}
                      </span>
                      {event.city && (
                        <>
                          <span className="event-card__sep" aria-hidden="true">·</span>
                          <span className="event-card__city">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                            </svg>
                            {event.city}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="event-card__artist">{event.artist || event.name}</h2>
                    <p className="event-card__venue">{event.venue_name}</p>

                    <div className="event-card__footer">
                      <button
                        className="btn btn-primary event-card__cta"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        Explore
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                </article>
              </li>
            ))}
          </ul>
        ) : !loading ? (
          <div className="events-list__empty">
            <div className="events-list__empty-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="events-list__empty-title">No events found</p>
            <p className="events-list__empty-sub">
              {search ? 'Try a different artist, venue, or city.' : 'No events have been added yet.'}
            </p>
            {search && (
              <button className="text-link text-link--bold" onClick={() => setSearch('')}>
                Clear search
              </button>
            )}
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
