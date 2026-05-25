import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, Award, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bidsRes = await API.get('/bids/my');
        setBids(bidsRes.data.data || []);
        
        try {
          const profileRes = await API.get('/providers/me');
          setProfile(profileRes.data.data);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            setProfile({ status: 'draft' }); // Dummy draft profile
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalBids = bids.length;
  const acceptedBids = bids.filter(b => b.status === 'accepted').length;
  const completedJobs = bids.filter(b => b.status === 'completed').length;
  const earnings = bids.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.offerPrice || 0), 0);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Provider Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name}</p>
      </div>

      {!loading && profile && profile.status !== 'approved' && (
        <div className="profile-status-card" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-warn)' }}>
          <div>
            <h3 className="profile-status-title">Profile Status: {profile.status.toUpperCase()}</h3>
            <p className="profile-status-desc" style={{ marginBottom: 0 }}>
              {profile.status === 'draft' && 'Your profile is incomplete. Please complete your profile and submit it for approval to start bidding on requests.'}
              {profile.status === 'pending' && 'Your profile is currently under review by our admin team. You will be notified once approved.'}
              {profile.status === 'rejected' && 'Your profile application was rejected. Please review your details and submit again.'}
            </p>
          </div>
          {profile.status === 'draft' && (
            <Link to="/provider/profile" className="btn btn-primary">Complete Profile</Link>
          )}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Send size={24} /></div>
          <div>
            <div className="stat-value">{totalBids}</div>
            <div className="stat-label">Total Bids</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-value">{acceptedBids}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><Award size={24} /></div>
          <div>
            <div className="stat-value">{completedJobs}</div>
            <div className="stat-label">Completed Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={24} /></div>
          <div>
            <div className="stat-value">Rs. {earnings}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Recent Bids</h2>
          <Link to="/provider/bids" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : bids.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Customer</th>
                  <th>Your Offer</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bids.slice(0, 5).map(bid => (
                  <tr key={bid._id}>
                    <td style={{ fontWeight: 500 }}>{bid.requestId?.serviceType || 'Unknown'}</td>
                    <td>{bid.customerId?.name || 'Customer'}</td>
                    <td>Rs. {bid.offerPrice}</td>
                    <td>
                      <span className={`badge badge-${bid.status}`}>
                        {bid.status}
                      </span>
                    </td>
                    <td>{new Date(bid.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Send size={48} /></div>
            <h3 className="empty-state-title">No bids yet</h3>
            <p className="empty-state-desc">Start browsing service requests and place your first bid to get jobs.</p>
            <Link to="/provider/requests" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Requests</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
