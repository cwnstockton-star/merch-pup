import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateEventCode } from '../lib/utils';
import Logo from '../components/Logo';
import './CreateAccountScreen.css';
import './VenueCreateEventScreen.css';

export default function VenueCreateEventScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState({
    artist: '',
    name: '',
    date: '',
    venueName: '',
    city: '',
    address: '',
    description: '',
    pickupWindow: '',
    directions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        owner_id: session.user.id,
        artist: form.artist,
        name: form.name || form.artist,
        date: form.date,
        venue_name: form.venueName,
        city: form.city,
        address: form.address,
        description: form.description,
        pickup_window: form.pickupWindow,
        directions: form.directions.split('\n').filter((d) => d.trim()),
        event_code: generateEventCode(),
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/venue/events/${event.id}`);
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
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
        <div style={{ width: 32 }} />
      </div>

      <div className="create__content">
        <div className="create__heading-wrap">
          <div className="create__heading-highlight" aria-hidden="true" />
          <h1 className="create__heading">
            New<br />Event.
          </h1>
        </div>

        <p className="create__sub">
          Fill in the details. Fans will see all of this when they connect.
        </p>

        <form className="venue-form" onSubmit={handleSubmit} noValidate>

          <div className="venue-form__section">
            <h2 className="venue-form__section-title">The Show</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="artist">Artist / Act Name</label>
              <input className="input-field" id="artist" name="artist" type="text"
                placeholder="The Midnight" value={form.artist} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="name">Event Subtitle <span className="venue-form__optional">(optional)</span></label>
              <input className="input-field" id="name" name="name" type="text"
                placeholder="Monsters Tour 2026" value={form.name} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="date">Date</label>
              <input className="input-field" id="date" name="date" type="date"
                value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="venue-form__section">
            <h2 className="venue-form__section-title">Location</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="venueName">Venue Name</label>
              <input className="input-field" id="venueName" name="venueName" type="text"
                placeholder="Orpheum Theatre" value={form.venueName} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="city">City</label>
              <input className="input-field" id="city" name="city" type="text"
                placeholder="Tampa, FL" value={form.city} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="address">Full Address</label>
              <input className="input-field" id="address" name="address" type="text"
                placeholder="1811 N Ola Ave, Tampa, FL 33602" value={form.address} onChange={handleChange} />
            </div>
          </div>

          <div className="venue-form__section">
            <h2 className="venue-form__section-title">Fan Experience</h2>

            <div className="input-group">
              <label className="input-label" htmlFor="description">Event Description</label>
              <textarea className="input-field input-textarea" id="description" name="description"
                placeholder="Tell fans what to expect…" rows={3}
                value={form.description} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="pickupWindow">Pickup Window</label>
              <input className="input-field" id="pickupWindow" name="pickupWindow" type="text"
                placeholder="6:00 PM – 7:30 PM" value={form.pickupWindow} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="directions">Pickup Directions</label>
              <p className="venue-form__hint">One step per line — fans see these as a numbered list.</p>
              <textarea className="input-field input-textarea" id="directions" name="directions"
                placeholder={"Enter through the main entrance.\nFollow signs to the merch table.\nShow your QR code."}
                rows={4} value={form.directions} onChange={handleChange} />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="create__actions">
            <button type="submit" className="btn btn-primary btn-lg btn-block create__cta" disabled={loading}>
              {loading ? 'Creating event…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
