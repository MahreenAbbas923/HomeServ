import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, providers: 0, requests: 0, bids: 0 });
  const [pendingProviders, setPendingProviders] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, requestsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/providers/pending'),
        API.get('/admin/requests')
      ]);
      
      if (statsRes.data.data) setStats(statsRes.data.data);
      if (pendingRes.data.data) setPendingProviders(pendingRes.data.data.slice(0, 3));
      if (requestsRes.data.data) setRecentRequests(requestsRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch admin dashboard data', error);
      // Fallback data if API fails to prevent white screen
      if (error.response?.status === 404) {
        addToast('Admin stats API not fully implemented yet', 'info');
      } else {
        addToast('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (id, action) => {
    try {
      await API.patch(`/admin/providers/${id}/${action}`);
      addToast(`Provider ${action}d successfully`, 'success');
      fetchDashboardData();
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${action} provider`, 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Platform overview and management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={24} /></div>
          <div>
            <div className="stat-value">{stats.users || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><UserCheck size={24} /></div>
          <div>
            <div className="stat-value">{stats.providers || 0}</div>
            <div className="stat-label">Active Providers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><FileText size={24} /></div>
          <div>
            <div className="stat-value">{stats.requests || 0}</div>
            <div className="stat-label">Open Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Send size={24} /></div>
          <div>
            <div className="stat-value">{stats.bids || 0}</div>
            <div className="stat-label">Total Bids</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        <div>
          <div className="table-header" style={{ padding: '0 0 16px 0', borderBottom: 'none' }}>
            <h2 className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Pending Approvals 
              {pendingProviders.length > 0 && <span className="badge badge-pending">{pendingProviders.length}</span>}
            </h2>
            <Link to="/admin/providers" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          
          {pendingProviders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingProviders.map(provider => (
                <div key={provider._id} className="admin-provider-card">
                  <div className="admin-provider-header">
                    <div className="provider-avatar" style={{ width: '40px', height: '40px', marginBottom: 0, fontSize: '1rem' }}>
                      {provider.user?.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="admin-provider-info">
                      <div className="admin-provider-name">{provider.user?.name || 'Unknown User'}</div>
                      <div className="admin-provider-email">{provider.user?.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="admin-provider-actions" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                      onClick={() => handleProviderAction(provider._id, 'reject')}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleProviderAction(provider._id, 'approve')}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '40px 24px' }}>
              <div className="empty-state-icon"><UserCheck size={32} /></div>
              <p className="empty-state-desc" style={{ marginBottom: 0 }}>No pending provider approvals.</p>
            </div>
          )}
        </div>

        <div>
          <div className="table-header" style={{ padding: '0 0 16px 0', borderBottom: 'none' }}>
            <h2 className="table-title">Recent Requests</h2>
            <Link to="/admin/requests" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          
          <div className="table-container">
            {recentRequests.length > 0 ? (
              <table style={{ background: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 500 }}>{req.serviceType}</td>
                      <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <p className="empty-state-desc" style={{ marginBottom: 0 }}>No recent requests found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
