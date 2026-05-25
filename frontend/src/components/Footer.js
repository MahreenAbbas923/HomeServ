import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="navbar-logo" style={{ marginBottom: '16px', display: 'flex' }}>
              <div className="logo-icon">
                <Home size={20} color="white" />
              </div>
              HomeServ
            </Link>
            <p className="footer-brand-desc">
              Your trusted platform to connect with verified home service professionals for plumbing, electrical, cleaning, and more.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">For Customers</h4>
            <div className="footer-links">
              <Link to="/" className="footer-link">How it Works</Link>
              <Link to="/signup" className="footer-link">Post a Request</Link>
              <Link to="/services" className="footer-link">Browse Providers</Link>
              <Link to="/" className="footer-link">FAQ</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">For Providers</h4>
            <div className="footer-links">
              <Link to="/signup" className="footer-link">Become a Provider</Link>
              <Link to="/" className="footer-link">How Bidding Works</Link>
              <Link to="/" className="footer-link">Resources</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <div className="footer-links">
              <Link to="/" className="footer-link">About Us</Link>
              <Link to="/" className="footer-link">Contact</Link>
              <Link to="/" className="footer-link">Privacy Policy</Link>
              <Link to="/" className="footer-link">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} HomeServ. All rights reserved.</p>
          <div className="footer-social" style={{ display: 'flex', gap: '16px' }}>
            <Mail size={18} />
            <Phone size={18} />
            <MapPin size={18} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
