import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  Users, GraduationCap, DollarSign, Truck, BookOpen,
  UserCheck, CheckCircle, ArrowRight, Star
} from 'lucide-react';
import './Home.css';

const features = [
  { icon: Users,         color: 'blue',   title: 'Class Management',    desc: 'Organize your school into classes effortlessly. Add, view, and manage all classes in one place.' },
  { icon: GraduationCap, color: 'green',  title: 'Teacher & Staff',     desc: 'Maintain complete records of teachers and staff — contacts, salaries, CNIC and more.' },
  { icon: UserCheck,     color: 'purple', title: 'Parent Records',       desc: 'Keep parent and guardian contact details handy for every student in your school.' },
  { icon: DollarSign,    color: 'cyan',   title: 'Income Tracking',      desc: 'Record fee payments and all income sources. Know exactly what money is coming in.' },
  { icon: Truck,         color: 'amber',  title: 'Expense Management',   desc: 'Track every expense. Get a clear picture of your school\'s spending at any time.' },
  { icon: BookOpen,      color: 'rose',   title: 'Supplier Ledger',      desc: 'Manage vendor accounts, bills, and payments. Never lose track of what you owe.' },
];

export const Home = () => {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-left animate-fade-up">
          <div className="hero-eyebrow">
            <Star size={14} fill="currentColor" /> School Management Made Simple
          </div>
          <h1 id="hero-heading" className="hero-title">
            Manage Your School<br /><span>The Smart Way</span>
          </h1>
          <p className="hero-subtitle">
            ilmsoft puts teachers, parents, fees, and expenses in one easy place.
            Designed for every school — big or small.
          </p>
          <div className="hero-cta">
            <Link to="/signup">
              <Button size="lg">
                Register Your School <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">Already have account?</Button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>1 Credit</strong><span>= 1 Day Access</span></div>
            <div className="hero-stat"><strong>Rs 67/day</strong><span>Monthly Plan</span></div>
            <div className="hero-stat"><strong>Rs 50/day</strong><span>Quarterly Plan</span></div>
          </div>
        </div>

        {/* Visual preview card */}
        <div className="hero-visual animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="hero-vis-header">
            <div className="hero-vis-avatar">S</div>
            <div className="hero-vis-school">
              <strong>Springfield High School</strong>
              <span>Admin Dashboard</span>
            </div>
            <div className="hero-vis-badge">Active</div>
          </div>
          <div className="hero-vis-stats">
            <div className="hero-vis-stat"><strong>42</strong><span>Teachers</span></div>
            <div className="hero-vis-stat"><strong>380</strong><span>Students</span></div>
            <div className="hero-vis-stat"><strong>Rs 1.2L</strong><span>This Month</span></div>
            <div className="hero-vis-stat"><strong>28 days</strong><span>Remaining</span></div>
          </div>
          <div className="hero-vis-row"><div className="hero-vis-dot green"/><span className="hero-vis-row-label">Fee Collection — June</span><span className="hero-vis-row-val">Rs 85,000</span></div>
          <div className="hero-vis-row"><div className="hero-vis-dot blue"/><span className="hero-vis-row-label">Teacher Salaries</span><span className="hero-vis-row-val">Rs 42,000</span></div>
          <div className="hero-vis-row"><div className="hero-vis-dot amber"/><span className="hero-vis-row-label">Misc Expenses</span><span className="hero-vis-row-val">Rs 8,500</span></div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" aria-label="Features">
        <div className="features-inner">
          <h2 className="features-title">Everything Your School Needs</h2>
          <p className="features-sub">Six powerful modules — all in one simple system</p>
          <div className="features-grid">
            {features.map(f => (
              <article key={f.title} className="feature-card">
                <div className={`feature-icon ${f.color}`}><f.icon size={24} /></div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join schools across Pakistan managing smarter with ilmsoft.</p>
        <div className="cta-btns">
          <Link to="/signup">
            <Button size="lg">
              <CheckCircle size={20} /> Register Free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">Login</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
