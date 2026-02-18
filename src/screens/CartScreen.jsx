import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { mockCart, mockEvents } from '../data/mock';
import './CartScreen.css';

export default function CartScreen() {
  const navigate = useNavigate();

  // Local copy so quantity/remove edits feel live
  const [items, setItems] = useState(mockCart);

  const subtotal = items.reduce((sum, i) => sum + i.merch.price * i.quantity, 0);
  const serviceFee = items.length > 0 ? 1.50 : 0;
  const total = subtotal + serviceFee;

  function updateQty(id, delta) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Group items by event
  const byEvent = items.reduce((acc, item) => {
    const key = item.eventId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

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
            {Object.entries(byEvent).map(([eventId, eventItems]) => {
              const event = mockEvents.find((e) => e.id === eventId);
              return (
                <section key={eventId} className="cart__event-group">

                  {/* Event label */}
                  <div className="cart__event-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                      <circle cx="12" cy="11" r="3"/>
                    </svg>
                    {event ? `${event.artist} - ${event.venue}` : 'Event'}
                  </div>

                  {/* Items */}
                  <ul className="cart__items">
                    {eventItems.map((item) => (
                      <li key={item.id} className="cart__item">

                        {/* Thumbnail */}
                        <div
                          className="cart__item-img"
                          style={{ backgroundImage: `url(${item.merch.images[0]})` }}
                          aria-hidden="true"
                        />

                        {/* Details */}
                        <div className="cart__item-details">
                          <p className="cart__item-name">{item.merch.name}</p>
                          {item.size !== 'One Size' && (
                            <p className="cart__item-meta">Size: {item.size}</p>
                          )}
                          <p className="cart__item-price">${item.merch.price * item.quantity}</p>

                          {/* Stepper + remove */}
                          <div className="cart__item-actions">
                            <div className="cart__stepper">
                              <button
                                className="cart__stepper-btn"
                                onClick={() => updateQty(item.id, -1)}
                                aria-label={`Decrease quantity of ${item.merch.name}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                              <span className="cart__stepper-val" aria-live="polite">{item.quantity}</span>
                              <button
                                className="cart__stepper-btn"
                                onClick={() => updateQty(item.id, 1)}
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

                  {/* Pickup info strip */}
                  {event && (
                    <div className="cart__pickup-strip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Pickup window: <strong>{event.pickupTime}</strong>
                    </div>
                  )}

                </section>
              );
            })}

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
            <button
              className="btn btn-primary cart__checkout-btn"
              onClick={() => navigate('/order-confirmation')}
            >
              Place Order - ${total.toFixed(2)}
            </button>
            <p className="cart__footer-note">
              No payment today - you'll be charged at pickup.
            </p>
          </div>
        </>

      )}

      <BottomNav />
    </div>
  );
}
