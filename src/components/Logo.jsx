import logoImg from '../assets/merchpuplogoblob26_orange.png';
import './Logo.css';

export default function Logo({ size = 'md' }) {
  return (
    <div className={`logo logo--${size}`}>
      <img src={logoImg} alt="Merch P.U.P. logo" className="logo__img" />
      <span className="logo__wordmark">MERCH P.U.P.</span>
    </div>
  );
}
