import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'customer') return '/customer/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  const renderNavLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/services" className={`navbar-link ${location.pathname === '/services' ? 'active' : ''}`}>Services</Link>
        </>
      );
    }

    if (user.role === 'customer') {
      return (
        <>
          <Link to="/customer/dashboard" className={`navbar-link ${location.pathname === '/customer/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/customer/requests" className={`navbar-link ${location.pathname === '/customer/requests' ? 'active' : ''}`}>My Requests</Link>
          <Link to="/services" className={`navbar-link ${location.pathname === '/services' ? 'active' : ''}`}>Browse Services</Link>
        </>
      );
    }

    if (user.role === 'provider') {
      return (
        <>
          <Link to="/provider/dashboard" className={`navbar-link ${location.pathname === '/provider/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/provider/requests" className={`navbar-link ${location.pathname === '/provider/requests' ? 'active' : ''}`}>Browse Requests</Link>
          <Link to="/provider/bids" className={`navbar-link ${location.pathname === '/provider/bids' ? 'active' : ''}`}>My Bids</Link>
        </>
      );
    }

    if (user.role === 'admin') {
      return (
        <>
          <Link to="/admin/dashboard" className={`navbar-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/admin/providers" className={`navbar-link ${location.pathname === '/admin/providers' ? 'active' : ''}`}>Providers</Link>
          <Link to="/admin/requests" className={`navbar-link ${location.pathname === '/admin/requests' ? 'active' : ''}`}>Requests</Link>
        </>
      );
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Home size={20} color="white" />
          </div>
          HomeServ
        </Link>

        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : 'mobile-hidden'}`}>
          {renderNavLinks()}
        </div>

        <div className="navbar-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          ) : (
            <div className="navbar-user" onClick={() => navigate(getDashboardLink())}>
              <div className="navbar-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="navbar-user-info" style={{display: 'flex', flexDirection: 'column'}}>
                 <span className="navbar-username">{user.name}</span>
                 <span className="navbar-role">{user.role}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logout(); }} className="btn btn-ghost btn-sm" style={{marginLeft: '10px', padding: '6px'}}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
