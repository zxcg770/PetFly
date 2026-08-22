import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BrowsePage from './pages/BrowsePage.jsx';
import { LandingPage } from './pages/LandingPage';
import MyOffersPage from './components/MyOffersPage';
import TrackingPage from './components/TrackingPage';
import PaymentPage from './components/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import RegulationPage from './pages/RegulationPage';
import ReviewPage from './pages/ReviewPage';
import MyRequestsPage from './pages/MyRequestsPage.jsx';
import CreateRequestPage from './pages/CreateRequestPage.jsx';
import RequestDetailPage from './pages/RequestDetailPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const Dashboard = () => {
  return <h1>Welcome to the Dashboard!</h1>;
};

const TrackerRoute = () => {
  const { offerId } = useParams();
  const { user } = useAuth();
  return <TrackingPage offerId={offerId} currentUserId={user?._id || ''} />;
};

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';
  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/my-offers" element={<ProtectedRoute><MyOffersPage /></ProtectedRoute>} />
        <Route path="/tracker/:offerId" element={<ProtectedRoute><TrackerRoute /></ProtectedRoute>} />
        <Route path="/payment/:offerId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/reviews/offers/:offerId" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path="/regulation" element={<RegulationPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/create-request" element={<ProtectedRoute><CreateRequestPage /></ProtectedRoute>} />
        <Route path="/request/:id" element={<RequestDetailPage />} />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

