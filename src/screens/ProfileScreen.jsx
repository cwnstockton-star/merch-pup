import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CartButton from '../components/CartButton';
import { mockUser, mockCart } from '../data/mock';
import './ProfileScreen.css';

const SECTIONS = [
  {
    heading: 'Account',
    items: [
      {
        label: 'Payment Methods',
        path: '/payment-methods',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
      },
      {
        label: 'Order History',
        path: '/order-history',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Preferences',
    items: [
      {
        label: 'Notifications',
        path: '/notifications',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        label: 'Account Settings',
        path: '/settings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Derive initials from name
function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileScreen() {
  const navigate = useNavigate();

  return (
    <div className="profile screen">
      {/* ── Header ── */}
      <header className="profile__header">
        <span className="profile__header-title">Profile</span>
        <CartButton count={mockCart.length} />
      </header>

      <main className="profile__content">

        {/* ── Profile hero ── */}
        <div className="profile__hero">
          <div className="profile__avatar" aria-hidden="true">
            {getInitials(mockUser.name)}
          </div>
          <div className="profile__identity">
            <h1 className="profile__name">{mockUser.name}</h1>
            <p className="profile__email">{mockUser.email}</p>
            <p className="profile__phone">{mockUser.phone}</p>
          </div>
          <button
            className="btn btn-outline profile__edit-btn"
            onClick={() => {}}
            aria-label="Edit profile"
          >
            Edit
          </button>
        </div>

        <div className="divider" />

        {/* ── Section list ── */}
        {SECTIONS.map((section) => (
          <div key={section.heading} className="profile__section">
            <h2 className="profile__section-heading">{section.heading}</h2>
            <ul className="profile__list">
              {section.items.map((item) => (
                <li key={item.label}>
                  <button
                    className="profile__row"
                    onClick={() => navigate(item.path)}
                  >
                    <span className="profile__row-icon">{item.icon}</span>
                    <span className="profile__row-label">{item.label}</span>
                    <span className="profile__row-chevron"><ChevronRight /></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* ── Sign Out ── */}
        <div className="profile__section profile__section--danger">
          <ul className="profile__list">
            <li>
              <button
                className="profile__row profile__row--danger"
                onClick={() => navigate('/')}
              >
                <span className="profile__row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                <span className="profile__row-label">Sign Out</span>
                <span className="profile__row-chevron"><ChevronRight /></span>
              </button>
            </li>
          </ul>
        </div>

        {/* App version */}
        <p className="profile__version">Merch P.U.P. v0.1.0 - pre-release</p>

      </main>

      <BottomNav />
    </div>
  );
}
