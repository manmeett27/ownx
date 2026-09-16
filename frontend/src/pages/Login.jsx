import React, { useState } from 'react';
import { User, Lock, Sparkles, ArrowRight, KeyRound, CheckCircle2, X } from 'lucide-react';
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
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password) {
      setToast({ message: 'Validation Required', details: 'Please enter both username and password.' });
      return;
    }

    setLoading(true);
    setToast(null);

    const res = await login(formData.username.trim(), formData.password);
    setLoading(false);

    if (res.success) {
      if (onLoginSuccess) onLoginSuccess(res.user);
    } else {
      setToast({
        message: 'Sign In Failed',
        details: res.error || 'Invalid username or password. Please check your credentials.'
      });
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotUsername.trim()) return;
    setResetSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSuccess(false);
      setForgotUsername('');
      setToast({
        type: 'success',
        message: 'Reset Instructions Sent',
        details: `Password recovery verification code sent for user @${forgotUsername}.`
      });
    }, 1500);
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
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--primary-dark-teal)' }}>
              OWN<span style={{ color: 'var(--primary-teal)' }}>X</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Sign in to your account and social workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-teal)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>

            <GlassButton
              type="submit"
              disabled={loading}
              icon={ArrowRight}
              style={{ width: '100%', marginTop: '6px', height: '44px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </GlassButton>

            {/* Quick Demo Autofill Helper */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setFormData({ username: 'Alice', password: 'password123' })}
                title="Autofill Alice credentials"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(9, 99, 126, 0.3)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--primary-dark-teal)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Auto: Alice
              </button>
              <button
                type="button"
                onClick={() => setFormData({ username: 'Bob', password: 'password123' })}
                title="Autofill Bob credentials"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(9, 99, 126, 0.3)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--primary-dark-teal)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Auto: Bob
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass-subtle)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
            </span>
            <button
              onClick={onNavigateRegister}
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
              Create Account
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 99, 126, 0.25)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)',
              boxShadow: '0 20px 50px rgba(9, 99, 126, 0.2)',
              padding: '28px 24px',
              position: 'relative',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(8, 131, 149, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark-teal)' }}>
                <KeyRound size={18} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                Reset Password
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
              Enter your username below to receive an account recovery verification code.
            </p>

            {resetSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(13, 148, 136, 0.1)', color: '#0F766E', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle2 size={18} />
                <span>Verification code generated! Closing...</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <GlassInput
                  placeholder="Enter your username"
                  icon={User}
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="glass-button glass-button-secondary"
                    style={{ flex: 1, height: '40px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button"
                    style={{ flex: 1, height: '40px' }}
                  >
                    Send Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type || 'error'}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
