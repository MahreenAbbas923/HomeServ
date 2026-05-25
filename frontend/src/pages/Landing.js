import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Zap, Sparkles, Paintbrush, Hammer, Wind, Bug, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>✨</span> #1 Home Services Platform
            </div>
            <h1 className="hero-title">Find Trusted Home Service Experts Near You</h1>
            <p className="hero-subtitle">
              Connect with verified professionals for plumbing, electrical, cleaning, and more. Post your request and let experts bid for your project.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">Post a Request</Link>
              <Link to="/services" className="btn btn-outline btn-lg">Browse Services</Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">2,500+</div>
                <div className="hero-stat-label">Providers</div>
              </div>
              <div>
                <div className="hero-stat-num">15,000+</div>
                <div className="hero-stat-label">Jobs Done</div>
              </div>
              <div>
                <div className="hero-stat-num">4.8</div>
                <div className="hero-stat-label">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section container">
        <div className="section-header">
          <span className="section-tag">SERVICES</span>
          <h2 className="section-title">Popular Service Categories</h2>
          <p className="section-desc">Find skilled professionals for all your home maintenance and repair needs.</p>
        </div>
        
        <div className="categories-grid">
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)' }}>
              <Droplets size={28} />
            </div>
            <h3 className="category-name">Plumbing</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(255,101,132,0.15)', color: 'var(--accent-2)' }}>
              <Zap size={28} />
            </div>
            <h3 className="category-name">Electrical</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(46,213,115,0.15)', color: 'var(--accent-success)' }}>
              <Sparkles size={28} />
            </div>
            <h3 className="category-name">Cleaning</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(247,183,49,0.15)', color: 'var(--accent-warn)' }}>
              <Paintbrush size={28} />
            </div>
            <h3 className="category-name">Painting</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)' }}>
              <Hammer size={28} />
            </div>
            <h3 className="category-name">Carpentry</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(255,101,132,0.15)', color: 'var(--accent-2)' }}>
              <Wind size={28} />
            </div>
            <h3 className="category-name">AC Repair</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(46,213,115,0.15)', color: 'var(--accent-success)' }}>
              <Bug size={28} />
            </div>
            <h3 className="category-name">Pest Control</h3>
            <div className="category-count">120+ Providers</div>
          </div>
          <div className="category-card">
            <div className="category-icon" style={{ background: 'rgba(247,183,49,0.15)', color: 'var(--accent-warn)' }}>
              <Truck size={28} />
            </div>
            <h3 className="category-name">Moving</h3>
            <div className="category-count">120+ Providers</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section container" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '80px 40px' }}>
        <div className="section-header">
          <span className="section-tag">HOW IT WORKS</span>
          <h2 className="section-title">Simple Steps to Get Things Done</h2>
          <p className="section-desc">Our platform makes it easy to find the right professional for your home service needs.</p>
        </div>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3 className="step-title">Post Your Request</h3>
            <p className="step-desc">Describe the service you need, set your budget, and choose a preferred date.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3 className="step-title">Receive Bids</h3>
            <p className="step-desc">Verified service providers will review your request and submit their proposals.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3 className="step-title">Choose & Book</h3>
            <p className="step-desc">Compare bids, check ratings, and select the provider that fits your needs.</p>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <h3 className="step-title">Job Done!</h3>
            <p className="step-desc">Your chosen provider completes the work. Rate and review the experience.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section container">
        <div className="card-glass" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <h2 className="section-title">Are You a Service Provider?</h2>
          <p className="section-desc" style={{ marginBottom: '32px' }}>
            Join our platform to reach more customers, grow your business, and manage your jobs easily.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">Become a Provider</Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Landing;
