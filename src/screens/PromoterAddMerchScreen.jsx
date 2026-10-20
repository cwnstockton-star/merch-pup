import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';
import './PromoterCreateEventScreen.css';
import './PromoterAddMerchScreen.css';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CATEGORIES = ['Tops', 'Accessories', 'Art', 'Music', 'Other'];

export default function PromoterAddMerchScreen() {
  const { eventId, merchId } = useParams();
  const isEditing = Boolean(merchId);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: 'Tops',
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  // Per-size stock counts as typed, e.g. { S: '10', M: '4' }
  const [sizeStock, setSizeStock] = useState({});
  // Item saved before per-size stock existed — needs counts entered once
  const [needsSizeStock, setNeedsSizeStock] = useState(false);
  // Stock when the edit form was opened, so saving applies only the change
  // (sales made while editing aren't erased)
  const [loadedStock, setLoadedStock] = useState({ sizes: {}, total: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    async function loadItem() {
      const { data } = await supabase
        .from('merch_items')
        .select('*')
        .eq('id', merchId)
        .single();

      if (!data) {
        setNotFound(true);
        setInitialLoading(false);
        return;
      }

      setForm({
        name: data.name || '',
        description: data.description || '',
        price: data.price ?? '',
        quantity: data.quantity_available ?? '',
        category: data.category || 'Tops',
      });
      setSelectedSizes(data.sizes || []);
      const savedSizeStock = data.size_stock || {};
      setLoadedStock({ sizes: savedSizeStock, total: data.quantity_available ?? 0 });
      setSizeStock(Object.fromEntries(
        Object.entries(savedSizeStock).map(([size, count]) => [size, String(count)])
      ));
      setNeedsSizeStock((data.sizes || []).some((size) => !(size in savedSizeStock)));
      setExistingImageUrl(data.image_url || null);
      setInitialLoading(false);
    }
    loadItem();
  }, [isEditing, merchId]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSizeStockChange(size, value) {
    setSizeStock((prev) => ({ ...prev, [size]: value }));
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

    // With sizes, stock is entered per size and the total is their sum
    const hasSizes = selectedSizes.length > 0;
    const missingSize = selectedSizes.find((size) => !/^\d+$/.test(String(sizeStock[size] ?? '').trim()));
    if (hasSizes && missingSize) {
      setError(`Enter how many ${missingSize} you have in stock (0 is fine).`);
      return;
    }
    if (!hasSizes && !/^\d+$/.test(String(form.quantity).trim())) {
      setError('Enter how many you have in stock.');
      return;
    }
    const sizeCounts = Object.fromEntries(
      selectedSizes.map((size) => [size, parseInt(sizeStock[size], 10)])
    );
    const totalStock = hasSizes
      ? Object.values(sizeCounts).reduce((sum, n) => sum + n, 0)
      : parseInt(form.quantity, 10);

    setLoading(true);

    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${eventId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await withTimeout(
          supabase.storage.from('merch-images').upload(filePath, imageFile)
        );

        if (uploadError) {
          setError('Image upload failed: ' + uploadError.message);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('merch-images')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const details = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        sizes: selectedSizes,
        image_url: imageUrl,
        category: form.category,
      };

      if (!isEditing) {
        const { error: saveError } = await withTimeout(
          supabase.from('merch_items').insert({
            ...details,
            size_stock: sizeCounts,
            quantity_available: totalStock,
            event_id: eventId,
          })
        );
        if (saveError) {
          setError(saveError.message);
          return;
        }
        navigate(`/promoter/events/${eventId}`, {
          state: { notice: { tone: 'success', text: `${form.name} added to your event.` } },
        });
        return;
      }

      // Editing: save the details, then the stock as a change from when the
      // form was opened (see update_merch_stock in migration 003)
      const { data: updatedRows, error: saveError } = await withTimeout(
        supabase.from('merch_items').update(details).eq('id', merchId).select('id')
      );
      if (saveError) {
        setError(saveError.message);
        return;
      }
      if (!updatedRows?.length) {
        // a blocked update returns no error, just no rows
        setError("Couldn't save changes to this item. Make sure you're signed in as its promoter.");
        return;
      }

      const { data: stockResult, error: stockError } = await withTimeout(
        supabase.rpc('update_merch_stock', {
          p_item_id: merchId,
          p_loaded_sizes: loadedStock.sizes,
          p_new_sizes: sizeCounts,
          p_loaded_total: loadedStock.total,
          p_new_total: totalStock,
        })
      );
      if (stockError) {
        setError('Details saved, but stock could not be updated: ' + stockError.message);
        return;
      }

      const sold = stockResult?.sold_while_editing ?? 0;
      navigate(`/promoter/events/${eventId}`, {
        state: {
          notice: sold > 0
            ? {
                tone: 'warning',
                text: `Changes saved. ${sold} ${form.name} sold while you were editing — those `
                  + `sales were kept, so stock is now ${stockResult.quantity_available}.`,
              }
            : { tone: 'success', text: `Changes to ${form.name} saved.` },
        },
      });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="screen" style={{ padding: 32 }}>
        <p style={{ color: 'var(--color-gray-600)' }}>Item not found.</p>
      </div>
    );
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
        <button
          className="create__back"
          onClick={() => navigate(`/promoter/events/${eventId}`)}
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
            {isEditing ? <>Edit<br />Item.</> : <>Add<br />Item.</>}
          </h1>
        </div>

        <p className="create__sub">
          Fans will see this when they browse merch for your event.
        </p>

        <form className="promoter-form" onSubmit={handleSubmit} noValidate>

          {/* Photo */}
          <div className="input-group">
            <label className="input-label">Photo</label>
            <label className="merch-upload__zone" htmlFor="image-upload">
              {imagePreview || existingImageUrl ? (
                <img src={imagePreview || existingImageUrl} alt="Preview" className="merch-upload__preview" />
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

          <div className="promoter-form__section">
            <h2 className="promoter-form__section-title">Item Details</h2>

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

          <div className="promoter-form__section">
            <h2 className="promoter-form__section-title">Pricing & Stock</h2>

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

            {selectedSizes.length > 0 ? (
              <div className="input-group">
                <label className="input-label">Stock per Size</label>
                {needsSizeStock && (
                  <p className="merch-stock__hint">
                    Stock is now tracked per size. Enter how many of each size you have.
                  </p>
                )}
                <div className="merch-stock">
                  {ALL_SIZES.filter((size) => selectedSizes.includes(size)).map((size) => (
                    <div key={size} className="merch-stock__row">
                      <label className="merch-stock__size" htmlFor={`stock-${size}`}>{size}</label>
                      <input
                        className="input-field merch-stock__input"
                        id={`stock-${size}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={sizeStock[size] ?? ''}
                        onChange={(e) => handleSizeStockChange(size, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <p className="merch-stock__total">
                  Total in stock:{' '}
                  {selectedSizes.reduce((sum, size) => sum + (parseInt(sizeStock[size], 10) || 0), 0)}
                </p>
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label" htmlFor="quantity">Quantity Available</label>
                <input className="input-field" id="quantity" name="quantity" type="number"
                  min="0" placeholder="50"
                  value={form.quantity} onChange={handleChange} required />
              </div>
            )}
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="create__actions">
            <button type="submit" className="btn btn-primary btn-tilt btn-lg btn-block create__cta" disabled={loading}>
              {loading
                ? (isEditing ? 'Saving…' : 'Adding item…')
                : (isEditing ? 'Save Changes' : 'Add to Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
