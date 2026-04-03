import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, LogIn } from 'lucide-react';
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
      <div className="auth-card animate-fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon"><GraduationCap size={22} /></div>
          <span>ilm<em>soft</em></span>
        </div>

        <div className="auth-form-header">
          <h2>Welcome back</h2>
          <p>Sign in to your school dashboard</p>
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
  );
};
