import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Calendar, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, bidsRes] = await Promise.all([
        API.get(`/requests/${id}`),
        API.get(`/bids/request/${id}`)
      ]);
      setRequest(reqRes.data.data);
      setBids(bidsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch request details', err);
      setError('Could not load request details. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidAction = async (bidId, action) => {
    setActionLoading(bidId);
    try {
      await API.patch(`/bids/${bidId}/${action}`);
      addToast(`Bid ${action}ed successfully!`, 'success');
      fetchData(); // Refresh data to update statuses
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${action} bid`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      await API.patch(`/requests/${id}/cancel`);
      addToast('Request cancelled successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (error || !request) return (
    <div>
      <Link to="/customer/requests" className="btn btn-ghost btn-sm" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>
      <div className="alert alert-error">{error || 'Request not found'}</div>
    </div>
  );

  return (
    <div>
      <Link to="/customer/requests" className="btn btn-ghost btn-sm" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title">{request.serviceType}</h1>
          <p className="dashboard-subtitle">Posted on {new Date(request.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className={`badge badge-${request.status}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
            {request.status.toUpperCase()}
          </span>
          {request.status === 'open' && (
            <button onClick={handleCancelRequest} className="btn btn-outline btn-sm" style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
              Cancel Request
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Request Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Location
            </div>
            <div style={{ fontWeight: 500 }}>{request.location}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Expected Budget
            </div>
            <div style={{ fontWeight: 500, color: 'var(--accent)' }}>Rs. {request.expectedPrice}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Preferred Date
            </div>
            <div style={{ fontWeight: 500 }}>
              {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Flexible'}
            </div>
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Description</div>
          <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{request.description}</p>
        </div>
      </div>

      <div className="section-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Bids from Providers ({bids.length})</h2>
      </div>

      {bids.length > 0 ? (
        <div className="bids-list">
          {bids.map(bid => (
            <div key={bid._id} className="bid-card" style={{ border: bid.status === 'accepted' ? '2px solid var(--accent-success)' : '' }}>
              <div className="bid-provider-info" style={{ flex: 1 }}>
                <div className="bid-avatar">
                  {bid.providerId?.user?.name ? bid.providerId.user.name.charAt(0).toUpperCase() : <User size={20} />}
                </div>
                <div>
                  <div className="bid-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {bid.providerId?.user?.name || 'Unknown Provider'}
                    {bid.status === 'accepted' && <span className="badge badge-accepted" style={{ fontSize: '0.7rem' }}>Accepted</span>}
                  </div>
                  <div className="bid-message" style={{ marginTop: '4px' }}>{bid.message || 'No message provided.'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div className="bid-price">Rs. {bid.offerPrice}</div>
                
                {request.status === 'open' && bid.status === 'pending' && (
                  <div className="bid-actions">
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                      onClick={() => handleBidAction(bid._id, 'reject')}
                      disabled={actionLoading === bid._id}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleBidAction(bid._id, 'accept')}
                      disabled={actionLoading === bid._id}
                    >
                      {actionLoading === bid._id ? <div className="spinner" style={{width: '14px', height: '14px'}}></div> : <><CheckCircle size={14} /> Accept</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon"><Clock size={48} /></div>
          <h3 className="empty-state-title">No bids yet</h3>
          <p className="empty-state-desc">Service providers haven't submitted any bids for your request yet. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;
