import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { mockEvents, mockMerch, mockCart, mockUser } from '../data/mock';
import './HomeFeedScreen.css';

const LOCATIONS = ['Tampa, FL', 'Orlando, FL', 'Miami, FL', 'Nashville, TN', 'Austin, TX'];

const followedEvents = mockEvents.filter((e) => e.following);

export default function HomeFeedScreen() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('Tampa, FL');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
              {/* Pin icon */}
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

            <CartButton count={mockCart.length} />
          </div>{/* .home__header-right */}
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

        {/* Greeting */}
        <div className="home__greeting">
          <h1 className="home__greeting-text">
            Hey, <span className="home__greeting-name">{mockUser.name.split(' ')[0]}.</span>
          </h1>
          <p className="home__greeting-sub">Here's what's happening near you.</p>
        </div>

        {/* ── Upcoming Events carousel ── */}
        <section className="home__section">
          <h2 className="home__section-title">Upcoming Events Near Me</h2>

          <div className="home__carousel" role="list">
            {mockEvents.map((event) => (
              <article
                key={event.id}
                className="home__event-card"
                role="listitem"
                onClick={() => navigate(`/events/${event.id}`)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                aria-label={`${event.artist} at ${event.venue}, ${event.date}`}
              >
                <div
                  className="home__event-img"
                  style={{ backgroundImage: `url(${event.image})` }}
                >
                  <span className="home__event-date-badge">{event.date}</span>
                </div>
                <div className="home__event-info">
                  <span className="home__event-artist">{event.artist}</span>
                  <span className="home__event-venue">{event.venue}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Events You Follow ── */}
        <section className="home__section">
          <h2 className="home__section-title">Events You Follow</h2>

          <div className="home__follow-list">
            {followedEvents.map((event) => {
              const drop = mockMerch.find((m) => m.eventId === event.id);
              if (!drop) return null;
              return (
                <article key={event.id} className="home__drop-card">
                  <div className="home__drop-card-inner">

                    {/* Left: text content */}
                    <div className="home__drop-text">
                      <div className="home__drop-meta">
                        <span className="badge">New Drop</span>
                        <span className="home__drop-artist">{event.artist}</span>
                      </div>
                      <p className="home__drop-name">{drop.name}</p>
                      <p className="home__drop-price">${drop.price}</p>
                      <button
                        className="btn btn-accent home__drop-cta"
                        onClick={() => navigate(`/events/${event.id}/merch/${drop.id}`)}
                      >
                        Pre-Order
                      </button>
                    </div>

                    {/* Right: merch thumbnail */}
                    <div
                      className="home__drop-thumb"
                      style={{ backgroundImage: `url(${drop.images[0]})` }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Event info footer */}
                  <div className="home__drop-footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                    {event.venue} · {event.date}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
