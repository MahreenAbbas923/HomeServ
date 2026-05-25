import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import API from '../../utils/api';

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/requests');
      setRequests(data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['All', 'Open', 'Assigned', 'Completed', 'Cancelled'];

  const filteredRequests = activeTab === 'All' 
    ? requests 
    : requests.filter(r => r.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">All Service Requests</h1>
        <p className="dashboard-subtitle">Monitor all requests across the platform</p>
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

      <div className="table-container">
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : filteredRequests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Type</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {req._id.substring(0, 8)}...
                    </td>
                    <td style={{ fontWeight: 500 }}>{req.serviceType}</td>
                    <td>{req.customerId?.name || 'Unknown'}</td>
                    <td>{req.location}</td>
                    <td>Rs. {req.expectedPrice}</td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h3 className="empty-state-title">No requests found</h3>
            <p className="empty-state-desc">No service requests match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRequests;
