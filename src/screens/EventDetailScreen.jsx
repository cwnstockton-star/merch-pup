import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatEventDate } from '../lib/utils';
import './EventDetailScreen.css';

export default function EventDetailScreen() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('merch');

  const [event, setEvent] = useState(null);
  const [merch, setMerch] = useState([]);
  const [isFollowing, setIsFollowing] = useState(
    location.state?.autoFollowed === true
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [
        { data: eventData },
        { data: merchData },
        { data: connection },
      ] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('merch_items').select('*').eq('event_id', eventId).order('created_at'),
        supabase.from('event_connections')
          .select('id')
          .eq('fan_id', session.user.id)
          .eq('event_id', eventId)
          .maybeSingle(),
      ]);
      setEvent(eventData);
      setMerch(merchData || []);
      // autoFollowed (arrived via code entry) takes precedence
      if (!location.state?.autoFollowed) {
        setIsFollowing(connection !== null);
      }
      setLoading(false);
    }
    loadData();
  }, [eventId, session.user.id, location.state?.autoFollowed]);

  async function toggleFollow() {
    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      await supabase.from('event_connections').upsert(
        { fan_id: session.user.id, event_id: eventId },
        { onConflict: 'fan_id,event_id' }
      );
    } else {
      await supabase.from('event_connections')
        .delete()
        .eq('fan_id', session.user.id)
        .eq('event_id', eventId);
    }
  }

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="screen" style={{ padding: 32 }}>
        <p style={{ color: 'var(--color-gray-600)' }}>Event not found.</p>
      </div>
    );
  }

  return (
    <div className="event-detail screen">

      {/* ── Hero image ── */}
      <div
        className="event-detail__hero"
        style={event.image_url
          ? { backgroundImage: `url(${event.image_url})` }
          : { background: 'linear-gradient(160deg, #111 0%, #333 100%)' }
        }
        role="img"
        aria-label={`${event.artist} hero image`}
      >
        <div className="event-detail__hero-overlay" aria-hidden="true" />

        <div className="event-detail__hero-controls">
          <button
            className="event-detail__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            className={`event-detail__follow-btn ${isFollowing ? 'event-detail__follow-btn--active' : ''}`}
            onClick={toggleFollow}
            aria-pressed={isFollowing}
            aria-label={isFollowing ? 'Unfollow this event' : 'Follow this event'}
          >
            {isFollowing ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Following
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Follow
              </>
            )}
          </button>

          <CartButton />
        </div>

        <div className="event-detail__hero-info">
          <h1 className="event-detail__artist">{event.artist || event.name}</h1>
          <p className="event-detail__venue-line">
            {event.venue_name} &nbsp;·&nbsp; {formatEventDate(event.date)}
          </p>
        </div>
      </div>

      {/* ── Tab toggle ── */}
      <div className="event-detail__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'merch'}
          className={`event-detail__tab ${activeTab === 'merch' ? 'event-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('merch')}
        >
          Event Merch
          {merch.length > 0 && <span className="event-detail__tab-count">{merch.length}</span>}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'details'}
          className={`event-detail__tab ${activeTab === 'details' ? 'event-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Event Details
        </button>
      </div>

      {/* ── Tab panels ── */}
      <main className="event-detail__content">

        {/* ── MERCH GRID ── */}
        {activeTab === 'merch' && (
          <div className="event-detail__merch-panel" role="tabpanel">
            {merch.length > 0 ? (
              <ul className="merch-grid">
                {merch.map((item) => (
                  <li key={item.id}>
                    <article
                      className="merch-card"
                      onClick={() => navigate(`/events/${eventId}/merch/${item.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${eventId}/merch/${item.id}`)}
                      aria-label={`${item.name}, $${item.price}`}
                    >
                      <div
                        className="merch-card__img"
                        style={item.image_url
                          ? { backgroundImage: `url(${item.image_url})` }
                          : { background: 'var(--color-gray-100)' }
                        }
                        aria-hidden="true"
                      >
                        <span className="merch-card__category">{item.category}</span>
                      </div>
                      <div className="merch-card__info">
                        <p className="merch-card__name">{item.name}</p>
                        <p className="merch-card__price">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="event-detail__empty">
                <p className="event-detail__empty-title">No merch yet.</p>
                <p className="event-detail__empty-sub">Check back closer to the show.</p>
              </div>
            )}
          </div>
        )}

        {/* ── EVENT DETAILS ── */}
        {activeTab === 'details' && (
          <div className="event-detail__info-panel" role="tabpanel">

            {event.description && (
              <>
                <div className="event-detail__block">
                  <h2 className="event-detail__block-label">About the Show</h2>
                  <p className="event-detail__block-body">{event.description}</p>
                </div>
                <div className="event-detail__divider" />
              </>
            )}

            {event.pickup_window && (
              <>
                <div className="event-detail__block event-detail__block--highlight">
                  <div className="event-detail__pickup-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="event-detail__block-label">Merch Pickup Window</h2>
                    <p className="event-detail__pickup-time">{event.pickup_window}</p>
                  </div>
                </div>
                <div className="event-detail__divider" />
              </>
            )}

            <div className="event-detail__block">
              <h2 className="event-detail__block-label">Venue</h2>
              <p className="event-detail__block-body event-detail__venue-name">{event.venue_name}</p>
              {event.address && <p className="event-detail__block-body">{event.address}</p>}
            </div>

            {event.directions?.length > 0 && (
              <>
                <div className="event-detail__divider" />
                <div className="event-detail__block">
                  <h2 className="event-detail__block-label">Pickup Directions</h2>
                  <ol className="event-detail__directions">
                    {event.directions.map((step, i) => (
                      <li key={i} className="event-detail__direction-step">
                        <span className="event-detail__step-num" aria-hidden="true">{i + 1}</span>
                        <span className="event-detail__step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
