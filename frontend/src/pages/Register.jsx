import React, { useState } from 'react';
import { User, Lock, MapPin, Sparkles, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import GlassCard from '../components/common/GlassCard';
import GlassInput from '../components/common/GlassInput';
import GlassButton from '../components/common/GlassButton';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { getRealUserLocation } from '../services/locationService';

export default function Register({ onNavigateLogin, onRegisterSuccess }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    location_str: '',
    latitude: null,
    longitude: null
  });

  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await getRealUserLocation();
      setFormData(prev => ({
        ...prev,
        location_str: loc.location_str,
        latitude: loc.latitude,
        longitude: loc.longitude
      }));
    } catch (err) {
      setErrorToast({
        message: 'Location Notice',
        details: err.message || 'Could not auto-detect location. You can enter your city manually or configure it later in your profile.'
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password) {
      setErrorToast({ message: 'Validation Error', details: 'Please fill in all required fields.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorToast({ message: 'Password Mismatch', details: 'Password and confirm password do not match.' });
      return;
    }

    setLoading(true);
    setErrorToast(null);

    const res = await register(formData.username.trim(), formData.password, {
      name: formData.name.trim() || formData.username.trim(),
      location_str: formData.location_str,
      latitude: formData.latitude,
      longitude: formData.longitude
    });
    setLoading(false);

    if (res.success) {
      if (onRegisterSuccess) onRegisterSuccess(res.user);
    } else {
      setErrorToast({
        message: 'Registration Failed',
        details: res.error || 'Username may already be taken. Try a different username.'
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <SpatialBackground />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', animation: 'fadeIn 0.3s ease-out' }}>
        <GlassCard style={{ padding: '36px 30px' }}>
          {/* OWNX Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'var(--primary-dark-teal)',
                boxShadow: '0 8px 24px rgba(9, 99, 126, 0.25)',
                marginBottom: '12px'
              }}
            >
              <Sparkles size={24} color="#FFFFFF" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--primary-dark-teal)' }}>
              Create Account
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Join the OWNX social network and community
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <GlassInput
              label="Username"
              name="username"
              placeholder="e.g. alex_spatial"
              icon={User}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />

            <GlassInput
              label="Full Name (Optional)"
              name="name"
              placeholder="e.g. Alex Henderson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <GlassInput
              label="Password"
              name="password"
              type="password"
              placeholder="Create strong password"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <GlassInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              icon={KeyRound}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            {/* Real Location (Optional / Auto-detect) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Location (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-teal)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <RefreshCw size={11} className={detectingLocation ? 'animate-spin' : ''} />
                  <span>{detectingLocation ? 'Detecting...' : 'Auto-detect GPS'}</span>
                </button>
              </div>

              <div className="glass-input-wrapper">
                <MapPin className="glass-input-icon" size={17} />
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. San Francisco, CA (or leave blank)"
                  value={formData.location_str}
                  onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                />
              </div>
            </div>

            <GlassButton
              type="submit"
              disabled={loading}
              icon={ArrowRight}
              style={{ width: '100%', marginTop: '6px', height: '44px' }}
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </GlassButton>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass-subtle)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
            </span>
            <button
              onClick={onNavigateLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-dark-teal)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sign In
            </button>
          </div>
        </GlassCard>
      </div>

      {errorToast && (
        <Toast
          type="error"
          message={errorToast.message}
          details={errorToast.details}
          onClose={() => setErrorToast(null)}
        />
      )}
    </div>
  );
}
