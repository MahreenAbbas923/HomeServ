import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Calendar, User, Send, X, FileText } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const BrowseRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bidForm, setBidForm] = useState({ offerPrice: '', message: '' });
  const [isBidding, setIsBidding] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/requests');
      setRequests(data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      addToast('Failed to load available requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBidModal = (request) => {
    setSelectedRequest(request);
    setBidForm({ offerPrice: request.expectedPrice || '', message: '' });
  };

  const handleCloseBidModal = () => {
    setSelectedRequest(null);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setIsBidding(true);
    
    try {
      await API.post('/bids', {
        requestId: selectedRequest._id,
        offerPrice: Number(bidForm.offerPrice),
        message: bidForm.message
      });
      
      addToast('Bid submitted successfully!', 'success');
      handleCloseBidModal();
      // Refetch to potentially hide if the backend removes bid-on requests (depends on backend logic)
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit bid', 'error');
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Available Service Requests</h1>
        <p className="dashboard-subtitle">Browse open requests from customers and submit your bids</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : requests.length > 0 ? (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h3 className="request-title">{request.serviceType}</h3>
                <span className="badge badge-open">OPEN</span>
              </div>
              
              <div className="request-meta">
                <div className="request-meta-item">
                  <User size={16} /> {request.customerId?.name || 'Customer'}
                </div>
                <div className="request-meta-item">
                  <MapPin size={16} /> {request.location}
                </div>
                <div className="request-meta-item">
                  <DollarSign size={16} /> Expected: Rs. {request.expectedPrice}
                </div>
                {request.preferredDate && (
                  <div className="request-meta-item">
                    <Calendar size={16} /> {new Date(request.preferredDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <p className="request-desc">{request.description}</p>
              
              <div className="request-footer">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Posted {new Date(request.createdAt).toLocaleDateString()}
                </span>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenBidModal(request)}
                >
                  <Send size={16} /> Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon"><FileText size={48} /></div>
          <h3 className="empty-state-title">No open requests</h3>
          <p className="empty-state-desc">There are no available requests right now. Please check back later.</p>
        </div>
      )}

      {/* Bid Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={handleCloseBidModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Your Bid</h3>
              <button className="modal-close" onClick={handleCloseBidModal}><X size={20} /></button>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>{selectedRequest.serviceType}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Customer's Budget: Rs. {selectedRequest.expectedPrice}
              </div>
            </div>
            
            <form onSubmit={handleSubmitBid} className="modal-body">
              <div className="form-group">
                <label className="form-label">Your Offer Price (Rs.)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }}
                    min="1"
                    value={bidForm.offerPrice}
                    onChange={(e) => setBidForm({...bidForm, offerPrice: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Message / Proposal</label>
                <textarea 
                  className="form-input" 
                  rows="4"
                  placeholder="Explain why you are the best fit for this job..."
                  value={bidForm.message}
                  onChange={(e) => setBidForm({...bidForm, message: e.target.value})}
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCloseBidModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isBidding}>
                  {isBidding ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseRequests;
