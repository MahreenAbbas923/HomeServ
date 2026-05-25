import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Search, User } from 'lucide-react';
import Navbar from '../../components/Navbar';

const CustomerLayout = () => {
  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-section-label">Main Menu</div>
            <NavLink to="/customer/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/customer/requests" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>My Requests</span>
            </NavLink>
            <NavLink to="/customer/requests/new" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Post Request</span>
            </NavLink>
            <div className="sidebar-section-label">Find Services</div>
            <NavLink to="/services" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Search size={20} />
              <span>Browse Services</span>
            </NavLink>
            <div className="sidebar-section-label">Settings</div>
            <NavLink to="/customer/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <User size={20} />
              <span>My Profile</span>
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

export default CustomerLayout;
