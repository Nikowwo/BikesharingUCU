import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import MyBikePage from './pages/MyBikePage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/my-bike" element={<MyBikePage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
