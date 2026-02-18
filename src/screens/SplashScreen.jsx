import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './SplashScreen.css';

export default function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="splash screen">
      {/* ── Grain texture overlay — CSS only, pointer-events off ── */}
      <div className="splash__grain" aria-hidden="true" />

      {/* ── Yellow accent bar at top ── */}
      <div className="splash__top-bar" />

      {/* ── Logo zone — centered, dominant, near top ── */}
      <div className="splash__logo-zone">
        <Logo size="xl" />
      </div>

      {/* ── Body — left-aligned, concert-poster layout ── */}
      <div className="splash__body">

        {/* Tagline with rotated yellow slab behind it */}
        <div className="splash__tagline-wrap">
          <div className="splash__tagline-highlight" aria-hidden="true" />
          <h1 className="splash__tagline">
            Ditch the line.<br />Join the crowd.
          </h1>
        </div>

        <p className="splash__sub">
          Preorder your merch. Pick it up at the merch table. Enjoy the show.
        </p>

        {/* Thick horizontal rule */}
        <div className="splash__rule" role="separator" />

        {/* CTA */}
        <div className="splash__actions">
          <button
            className="btn btn-primary btn-lg btn-block splash__cta"
            onClick={() => navigate('/onboarding')}
          >
            Get Started
          </button>

          <button
            className="text-link"
            onClick={() => navigate('/home')}
          >
            Already have an account?{' '}
            <span className="text-link--bold">Sign in</span>
          </button>
        </div>
      </div>

      {/* ── Black accent bar at bottom ── */}
      <div className="splash__bottom-bar" />
    </div>
  );
}
