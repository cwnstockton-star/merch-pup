import './Logo.css';

/**
 * Logo — reusable brand mark.
 *
 * To swap in a real SVG/image later, replace the contents of the
 * .logo__badge div. The rest of the component stays the same.
 *
 * Props:
 *   size   — 'sm' | 'md' | 'lg'  (default: 'md')
 *   theme  — 'dark' | 'light'    (default: 'dark')
 *             dark  = black badge, yellow text
 *             light = yellow badge, black text
 */
export default function Logo({ size = 'md', theme = 'dark' }) {
  return (
    <div className={`logo logo--${size} logo--${theme}`}>
      <div className="logo__badge">
        {/* ── SWAP POINT ──────────────────────────────────────────
            Replace the markup below with <img src={logoSvg} />
            or an <svg> import when the real asset is ready.
            ──────────────────────────────────────────────────── */}
        <div className="logo__outer-ring">
          <div className="logo__yellow-ring">
            <div className="logo__inner">
              <span className="logo__mp">MP</span>
            </div>
          </div>
        </div>
      </div>
      <span className="logo__wordmark">MERCH P.U.P.</span>
    </div>
  );
}
