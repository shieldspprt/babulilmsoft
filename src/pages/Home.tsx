
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Zap, ShieldCheck, CreditCard } from 'lucide-react';
import './Home.css';

export const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-badge animate-fade-in">✨ The Future of School Management</div>
        <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Empower Your Institution with <span className="text-gradient">Babulilmsoft</span>
        </h1>
        <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Streamline administration, manage students, and power your school's daily operations simply and affordably with our credit-based system.
        </p>
        <div className="hero-cta animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/signup">
            <Button size="lg" className="cta-btn">Register Your School</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">Admin Login</Button>
          </Link>
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card glass animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="feature-icon bg-primary"><Zap size={24} /></div>
          <h3>Pay As You Go</h3>
          <p>No expensive subscriptions. Purchase daily credits and use the system exactly when you need it.</p>
        </div>
        <div className="feature-card glass animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="feature-icon bg-accent"><ShieldCheck size={24} /></div>
          <h3>Secure & Reliable</h3>
          <p>Your school's data is protected with enterprise-grade security and automated backups.</p>
        </div>
        <div className="feature-card glass animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="feature-icon bg-success"><CreditCard size={24} /></div>
          <h3>Easy Top-ups</h3>
          <p>Recharge your credits instantly via JazzCash or Bank Transfer directly from your dashboard.</p>
        </div>
      </div>
    </div>
  );
};
