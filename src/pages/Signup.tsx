import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building, UserPlus } from 'lucide-react';
import './Auth.css';

export const Signup = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    email: '',
    contact: '',
    password: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.id]: e.target.value});
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Sign up the user with school details as metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          school_name: formData.schoolName,
          contact: formData.contact,
          logo_url: formData.logoUrl || null
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // The school profile is now created automatically by the database trigger!
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass animate-fade-in signup-card">
        <div className="auth-header">
          <div className="auth-icon"><Building size={32} /></div>
          <h2>Register School</h2>
          <p>Create your Babulilmsoft account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="form-grid">
            <Input 
              id="schoolName" label="School Name"
              placeholder="e.g. Springfield High"
              value={formData.schoolName} onChange={handleChange} required
            />
            <Input 
              id="contact" label="Contact Number"
              placeholder="+92 300 1234567"
              value={formData.contact} onChange={handleChange} required
            />
            <Input 
              id="email" label="Admin Email" type="email"
              placeholder="admin@school.edu"
              value={formData.email} onChange={handleChange} required
            />
            <Input 
              id="password" label="Password" type="password"
              placeholder="••••••••"
              value={formData.password} onChange={handleChange} required minLength={6}
            />
            <Input 
              id="logoUrl" label="Logo URL (Optional)" type="url"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl} onChange={handleChange}
              className="full-width"
            />
          </div>
          <Button type="submit" size="lg" style={{width: '100%', marginTop: '1rem'}} isLoading={loading}>
            <UserPlus size={18} /> Create Account
          </Button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};
