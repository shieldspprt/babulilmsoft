import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, KeyRound } from 'lucide-react';
import './Auth.css';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user has an active session or a recovery hash in the URL
    // Supabase automatically parses the hash and creates a session if it's a valid recovery link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If there's no session and no hash in URL, this is an invalid access
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (!hashParams.has('access_token')) {
            setError('Invalid or expired password reset link. Please request a new one.');
        }
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Password updated successfully, redirect to dashboard or login
      setTimeout(() => navigate('/dashboard'), 1500);
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
          <h2>Set New Password</h2>
          <p>Please enter your new password below</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleUpdate} className="auth-form">
          <Input
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" fullWidth isLoading={loading} size="lg">
            <KeyRound size={18} /> Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};
