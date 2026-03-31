import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { CreditGuard } from './components/CreditGuard';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-muted)', fontSize:'1rem', gap:'0.75rem' }}><div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  // Dashboard and admin are full-screen apps — no public navbar
  const isAppRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  return (
    <div className="app-layout">
      {!isAppRoute && <Navbar />}
      <main className={`main-content${isAppRoute ? ' admin-page' : ''}`}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
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
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
