import { useNavigate } from 'react-router-dom';
import './CartButton.css';

/**
 * CartButton — floating cart icon for screen headers.
 * Only renders when count > 0.
 * Drop this into any screen's header row to get the persistent cart access.
 */
export default function CartButton({ count = 0 }) {
  const navigate = useNavigate();
  if (count === 0) return null;

  return (
    <button
      className="cart-btn"
      onClick={() => navigate('/cart')}
      aria-label={`View cart, ${count} item${count !== 1 ? 's' : ''}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="cart-btn__badge">{count}</span>
    </button>
  );
}
