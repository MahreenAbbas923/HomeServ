import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Services = () => {
  return (
    <>
      <Navbar />
      <div className="page container" style={{ paddingBottom: '80px' }}>
        <div className="section-header" style={{ marginTop: '40px' }}>
          <h1 className="section-title">Browse Services</h1>
          <p className="section-desc">Discover verified professionals ready to help with your home projects.</p>
        </div>
        
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', marginTop: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 24px', width: '40px', height: '40px' }}></div>
          <h3 className="empty-state-title">Loading services...</h3>
          <p className="empty-state-desc">This feature is coming soon.</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Services;
