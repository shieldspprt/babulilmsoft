import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Clock, CreditCard, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import './CreditGuard.css';

type CreditStatus = {
  hasCredits: boolean; totalCredits: number; daysRemaining: number;
  expiresAt: string | null; expired: boolean; warning: boolean;
};

export const CreditGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!profile) { setChecking(false); return; }
    const now      = new Date();
    const exp      = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired  = !!exp && exp <= now;
    const warning  = !!exp && exp.getTime() - now.getTime() < 7 * 86400000;
    const days     = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
    setStatus({
      hasCredits: profile.total_credits > 0 && (!exp || exp > now),
      totalCredits: profile.total_credits, daysRemaining: days,
      expiresAt: profile.credit_expires_at, expired, warning,
    });
    setChecking(false);
  }, [profile]);

  if (checking || !status) return (
    <div className="cg-loading"><div className="spinner" /> Checking access…</div>
  );

  if (!status.hasCredits || status.expired) return (
    <div className="cg-block">
      <div className="cg-card">
        <div className="cg-icon"><Lock size={40} /></div>
        <h2>Account Locked</h2>
        <p>Your credits have expired. Purchase credits to continue using ilmsoft.</p>
        <Button size="lg" onClick={() => navigate('/dashboard', { state: { showBuyCredits: true } })}>
          <CreditCard size={18} /> Buy Credits Now
        </Button>
      </div>
    </div>
  );

  return <>{children}</>;
};

export const CreditDisplay: React.FC = () => {
  const { profile } = useAuth();
  if (!profile) return null;

  const now      = new Date();
  const exp      = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
  const expired  = !!exp && exp <= now;
  const warning  = !!exp && exp.getTime() - now.getTime() < 7 * 86400000;
  const days     = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
  const label    = expired ? 'Expired' : days <= 7 ? `${days}d` : `${profile.total_credits}`;
  const cls      = expired ? 'credits-badge expired' : warning ? 'credits-badge warning' : 'credits-badge';

  return (
    <span className={cls} title={expired ? 'Credits expired' : `${days} days remaining`}>
      {expired ? <AlertTriangle size={11} /> : <Clock size={11} />}
      {label}
    </span>
  );
};
