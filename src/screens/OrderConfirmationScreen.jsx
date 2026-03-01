import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import merchpupgoth1 from '../assets/merchpupgoth1.png';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import './OrderConfirmationScreen.css';

export default function OrderConfirmationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('No session ID found.');
      setLoading(false);
      return;
    }

    async function verifyAndLoad() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('verify-checkout-session', {
          body: { sessionId },
        });

        if (fnError || data?.error) throw new Error(fnError?.message || data.error);

        setOrder(data.order);
        clearCart();

        // Fetch event details for pickup info
        if (data.order.event_id) {
          const { data: eventData } = await supabase
            .from('events')
            .select('artist, venue_name, city, pickup_window, directions')
            .eq('id', data.order.event_id)
            .single();
          setEvent(eventData);
        }
      } catch (err) {
        setError(err.message || 'Could not verify your order.');
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Confirming your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="screen" style={{ padding: 32, gap: 16 }}>
        <p style={{ color: 'var(--color-gray-600)' }}>{error || 'Order not found.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/home')}>Go Home</button>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.qr_code)}`;

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
            Order <strong>{order.qr_code}</strong> confirmed. Your merch is waiting.
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
              src={qrUrl}
              alt={`QR code for order ${order.qr_code}`}
              className="order-confirm__qr-img"
              width="200"
              height="200"
            />
          </div>
          <p className="order-confirm__qr-order-id">{order.qr_code}</p>
        </div>

        {/* ── Pickup info ── */}
        {event && (
          <div className="order-confirm__pickup-block">
            {event.pickup_window && (
              <div className="order-confirm__pickup-row">
                <span className="order-confirm__pickup-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <div>
                  <p className="order-confirm__pickup-label">Pickup Window</p>
                  <p className="order-confirm__pickup-time">{event.pickup_window}</p>
                </div>
              </div>
            )}

            {event.venue_name && (
              <>
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
                    <p className="order-confirm__pickup-venue">{event.venue_name}</p>
                    {event.city && <p className="order-confirm__pickup-address">{event.city}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step-by-step directions ── */}
        {event?.directions?.length > 0 && (
          <div className="order-confirm__directions-block">
            <h2 className="order-confirm__section-label">Pickup Directions</h2>
            <ol className="order-confirm__directions">
              {event.directions.map((step, i) => (
                <li key={i} className="order-confirm__direction-step">
                  <span className="order-confirm__step-num" aria-hidden="true">{i + 1}</span>
                  <span className="order-confirm__step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Order summary ── */}
        <div className="order-confirm__summary-block">
          <h2 className="order-confirm__section-label">What you ordered</h2>
          <ul className="order-confirm__item-list">
            {order.order_items?.map((item) => (
              <li key={item.id} className="order-confirm__item">
                <div className="order-confirm__item-img" aria-hidden="true" />
                <div className="order-confirm__item-info">
                  <p className="order-confirm__item-name">{item.name}</p>
                  {item.size && item.size !== 'One Size' ? (
                    <p className="order-confirm__item-meta">Size: {item.size} &nbsp;·&nbsp; Qty: {item.quantity}</p>
                  ) : (
                    <p className="order-confirm__item-meta">Qty: {item.quantity}</p>
                  )}
                </div>
                <p className="order-confirm__item-price">${(item.price * item.quantity).toFixed(2)}</p>
              </li>
            ))}
          </ul>

          <div className="order-confirm__total-row">
            <span>Total paid</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
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
