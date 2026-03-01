import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import LoginScreen from './screens/LoginScreen';
import ConnectEventScreen from './screens/ConnectEventScreen';
import HomeFeedScreen from './screens/HomeFeedScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyEventsScreen from './screens/MyEventsScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import VenueDashboardScreen from './screens/VenueDashboardScreen';
import VenueSignupScreen from './screens/VenueSignupScreen';
import VenueCreateEventScreen from './screens/VenueCreateEventScreen';
import VenueEventScreen from './screens/VenueEventScreen';
import VenueAddMerchScreen from './screens/VenueAddMerchScreen';

// Redirects unauthenticated users to /login.
// If requiredRole is set, also checks that the user's role matches.
function ProtectedRoute({ requiredRole, children }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Send venue users to their dashboard, fans to the home feed
    return <Navigate to={profile?.role === 'venue' ? '/venue/dashboard' : '/home'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/create-account" element={<CreateAccountScreen />} />
      <Route path="/login" element={<LoginScreen />} />

      {/* Fan-only */}
      <Route path="/connect-event" element={<ProtectedRoute requiredRole="fan"><ConnectEventScreen /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute requiredRole="fan"><HomeFeedScreen /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute requiredRole="fan"><EventsListScreen /></ProtectedRoute>} />
      <Route path="/events/:eventId" element={<ProtectedRoute requiredRole="fan"><EventDetailScreen /></ProtectedRoute>} />
      <Route path="/events/:eventId/merch/:merchId" element={<ProtectedRoute requiredRole="fan"><ProductDetailScreen /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute requiredRole="fan"><CartScreen /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute requiredRole="fan"><OrderConfirmationScreen /></ProtectedRoute>} />
      <Route path="/my-events" element={<ProtectedRoute requiredRole="fan"><MyEventsScreen /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requiredRole="fan"><ProfileScreen /></ProtectedRoute>} />
      <Route path="/order-history" element={<ProtectedRoute requiredRole="fan"><OrderHistoryScreen /></ProtectedRoute>} />

      {/* Venue signup — public */}
      <Route path="/venue/signup" element={<VenueSignupScreen />} />

      {/* Venue-only */}
      <Route path="/venue/dashboard" element={<ProtectedRoute requiredRole="venue"><VenueDashboardScreen /></ProtectedRoute>} />
      <Route path="/venue/events/new" element={<ProtectedRoute requiredRole="venue"><VenueCreateEventScreen /></ProtectedRoute>} />
      <Route path="/venue/events/:eventId" element={<ProtectedRoute requiredRole="venue"><VenueEventScreen /></ProtectedRoute>} />
      <Route path="/venue/events/:eventId/merch/new" element={<ProtectedRoute requiredRole="venue"><VenueAddMerchScreen /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-shell">
            <AppRoutes />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
