import React, { useState } from 'react';
import { User, Lock, MapPin, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import GlassCard from '../components/common/GlassCard';
import GlassInput from '../components/common/GlassInput';
import GlassButton from '../components/common/GlassButton';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export default function Login({ onNavigateRegister, onLoginSuccess }) {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    location: 'Lucknow'
  });

  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setErrorToast({ message: 'Validation Error', details: 'Please enter both username and password.' });
      return;
    }

    setLoading(true);
    setErrorToast(null);

    const res = await login(formData.username, formData.password);
    setLoading(false);

    if (res.success) {
      if (onLoginSuccess) onLoginSuccess(res.user);
    } else {
      setErrorToast({
        message: 'Authentication Failed',
        details: res.error || 'Invalid username or password. Please check your credentials.'
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
              OWN<span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X</span>
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Welcome back to your spatial social environment
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlassInput
              label="Username"
              name="username"
              placeholder="Enter your username"
              icon={User}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />

            <GlassInput
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Location Region
              </label>
              <div className="glass-input-wrapper">
                <MapPin className="glass-input-icon" size={18} />
                <select
                  className="glass-select"
                  style={{ width: '100%', paddingLeft: '46px' }}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="Lucknow">Lucknow (Region 1)</option>
                  <option value="Delhi">Delhi (Region 2)</option>
                  <option value="Mumbai">Mumbai (Region 3)</option>
                  <option value="Bangalore">Bangalore (Region 4)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
              <button
                type="button"
                onClick={() => setErrorToast({ message: 'Password Reset', details: 'Contact support or re-register with a new username.' })}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            <GlassButton
              type="submit"
              disabled={loading}
              icon={ArrowRight}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Authenticating...' : 'Next'}
            </GlassButton>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
            </span>
            <button
              onClick={onNavigateRegister}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Create Account
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
