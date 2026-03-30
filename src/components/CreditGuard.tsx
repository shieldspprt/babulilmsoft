import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Clock, CreditCard, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import './CreditGuard.css';

type CreditStatus = {
  hasCredits: boolean;
  totalCredits: number;
  daysRemaining: number;
  expiresAt: string | null;
  expired: boolean;
  warning: boolean;
};

export const CreditGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCredits();
  }, [profile]);

  const checkCredits = () => {
    if (!profile) {
      setChecking(false);
      return;
    }

    const now = new Date();
    const expiresAt = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const hasCredits = profile.total_credits > 0 && (!expiresAt || expiresAt > now);
    const expired = !!expiresAt && expiresAt <= now;
    const warning = !!expiresAt && expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

    const daysRemaining = expiresAt 
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : profile.total_credits;

    setStatus({
      hasCredits,
      totalCredits: profile.total_credits,
      daysRemaining,
      expiresAt: profile.credit_expires_at,
      expired,
      warning
    });
    setChecking(false);
  };

  if (checking || !status) {
    return (
      <div className="credit-guard-loading">
        <div className="spinner" />
        <span>Checking credits...</span>
      </div>
    );
  }

  if (!status.hasCredits || status.expired) {
    return (
      <div className="credit-block-overlay">
        <div className="credit-block-card">
          <div className="block-icon">
            <Lock size={48} />
          </div>
          <h2>Account Locked</h2>
          <p>Your credits have expired. You need to purchase credits to access the dashboard.</p>
          <div className="block-actions">
            <Button size="lg" onClick={() => navigate('/dashboard', { state: { showBuyCredits: true } })}>
              <CreditCard size={18} /> Buy Credits
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const CreditDisplay: React.FC = () => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<CreditStatus | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    const now = new Date();
    const expiresAt = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired = !!expiresAt && expiresAt <= now;
    const warning = !!expiresAt && expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
    const daysRemaining = expiresAt 
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : profile.total_credits;

    setStatus({
      hasCredits: profile.total_credits > 0 && !expired,
      totalCredits: profile.total_credits,
      daysRemaining,
      expiresAt: profile.credit_expires_at,
      expired,
      warning
    });
  }, [profile]);

  if (!status) return null;

  const getBadgeClass = () => {
    if (status.expired || status.totalCredits <= 0) return 'credits-badge expired';
    if (status.warning) return 'credits-badge warning';
    return 'credits-badge';
  };

  const getLabel = () => {
    if (status.expired || status.totalCredits <= 0) return 'Expired';
    if (status.daysRemaining <= 7) return `${status.daysRemaining}d`;
    return `${status.totalCredits}`;
  };

  return (
    <span className={getBadgeClass()} title={status.expired ? 'Credits expired' : `${status.daysRemaining} days remaining`}>
      {status.expired ? <AlertTriangle size={12} /> : <Clock size={12} />}
      {getLabel()}
    </span>
  );
};
