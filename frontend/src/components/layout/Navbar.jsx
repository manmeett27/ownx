import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Shield, User, LogOut, Bell, Compass, Home, Check, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onNavigateAuth, onNavigateHome, activeTab = 'home', onTabChange }) {
  const { user, logout, backendStatus } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'AI Shield Approved', desc: 'Your recent post passed all content moderation checks.', time: '10m ago', unread: true },
    { id: 2, title: 'Trending Recommendation', desc: 'New discussions about #AI_Content_Moderation available.', time: '1h ago', unread: false },
    { id: 3, title: 'Security Notice', desc: 'Two-factor session token active on this device.', time: '2h ago', unread: false }
  ]);
  const notifRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark all as read
    if (!showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  const handleHomeClick = () => {
    if (onTabChange) onTabChange('home');
    if (onNavigateHome) onNavigateHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    if (onTabChange) onTabChange('explore');
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="glass-navbar">
      {/* Brand Logo - Clickable to go Home */}
      <div
        onClick={handleHomeClick}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        title="OWNX Home"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--primary-dark-teal)',
            boxShadow: '0 3px 10px rgba(9, 99, 126, 0.25)'
          }}
        >
          <Sparkles size={20} color="#FFFFFF" />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '-0.3px',
            color: 'var(--primary-dark-teal)'
          }}
        >
          OWN<span style={{ color: 'var(--primary-teal)' }}>X</span>
        </span>
      </div>

      {/* Center Navigation Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleHomeClick}
          className={`glass-icon-button ${activeTab === 'home' ? 'active' : ''}`}
          title="Home Feed"
          aria-label="Home Feed"
        >
          <Home size={18} />
        </button>

        <button
          onClick={handleExploreClick}
          className={`glass-icon-button ${activeTab === 'explore' ? 'active' : ''}`}
          title="Explore Recommendations"
          aria-label="Explore Recommendations"
        >
          <Compass size={18} />
        </button>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={handleNotificationClick}
            className={`glass-icon-button ${showNotifications ? 'active' : ''}`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-teal)',
                  boxShadow: '0 0 0 2px #FFFFFF'
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '-40px',
                width: '320px',
                background: '#FFFFFF',
                border: '1px solid var(--border-glass)',
                borderRadius: '14px',
                boxShadow: '0 12px 36px rgba(9, 99, 126, 0.15)',
                padding: '16px',
                zIndex: 1100,
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                  Notifications
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Activity Center
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: n.unread ? 'rgba(8, 131, 149, 0.06)' : 'rgba(235, 244, 246, 0.5)',
                      border: '1px solid var(--border-glass-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        {n.time}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backend Status & Profile Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: backendStatus.online ? 'rgba(13, 148, 136, 0.08)' : 'rgba(235, 244, 246, 0.8)',
            border: `1px solid ${backendStatus.online ? 'rgba(13, 148, 136, 0.3)' : 'var(--border-glass)'}`,
            fontSize: '12px',
            fontWeight: '600',
            color: backendStatus.online ? '#0F766E' : 'var(--text-muted)'
          }}
          title={backendStatus.online ? 'Backend API and AI services are connected' : 'Connecting to backend services'}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: backendStatus.online ? '#0D9488' : '#7AB2B2'
            }}
          />
          <Shield size={13} />
          <span>{backendStatus.online ? 'AI Shield Online' : 'Mock Mode Active'}</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 5px',
                background: 'rgba(235, 244, 246, 0.8)',
                borderRadius: '30px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--primary-dark-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                {(user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark-teal)' }}>
                @{user.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="glass-icon-button"
              title="Sign Out"
              aria-label="Sign Out"
              style={{ color: 'var(--status-danger)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onNavigateAuth}
            className="glass-button"
            style={{ padding: '7px 16px', fontSize: '13px' }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
