import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatEventDate } from '../lib/utils';
import './OrderHistoryScreen.css';

function StatusBadge({ status }) {
  const isPickedUp = status === 'picked_up';
  return (
    <span className={`order-hist__status ${isPickedUp ? 'order-hist__status--done' : 'order-hist__status--paid'}`}>
      {isPickedUp ? 'Picked Up' : 'Ready'}
    </span>
  );
}

function OrderCard({ order }) {
  const [qrOpen, setQrOpen] = useState(false);
  const event = order.events;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(order.qr_code)}`;

  return (
    <li className="order-hist__card">
      {/* ── Card header ── */}
      <div className="order-hist__card-header">
        <div className="order-hist__event-info">
          <p className="order-hist__event-name">{event?.artist || 'Unknown Event'}</p>
          <p className="order-hist__event-meta">
            {event?.venue_name}
            {event?.date ? ` · ${formatEventDate(event.date)}` : ''}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ── Items ── */}
      <ul className="order-hist__items">
        {order.order_items?.map((item) => (
          <li key={item.id} className="order-hist__item">
            <span className="order-hist__item-name">
              {item.name}
              {item.size && item.size !== 'One Size' && (
                <span className="order-hist__item-size"> · {item.size}</span>
              )}
            </span>
            <span className="order-hist__item-right">
              <span className="order-hist__item-qty">×{item.quantity}</span>
              <span className="order-hist__item-price">${(item.price * item.quantity).toFixed(2)}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* ── Footer: total + QR toggle ── */}
      <div className="order-hist__card-footer">
        <span className="order-hist__total">${parseFloat(order.total).toFixed(2)} total</span>
        <button
          className="order-hist__qr-toggle"
          onClick={() => setQrOpen((o) => !o)}
          aria-expanded={qrOpen}
        >
          {qrOpen ? 'Hide QR' : 'Show QR'}
          <svg
            width="13" height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transform: qrOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── QR panel ── */}
      {qrOpen && (
        <div className="order-hist__qr-panel">
          <p className="order-hist__qr-hint">Show this at the merch table</p>
          <div className="order-hist__qr-frame">
            <img
              src={qrUrl}
              alt={`QR code for order ${order.qr_code}`}
              width="180"
              height="180"
              className="order-hist__qr-img"
            />
          </div>
          <p className="order-hist__qr-code">{order.qr_code}</p>
        </div>
      )}
    </li>
  );
}

export default function OrderHistoryScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), events(artist, venue_name, date)')
        .eq('fan_id', session.user.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }
    loadOrders();
  }, [session.user.id]);

  return (
    <div className="order-hist screen">

      {/* ── Header ── */}
      <header className="order-hist__header">
        <button
          className="order-hist__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="order-hist__title">Order History</h1>
        <CartButton />
      </header>

      {/* ── Content ── */}
      {loading ? (
        <div className="order-hist__state">
          <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="order-hist__state order-hist__empty">
          <div className="order-hist__empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <p className="order-hist__empty-title">No orders yet.</p>
          <p className="order-hist__empty-sub">Your confirmed orders will show up here.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8, padding: '12px 28px' }}
            onClick={() => navigate('/events')}
          >
            Browse Events
          </button>
        </div>
      ) : (
        <main className="order-hist__content">
          <ul className="order-hist__list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        </main>
      )}

      <BottomNav />
    </div>
  );
}
