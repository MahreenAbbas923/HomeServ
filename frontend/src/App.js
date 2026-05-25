import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Services from './pages/Services';

// Customer Pages
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/Dashboard';
import MyRequests from './pages/customer/MyRequests';
import CreateRequest from './pages/customer/CreateRequest';
import RequestDetail from './pages/customer/RequestDetail';

// Provider Pages
import ProviderLayout from './pages/provider/ProviderLayout';
import ProviderDashboard from './pages/provider/Dashboard';
import BrowseRequests from './pages/provider/BrowseRequests';
import MyBids from './pages/provider/MyBids';
import ProviderProfileSetup from './pages/provider/ProviderProfileSetup';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageProviders from './pages/admin/ManageProviders';
import ManageRequests from './pages/admin/ManageRequests';
import ManageCustomers from './pages/admin/ManageCustomers';

// Simple Unauthorized Component
const Unauthorized = () => (
  <div className="auth-page">
    <div className="auth-card" style={{ textAlign: 'center' }}>
      <h2>Unauthorized Access</h2>
      <p style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>You do not have permission to view this page.</p>
      <button onClick={() => window.history.back()} className="btn btn-primary">Go Back</button>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/services" element={<Services />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute roles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="requests/new" element={<CreateRequest />} />
              <Route path="requests/:id" element={<RequestDetail />} />
              <Route path="profile" element={<div className="dashboard-header"><h1 className="dashboard-title">My Profile</h1></div>} />
            </Route>

            {/* Provider Routes */}
            <Route path="/provider" element={
              <ProtectedRoute roles={['provider']}>
                <ProviderLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="requests" element={<BrowseRequests />} />
              <Route path="bids" element={<MyBids />} />
              <Route path="profile" element={<ProviderProfileSetup />} />
              <Route path="services" element={<div className="dashboard-header"><h1 className="dashboard-title">My Services</h1></div>} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="providers" element={<ManageProviders />} />
              <Route path="customers" element={<ManageCustomers />} />
              <Route path="requests" element={<ManageRequests />} />
              <Route path="bids" element={<div className="dashboard-header"><h1 className="dashboard-title">All Bids</h1></div>} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
