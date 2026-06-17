import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';
import './PromoterEventScreen.css';

export default function PromoterEventScreen() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [merch, setMerch] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('merch'); // 'merch' | 'orders'
  const [codeCopied, setCodeCopied] = useState(false);
  const [smsState, setSmsState] = useState({}); // { [orderId]: 'sending' | 'sent' | 'error' }
  const newOrderIds = useRef(new Set());

  useEffect(() => {
    async function loadData() {
      const [{ data: eventData }, { data: merchData }, { data: ordersData }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('merch_items').select('*').eq('event_id', eventId).order('created_at'),
        supabase
          .from('orders')
          .select('*, order_items(*), fan:profiles!fan_id(name, phone)')
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
      .channel(`promoter-orders-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `event_id=eq.${eventId}` },
        async (payload) => {
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*), fan:profiles!fan_id(name, phone)')
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
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => o.id === payload.new.id ? { ...o, status: payload.new.status } : o)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  // Real-time merch inventory — picks up quantity_available changes from any source
  useEffect(() => {
    const channel = supabase
      .channel(`promoter-merch-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'merch_items', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setMerch((prev) =>
            prev.map((m) => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  async function markPickedUp(orderId) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'picked_up' } : o))
    );
    await supabase.from('orders').update({ status: 'picked_up' }).eq('id', orderId);
  }

  async function notifyFan(orderId) {
    setSmsState((prev) => ({ ...prev, [orderId]: 'sending' }));
    const { error } = await supabase.functions.invoke('notify-fan-ready', {
      body: { orderId },
    });
    setSmsState((prev) => ({ ...prev, [orderId]: error ? 'error' : 'sent' }));
    if (!error) {
      setTimeout(() => setSmsState((prev) => ({ ...prev, [orderId]: undefined })), 3000);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(event.event_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function shareCode() {
    const text = `Join ${event.artist || event.name}'s merch pre-order on Merch PUP!\n\nEvent code: ${event.event_code}`;
    if (navigator.share) {
      navigator.share({ title: 'Merch PUP Event Code', text });
    } else {
      copyCode();
    }
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
    <div className="promoter-event screen">
      <header className="promoter-event__header">
        <button
          className="create__back"
          onClick={() => navigate('/promoter/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Logo size="sm" />
        <div style={{ width: 36 }} />
      </header>

      <div className="promoter-event__content">

        {/* ── Title ── */}
        <div>
          <span className="badge">Event</span>
          <h1 className="promoter-event__title">{event.artist || event.name}</h1>
          <p className="promoter-event__meta">
            {event.venue_name}
            {event.city ? ` · ${event.city}` : ''}
            {event.date ? ` · ${formatDate(event.date)}` : ''}
          </p>
        </div>

        {/* ── Event code card ── */}
        <div className="promoter-event__code-card">
          <p className="promoter-event__code-label">Fan Event Code</p>
          <p className="promoter-event__code">{event.event_code}</p>
          <p className="promoter-event__code-hint">
            Share this with fans so they can connect to your event and browse merch.
          </p>
          <div className="promoter-event__code-actions">
            <button className="btn btn-outline promoter-event__copy-btn" onClick={copyCode}>
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </button>
            <button className="btn btn-outline promoter-event__copy-btn" onClick={shareCode}>
              Share
            </button>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className="promoter-event__tabs" role="tablist">
          <button
            className={`promoter-event__tab ${tab === 'merch' ? 'promoter-event__tab--active' : ''}`}
            role="tab"
            aria-selected={tab === 'merch'}
            onClick={() => setTab('merch')}
          >
            Merch ({merch.length})
          </button>
          <button
            className={`promoter-event__tab ${tab === 'orders' ? 'promoter-event__tab--active' : ''}`}
            role="tab"
            aria-selected={tab === 'orders'}
            onClick={() => setTab('orders')}
          >
            Orders
            {pending > 0 && (
              <span className="promoter-event__tab-badge" aria-label={`${pending} pending`}>
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
            <div className="promoter-event__merch-header">
              <h2 className="promoter-event__section-title">Merch</h2>
              <button
                className="btn btn-primary promoter-event__add-btn"
                onClick={() => navigate(`/promoter/events/${eventId}/merch/new`)}
              >
                + Add Item
              </button>
            </div>

            {merch.length === 0 ? (
              <div className="promoter-event__empty">
                <p>No merch items yet.</p>
                <p>Add your first item to start selling.</p>
              </div>
            ) : (
              <ul className="promoter-event__merch-list">
                {merch.map((item) => (
                  <li key={item.id} className="promoter-merch-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="promoter-merch-card__img" />
                    ) : (
                      <div className="promoter-merch-card__img promoter-merch-card__img--empty" />
                    )}
                    <div className="promoter-merch-card__info">
                      <h3 className="promoter-merch-card__name">{item.name}</h3>
                      <p className="promoter-merch-card__price">${parseFloat(item.price).toFixed(2)}</p>
                      {item.sizes?.length > 0 && (
                        <p className="promoter-merch-card__meta">{item.sizes.join(' · ')}</p>
                      )}
                      <p className="promoter-merch-card__meta promoter-merch-card__qty">
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
            <div className="promoter-orders__stats">
              <div className="promoter-orders__stat">
                <span className="promoter-orders__stat-val">{totalOrders}</span>
                <span className="promoter-orders__stat-label">Orders</span>
              </div>
              <div className="promoter-orders__stat-divider" />
              <div className="promoter-orders__stat">
                <span className="promoter-orders__stat-val promoter-orders__stat-val--pending">{pending}</span>
                <span className="promoter-orders__stat-label">Pending</span>
              </div>
              <div className="promoter-orders__stat-divider" />
              <div className="promoter-orders__stat">
                <span className="promoter-orders__stat-val promoter-orders__stat-val--done">{pickedUp}</span>
                <span className="promoter-orders__stat-label">Picked Up</span>
              </div>
              <div className="promoter-orders__stat-divider" />
              <div className="promoter-orders__stat">
                <span className="promoter-orders__stat-val">${revenue.toFixed(2)}</span>
                <span className="promoter-orders__stat-label">Revenue</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="promoter-event__empty">
                <p>No orders yet.</p>
                <p>New orders will appear here in real time.</p>
              </div>
            ) : (
              <ul className="promoter-orders__list">
                {orders.map((order) => {
                  const isNew = newOrderIds.current.has(order.id);
                  const isPaid = order.status === 'paid';
                  return (
                    <li
                      key={order.id}
                      className={`promoter-order-card ${isNew ? 'promoter-order-card--new' : ''} ${!isPaid ? 'promoter-order-card--done' : ''}`}
                    >
                      <div className="promoter-order-card__top">
                        <div>
                          <p className="promoter-order-card__code">{order.qr_code}</p>
                          <p className="promoter-order-card__time">{formatTime(order.created_at)}</p>
                          {order.fan?.name && (
                            <p className="promoter-order-card__fan">{order.fan.name}</p>
                          )}
                          {order.fan?.phone && (
                            <a
                              className="promoter-order-card__phone"
                              href={`tel:${order.fan.phone}`}
                            >
                              {order.fan.phone}
                            </a>
                          )}
                        </div>
                        <span className={`promoter-order-card__status ${isPaid ? 'promoter-order-card__status--paid' : 'promoter-order-card__status--done'}`}>
                          {isPaid ? 'Ready' : 'Picked Up'}
                        </span>
                      </div>

                      {/* Items */}
                      <ul className="promoter-order-card__items">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="promoter-order-card__item">
                            <span className="promoter-order-card__item-name">{item.name}</span>
                            {item.size && item.size !== 'One Size' && (
                              <span className="promoter-order-card__item-size">{item.size}</span>
                            )}
                            <span className="promoter-order-card__item-qty">×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="promoter-order-card__footer">
                        <span className="promoter-order-card__total">${parseFloat(order.total).toFixed(2)}</span>
                        {isPaid && (
                          <div className="promoter-order-card__actions">
                            {order.fan?.phone && (
                              <button
                                className={`btn promoter-order-card__sms-btn ${smsState[order.id] === 'sent' ? 'promoter-order-card__sms-btn--sent' : smsState[order.id] === 'error' ? 'promoter-order-card__sms-btn--error' : ''}`}
                                onClick={() => notifyFan(order.id)}
                                disabled={!!smsState[order.id]}
                              >
                                {smsState[order.id] === 'sending' ? 'Sending…'
                                  : smsState[order.id] === 'sent' ? 'Sent!'
                                  : smsState[order.id] === 'error' ? 'Failed'
                                  : 'Text Fan'}
                              </button>
                            )}
                            <button
                              className="btn btn-accent promoter-order-card__pickup-btn"
                              onClick={() => markPickedUp(order.id)}
                            >
                              Mark Picked Up
                            </button>
                          </div>
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
