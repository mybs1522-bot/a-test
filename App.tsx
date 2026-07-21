import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CheckoutPage from './pages/CheckoutPage';
import OnetimePage from './pages/OnetimePage';
import OfferPage from './pages/OfferPage';
import RenderUpsellPage from './pages/RenderUpsellPage';
import AdminPage from './pages/AdminPage';
import ThankYouPage from './pages/ThankYouPage';
import { initTrafficTracking } from './services/traffic-tracking';

const App: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Initialize traffic tracking globally
  useEffect(() => {
    initTrafficTracking();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/render-upsell" element={<RenderUpsellPage />} />
      {/* Redirect old free SketchUp routes to the main landing page */}
      <Route path="/sketchup" element={<Navigate to="/" replace />} />
      <Route path="/sketchup-checkout" element={<Navigate to="/checkout" replace />} />
      <Route path="/onetime" element={<OnetimePage />} />
      <Route path="/offer" element={<OfferPage />} />
      <Route path="/thankyou" element={<ThankYouPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
};

export default App;