
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
          Empower Your Institution with <span className="text-gradient">ilmsoft</span>
        </h1>
        <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Streamline student registrations, fee collection, and financial reporting with our intuitive, day-to-day school management platform.
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
          <h2>Student Registration</h2>
          <p>Seamlessly onboard and manage student records with digital registration and automated ID generation.</p>
        </article>
        <article className="feature-card glass animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="feature-icon bg-accent" aria-hidden="true"><ShieldCheck size={24} /></div>
          <h2>Fee Collection</h2>
          <p>Track payments, generate invoices, and manage fee structures with absolute transparency.</p>
        </article>
        <article className="feature-card glass animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="feature-icon bg-success" aria-hidden="true"><CreditCard size={24} /></div>
          <h2>Financial Reports</h2>
          <p>Get instant insights with detailed financial reports, income tracking, and expense management.</p>
        </article>
      </section>
    </main>
  );
};
