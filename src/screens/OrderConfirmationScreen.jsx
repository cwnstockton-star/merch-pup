import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import merchpupgoth1 from '../assets/merchpupgoth1.png';
import { mockOrder } from '../data/mock';
import './OrderConfirmationScreen.css';

export default function OrderConfirmationScreen() {
  const navigate = useNavigate();
  const order = mockOrder;
  const event = order.event;

  return (
    <div className="order-confirm screen">

      {/* ── Top bar ── */}
      <div className="order-confirm__top-bar" aria-hidden="true" />

      {/* ── Header ── */}
      <div className="order-confirm__header">
        <Logo size="sm" />
      </div>

      {/* ── Scrollable body ── */}
      <main className="order-confirm__body">

        {/* ── Success hero ── */}
        <div className="order-confirm__hero">
          <div className="order-confirm__check-wrap" aria-hidden="true">
            <svg
              className="order-confirm__check"
              width="36" height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="order-confirm__heading">You're all set.</h1>
          <p className="order-confirm__sub">
            Order <strong>{order.id}</strong> confirmed. Your merch is waiting.
          </p>
        </div>

        {/* ── Mascot ── */}
        <div className="order-confirm__mascot-wrap">
          <img src={merchpupgoth1} alt="Merch Pup mascot" className="order-confirm__mascot-img" />
          <p className="order-confirm__mascot-quip">You're going to look so sick.</p>
        </div>

        {/* ── QR code ── */}
        <div className="order-confirm__qr-block">
          <p className="order-confirm__qr-label">Show this at the merch table</p>
          <div className="order-confirm__qr-frame">
            <img
              src={order.qrCodePlaceholder}
              alt={`QR code for order ${order.id}`}
              className="order-confirm__qr-img"
              width="200"
              height="200"
            />
          </div>
          <p className="order-confirm__qr-order-id">{order.id}</p>
        </div>

        {/* ── Pickup info ── */}
        <div className="order-confirm__pickup-block">
          <div className="order-confirm__pickup-row">
            <span className="order-confirm__pickup-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <div>
              <p className="order-confirm__pickup-label">Pickup Window</p>
              <p className="order-confirm__pickup-time">{event.pickupTime}</p>
            </div>
          </div>

          <div className="order-confirm__divider" />

          <div className="order-confirm__pickup-row">
            <span className="order-confirm__pickup-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            </span>
            <div>
              <p className="order-confirm__pickup-label">Venue</p>
              <p className="order-confirm__pickup-venue">{event.venue}</p>
              <p className="order-confirm__pickup-address">{event.address}</p>
            </div>
          </div>
        </div>

        {/* ── Step-by-step directions ── */}
        <div className="order-confirm__directions-block">
          <h2 className="order-confirm__section-label">Pickup Directions</h2>
          <ol className="order-confirm__directions">
            {event.pickupDirections.map((step, i) => (
              <li key={i} className="order-confirm__direction-step">
                <span className="order-confirm__step-num" aria-hidden="true">{i + 1}</span>
                <span className="order-confirm__step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Order summary ── */}
        <div className="order-confirm__summary-block">
          <h2 className="order-confirm__section-label">What you ordered</h2>
          <ul className="order-confirm__item-list">
            {order.items.map((item) => (
              <li key={item.id} className="order-confirm__item">
                <div
                  className="order-confirm__item-img"
                  style={{ backgroundImage: `url(${item.merch.images[0]})` }}
                  aria-hidden="true"
                />
                <div className="order-confirm__item-info">
                  <p className="order-confirm__item-name">{item.merch.name}</p>
                  {item.size !== 'One Size' && (
                    <p className="order-confirm__item-meta">Size: {item.size} &nbsp;·&nbsp; Qty: {item.quantity}</p>
                  )}
                  {item.size === 'One Size' && (
                    <p className="order-confirm__item-meta">Qty: {item.quantity}</p>
                  )}
                </div>
                <p className="order-confirm__item-price">${item.merch.price * item.quantity}</p>
              </li>
            ))}
          </ul>

          <div className="order-confirm__total-row">
            <span>Total paid at pickup</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="order-confirm__actions">
          <button
            className="btn btn-primary order-confirm__home-btn"
            onClick={() => navigate('/home')}
          >
            Back to Home
          </button>
          <button
            className="btn btn-outline order-confirm__events-btn"
            onClick={() => navigate('/events')}
          >
            Browse More Events
          </button>
        </div>

      </main>

      {/* ── Bottom bar ── */}
      <div className="order-confirm__bottom-bar" aria-hidden="true" />

      <BottomNav />
    </div>
  );
}
