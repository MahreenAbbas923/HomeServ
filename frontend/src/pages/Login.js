import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  
  // Admin form state
  const [adminEmail, setAdminEmail] = useState('admin@gmail.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      
      addToast('Login successful!', 'success');
      
      // Navigate based on role
      if (user.role === 'customer') navigate('/customer/dashboard');
      else if (user.role === 'provider') navigate('/provider/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
      
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      
      // Handle unverified email
      if (err.response?.status === 403 || message.toLowerCase().includes('verify') || message.toLowerCase().includes('otp')) {
        addToast('Please verify your email first.', 'info');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAdminSubmitting(true);
    
    try {
      const user = await login(adminEmail, adminPassword);
      addToast('Admin login successful!', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login as admin.');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <Home size={24} color="white" />
            </div>
            HomeServ
          </Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}

        {showAdminForm ? (
          <form className="auth-form" onSubmit={handleAdminLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
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

            <button type="submit" className="btn btn-primary btn-full" disabled={isAdminSubmitting} style={{ marginTop: '10px' }}>
              {isAdminSubmitting ? <div className="spinner"></div> : 'Sign In as Admin'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-outline btn-full" 
              disabled={isAdminSubmitting} 
              style={{ marginTop: '10px' }}
              onClick={() => setShowAdminForm(false)}
            >
              Back to User Login
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Forgot Password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting || isAdminSubmitting} style={{ marginTop: '10px' }}>
              {isSubmitting ? <div className="spinner"></div> : 'Sign In'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-outline btn-full" 
              disabled={isSubmitting || isAdminSubmitting} 
              style={{ marginTop: '10px' }}
              onClick={() => setShowAdminForm(true)}
            >
              Quick Login as Admin
            </button>
          </form>
        )}

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
