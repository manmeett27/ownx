import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, User, LogOut, Bell, Compass, Home, Film, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onNavigateAuth, onNavigateHome, onNavigateProfile, onNavigateVideos, activeTab = 'home', onTabChange }) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to OWNX', desc: 'Explore the live feed, try Short Videos, and customize your profile.', time: 'Just now', unread: true },
    { id: 2, title: 'Real-time Feed Active', desc: 'New media updates are available from your network.', time: '20m ago', unread: true },
    { id: 3, title: 'Cloud Media Ready', desc: 'High-speed Cloudinary storage is active for all your posts and photos.', time: '1h ago', unread: false }
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
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      // Mark notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  const handleHomeClick = () => {
    if (onTabChange) onTabChange('home');
    if (onNavigateHome) onNavigateHome();
    else window.location.hash = 'feed';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    if (onTabChange) onTabChange('explore');
    else {
      window.location.hash = 'feed';
      if (onTabChange) onTabChange('explore');
    }
  };

  const handleVideosClick = () => {
    if (onNavigateVideos) onNavigateVideos();
    else window.location.hash = 'videos';
  };

  const handleProfileClick = () => {
    if (onNavigateProfile) onNavigateProfile();
    else window.location.hash = 'profile';
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="glass-navbar">
      {/* LEFT: Brand Logo & Main Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Brand Logo */}
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

        {/* Main Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleHomeClick}
            className={`glass-icon-button ${activeTab === 'home' ? 'active' : ''}`}
            title="Home Feed"
            aria-label="Home Feed"
            style={{ gap: '6px', width: 'auto', padding: '0 12px' }}
          >
            <Home size={17} />
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'inline-block' }}>Feed</span>
          </button>

          <button
            onClick={handleVideosClick}
            className={`glass-icon-button ${activeTab === 'videos' ? 'active' : ''}`}
            title="Short Videos"
            aria-label="Short Videos"
            style={{ gap: '6px', width: 'auto', padding: '0 12px' }}
          >
            <Film size={17} color="var(--primary-teal)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark-teal)' }}>Shorts</span>
          </button>

          <button
            onClick={handleExploreClick}
            className={`glass-icon-button ${activeTab === 'explore' ? 'active' : ''}`}
            title="Explore"
            aria-label="Explore"
            style={{ gap: '6px', width: 'auto', padding: '0 12px' }}
          >
            <Compass size={17} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Explore</span>
          </button>
        </nav>
      </div>

      {/* RIGHT: Notifications, Profile / Avatar, and Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Working Notifications Bell on the Right */}
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
                  top: '5px',
                  right: '5px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px #FFFFFF'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
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
                  Activity & Notifications
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Live Updates
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: n.unread ? 'rgba(8, 131, 149, 0.08)' : 'rgba(235, 244, 246, 0.65)',
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
                    <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Controls */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clickable Profile Avatar Button */}
            <button
              onClick={handleProfileClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 5px',
                background: 'rgba(235, 244, 246, 0.85)',
                borderRadius: '30px',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="View & Edit Full Profile"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-teal)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary-dark-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  overflow: 'hidden'
                }}
              >
                {user.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt={user.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  (user.name || user.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                @{user.username}
              </span>
            </button>

            {/* Logout Button */}
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
            style={{ padding: '7px 18px', fontSize: '13px' }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
