import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, GraduationCap, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" aria-label="ilmsoft Home">
          <div className="nav-logo-icon">
            <GraduationCap size={22} />
          </div>
          <span className="nav-logo-text">ilm<em>soft</em></span>
        </Link>

        <div className="nav-actions">
          {session ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={16} /> Dashboard
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
