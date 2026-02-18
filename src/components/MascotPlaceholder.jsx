import './MascotPlaceholder.css';

/**
 * MascotPlaceholder — drop-in box showing where the mascot illustration lives.
 * Replace this entire component with <img src={mascot} /> when the artwork is ready.
 *
 * Props:
 *   size  — 'sm' | 'md' | 'lg'  (default: 'md')
 *   label — optional override text shown inside the box
 */
export default function MascotPlaceholder({ size = 'md', label }) {
  return (
    <div className={`mascot-placeholder mascot-placeholder--${size}`} aria-hidden="true">
      {/* Paw print made of circles — purely decorative */}
      <div className="mascot-placeholder__paw">
        <div className="paw-main" />
        <div className="paw-toes">
          <div className="paw-toe" />
          <div className="paw-toe" />
          <div className="paw-toe" />
          <div className="paw-toe" />
        </div>
      </div>
      <span className="mascot-placeholder__label">{label ?? 'MASCOT'}</span>
      <span className="mascot-placeholder__sub">Drop illustration here</span>
    </div>
  );
}
