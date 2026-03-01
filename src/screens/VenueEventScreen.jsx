import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';
import './VenueEventScreen.css';

export default function VenueEventScreen() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [merch, setMerch] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('merch'); // 'merch' | 'orders'
  const [codeCopied, setCodeCopied] = useState(false);
  const newOrderIds = useRef(new Set()); // track IDs that arrived via realtime

  useEffect(() => {
    async function loadData() {
      const [{ data: eventData }, { data: merchData }, { data: ordersData }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('merch_items').select('*').eq('event_id', eventId).order('created_at'),
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false }),
      ]);
      setEvent(eventData);
      setMerch(merchData || []);
      setOrders(ordersData || []);
      setLoading(false);
    }
    loadData();
  }, [eventId]);

  // Real-time order feed
  useEffect(() => {
    const channel = supabase
      .channel(`venue-orders-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch full order with items (payload.new won't have order_items)
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            newOrderIds.current.add(data.id);
            setOrders((prev) => [data, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, status: payload.new.status } : o
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  async function markPickedUp(orderId) {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'picked_up' } : o))
    );
    await supabase
      .from('orders')
      .update({ status: 'picked_up' })
      .eq('id', orderId);
  }

  function copyCode() {
    navigator.clipboard.writeText(event.event_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  }

  // Stats derived from orders
  const totalOrders = orders.length;
  const pending = orders.filter((o) => o.status === 'paid').length;
  const pickedUp = orders.filter((o) => o.status === 'picked_up').length;
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);

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
    <div className="venue-event screen">
      <header className="venue-event__header">
        <button
          className="create__back"
          onClick={() => navigate('/venue/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Logo size="sm" />
        <div style={{ width: 36 }} />
      </header>

      <div className="venue-event__content">

        {/* ── Title ── */}
        <div>
          <span className="badge">Event</span>
          <h1 className="venue-event__title">{event.artist || event.name}</h1>
          <p className="venue-event__meta">
            {event.venue_name}
            {event.city ? ` · ${event.city}` : ''}
            {event.date ? ` · ${formatDate(event.date)}` : ''}
          </p>
        </div>

        {/* ── Event code card ── */}
        <div className="venue-event__code-card">
          <p className="venue-event__code-label">Fan Event Code</p>
          <p className="venue-event__code">{event.event_code}</p>
          <p className="venue-event__code-hint">
            Share this with fans so they can connect to your event and browse merch.
          </p>
          <button className="btn btn-outline venue-event__copy-btn" onClick={copyCode}>
            {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* ── Tab switcher ── */}
        <div className="venue-event__tabs" role="tablist">
          <button
            className={`venue-event__tab ${tab === 'merch' ? 'venue-event__tab--active' : ''}`}
            role="tab"
            aria-selected={tab === 'merch'}
            onClick={() => setTab('merch')}
          >
            Merch ({merch.length})
          </button>
          <button
            className={`venue-event__tab ${tab === 'orders' ? 'venue-event__tab--active' : ''}`}
            role="tab"
            aria-selected={tab === 'orders'}
            onClick={() => setTab('orders')}
          >
            Orders
            {pending > 0 && (
              <span className="venue-event__tab-badge" aria-label={`${pending} pending`}>
                {pending}
              </span>
            )}
          </button>
        </div>

        {/* ════════════════════════════════
            MERCH TAB
        ════════════════════════════════ */}
        {tab === 'merch' && (
          <>
            <div className="venue-event__merch-header">
              <h2 className="venue-event__section-title">Merch</h2>
              <button
                className="btn btn-primary venue-event__add-btn"
                onClick={() => navigate(`/venue/events/${eventId}/merch/new`)}
              >
                + Add Item
              </button>
            </div>

            {merch.length === 0 ? (
              <div className="venue-event__empty">
                <p>No merch items yet.</p>
                <p>Add your first item to start selling.</p>
              </div>
            ) : (
              <ul className="venue-event__merch-list">
                {merch.map((item) => (
                  <li key={item.id} className="venue-merch-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="venue-merch-card__img" />
                    ) : (
                      <div className="venue-merch-card__img venue-merch-card__img--empty" />
                    )}
                    <div className="venue-merch-card__info">
                      <h3 className="venue-merch-card__name">{item.name}</h3>
                      <p className="venue-merch-card__price">${parseFloat(item.price).toFixed(2)}</p>
                      {item.sizes?.length > 0 && (
                        <p className="venue-merch-card__meta">{item.sizes.join(' · ')}</p>
                      )}
                      <p className="venue-merch-card__meta venue-merch-card__qty">
                        Qty: {item.quantity_available}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ════════════════════════════════
            ORDERS TAB
        ════════════════════════════════ */}
        {tab === 'orders' && (
          <>
            {/* Stats row */}
            <div className="venue-orders__stats">
              <div className="venue-orders__stat">
                <span className="venue-orders__stat-val">{totalOrders}</span>
                <span className="venue-orders__stat-label">Orders</span>
              </div>
              <div className="venue-orders__stat-divider" />
              <div className="venue-orders__stat">
                <span className="venue-orders__stat-val venue-orders__stat-val--pending">{pending}</span>
                <span className="venue-orders__stat-label">Pending</span>
              </div>
              <div className="venue-orders__stat-divider" />
              <div className="venue-orders__stat">
                <span className="venue-orders__stat-val venue-orders__stat-val--done">{pickedUp}</span>
                <span className="venue-orders__stat-label">Picked Up</span>
              </div>
              <div className="venue-orders__stat-divider" />
              <div className="venue-orders__stat">
                <span className="venue-orders__stat-val">${revenue.toFixed(2)}</span>
                <span className="venue-orders__stat-label">Revenue</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="venue-event__empty">
                <p>No orders yet.</p>
                <p>New orders will appear here in real time.</p>
              </div>
            ) : (
              <ul className="venue-orders__list">
                {orders.map((order) => {
                  const isNew = newOrderIds.current.has(order.id);
                  const isPaid = order.status === 'paid';
                  return (
                    <li
                      key={order.id}
                      className={`venue-order-card ${isNew ? 'venue-order-card--new' : ''} ${!isPaid ? 'venue-order-card--done' : ''}`}
                    >
                      <div className="venue-order-card__top">
                        {/* Code + time */}
                        <div>
                          <p className="venue-order-card__code">{order.qr_code}</p>
                          <p className="venue-order-card__time">{formatTime(order.created_at)}</p>
                        </div>
                        {/* Status badge */}
                        <span className={`venue-order-card__status ${isPaid ? 'venue-order-card__status--paid' : 'venue-order-card__status--done'}`}>
                          {isPaid ? 'Ready' : 'Picked Up'}
                        </span>
                      </div>

                      {/* Items */}
                      <ul className="venue-order-card__items">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="venue-order-card__item">
                            <span className="venue-order-card__item-name">{item.name}</span>
                            {item.size && item.size !== 'One Size' && (
                              <span className="venue-order-card__item-size">{item.size}</span>
                            )}
                            <span className="venue-order-card__item-qty">×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Total + action */}
                      <div className="venue-order-card__footer">
                        <span className="venue-order-card__total">${parseFloat(order.total).toFixed(2)}</span>
                        {isPaid && (
                          <button
                            className="btn btn-accent venue-order-card__pickup-btn"
                            onClick={() => markPickedUp(order.id)}
                          >
                            Mark Picked Up
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

      </div>
    </div>
  );
}
