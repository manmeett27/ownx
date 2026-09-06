import React from 'react';
import { Sparkles, Shield, User, LogOut, Bell, Compass, Home, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onNavigateAuth }) {
  const { user, logout, backendStatus } = useAuth();

  return (
    <header className="glass-navbar">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: 'var(--brand-gradient)', boxShadow: '0 4px 16px rgba(123, 97, 255, 0.4)' }}>
          <Sparkles size={22} color="#FFFFFF" />
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
          OWN<span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X</span>
        </span>
      </div>

      {/* Center Navigation Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="glass-icon-button active" title="Home Feed">
          <Home size={20} />
        </button>
        <button className="glass-icon-button" title="Explore Recommendations">
          <Compass size={20} />
        </button>
        <button className="glass-icon-button" title="Notifications">
          <Bell size={20} />
        </button>
      </div>

      {/* Backend Status & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '99px',
            background: backendStatus.online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${backendStatus.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '12px',
            fontWeight: '600',
            color: backendStatus.online ? '#6EE7B7' : '#FCA5A5'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendStatus.online ? '#10B981' : '#EF4444',
              boxShadow: backendStatus.online ? '0 0 8px #10B981' : '0 0 8px #EF4444'
            }}
          />
          <Shield size={14} />
          <span>{backendStatus.online ? 'AI Shield Online' : 'Mock Mode Active'}</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px 6px 6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '99px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '700', fontSize: '14px' }}>
                {(user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                @{user.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="glass-icon-button"
              title="Sign Out"
              style={{ color: '#FCA5A5' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onNavigateAuth}
            className="glass-button"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
