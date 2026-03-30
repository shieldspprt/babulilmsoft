
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, GraduationCap, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar glass" aria-label="Main Navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" aria-label="ilmsoft Home">
          <GraduationCap size={28} className="logo-icon" aria-hidden="true" />
          <span>ilm<span className="logo-accent">soft</span></span>
        </Link>
        
        <div className="nav-actions">
          {session ? (
            <>
              {profile && (
                <div className="nav-profile">
                  {profile.logo_url && (
                    <img src={profile.logo_url} alt={`${profile.school_name} Logo`} className="nav-avatar" />
                  )}
                  <span className="nav-school-name">{profile.school_name}</span>
                  <span className="credits-badge">{profile.total_credits} Credits</span>
                </div>
              )}
              <Button variant="ghost" className="nav-btn" onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard">
                <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
              </Button>
              <Button variant="outline" className="nav-btn" onClick={handleLogout} aria-label="Logout">
                <LogOut size={18} aria-hidden="true" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
