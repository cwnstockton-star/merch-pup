import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './ConnectEventScreen.css';

export default function ConnectEventScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleCodeSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = code.trim().toUpperCase();
    setLoading(true);

    // Look up event by code
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .eq('event_code', trimmed)
      .single();

    if (fetchError || !event) {
      setError('Event code not found. Double-check the code and try again.');
      setLoading(false);
      return;
    }

    // Record the connection (upsert so re-connecting is idempotent)
    await supabase.from('event_connections').upsert(
      { fan_id: session.user.id, event_id: event.id },
      { onConflict: 'fan_id,event_id' }
    );

    setLoading(false);
    navigate(`/events/${event.id}`, { state: { autoFollowed: true } });
  }

  function handleScanTrigger() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    if (e.target.files?.length) {
      // QR scanning requires a library — keeping this as a visual placeholder for now
      setScanning(true);
      setTimeout(() => setScanning(false), 1200);
    }
  }

  return (
    <div className="connect screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      {/* Nav */}
      <div className="create__nav">
        <button
          className="create__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Logo size="sm" />
        <div style={{ width: 36 }} />
      </div>

      {/* Content */}
      <div className="connect__content">

        <div className="connect__heading-wrap">
          <div className="connect__heading-highlight" aria-hidden="true" />
          <h1 className="connect__heading">
            Connect<br />to an event.
          </h1>
        </div>

        <p className="connect__sub">
          Your venue or artist will provide a code or QR link.
        </p>

        <div className="connect__cards">

          {/* Card A — Enter Code */}
          <div className="connect__card">
            <div className="connect__card-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M8 10h8M8 14h4" />
              </svg>
            </div>
            <h2 className="connect__card-title">Enter Event Code</h2>

            <form className="connect__code-form" onSubmit={handleCodeSubmit}>
              <input
                className="input-field connect__code-input"
                type="text"
                placeholder="e.g. ABC123"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                aria-label="Event code"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button
                type="submit"
                className="connect__code-submit"
                aria-label="Submit code"
                disabled={!code.trim() || loading}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="connect__scan-spin" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </form>

            {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
          </div>

          {/* Card B — Scan Ticket */}
          <div className={`connect__card ${scanning ? 'connect__card--scanning' : ''}`}>
            <div className="connect__card-icon" aria-hidden="true">
              {scanning ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="connect__scan-spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
                </svg>
              )}
            </div>

            <h2 className="connect__card-title">
              {scanning ? 'Scanning...' : 'Scan Ticket'}
            </h2>

            <p className="connect__card-hint">
              {scanning ? 'Reading your ticket' : 'Open camera to scan your QR or barcode'}
            </p>

            <button
              className="connect__scan-btn"
              onClick={handleScanTrigger}
              disabled={scanning}
              aria-label="Open camera to scan ticket"
            >
              {scanning ? 'Reading...' : 'Open Camera'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="connect__file-input"
              onChange={handleFileChange}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

        </div>

        <button
          className="text-link connect__skip"
          onClick={() => navigate('/home')}
        >
          Skip for now - Browse Events
        </button>

      </div>

      <div className="splash__bottom-bar" style={{ marginTop: 'auto' }} />
    </div>
  );
}
