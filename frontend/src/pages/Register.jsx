import React, { useState } from 'react';
import { User, Lock, MapPin, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import GlassCard from '../components/common/GlassCard';
import GlassInput from '../components/common/GlassInput';
import GlassButton from '../components/common/GlassButton';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export default function Register({ onNavigateLogin, onRegisterSuccess }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    locationId: 1
  });

  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setErrorToast({ message: 'Validation Error', details: 'Please fill in all required fields.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorToast({ message: 'Password Mismatch', details: 'Password and confirm password do not match.' });
      return;
    }

    setLoading(true);
    setErrorToast(null);

    const res = await register(formData.username, formData.password, Number(formData.locationId));
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

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', animation: 'fadeIn 0.3s ease-out' }}>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <GlassInput
              label="Choose Username"
              name="username"
              placeholder="e.g. alex_spatial"
              icon={User}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
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
              icon={ShieldCheck}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Your Primary Location
              </label>
              <div className="glass-input-wrapper">
                <MapPin className="glass-input-icon" size={17} />
                <select
                  className="glass-select"
                  style={{ width: '100%', paddingLeft: '42px', height: '42px' }}
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="1">Lucknow (Region 1)</option>
                  <option value="2">Delhi (Region 2)</option>
                  <option value="3">Mumbai (Region 3)</option>
                  <option value="4">Bangalore (Region 4)</option>
                </select>
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
