import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Mail, ShieldCheck } from 'lucide-react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    // Allow only one character
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length < 6) {
      return setError('Please enter the complete 6-digit OTP');
    }

    setIsSubmitting(true);
    setError('');

    try {
      await API.post('/auth/verify-email', { email, otp: otpString });
      addToast('Email verified successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await API.post('/auth/resend-otp', { email });
      addToast('A new OTP has been sent to your email.', 'info');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(108,99,255,0.1)', padding: '16px', borderRadius: '50%' }}>
              <ShieldCheck size={32} color="var(--accent)" />
            </div>
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">We've sent a 6-digit verification code to<br/><strong style={{color: 'var(--text-primary)'}}>{email}</strong></p>
        </div>

        {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-group" style={{ marginBottom: '10px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
                maxLength={1}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting || otp.join('').length < 6}>
            {isSubmitting ? <div className="spinner"></div> : 'Verify Email'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '32px' }}>
          <p style={{ marginBottom: '16px' }}>Didn't receive the code?</p>
          {canResend ? (
            <button 
              onClick={handleResend} 
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 24px' }}
            >
              Resend Code
            </button>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>You can resend in <strong style={{color: 'var(--accent)'}}>{countdown}s</strong></p>
          )}
          
          <div style={{ marginTop: '24px' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
