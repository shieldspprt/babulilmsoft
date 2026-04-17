import { useEffect, useMemo, useState, useCallback, type FC, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Clock, CreditCard, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import './CreditGuard.css';

type CreditStatus = {
  hasCredits: boolean; totalCredits: number; daysRemaining: number;
  expiresAt: string | null; expired: boolean; warning: boolean;
};

export const CreditGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const { profile, refreshProfile } = useAuth();

  // Memoize navigation handler to prevent re-renders
  const handleBuyCredits = useCallback(() => {
    navigate('/dashboard', { state: { showBuyCredits: true } });
  }, [navigate]);

  // Memoize status calculation to prevent unnecessary re-renders
  const status = useMemo<CreditStatus | null>(() => {
    if (!profile) return null;
    const now      = new Date();
    const exp      = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired  = !!exp && exp <= now;
    const warning  = !!exp && exp.getTime() - now.getTime() < 7 * 86400000;
    const days     = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
    return {
      hasCredits: profile.total_credits > 0 && (!exp || exp > now),
      totalCredits: profile.total_credits, daysRemaining: days,
      expiresAt: profile.credit_expires_at, expired, warning,
    };
  }, [profile?.total_credits, profile?.credit_expires_at]);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 800);
    const slowTimer = setTimeout(() => setIsSlow(true), 5000);
    return () => { clearTimeout(timer); clearTimeout(slowTimer); };
  }, []);

  if (checking || (!status && !isSlow)) return (
    <div className="cg-loading">
      <div className="spinner" /> 
      <span>Checking enrollment status…</span>
    </div>
  );

  if (!status && isSlow) return (
    <div className="cg-block">
      <div className="cg-card">
        <div className="cg-icon alert"><AlertTriangle size={40} /></div>
        <h2>School Setup in Progress</h2>
        <p>We're finishing the setup for your school profile. This usually takes a moment after email confirmation.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <Button onClick={() => refreshProfile()}>
            Check Again
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );

  if (!status) return null;

  if (!status.hasCredits || status.expired) return (
    <div className="cg-block">
      <div className="cg-card">
        <div className="cg-icon"><Lock size={40} /></div>
        <h2>Account Locked</h2>
        <p>Your credits have expired. Purchase credits to continue using ilmsoft.</p>
        <Button size="lg" onClick={handleBuyCredits}>
          <CreditCard size={18} /> Buy Credits Now
        </Button>
      </div>
    </div>
  );

  return <>{children}</>;
};

export const CreditDisplay: FC = () => {
  const { profile } = useAuth();
  if (!profile) return null;

  // Memoize display calculations
  const display = useMemo(() => {
    const now      = new Date();
    const exp      = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired  = !!exp && exp <= now;
    const warning  = !!exp && exp.getTime() - now.getTime() < 7 * 86400000;
    const days     = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
    const label    = expired ? 'Expired' : days <= 7 ? `${days}d` : `${profile.total_credits}`;
    const cls      = expired ? 'credits-badge expired' : warning ? 'credits-badge warning' : 'credits-badge';
    return { label, cls, expired, warning, days };
  }, [profile.total_credits, profile.credit_expires_at]);

  return (
    <span className={display.cls} title={display.expired ? 'Credits expired' : `${display.days} days remaining`}>
      {display.expired ? <AlertTriangle size={11} /> : <Clock size={11} />}
      {display.label}
    </span>
  );
};
