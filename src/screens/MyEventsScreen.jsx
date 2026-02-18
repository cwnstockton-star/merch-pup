import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import MascotPlaceholder from '../components/MascotPlaceholder';
import { mockEvents, mockCart, mockOrder } from '../data/mock';
import './MyEventsScreen.css';

// Events the user is following
const followedEvents = mockEvents.filter((e) => e.following);

// Event IDs that have a completed order
const orderedEventIds = new Set([mockOrder.event.id]);

export default function MyEventsScreen() {
  const navigate = useNavigate();

  return (
    <div className="my-events screen">

      {/* ── Header ── */}
      <div className="my-events__header">
        <h1 className="my-events__title">My Events</h1>
        <CartButton count={mockCart.length} />
      </div>

      {followedEvents.length === 0 ? (

        /* ── Empty state ── */
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
              Scan Ticket
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

        /* ── Event list ── */
        <main className="my-events__content">
          <ul className="my-events__list">
            {followedEvents.map((event) => {
              const hasOrder = orderedEventIds.has(event.id);
              return (
                <li key={event.id}>
                  <article className="my-events__card">

                    {/* Hero image */}
                    <div
                      className="my-events__card-img"
                      style={{ backgroundImage: `url(${event.heroImage})` }}
                      role="img"
                      aria-label={`${event.artist} hero image`}
                    >
                      <div className="my-events__card-img-overlay" aria-hidden="true" />
                      <div className="my-events__card-img-info">
                        <h2 className="my-events__card-artist">{event.artist}</h2>
                        <p className="my-events__card-meta">
                          {event.venue}&nbsp;&nbsp;·&nbsp;&nbsp;{event.date}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="my-events__card-footer">
                      {hasOrder ? (
                        <button
                          className="btn my-events__qr-btn"
                          onClick={() => navigate('/order-confirmation')}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
                          </svg>
                          View QR Code
                        </button>
                      ) : (
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
                      )}

                      <button
                        className="my-events__detail-link"
                        onClick={() => navigate(`/events/${event.id}`)}
                        aria-label={`View details for ${event.artist}`}
                      >
                        Event details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>

                  </article>
                </li>
              );
            })}
          </ul>

          {/* Nudge to add more events */}
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
