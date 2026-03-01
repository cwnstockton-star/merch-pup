import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import MascotPlaceholder from '../components/MascotPlaceholder';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatEventDate } from '../lib/utils';
import './MyEventsScreen.css';

export default function MyEventsScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [connectedEvents, setConnectedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: connections } = await supabase
        .from('event_connections')
        .select('event_id, events(*)')
        .eq('fan_id', session.user.id)
        .order('connected_at', { ascending: false });

      setConnectedEvents(
        (connections || []).map((c) => c.events).filter(Boolean)
      );
      setLoading(false);
    }
    loadData();
  }, [session.user.id]);

  if (loading) {
    return (
      <div className="my-events screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="my-events screen">

      <div className="my-events__header">
        <h1 className="my-events__title">My Events</h1>
        <CartButton />
      </div>

      {connectedEvents.length === 0 ? (

        <div className="my-events__empty">
          <MascotPlaceholder size="md" />
          <p className="my-events__empty-title">No shows yet.</p>
          <p className="my-events__empty-sub">
            Start by scanning your ticket or browsing events.
          </p>
          <div className="my-events__empty-actions">
            <button
              className="btn btn-primary my-events__scan-btn"
              onClick={() => navigate('/connect-event')}
            >
              Connect to an Event
            </button>
            <button
              className="btn btn-outline my-events__browse-btn"
              onClick={() => navigate('/events')}
            >
              Browse Events
            </button>
          </div>
        </div>

      ) : (

        <main className="my-events__content">
          <ul className="my-events__list">
            {connectedEvents.map((event) => (
              <li key={event.id}>
                <article className="my-events__card">

                  <div
                    className="my-events__card-img"
                    style={event.image_url
                      ? { backgroundImage: `url(${event.image_url})` }
                      : { background: 'linear-gradient(160deg, #1a1a1a 0%, #444 100%)' }
                    }
                    role="img"
                    aria-label={`${event.artist || event.name} hero image`}
                  >
                    <div className="my-events__card-img-overlay" aria-hidden="true" />
                    <div className="my-events__card-img-info">
                      <h2 className="my-events__card-artist">{event.artist || event.name}</h2>
                      <p className="my-events__card-meta">
                        {event.venue_name}&nbsp;&nbsp;·&nbsp;&nbsp;{formatEventDate(event.date)}
                      </p>
                    </div>
                  </div>

                  <div className="my-events__card-footer">
                    <button
                      className="btn btn-primary my-events__merch-btn"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      View Merch
                    </button>

                    <button
                      className="my-events__detail-link"
                      onClick={() => navigate(`/events/${event.id}`)}
                      aria-label={`View details for ${event.artist || event.name}`}
                    >
                      Event details
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                </article>
              </li>
            ))}
          </ul>

          <div className="my-events__add-wrap">
            <button
              className="my-events__add-btn"
              onClick={() => navigate('/connect-event')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add another show
            </button>
          </div>
        </main>

      )}

      <BottomNav />
    </div>
  );
}
