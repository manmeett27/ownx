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

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', animation: 'fadeIn 0.5s ease-out' }}>
        <GlassCard style={{ padding: '40px 32px' }}>
          {/* OWNX Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', background: 'var(--brand-gradient)', boxShadow: '0 10px 30px rgba(123, 97, 255, 0.4)', marginBottom: '14px' }}>
              <Sparkles size={28} color="#FFFFFF" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
              Create Account
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Join the next generation OWNX spatial platform
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Your Primary Location
              </label>
              <div className="glass-input-wrapper">
                <MapPin className="glass-input-icon" size={18} />
                <select
                  className="glass-select"
                  style={{ width: '100%', paddingLeft: '46px' }}
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
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </GlassButton>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
            </span>
            <button
              onClick={onNavigateLogin}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Login
            </button>
          </div>
        </GlassCard>
      </div>

      {errorToast && (
        <Toast
          message={errorToast.message}
          details={errorToast.details}
          onClose={() => setErrorToast(null)}
        />
      )}
    </div>
  );
}
