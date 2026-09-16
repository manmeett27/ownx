import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Camera, MapPin, Users, Edit3, Check, X, 
  RefreshCw, LogOut, User, Sparkles, Image as ImageIcon 
} from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import GlassCard from '../components/common/GlassCard';
import GlassButton from '../components/common/GlassButton';
import PostCard from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { 
  updateUserProfile, 
  uploadProfilePhoto, 
  fetchUserPosts, 
  fetchFollowers, 
  resolveMediaUrl 
} from '../services/api';
import { getRealUserLocation } from '../services/locationService';

export default function Profile({ onNavigateHome, onLogout }) {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  // Profile data & UI state
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user?.name || user?.username || '',
    location_str: user?.location_str || '',
    profile_pic: user?.profile_pic || ''
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Load user's real posts from backend
  const loadUserPosts = async () => {
    if (!user?.user_id) return;
    setPostsLoading(true);
    try {
      const posts = await fetchUserPosts(user.user_id);
      setUserPosts(posts || []);
    } catch (err) {
      console.warn('Error loading user posts:', err.message);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load user's real friends/followers count from backend
  const loadFriendsCount = async () => {
    if (!user?.user_id) return;
    try {
      const followers = await fetchFollowers(user.user_id);
      setFriendsCount(Array.isArray(followers) ? followers.length : 0);
    } catch (err) {
      console.warn('Error loading friends count:', err.message);
      setFriendsCount(0);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadUserPosts();
      loadFriendsCount();
      setEditForm({
        name: user.name || user.username || '',
        location_str: user.location_str || '',
        profile_pic: user.profile_pic || ''
      });
    }
  }, [user?.user_id]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Handle local photo selection in edit mode
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ 
        type: 'error', 
        message: 'Invalid File', 
        details: 'Please select a valid image file (JPG, PNG, WebP).' 
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setToast({ 
        type: 'error', 
        message: 'File Too Large', 
        details: 'Image must be under 15MB.' 
      });
      return;
    }

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setSelectedPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  // Auto-detect GPS location
  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await getRealUserLocation();
      setEditForm(prev => ({
        ...prev,
        location_str: loc.location_str
      }));
      setToast({
        type: 'success',
        message: 'Location Detected',
        details: `Identified as: ${loc.location_str}`
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Location Notice',
        details: err.message || 'Could not auto-detect GPS. You can type your location manually.'
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  // Start editing mode
  const handleStartEdit = () => {
    setEditForm({
      name: user?.name || user?.username || '',
      location_str: user?.location_str || '',
      profile_pic: user?.profile_pic || ''
    });
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(true);
  };

  // Cancel editing mode and discard unsaved changes
  const handleCancelEdit = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    setEditForm({
      name: user?.name || user?.username || '',
      location_str: user?.location_str || '',
      profile_pic: user?.profile_pic || ''
    });
    setIsEditing(false);
  };

  // Save changes to backend and update local context
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setToast({ 
        type: 'error', 
        message: 'Validation Error', 
        details: 'Name cannot be empty.' 
      });
      return;
    }

    setSaving(true);
    let finalPhotoUrl = editForm.profile_pic;

    try {
      // 1. If user selected a new photo file, upload via Cloudinary system
      if (selectedPhotoFile) {
        const uploadRes = await uploadProfilePhoto(selectedPhotoFile);
        finalPhotoUrl = uploadRes.profile_pic || uploadRes.user?.profile_pic || finalPhotoUrl;
      }

      // 2. Save profile details to backend database
      const userId = user?.user_id;
      const res = await updateUserProfile(userId, {
        name: editForm.name.trim(),
        location_str: editForm.location_str.trim(),
        profile_pic: finalPhotoUrl
      });

      const updatedUserData = res.user || {
        ...user,
        name: editForm.name.trim(),
        location_str: editForm.location_str.trim(),
        profile_pic: finalPhotoUrl
      };

      // 3. Update global AuthContext (immediately updates Profile, Navbar, & Feed)
      updateUser(updatedUserData);

      // 4. Update author avatar in current user's loaded posts
      setUserPosts(prev => prev.map(p => ({
        ...p,
        name: updatedUserData.name,
        profile_pic: updatedUserData.profile_pic,
        author: {
          ...(p.author || {}),
          name: updatedUserData.name,
          profile_pic: updatedUserData.profile_pic,
          location_str: updatedUserData.location_str
        }
      })));

      // 5. Clean up temporary preview
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
      setIsEditing(false);

      const isCloudinary = finalPhotoUrl && finalPhotoUrl.includes('cloudinary');
      setToast({
        type: 'success',
        message: 'Profile Updated Successfully',
        details: isCloudinary
          ? 'Your profile and Cloudinary photo have been saved.'
          : 'Your profile changes have been saved.'
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setToast({
        type: 'error',
        message: 'Save Failed',
        details: err.message || 'Unable to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  const activePhoto = photoPreview || resolveMediaUrl(isEditing ? editForm.profile_pic : user?.profile_pic);
  const userDisplayName = user?.name || user?.username || 'User';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '80px' }}>
      <SpatialBackground />

      <style>{`
        .profile-grid-container {
          display: grid;
          grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .profile-grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Main Container */}
      <main style={{ maxWidth: '1160px', margin: '0 auto', padding: '96px 20px 40px 20px', position: 'relative', zIndex: 10 }}>
        
        {/* Top Header Row with Navigation & Edit Option in Upper Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={onNavigateHome}
            className="glass-button glass-button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', height: '40px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </button>

          {/* UPPER-RIGHT: EDIT BUTTON & SESSION CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="glass-button glass-button-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  height: '40px',
                  fontWeight: '600',
                  color: 'var(--primary-dark-teal)',
                  borderColor: 'var(--border-glass)'
                }}
                title="Edit profile information"
              >
                <Edit3 size={15} color="var(--primary-teal)" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="glass-button glass-button-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  height: '40px'
                }}
              >
                <X size={15} />
                <span>Cancel Editing</span>
              </button>
            )}

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
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* TWO MAIN PANELS */}
        <div className="profile-grid-container">

          {/* ========================================================== */}
          {/* LEFT SIDE — USER PROFILE INFORMATION                       */}
          {/* ========================================================== */}
          <GlassCard style={{ padding: '30px 24px', position: 'sticky', top: '90px' }}>
            {!isEditing ? (
              /* VIEWING STATE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* 1. PROFILE PHOTO */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '24px',
                      background: 'var(--primary-dark-teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '44px',
                      fontWeight: '800',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(9, 99, 126, 0.22)',
                      border: '3px solid #FFFFFF'
                    }}
                  >
                    {user?.profile_pic ? (
                      <img
                        src={resolveMediaUrl(user.profile_pic)}
                        alt={userDisplayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                </div>

                {/* 2. USER NAME */}
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-dark-teal)', margin: 0 }}>
                    {userDisplayName}
                  </h1>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-teal)', marginTop: '4px' }}>
                    @{user?.username}
                  </div>
                  {user?.bio && (
                    <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '10px', lineHeight: '1.5' }}>
                      {user.bio}
                    </p>
                  )}
                </div>

                <div style={{ height: '1px', background: 'var(--border-glass-subtle)' }} />

                {/* 3. LOCATION */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(8, 131, 149, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={18} color="var(--primary-teal)" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Location
                    </div>
                    <div
                      style={{
                        fontWeight: '600',
                        color: 'var(--primary-dark-teal)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}
                    >
                      {user?.location_str || 'Location not specified'}
                    </div>
                  </div>
                </div>

                {/* 4. FRIEND COUNT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(8, 131, 149, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Users size={18} color="var(--primary-teal)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Friends
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--primary-dark-teal)', fontSize: '15px', marginTop: '2px' }}>
                      {friendsCount} {friendsCount === 1 ? 'Friend' : 'Friends'}
                    </div>
                  </div>
                </div>

                {/* Edit Button in panel */}
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="glass-button glass-button-secondary"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    height: '40px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <Edit3 size={15} color="var(--primary-teal)" />
                  <span>Edit Profile</span>
                </button>
              </div>
            ) : (
              /* EDITING STATE */
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-4px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-dark-teal)', margin: 0 }}>
                    Edit Profile
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--primary-teal)',
                      background: 'rgba(8, 131, 149, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    Editing Mode
                  </span>
                </div>

                {/* Editable Profile Picture */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '22px',
                        background: 'var(--primary-dark-teal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '40px',
                        fontWeight: '800',
                        overflow: 'hidden',
                        boxShadow: '0 6px 18px rgba(9, 99, 126, 0.25)',
                        border: '3px solid #FFFFFF'
                      }}
                    >
                      {activePhoto ? (
                        <img
                          src={activePhoto}
                          alt="Avatar Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        userInitial
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Select new profile photo"
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
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
                        boxShadow: '0 3px 10px rgba(8, 131, 149, 0.4)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {selectedPhotoFile ? selectedPhotoFile.name : 'Click camera button to select photo'}
                  </span>
                </div>

                {/* Editable Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Display Name
                  </label>
                  <div className="glass-input-wrapper">
                    <User className="glass-input-icon" size={16} />
                    <input
                      type="text"
                      className="glass-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                {/* Editable Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
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
                    <MapPin className="glass-input-icon" size={16} />
                    <input
                      type="text"
                      className="glass-input"
                      value={editForm.location_str}
                      onChange={(e) => setEditForm({ ...editForm, location_str: e.target.value })}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                {/* Save & Cancel Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="glass-button glass-button-secondary"
                    style={{ flex: 1, height: '40px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <GlassButton
                    type="submit"
                    disabled={saving}
                    icon={saving ? RefreshCw : Check}
                    style={{ flex: 1, height: '40px', fontSize: '13px' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </GlassButton>
                </div>
              </form>
            )}
          </GlassCard>

          {/* ========================================================== */}
          {/* RIGHT SIDE — USER'S POSTS                                  */}
          {/* ========================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            
            {/* Right Panel Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-dark-teal)', margin: 0 }}>
                  My Posts
                </h2>
                {!postsLoading && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--primary-teal)',
                      background: 'rgba(8, 131, 149, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '14px',
                      border: '1px solid rgba(8, 131, 149, 0.2)'
                    }}
                  >
                    {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                )}
              </div>

              <button
                onClick={loadUserPosts}
                disabled={postsLoading}
                className="glass-button glass-button-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', height: '34px' }}
                title="Refresh my posts"
              >
                <RefreshCw size={13} className={postsLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Posts List or Loading / Empty States */}
            {postsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : userPosts.length === 0 ? (
              <GlassCard
                style={{
                  padding: '50px 24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: 'rgba(8, 131, 149, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-teal)',
                    marginBottom: '4px'
                  }}
                >
                  <ImageIcon size={24} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)', margin: 0 }}>
                  No posts shared yet
                </h3>
                <p style={{ fontSize: '13px', maxWidth: '340px', lineHeight: '1.5', margin: 0 }}>
                  You haven't published any posts yet. Head over to the home feed to share your thoughts, photos, or updates!
                </p>
                <button
                  onClick={onNavigateHome}
                  className="glass-button"
                  style={{ marginTop: '8px', padding: '8px 22px', fontSize: '13px' }}
                >
                  Create Post on Feed
                </button>
              </GlassCard>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {userPosts.map((post) => (
                  <PostCard
                    key={post.post_id || Math.random()}
                    post={post}
                    onNotify={(notif) => setToast(notif)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Dynamic Toast Feedback */}
      {toast && (
        <Toast
          type={toast.type || 'info'}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
