import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CartButton from '../components/CartButton';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import './ProductDetailScreen.css';

export default function ProductDetailScreen() {
  const { eventId, merchId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addItem } = useCart();

  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: itemData } = await supabase
        .from('merch_items')
        .select('*')
        .eq('id', merchId)
        .single();

      if (itemData) {
        setItem(itemData);
        // Pre-select size if there's only one
        if (itemData.sizes?.length === 1) setSelectedSize(itemData.sizes[0]);

        const { data: relatedData } = await supabase
          .from('merch_items')
          .select('*')
          .eq('event_id', itemData.event_id)
          .neq('id', itemData.id)
          .order('created_at');
        setRelated(relatedData || []);
      }
      setLoading(false);
    }
    loadData();
  }, [merchId]);

  function handleAddToCart() {
    const size = selectedSize || (sizes.length === 1 ? sizes[0] : 'One Size');
    addItem(item, size, qty, eventId);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="screen" style={{ padding: 32 }}>
        <p style={{ color: 'var(--color-gray-600)' }}>Item not found.</p>
      </div>
    );
  }

  // Treat the single image_url as a one-item array to keep carousel logic intact
  const images = item.image_url ? [item.image_url] : [];
  const sizes = item.sizes || [];

  return (
    <div className="product-detail screen">

      {/* ── Sticky header ── */}
      <div className="product-detail__header">
        <button
          className="product-detail__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="product-detail__header-label">Merch</span>
        <CartButton />
      </div>

      {/* ── Scrollable body ── */}
      <main className="product-detail__body">

        {/* ── Image ── */}
        <div className="product-detail__carousel">
          {images.length > 0 ? (
            <div
              className="product-detail__img"
              style={{ backgroundImage: `url(${images[imgIndex]})` }}
              role="img"
              aria-label={`${item.name} - image ${imgIndex + 1}`}
            />
          ) : (
            <div
              className="product-detail__img"
              style={{ background: 'var(--color-gray-100)' }}
              role="img"
              aria-label={`${item.name} - no image`}
            />
          )}
        </div>

        {/* ── Info block ── */}
        <div className="product-detail__info">

          <div className="product-detail__meta-row">
            {item.category && (
              <span className="product-detail__category badge">{item.category}</span>
            )}
            <span className="product-detail__price">${parseFloat(item.price).toFixed(2)}</span>
          </div>

          <h1 className="product-detail__name">{item.name}</h1>
          {item.description && <p className="product-detail__desc">{item.description}</p>}

          {/* ── Size selector ── */}
          {sizes.length > 0 && !(sizes.length === 1 && sizes[0] === 'One Size') && (
            <div className="product-detail__size-section">
              <p className="product-detail__field-label">
                Size
                {selectedSize && <span className="product-detail__size-chosen"> — {selectedSize}</span>}
              </p>
              <div className="product-detail__sizes" role="group" aria-label="Select size">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`product-detail__size-pill ${selectedSize === s ? 'product-detail__size-pill--active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                    aria-pressed={selectedSize === s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quantity stepper ── */}
          <div className="product-detail__qty-section">
            <p className="product-detail__field-label">Quantity</p>
            <div className="product-detail__qty-stepper">
              <button
                className="product-detail__qty-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={qty <= 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span className="product-detail__qty-val" aria-live="polite" aria-label={`Quantity: ${qty}`}>{qty}</span>
              <button
                className="product-detail__qty-btn"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Add to Cart ── */}
          <button
            className={`btn btn-primary product-detail__add-btn ${added ? 'product-detail__add-btn--added' : ''}`}
            onClick={handleAddToCart}
            disabled={sizes.length > 1 && !selectedSize}
            aria-live="polite"
          >
            {added ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added to Cart
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {sizes.length > 1 && !selectedSize
                  ? 'Select a Size'
                  : `Pre-Order — $${(parseFloat(item.price) * qty).toFixed(2)}`}
              </>
            )}
          </button>

          {/* ── More from this show ── */}
          {related.length > 0 && (
            <div className="product-detail__related">
              <h2 className="product-detail__related-title">More from this show</h2>
              <div className="product-detail__related-scroll">
                {related.map((rel) => (
                  <article
                    key={rel.id}
                    className="product-detail__related-card"
                    onClick={() => navigate(`/events/${eventId}/merch/${rel.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${eventId}/merch/${rel.id}`)}
                    aria-label={`${rel.name}, $${rel.price}`}
                  >
                    <div
                      className="product-detail__related-img"
                      style={rel.image_url
                        ? { backgroundImage: `url(${rel.image_url})` }
                        : { background: 'var(--color-gray-100)' }
                      }
                      aria-hidden="true"
                    />
                    <div className="product-detail__related-info">
                      <p className="product-detail__related-name">{rel.name}</p>
                      <p className="product-detail__related-price">${parseFloat(rel.price).toFixed(2)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
