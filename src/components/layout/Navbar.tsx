
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
    <nav className="navbar glass">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <GraduationCap size={28} className="logo-icon" />
          <span>Babulilm<span className="logo-accent">soft</span></span>
        </Link>
        
        <div className="nav-actions">
          {session ? (
            <>
              {profile && (
                <div className="nav-profile">
                  {profile.logo_url && (
                    <img src={profile.logo_url} alt="School Logo" className="nav-avatar" />
                  )}
                  <span className="nav-school-name">{profile.school_name}</span>
                  <span className="credits-badge">{profile.total_credits} Credits</span>
                </div>
              )}
              <Button variant="ghost" className="nav-btn" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </Button>
              <Button variant="outline" className="nav-btn" onClick={handleLogout}>
                <LogOut size={18} /> Logout
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
