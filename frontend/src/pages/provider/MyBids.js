import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, XCircle, DollarSign, Award } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/bids/my');
      setBids(data.data || []);
    } catch (error) {
      console.error('Failed to fetch bids', error);
      addToast('Failed to load your bids', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (bidId) => {
    if (!window.confirm('Are you sure you want to mark this job as completed?')) return;
    
    try {
      await API.patch(`/bids/${bidId}/complete`);
      addToast('Job marked as completed successfully!', 'success');
      fetchBids();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update job status', 'error');
    }
  };

  const tabs = ['All', 'Pending', 'Accepted', 'Rejected', 'Completed'];

  const filteredBids = activeTab === 'All' 
    ? bids 
    : bids.filter(b => b.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Bids</h1>
        <p className="dashboard-subtitle">Track the status of all your submitted proposals</p>
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
      ) : filteredBids.length > 0 ? (
        <div className="requests-list">
          {filteredBids.map(bid => (
            <div key={bid._id} className="request-card" style={{ border: bid.status === 'accepted' ? '1px solid var(--accent-success)' : '1px solid var(--border-subtle)' }}>
              <div className="request-header">
                <h3 className="request-title">{bid.requestId?.serviceType || 'Service Request'}</h3>
                <span className={`badge badge-${bid.status}`}>
                  {bid.status === 'pending' && <Clock size={12} />}
                  {bid.status === 'accepted' && <CheckCircle size={12} />}
                  {bid.status === 'rejected' && <XCircle size={12} />}
                  {bid.status === 'completed' && <Award size={12} />}
                  {bid.status.toUpperCase()}
                </span>
              </div>
              
              <div className="request-meta" style={{ marginBottom: '16px' }}>
                <div className="request-meta-item">
                  <DollarSign size={16} /> Offered: Rs. {bid.offerPrice}
                </div>
                {bid.requestId?.location && (
                  <div className="request-meta-item">
                    Location: {bid.requestId.location}
                  </div>
                )}
                {bid.customerId?.name && (
                  <div className="request-meta-item">
                    Customer: {bid.customerId.name}
                  </div>
                )}
              </div>
              
              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Message</div>
                <p className="request-desc" style={{ margin: 0 }}>{bid.message || 'No message provided'}</p>
              </div>
              
              <div className="request-footer">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(bid.createdAt).toLocaleDateString()}
                </span>
                
                {bid.status === 'accepted' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarkComplete(bid._id)}
                  >
                    <CheckCircle size={16} /> Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon"><Send size={48} /></div>
          <h3 className="empty-state-title">No bids found</h3>
          <p className="empty-state-desc">
            {activeTab === 'All' 
              ? "You haven't submitted any bids yet." 
              : `You don't have any ${activeTab.toLowerCase()} bids.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBids;
