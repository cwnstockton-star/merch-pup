import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';
import './VenueCreateEventScreen.css';
import './VenueAddMerchScreen.css';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CATEGORIES = ['Tops', 'Accessories', 'Art', 'Music', 'Other'];

export default function VenueAddMerchScreen() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: 'Tops',
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleSize(size) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${eventId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('merch-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('merch-images')
        .getPublicUrl(filePath);
      imageUrl = publicUrl;
    }

    const { error: insertError } = await supabase.from('merch_items').insert({
      event_id: eventId,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      sizes: selectedSizes,
      quantity_available: parseInt(form.quantity, 10),
      image_url: imageUrl,
      category: form.category,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/venue/events/${eventId}`);
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
        <button
          className="create__back"
          onClick={() => navigate(`/venue/events/${eventId}`)}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Logo size="sm" />
        <div style={{ width: 32 }} />
      </div>

      <div className="create__content">
        <div className="create__heading-wrap">
          <div className="create__heading-highlight" aria-hidden="true" />
          <h1 className="create__heading">
            Add<br />Item.
          </h1>
        </div>

        <p className="create__sub">
          Fans will see this when they browse merch for your event.
        </p>

        <form className="venue-form" onSubmit={handleSubmit} noValidate>

          {/* Photo */}
          <div className="input-group">
            <label className="input-label">Photo</label>
            <label className="merch-upload__zone" htmlFor="image-upload">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="merch-upload__preview" />
              ) : (
                <div className="merch-upload__placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Tap to upload photo</span>
                </div>
              )}
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          <div className="venue-form__section">
            <h2 className="venue-form__section-title">Item Details</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="name">Item Name</label>
              <input className="input-field" id="name" name="name" type="text"
                placeholder="Monsters Tour Tee" value={form.name} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="category">Category</label>
              <select className="input-field" id="category" name="category"
                value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="description">Description</label>
              <textarea className="input-field input-textarea" id="description" name="description"
                placeholder="Heavyweight cotton. Screen-printed. Built to last." rows={3}
                value={form.description} onChange={handleChange} />
            </div>
          </div>

          <div className="venue-form__section">
            <h2 className="venue-form__section-title">Pricing & Stock</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="price">Price ($)</label>
              <input className="input-field" id="price" name="price" type="number"
                step="0.01" min="0" placeholder="38.00"
                value={form.price} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label">Sizes Available</label>
              <div className="merch-sizes">
                {ALL_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`merch-size-btn ${selectedSizes.includes(size) ? 'merch-size-btn--active' : ''}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="quantity">Quantity Available</label>
              <input className="input-field" id="quantity" name="quantity" type="number"
                min="0" placeholder="50"
                value={form.quantity} onChange={handleChange} required />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="create__actions">
            <button type="submit" className="btn btn-primary btn-lg btn-block create__cta" disabled={loading}>
              {loading ? 'Adding item…' : 'Add to Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
