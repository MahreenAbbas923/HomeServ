import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data } = await API.get('/requests/my');
        setRequests(data.data || []);
      } catch (error) {
        console.error('Failed to fetch requests', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'assigned').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const totalSpent = requests.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.expectedPrice || 0), 0);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.name}!</h1>
        <p className="dashboard-subtitle">Here's what's happening with your requests</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={24} /></div>
          <div>
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{openRequests}</div>
            <div className="stat-label">Active Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-value">{completedRequests}</div>
            <div className="stat-label">Completed Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={24} /></div>
          <div>
            <div className="stat-value">Rs. {totalSpent}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Recent Requests</h2>
          <Link to="/customer/requests" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : requests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map(request => (
                  <tr key={request._id}>
                    <td style={{ fontWeight: 500 }}>{request.serviceType}</td>
                    <td>{request.location}</td>
                    <td>Rs. {request.expectedPrice}</td>
                    <td>
                      <span className={`badge badge-${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h3 className="empty-state-title">No requests yet</h3>
            <p className="empty-state-desc">You haven't posted any service requests. Create one to get started.</p>
            <Link to="/customer/requests/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Post Request</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
