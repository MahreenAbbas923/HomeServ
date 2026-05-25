import React, { useState, useEffect } from 'react';
import { User, Briefcase, MapPin, Clock, Save, Send } from 'lucide-react';
import API from '../../utils/api';
import { useToast } from '../../components/Toast';

const ProviderProfileSetup = () => {
  const [profile, setProfile] = useState({
    bio: '',
    experience: 0,
    specializations: [],
    serviceAreas: [],
    status: 'draft'
  });
  
  // Tags inputs state
  const [specInput, setSpecInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get('/providers/me');
        if (data.data) {
          setProfile({
            ...profile,
            ...data.data
          });
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error('Failed to fetch profile', error);
          addToast('Failed to load profile details', 'error');
        }
        // 404 is fine, means profile doesn't exist yet, we stick to default state
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAddTag = (type, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = type === 'spec' ? specInput.trim() : areaInput.trim();
      
      if (value) {
        if (type === 'spec' && !profile.specializations.includes(value)) {
          setProfile({ ...profile, specializations: [...profile.specializations, value] });
          setSpecInput('');
        } else if (type === 'area' && !profile.serviceAreas.includes(value)) {
          setProfile({ ...profile, serviceAreas: [...profile.serviceAreas, value] });
          setAreaInput('');
        }
      }
    }
  };

  const handleRemoveTag = (type, index) => {
    if (type === 'spec') {
      const newSpecs = [...profile.specializations];
      newSpecs.splice(index, 1);
      setProfile({ ...profile, specializations: newSpecs });
    } else {
      const newAreas = [...profile.serviceAreas];
      newAreas.splice(index, 1);
      setProfile({ ...profile, serviceAreas: newAreas });
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const payload = {
        bio: profile.bio,
        experience: Number(profile.experience),
        specializations: profile.specializations,
        serviceAreas: profile.serviceAreas
      };
      
      const { data } = await API.put('/providers/me', payload);
      setProfile(data.data);
      addToast('Profile draft saved successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitApproval = async () => {
    // Basic validation
    if (!profile.bio || profile.specializations.length === 0 || profile.serviceAreas.length === 0) {
      return addToast('Please fill out bio, specializations and service areas before submitting.', 'error');
    }
    
    if (!window.confirm('Submit your profile for admin approval? You will not be able to edit core details while under review.')) return;
    
    setIsSubmitting(true);
    try {
      // First save the latest changes
      await API.put('/providers/me', {
        bio: profile.bio,
        experience: Number(profile.experience),
        specializations: profile.specializations,
        serviceAreas: profile.serviceAreas
      });
      
      // Then submit for approval
      const { data } = await API.patch('/providers/me/submit');
      setProfile(data.data);
      addToast('Profile submitted for approval successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  const isEditable = profile.status === 'draft' || profile.status === 'rejected';

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Provider Profile</h1>
        <p className="dashboard-subtitle">Manage your professional details and services</p>
      </div>

      <div className="profile-status-card" style={{ 
        textAlign: 'left', 
        borderLeft: `4px solid ${
          profile.status === 'approved' ? 'var(--accent-success)' : 
          profile.status === 'pending' ? 'var(--accent-warn)' : 
          profile.status === 'rejected' ? 'var(--accent-danger)' : 'var(--accent)'
        }` 
      }}>
        <h3 className="profile-status-title">Status: {profile.status.toUpperCase()}</h3>
        <p className="profile-status-desc" style={{ marginBottom: 0 }}>
          {profile.status === 'draft' && 'Your profile is not visible to customers yet. Complete it and submit for approval.'}
          {profile.status === 'pending' && 'Your profile is under review by our team. Please wait for approval.'}
          {profile.status === 'approved' && 'Your profile is active and visible to customers! You can bid on requests.'}
          {profile.status === 'rejected' && 'Your profile was rejected. Please update your details and submit again.'}
        </p>
      </div>

      <div className="card" style={{ maxWidth: '800px', opacity: !isEditable && profile.status !== 'approved' ? 0.8 : 1 }}>
        <div className="profile-section">
          <h3 className="profile-section-title"><User size={20} /> Basic Info</h3>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Professional Bio</label>
            <textarea 
              name="bio"
              className="form-input" 
              rows="4" 
              placeholder="Tell customers about yourself, your work ethic, and why they should hire you..."
              value={profile.bio}
              onChange={handleChange}
              disabled={!isEditable}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input 
              type="number" 
              name="experience"
              className="form-input" 
              min="0"
              value={profile.experience}
              onChange={handleChange}
              disabled={!isEditable}
              style={{ maxWidth: '200px' }}
            />
          </div>
        </div>

        <div className="profile-section">
          <h3 className="profile-section-title"><Briefcase size={20} /> Specializations</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Type a skill (e.g. "Plumbing", "AC Repair") and press Enter.
          </p>
          <div className="tags-container">
            {profile.specializations.map((spec, index) => (
              <span key={index} className="tag-pill">
                {spec}
                {isEditable && <button className="tag-remove" onClick={() => handleRemoveTag('spec', index)}>&times;</button>}
              </span>
            ))}
            {isEditable && (
              <input 
                type="text" 
                className="tags-input" 
                placeholder="Add specialization..." 
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => handleAddTag('spec', e)}
              />
            )}
          </div>
        </div>

        <div className="profile-section" style={{ marginBottom: 0 }}>
          <h3 className="profile-section-title"><MapPin size={20} /> Service Areas</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Cities or neighborhoods you serve (Press Enter to add).
          </p>
          <div className="tags-container">
            {profile.serviceAreas.map((area, index) => (
              <span key={index} className="tag-pill">
                {area}
                {isEditable && <button className="tag-remove" onClick={() => handleRemoveTag('area', index)}>&times;</button>}
              </span>
            ))}
            {isEditable && (
              <input 
                type="text" 
                className="tags-input" 
                placeholder="Add service area..." 
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => handleAddTag('area', e)}
              />
            )}
          </div>
        </div>
      </div>

      {isEditable && (
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : <><Save size={18} /> Save Draft</>}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmitApproval}
            disabled={isSaving || isSubmitting}
          >
            {isSubmitting ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : <><Send size={18} /> Submit for Approval</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderProfileSetup;
