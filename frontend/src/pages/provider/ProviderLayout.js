import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Search, Send, User, Briefcase } from 'lucide-react';
import Navbar from '../../components/Navbar';

const ProviderLayout = () => {
  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-section-label">Main Menu</div>
            <NavLink to="/provider/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/provider/requests" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Search size={20} />
              <span>Browse Requests</span>
            </NavLink>
            <NavLink to="/provider/bids" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Send size={20} />
              <span>My Bids</span>
            </NavLink>
            <div className="sidebar-section-label">Profile & Services</div>
            <NavLink to="/provider/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <User size={20} />
              <span>My Profile</span>
            </NavLink>
            <NavLink to="/provider/services" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Briefcase size={20} />
              <span>My Services</span>
            </NavLink>
          </aside>
          
          <main className="dashboard-main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default ProviderLayout;
