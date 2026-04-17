import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import './Auth.css';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // In production, the URL would be configured in Supabase
    // Using window.location.origin to support local dev and prod
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon"><GraduationCap size={22} /></div>
          <span>ilm<em>soft</em></span>
        </div>

        <div className="auth-form-header">
          <h2>Reset Password</h2>
          <p>We'll send you a link to reset your password</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success">
            Password reset instructions have been sent to your email. Check your inbox (and spam folder).
          </div>
        )}

        {!success && (
          <form onSubmit={handleReset} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@school.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth isLoading={loading} size="lg">
              <Mail size={18} /> Send Reset Link
            </Button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
