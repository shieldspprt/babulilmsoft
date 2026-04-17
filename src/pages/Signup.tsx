import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, UserPlus } from 'lucide-react';
import './Auth.css';

export const Signup = () => {
  const [formData, setFormData] = useState({ schoolName: '', email: '', contact: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { school_name: formData.schoolName, contact: formData.contact } }
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.session) {
      // Email confirmation not required — session is active
      // Credits are initialized automatically by DB trigger (trg_school_credits)
      navigate('/dashboard');
    } else if (data.user) {
      // Email confirmation required — session not yet active
      setSuccessMsg('Account created! Please check your email to verify your account, then log in.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon"><GraduationCap size={22} /></div>
          <span>ilm<em>soft</em></span>
        </div>

        <div className="auth-form-header">
          <h2>Create Account</h2>
          <p>Register your school — it only takes a minute</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && (
          <div className="auth-success">
            {successMsg}
            <div style={{ marginTop: '0.5rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Go to Login</Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-form-grid">
            <div className="span-2">
              <Input
                id="schoolName" label="School Name"
                placeholder="e.g. Al-Noor Public School"
                value={formData.schoolName} onChange={handleChange} required
              />
            </div>
            <Input
              id="contact" label="Contact Number"
              placeholder="03XX-XXXXXXX"
              value={formData.contact} onChange={handleChange} required
            />
            <Input
              id="email" label="Email Address" type="email"
              placeholder="admin@school.com"
              value={formData.email} onChange={handleChange} required
            />
            <div className="span-2">
              <Input
                id="password" label="Password" type="password"
                placeholder="Min. 6 characters"
                value={formData.password} onChange={handleChange} required minLength={6}
              />
            </div>
          </div>
          <Button type="submit" fullWidth isLoading={loading} size="lg">
            <UserPlus size={18} /> Create My School Account
          </Button>
        </form>

        <div className="auth-footer">
          Already registered? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};
