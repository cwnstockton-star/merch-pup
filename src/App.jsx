import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import ConnectEventScreen from './screens/ConnectEventScreen';
import HomeFeedScreen from './screens/HomeFeedScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyEventsScreen from './screens/MyEventsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/create-account" element={<CreateAccountScreen />} />
          <Route path="/connect-event" element={<ConnectEventScreen />} />
          <Route path="/home" element={<HomeFeedScreen />} />
          <Route path="/events" element={<EventsListScreen />} />
          <Route path="/events/:eventId" element={<EventDetailScreen />} />
          <Route path="/events/:eventId/merch/:merchId" element={<ProductDetailScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/order-confirmation" element={<OrderConfirmationScreen />} />
          <Route path="/my-events" element={<MyEventsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
