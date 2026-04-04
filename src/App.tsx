import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { CreditGuard } from './components/CreditGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { JoinInvite } from './pages/JoinInvite';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="loading-spinner-icon" /> Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  // Dashboard and admin are full-screen apps — no public navbar
  const isAppRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
  // Auth pages have dark header
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app-layout">
      {!isAppRoute && <Navbar dark={isAuthPage} />}
      <main className={`main-content${isAppRoute ? ' admin-page' : ''}`}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/join/:token" element={<JoinInvite />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><CreditGuard><Dashboard /></CreditGuard></ProtectedRoute>} />
          <Route path="/admin/*"     element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
