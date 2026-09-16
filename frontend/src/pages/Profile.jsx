import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Camera, MapPin, Sparkles, Check, AlertCircle, 
  Trash2, RefreshCw, Bell, Eye, Save, LogOut, User 
} from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import GlassCard from '../components/common/GlassCard';
import GlassInput from '../components/common/GlassInput';
import GlassButton from '../components/common/GlassButton';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfilePhoto } from '../services/api';
import { getRealUserLocation } from '../services/locationService';

export default function Profile({ onNavigateHome, onLogout }) {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || user?.username || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location_str: user?.location_str || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    profile_pic: user?.profile_pic || ''
  });

  // Settings State
  const [settings, setSettings] = useState({
    emailNotifs: true,
    activityAlerts: true,
    publicProfile: true,
    shareLocation: true
  });

  // UI States
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  // Profile Photo Upload — sends File directly to backend → Cloudinary (API secret never exposed to frontend)
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Invalid File', details: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File Too Large', details: 'Image must be under 10MB.' });
      return;
    }

    setUploadingPhoto(true);

    // Show instant local preview while uploading
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, profile_pic: previewUrl }));

    try {
      // Uploads file as multipart/form-data to PUT /api/users/profile/photo
      // Backend uploads to Cloudinary using server-side credentials and updates the DB
      const uploadRes = await uploadProfilePhoto(file);
      const photoUrl = uploadRes.profile_pic || uploadRes.user?.profile_pic;

      if (photoUrl) {
        // Replace preview blob URL with real Cloudinary URL
        URL.revokeObjectURL(previewUrl);
        setFormData((prev) => ({ ...prev, profile_pic: photoUrl }));
        updateUser({ profile_pic: photoUrl });
      }

      setToast({
        type: 'success',
        message: 'Profile Photo Updated',
        details: 'Your new photo has been securely uploaded via Cloudinary.'
      });
    } catch (err) {
      // Revert preview on error
      URL.revokeObjectURL(previewUrl);
      setFormData((prev) => ({ ...prev, profile_pic: user?.profile_pic || '' }));
      setToast({
        type: 'error',
        message: 'Upload Failed',
        details: err.message
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setFormData((prev) => ({ ...prev, profile_pic: '' }));
    if (user?.user_id) {
      try {
        await updateUserProfile(user.user_id, { profile_pic: '' });
        updateUser({ profile_pic: '' });
        setToast({ type: 'success', message: 'Profile Photo Removed' });
      } catch (err) {
        console.error('Error removing photo:', err);
      }
    }
  };

  // Real Location Detection using device navigator.geolocation + reverse geocode
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);
    setLocationSuccess(false);

    try {
      const loc = await getRealUserLocation();
      setFormData((prev) => ({
        ...prev,
        location_str: loc.location_str,
        latitude: loc.latitude,
        longitude: loc.longitude
      }));
      setLocationSuccess(true);
      setToast({
        type: 'success',
        message: 'Location Detected',
        details: `Identified as: ${loc.location_str}`
      });
    } catch (err) {
      setLocationError(err.message || 'Unable to access your location. Please allow location permission and try again.');
      setToast({
        type: 'error',
        message: 'Location Access Failed',
        details: err.message || 'Please check browser permissions and retry.'
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  // Save Complete Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setToast({ type: 'error', message: 'Validation Error', details: 'Username cannot be blank.' });
      return;
    }

    setSaving(true);
    try {
      const userId = user?.user_id || 1;
      const res = await updateUserProfile(userId, {
        name: formData.name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        location_str: formData.location_str.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        profile_pic: formData.profile_pic
      });

      // Update global user context immediately so Navbar & Feed reflect changes
      updateUser(res.user || formData);

      setToast({
        type: 'success',
        message: 'Profile Updated Successfully',
        details: 'All changes have been synchronized to your account.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Unable to update profile. Please try again.',
        details: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '80px' }}>
      <SpatialBackground />

      {/* Main Full-Page Container */}
      <main style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 20px 0 20px', position: 'relative', zIndex: 10 }}>
        {/* Top Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={onNavigateHome}
            className="glass-button glass-button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', height: '40px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleLogout}
              className="glass-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                height: '40px',
                borderColor: 'rgba(220, 38, 38, 0.3)',
                color: '#B91C1C',
                background: 'rgba(220, 38, 38, 0.08)'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <GlassCard style={{ padding: '36px 30px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            {/* Avatar with Cloudinary Upload Trigger */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '24px',
                  background: 'var(--primary-dark-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '40px',
                  fontWeight: '800',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(9, 99, 126, 0.25)',
                  border: '3px solid #FFFFFF'
                }}
              >
                {formData.profile_pic ? (
                  <img
                    src={formData.profile_pic}
                    alt="Profile Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(formData.name || formData.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Change Profile Photo"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '-6px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary-teal)',
                  color: '#FFFFFF',
                  border: '2px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(8, 131, 149, 0.35)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {uploadingPhoto ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>

              {/* Hidden Real File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* User Meta Information */}
            <div style={{ flex: '1', minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary-dark-teal)', margin: 0 }}>
                  {formData.name || `@${formData.username}`}
                </h1>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--primary-teal)',
                    background: 'rgba(8, 131, 149, 0.1)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(8, 131, 149, 0.2)'
                  }}
                >
                  Active Member
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-teal)', marginTop: '2px' }}>
                @{formData.username}
              </div>

              {formData.bio && (
                <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.5' }}>
                  {formData.bio}
                </p>
              )}

              {formData.location_str && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <MapPin size={14} color="var(--primary-teal)" />
                  <span>{formData.location_str}</span>
                </div>
              )}

              {/* Photo Options */}
              {formData.profile_pic && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-danger)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Personal Details */}
          <GlassCard style={{ padding: '28px 24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)', marginBottom: '18px' }}>
              Personal Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <GlassInput
                label="Full Name"
                placeholder="e.g. Alex Henderson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <GlassInput
                label="Username"
                placeholder="e.g. alex_spatial"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                About / Bio
              </label>
              <textarea
                className="glass-input"
                style={{
                  width: '100%',
                  minHeight: '90px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
                placeholder="Tell your community about your passions, background, and projects..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={300}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                {formData.bio.length}/300 characters
              </div>
            </div>
          </GlassCard>

          {/* Section 2: Real Location Management (No Mock Location) */}
          <GlassCard style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)', margin: 0 }}>
                  Location Management
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Real browser geolocation with GPS coordinates and reverse geocoding
                </p>
              </div>

              <GlassButton
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                icon={detectingLocation ? RefreshCw : MapPin}
                style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
              >
                {detectingLocation ? 'Requesting GPS...' : 'Detect Device Location'}
              </GlassButton>
            </div>

            {/* Current Location Display Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(235, 244, 246, 0.7)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(8, 131, 149, 0.1)',
                      color: 'var(--primary-dark-teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Current Saved Location
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                      {formData.location_str || 'No location configured'}
                    </div>
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-glass)',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--primary-teal)'
                    }}
                  >
                    GPS: {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
                  </div>
                )}
              </div>

              {/* Manual Location Override Input */}
              <div style={{ marginTop: '6px' }}>
                <GlassInput
                  placeholder="Or enter city and state manually (e.g. San Francisco, California)"
                  value={formData.location_str}
                  onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                />
              </div>
            </div>

            {/* Error Banner with Retry */}
            {locationError && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: '#991B1B',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={17} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>{locationError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  style={{
                    background: 'var(--primary-dark-teal)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </GlassCard>

          {/* Section 3: Account & Notification Settings */}
          <GlassCard style={{ padding: '28px 24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)', marginBottom: '18px' }}>
              Account Preferences
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'emailNotifs', label: 'Activity Notifications', desc: 'Receive real-time alerts when people like, comment, or share your posts' },
                { key: 'activityAlerts', label: 'Community Announcements', desc: 'Get updates on platform features and trending discussions' },
                { key: 'publicProfile', label: 'Public Profile Visibility', desc: 'Allow your posts and profile to be discovered in Explore and search' },
                { key: 'shareLocation', label: 'Attach Location to New Posts', desc: 'Automatically tag your verified region on newly published updates' }
              ].map((pref) => (
                <div
                  key={pref.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(235, 244, 246, 0.65)',
                    border: '1px solid var(--border-glass-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                      {pref.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {pref.desc}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings[pref.key]}
                    onChange={(e) => setSettings({ ...settings, [pref.key]: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-dark-teal)' }}
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Form Actions Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onNavigateHome}
              className="glass-button glass-button-secondary"
              style={{ height: '44px', padding: '0 24px', fontSize: '14px' }}
            >
              Cancel
            </button>

            <GlassButton
              type="submit"
              disabled={saving}
              icon={Save}
              style={{ height: '44px', padding: '0 28px', fontSize: '14px' }}
            >
              {saving ? 'Saving Profile...' : 'Save Changes'}
            </GlassButton>
          </div>
        </form>
      </main>

      {/* Global Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
