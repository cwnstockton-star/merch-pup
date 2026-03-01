import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './CartScreen.css';

export default function CartScreen() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();
  const { session } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  // Fetch event names for grouping labels
  const [eventNames, setEventNames] = useState({});
  useEffect(() => {
    const eventIds = [...new Set(items.map((i) => i.eventId).filter(Boolean))];
    if (eventIds.length === 0) return;
    supabase
      .from('events')
      .select('id, artist, venue_name')
      .in('id', eventIds)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach((e) => { map[e.id] = `${e.artist} – ${e.venue_name}`; });
        setEventNames(map);
      });
  }, [items]);

  const serviceFee = itemCount > 0 ? 1.50 : 0;
  const total = subtotal + serviceFee;

  // Group items by event
  const byEvent = items.reduce((acc, item) => {
    const key = item.eventId || 'no-event';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  async function handleCheckout() {
    setError('');
    setCheckingOut(true);
    try {
      const origin = window.location.origin;
      const firstEventId = items[0]?.eventId || null;
      const payload = {
        items: items.map((i) => ({ id: i.merch.id, size: i.size, quantity: i.quantity })),
        eventId: firstEventId,
        fanId: session.user.id,
        successUrl: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart`,
      };

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: payload,
      });

      if (fnError || data?.error) throw new Error(fnError?.message || data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setCheckingOut(false);
    }
  }

  return (
    <div className="cart screen">

      {/* ── Header ── */}
      <div className="cart__header">
        <button
          className="cart__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="cart__title">Your Cart</h1>
        <div style={{ width: 36 }} />
      </div>

      {items.length === 0 ? (

        /* ── Empty state ── */
        <div className="cart__empty">
          <div className="cart__empty-icon" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <p className="cart__empty-title">Your cart is empty.</p>
          <p className="cart__empty-sub">Find something at an upcoming show.</p>
          <button
            className="btn btn-primary cart__empty-cta"
            onClick={() => navigate('/events')}
          >
            Browse Events
          </button>
        </div>

      ) : (

        <>
          {/* ── Item list ── */}
          <main className="cart__content">
            {Object.entries(byEvent).map(([eventId, eventItems]) => (
              <section key={eventId} className="cart__event-group">

                {/* Event label */}
                <div className="cart__event-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                    <circle cx="12" cy="11" r="3"/>
                  </svg>
                  {eventNames[eventId] || 'Event'}
                </div>

                {/* Items */}
                <ul className="cart__items">
                  {eventItems.map((item) => (
                    <li key={item.id} className="cart__item">

                      {/* Thumbnail */}
                      <div
                        className="cart__item-img"
                        style={item.merch.image_url
                          ? { backgroundImage: `url(${item.merch.image_url})` }
                          : { background: 'var(--color-gray-100)' }
                        }
                        aria-hidden="true"
                      />

                      {/* Details */}
                      <div className="cart__item-details">
                        <p className="cart__item-name">{item.merch.name}</p>
                        {item.size && item.size !== 'One Size' && (
                          <p className="cart__item-meta">Size: {item.size}</p>
                        )}
                        <p className="cart__item-price">${(parseFloat(item.merch.price) * item.quantity).toFixed(2)}</p>

                        {/* Stepper + remove */}
                        <div className="cart__item-actions">
                          <div className="cart__stepper">
                            <button
                              className="cart__stepper-btn"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.merch.name}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                            <span className="cart__stepper-val" aria-live="polite">{item.quantity}</span>
                            <button
                              className="cart__stepper-btn"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.merch.name}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>

                          <button
                            className="cart__remove"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.merch.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                    </li>
                  ))}
                </ul>

              </section>
            ))}

            {/* ── Order summary ── */}
            <div className="cart__summary">
              <h2 className="cart__summary-title">Order Summary</h2>

              <div className="cart__summary-rows">
                <div className="cart__summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="cart__summary-row">
                  <span>Service fee</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>
                <div className="cart__summary-row">
                  <span>Pickup</span>
                  <span className="cart__summary-free">Free</span>
                </div>
              </div>

              <div className="cart__summary-divider" />

              <div className="cart__summary-row cart__summary-row--total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

          </main>

          {/* ── Sticky checkout footer ── */}
          <div className="cart__footer">
            {error && <p className="auth-error" style={{ marginBottom: 8 }}>{error}</p>}
            <button
              className="btn btn-primary cart__checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Redirecting to payment…' : `Pay Now — $${total.toFixed(2)}`}
            </button>
            <p className="cart__footer-note">
              Secure checkout via Stripe. Your merch is held until the show.
            </p>
          </div>
        </>

      )}

      <BottomNav />
    </div>
  );
}
