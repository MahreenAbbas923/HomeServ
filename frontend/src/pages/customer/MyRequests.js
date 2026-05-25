import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, FileText } from 'lucide-react';
import API from '../../utils/api';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

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

  const tabs = ['All', 'Open', 'Assigned', 'Completed', 'Cancelled'];

  const filteredRequests = activeTab === 'All' 
    ? requests 
    : requests.filter(r => r.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dashboard-title">My Service Requests</h1>
          <p className="dashboard-subtitle">Manage all your posted requests and view bids</p>
        </div>
        <Link to="/customer/requests/new" className="btn btn-primary">New Request</Link>
      </div>

      <div className="tabs" style={{ marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button 
            key={tab} 
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : filteredRequests.length > 0 ? (
        <div className="requests-list">
          {filteredRequests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h3 className="request-title">{request.serviceType}</h3>
                <span className={`badge badge-${request.status}`}>{request.status}</span>
              </div>
              
              <div className="request-meta">
                <div className="request-meta-item">
                  <MapPin size={16} /> {request.location}
                </div>
                <div className="request-meta-item">
                  <DollarSign size={16} /> Rs. {request.expectedPrice}
                </div>
                {request.preferredDate && (
                  <div className="request-meta-item">
                    <Calendar size={16} /> {new Date(request.preferredDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <p className="request-desc">
                {request.description.length > 150 ? `${request.description.substring(0, 150)}...` : request.description}
              </p>
              
              <div className="request-footer">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Posted on {new Date(request.createdAt).toLocaleDateString()}
                </span>
                <Link to={`/customer/requests/${request._id}`} className="btn btn-outline btn-sm">
                  View Details & Bids
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div className="empty-state-icon"><FileText size={48} /></div>
          <h3 className="empty-state-title">No requests found</h3>
          <p className="empty-state-desc">
            {activeTab === 'All' 
              ? "You haven't posted any service requests yet." 
              : `You don't have any ${activeTab.toLowerCase()} requests.`}
          </p>
          {activeTab === 'All' && (
            <Link to="/customer/requests/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Post Request</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
