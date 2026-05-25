import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, FileText, DollarSign, MapPin, Calendar } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const SERVICE_TYPES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'AC / Heating',
  'Appliance Repair',
  'Pest Control',
  'Masonry / Tiling',
  'Landscaping / Gardening',
  'Other',
];

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    expectedPrice: '',
    location: '',
    preferredDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        serviceType: formData.serviceType,
        description: formData.description,
        expectedPrice: Number(formData.expectedPrice),
        location: formData.location,
        ...(formData.preferredDate && { preferredDate: formData.preferredDate }),
      };

      await API.post('/requests', payload);
      addToast('Service request posted successfully!', 'success');
      navigate('/customer/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post request. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Post a New Service Request</h1>
        <p className="dashboard-subtitle">Provide details about the job to get bids from professionals</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {error && <div className="alert alert-error" style={{marginBottom: '24px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="form-group" style={{ gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <div style={{ position: 'relative' }}>
              <Wrench size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                name="serviceType"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select a service type...</option>
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <textarea
                name="description"
                className="form-input"
                style={{ paddingLeft: '40px', minHeight: '120px' }}
                placeholder="Describe what needs to be done in detail. Include any specific requirements or materials needed."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expected Budget (Rs.)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  name="expectedPrice"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. 5000"
                  min="1"
                  value={formData.expectedPrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Date (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  name="preferredDate"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.preferredDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="location"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Your full address or area"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? <div className="spinner"></div> : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
