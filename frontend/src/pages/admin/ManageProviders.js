import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Award, MapPin, Briefcase, X } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const ManageProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, [activeTab]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'Pending' ? '/admin/providers/pending' : '/admin/providers';
      const { data } = await API.get(endpoint);
      
      let fetchedProviders = data.data || [];
      if (activeTab !== 'Pending' && activeTab !== 'All') {
        fetchedProviders = fetchedProviders.filter(p => p.status.toLowerCase() === activeTab.toLowerCase());
      }
      
      setProviders(fetchedProviders);
    } catch (error) {
      console.error('Failed to fetch providers', error);
      addToast('Failed to load providers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (id, action) => {
    try {
      await API.patch(`/admin/providers/${id}/${action}`);
      addToast(`Provider ${action}d successfully`, 'success');
      setSelectedProvider(null); // Close modal on action
      fetchProviders();
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${action} provider`, 'error');
    }
  };

  const tabs = ['Pending', 'Approved', 'Rejected', 'All'];

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Manage Service Providers</h1>
        <p className="dashboard-subtitle">Review applications and manage provider accounts</p>
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
      ) : providers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px' }}>
          {providers.map(provider => (
            <div key={provider._id} className="admin-provider-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="admin-provider-header">
                <div className="provider-avatar" style={{ marginBottom: 0 }}>
                  {provider.user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="admin-provider-info">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="admin-provider-name">{provider.user?.name || 'Unknown User'}</div>
                    <span className={`badge badge-${provider.status}`}>{provider.status.toUpperCase()}</span>
                  </div>
                  <div className="admin-provider-email">{provider.user?.email || 'No email'} • {provider.user?.phone || 'No phone'}</div>
                </div>
              </div>
              
              <div className="admin-provider-details" style={{ flex: 1 }}>
                <div className="detail-chip"><Briefcase size={12} /> {provider.specializations?.length || 0} Specializations</div>
                <div className="detail-chip"><Award size={12} /> {provider.experience || 0} Years Exp.</div>
                <div className="detail-chip"><MapPin size={12} /> {provider.serviceAreas?.length || 0} Areas</div>
              </div>

              <div className="admin-provider-actions" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedProvider(provider)}
                >
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon"><Users size={48} /></div>
          <h3 className="empty-state-title">No providers found</h3>
          <p className="empty-state-desc">There are no providers in the {activeTab.toLowerCase()} state right now.</p>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedProvider && (
        <div className="modal-overlay" onClick={() => setSelectedProvider(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Provider Details</h3>
              <button className="modal-close" onClick={() => setSelectedProvider(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div className="provider-avatar" style={{ marginBottom: 0, width: '64px', height: '64px', fontSize: '1.5rem' }}>
                  {selectedProvider.user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedProvider.user?.name}</h2>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedProvider.user?.email} • {selectedProvider.user?.phone}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge badge-${selectedProvider.status}`}>{selectedProvider.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Professional Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Experience</div>
                    <div style={{ fontWeight: 600 }}>{selectedProvider.experience || 0} Years</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>City</div>
                    <div style={{ fontWeight: 600 }}>{selectedProvider.user?.city || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Specializations</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedProvider.specializations?.length > 0 ? (
                    selectedProvider.specializations.map((spec, i) => (
                      <span key={i} className="provider-tag">{spec}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>None listed</span>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Service Areas</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedProvider.serviceAreas?.length > 0 ? (
                    selectedProvider.serviceAreas.map((area, i) => (
                      <span key={i} className="provider-tag">{area}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>None listed</span>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedProvider(null)}>Close</button>
                
                {selectedProvider.status !== 'rejected' && (
                  <button 
                    className="btn btn-outline" 
                    style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                    onClick={() => handleProviderAction(selectedProvider._id, 'reject')}
                  >
                    <XCircle size={16} /> Reject Provider
                  </button>
                )}
                
                {selectedProvider.status !== 'approved' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => handleProviderAction(selectedProvider._id, 'approve')}
                  >
                    <CheckCircle size={16} /> Approve Provider
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProviders;
