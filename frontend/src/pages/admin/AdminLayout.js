import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, FileText, Send } from 'lucide-react';
import Navbar from '../../components/Navbar';

const AdminLayout = () => {
  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-section-label">Main Menu</div>
            <NavLink to="/admin/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </NavLink>
            <div className="sidebar-section-label">Management</div>
            <NavLink to="/admin/providers" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span>Providers</span>
            </NavLink>
            <NavLink to="/admin/customers" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={20} />
              <span>Customers</span>
            </NavLink>
            <NavLink to="/admin/requests" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>All Requests</span>
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

export default AdminLayout;
