import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const Signup = () => {
  const [role, setRole] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: formData.password,
        role
      };

      await register(payload);
      addToast('Registration successful! You can now sign in.', 'success');
      navigate('/login');
      
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '40px 24px' }}>
      <div className="auth-bg"></div>
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header" style={{ marginBottom: '24px' }}>
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <Home size={24} color="white" />
            </div>
            HomeServ
          </Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join HomeServ today</p>
        </div>

        <div className="role-tabs" style={{ marginBottom: '24px' }}>
          <button 
            type="button" 
            className={`role-tab ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            Customer
          </button>
          <button 
            type="button" 
            className={`role-tab ${role === 'provider' ? 'active' : ''}`}
            onClick={() => setRole('provider')}
          >
            Service Provider
          </button>
        </div>

        {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="name"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">City</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Your city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="Create a password (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '10px' }}>
            {isSubmitting ? <div className="spinner"></div> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
