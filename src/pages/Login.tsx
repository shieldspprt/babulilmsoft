import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, LogIn, BookOpen, Users, DollarSign, BarChart2 } from 'lucide-react';
import './Auth.css';

export const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <div className="logo-icon-wrap"><GraduationCap size={28} color="#fff" /></div>
          <span>ilm<em>soft</em></span>
        </div>
        <div className="auth-brand-tagline">
          <strong>Welcome back!</strong>
          Login to manage your school's classes, teachers, fees, and more — all in one place.
        </div>
        <div className="auth-brand-features">
          {[
            { icon: Users,      label: 'Teachers & Parents Management' },
            { icon: DollarSign, label: 'Income & Expense Tracking' },
            { icon: BookOpen,   label: 'Class & Supplier Ledger' },
            { icon: BarChart2,  label: 'Financial Overview at a Glance' },
          ].map(f => (
            <div className="auth-feature-item" key={f.label}>
              <div className="feat-icon"><f.icon size={18} /></div>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap animate-fade-up">
          <div className="auth-form-header">
            <h2>Sign in</h2>
            <p>Enter your email and password to continue</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <Input
              label="Email Address" type="email"
              placeholder="you@school.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <Input
              label="Password" type="password"
              placeholder="Enter your password"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            <Button type="submit" fullWidth isLoading={loading} size="lg">
              <LogIn size={18} /> Login to Dashboard
            </Button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup">Register your school</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
