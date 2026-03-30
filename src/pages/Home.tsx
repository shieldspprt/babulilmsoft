
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Zap, ShieldCheck, CreditCard } from 'lucide-react';
import './Home.css';

export const Home = () => {
  return (
    <main className="home-container">
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-badge animate-fade-in">✨ The Future of School Management</div>
        <h1 id="hero-heading" className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
      </section>

      <section className="features-section" aria-label="Key Features">
        <article className="feature-card glass animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="feature-icon bg-primary" aria-hidden="true"><Zap size={24} /></div>
          <h2>Pay As You Go</h2>
          <p>No expensive subscriptions. Purchase daily credits and use the system exactly when you need it.</p>
        </article>
        <article className="feature-card glass animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="feature-icon bg-accent" aria-hidden="true"><ShieldCheck size={24} /></div>
          <h2>Secure & Reliable</h2>
          <p>Your school's data is protected with enterprise-grade security and automated backups.</p>
        </article>
        <article className="feature-card glass animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="feature-icon bg-success" aria-hidden="true"><CreditCard size={24} /></div>
          <h2>Easy Top-ups</h2>
          <p>Recharge your credits instantly via JazzCash or Bank Transfer directly from your dashboard.</p>
        </article>
      </section>
    </main>
  );
};
