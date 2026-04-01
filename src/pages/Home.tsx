import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  LayoutGrid, GraduationCap, TrendingUp, Receipt, Store,
  UsersRound, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';
import './Home.css';

const features = [
  { icon: LayoutGrid,    color: 'blue',   title: 'Class Management',    desc: 'Organize your school into classes effortlessly. Add, view, and manage all classes in one place.' },
  { icon: GraduationCap, color: 'green',  title: 'Teacher & Staff',     desc: 'Maintain complete records of teachers and staff — contacts, salaries, CNIC and more.' },
  { icon: UsersRound,    color: 'purple', title: 'Parent Records',       desc: 'Keep parent and guardian contact details handy for every student in your school.' },
  { icon: TrendingUp,    color: 'cyan',   title: 'Income Tracking',      desc: 'Record fee payments and all income sources. Know exactly what money is coming in.' },
  { icon: Receipt,       color: 'amber',  title: 'Expense Management',   desc: 'Track every expense. Get a clear picture of your school\'s spending at any time.' },
  { icon: Store,         color: 'rose',   title: 'Supplier Ledger',      desc: 'Manage vendor accounts, bills, and payments. Never lose track of what you owe.' },
];

export const Home = () => {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-left animate-fade-up">
          <div className="hero-eyebrow">
            <Sparkles size={14} fill="currentColor" /> School Management Made Simple
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

        {/* Dashboard Preview — abstract UI mockup, no fake data */}
        <div className="hero-visual animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="preview-browser-bar">
            <div className="preview-dots">
              <span /><span /><span />
            </div>
            <div className="preview-url">ilmsoft.netlify.app/dashboard</div>
          </div>

          <div className="preview-body">
            {/* Mini sidebar */}
            <div className="preview-sidebar">
              <div className="preview-sidebar-logo">
                <GraduationCap size={12} />
                <span>ilm<em>soft</em></span>
              </div>
              {['Overview', 'Classes', 'Teachers', 'Parents', 'Students', 'Income', 'Expenses'].map((label, i) => (
                <div key={label} className={`preview-sidebar-item${i === 0 ? ' active' : ''}`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Mini content */}
            <div className="preview-content">
              <div className="preview-content-bar">
                <div className="preview-skeleton-text title" />
                <div className="preview-skeleton-text subtitle" />
              </div>

              <div className="preview-stat-row">
                {[
                  { label: 'Parents', color: 'blue' },
                  { label: 'Students', color: 'green' },
                  { label: 'Classes', color: 'purple' },
                ].map(s => (
                  <div key={s.label} className={`preview-stat-block ${s.color}`}>
                    <div className="preview-stat-block-label">{s.label}</div>
                    <div className="preview-stat-block-bar" />
                  </div>
                ))}
              </div>

              <div className="preview-table-area">
                <div className="preview-table-label">Quick Actions</div>
                <div className="preview-table-rows">
                  {['Add Parent', 'Record Income', 'Add Expense'].map(row => (
                    <div key={row} className="preview-table-row">
                      <div className="preview-skeleton-dot" />
                      <div className="preview-skeleton-text short" />
                      <div className="preview-skeleton-text shorter" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
