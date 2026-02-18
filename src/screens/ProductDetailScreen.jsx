import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CartButton from '../components/CartButton';
import BottomNav from '../components/BottomNav';
import { mockMerch, mockCart } from '../data/mock';
import './ProductDetailScreen.css';

export default function ProductDetailScreen() {
  const { eventId, merchId } = useParams();
  const navigate = useNavigate();

  const item = mockMerch.find((m) => m.id === merchId) ?? mockMerch[0];
  const related = mockMerch.filter((m) => m.eventId === item.eventId && m.id !== item.id);

  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    item.sizes.length === 1 ? item.sizes[0] : null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

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
        <CartButton count={mockCart.length} />
      </div>

      {/* ── Scrollable body ── */}
      <main className="product-detail__body">

        {/* ── Image carousel ── */}
        <div className="product-detail__carousel">
          <div
            className="product-detail__img"
            style={{ backgroundImage: `url(${item.images[imgIndex]})` }}
            role="img"
            aria-label={`${item.name} - image ${imgIndex + 1} of ${item.images.length}`}
          />

          {item.images.length > 1 && (
            <>
              {/* Prev / Next tap zones */}
              <button
                className="product-detail__img-prev"
                onClick={() => setImgIndex((i) => (i - 1 + item.images.length) % item.images.length)}
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className="product-detail__img-next"
                onClick={() => setImgIndex((i) => (i + 1) % item.images.length)}
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Dot indicators */}
              <div className="product-detail__dots" role="tablist" aria-label="Image selector">
                {item.images.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === imgIndex}
                    aria-label={`Image ${i + 1}`}
                    className={`product-detail__dot ${i === imgIndex ? 'product-detail__dot--active' : ''}`}
                    onClick={() => setImgIndex(i)}
                  />
                ))}
              </div>

              {/* Front / Back label */}
              <span className="product-detail__img-label">
                {imgIndex === 0 ? 'Front' : 'Back'}
              </span>
            </>
          )}
        </div>

        {/* ── Info block ── */}
        <div className="product-detail__info">

          <div className="product-detail__meta-row">
            <span className="product-detail__category badge">{item.category}</span>
            <span className="product-detail__price">${item.price}</span>
          </div>

          <h1 className="product-detail__name">{item.name}</h1>
          <p className="product-detail__desc">{item.description}</p>

          {/* ── Size selector ── */}
          {!(item.sizes.length === 1 && item.sizes[0] === 'One Size') && (
            <div className="product-detail__size-section">
              <p className="product-detail__field-label">
                Size
                {selectedSize && <span className="product-detail__size-chosen"> — {selectedSize}</span>}
              </p>
              <div className="product-detail__sizes" role="group" aria-label="Select size">
                {item.sizes.map((s) => (
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
            disabled={!selectedSize && item.sizes.length > 1}
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
                {!selectedSize && item.sizes.length > 1 ? 'Select a Size' : `Pre-Order - $${item.price * qty}`}
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
                      style={{ backgroundImage: `url(${rel.images[0]})` }}
                      aria-hidden="true"
                    />
                    <div className="product-detail__related-info">
                      <p className="product-detail__related-name">{rel.name}</p>
                      <p className="product-detail__related-price">${rel.price}</p>
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
