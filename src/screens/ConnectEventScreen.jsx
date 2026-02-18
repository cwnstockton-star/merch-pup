import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { mockEvents } from '../data/mock';
import './ConnectEventScreen.css';

export default function ConnectEventScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef(null);

  function handleCodeSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    // Match typed code against mock events; fall back to first event
    const matched = mockEvents.find((ev) => ev.code.toUpperCase() === trimmed) ?? mockEvents[0];
    navigate(`/events/${matched.id}`, { state: { autoFollowed: true } });
  }

  function handleScanTrigger() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    if (e.target.files?.length) {
      // Mock: any scan resolves to the first event and auto-follows it
      setScanning(true);
      setTimeout(() => {
        navigate(`/events/${mockEvents[0].id}`, { state: { autoFollowed: true } });
      }, 1200);
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

        {/* Heading */}
        <div className="connect__heading-wrap">
          <div className="connect__heading-highlight" aria-hidden="true" />
          <h1 className="connect__heading">
            Connect<br />to an event.
          </h1>
        </div>

        <p className="connect__sub">
          Your venue or artist will provide a code or QR link.
        </p>

        {/* Two equal cards */}
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
                placeholder="e.g. MID-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-label="Event code"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button
                type="submit"
                className="connect__code-submit"
                aria-label="Submit code"
                disabled={!code.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
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

            {/* Hidden file input triggers camera on mobile */}
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

        {/* Skip link */}
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
