import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MascotPlaceholder from '../components/MascotPlaceholder';
import './OnboardingScreen.css';

const SLIDES = [
  {
    headline: 'Merch lines\nsuck.',
    sub: "You know the feeling. Show starts in 10. Line's around the block.",
    mascotLabel: 'MASCOT — Slide 1',
  },
  {
    headline: 'So we\nfixed it.',
    sub: 'Browse merch before the show. Add to cart. Pay in seconds.',
    mascotLabel: 'MASCOT — Slide 2',
  },
  {
    headline: 'Pick it up.\nNo wait.',
    sub: 'Just scan your QR code at the merch table and go.',
    mascotLabel: 'MASCOT — Slide 3',
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      navigate('/create-account');
    } else {
      setCurrent((c) => c + 1);
    }
  }

  const slide = SLIDES[current];

  return (
    <div className="onboard screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="onboard__slide" key={current}>
        {/* Upper zone — mascot centered as focal point */}
        <div className="onboard__mascot-zone">
          <MascotPlaceholder size="lg" label={slide.mascotLabel} />
        </div>

        {/* Lower zone — headline + subtext pinned to bottom of slide */}
        <div className="onboard__text">
          <div className="onboard__headline-wrap">
            <div className="onboard__headline-highlight" aria-hidden="true" />
            <h1 className="onboard__headline">
              {slide.headline.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </div>

          <p className="onboard__sub">{slide.sub}</p>
        </div>
      </div>

      {/* Bottom dock — dots + button */}
      <div className="onboard__dock">
        <div className="onboard__dots" role="tablist" aria-label="Slide progress">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
              className={`onboard__dot ${i === current ? 'onboard__dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg btn-block onboard__cta"
          onClick={handleNext}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>

        {!isLast && (
          <button
            className="text-link"
            onClick={() => navigate('/create-account')}
          >
            Skip
          </button>
        )}
      </div>

      <div className="splash__bottom-bar" />
    </div>
  );
}
