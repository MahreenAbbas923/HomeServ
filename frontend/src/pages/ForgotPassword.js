import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await API.post('/auth/forgot-password', { email });
      setIsSuccess(true);
      addToast('Password reset link sent to your email.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          
          {isSuccess ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(46,213,115,0.1)', padding: '16px', borderRadius: '50%' }}>
                <CheckCircle size={32} color="var(--accent-success)" />
              </div>
            </div>
          ) : null}
          
          <h1 className="auth-title">{isSuccess ? 'Check Your Email' : 'Reset Password'}</h1>
          <p className="auth-subtitle">
            {isSuccess 
              ? `We have sent password reset instructions to ${email}`
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </p>
        </div>

        {!isSuccess ? (
          <>
            {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}

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

              <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                {isSubmitting ? <div className="spinner"></div> : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button 
              onClick={() => setIsSuccess(false)} 
              className="btn btn-outline btn-full"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '32px' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
