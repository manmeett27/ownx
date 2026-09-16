import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Video, X, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import GlassButton from '../common/GlassButton';
import { useAuth } from '../../context/AuthContext';
import { createPost, resolveMediaUrl } from '../../services/api';
import { getRealUserLocation } from '../../services/locationService';

export default function CreatePostCard({ onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [attachLocation, setAttachLocation] = useState(false);
  const [postLocation, setPostLocation] = useState(user?.location_str || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  // File selection and client preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setErrorMsg('Please select a valid image (JPG, PNG, WebP) or video (MP4, WebM) file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum upload limit.');
      return;
    }

    setMediaType(isVideo ? 'video' : 'image');
    setSelectedFile(file);

    // Create object URL for fast, reliable preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const handleRemoveMedia = () => {
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setSelectedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleLocation = async () => {
    if (!attachLocation) {
      if (user?.location_str) {
        setPostLocation(user.location_str);
        setAttachLocation(true);
      } else {
        try {
          const loc = await getRealUserLocation();
          setPostLocation(loc.location_str);
          setAttachLocation(true);
        } catch (err) {
          setErrorMsg(err.message || 'Unable to access your location. Please allow location permission and try again.');
        }
      }
    } else {
      setAttachLocation(false);
      setPostLocation('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!caption.trim() && !selectedFile) {
      setErrorMsg('Post content cannot be empty. Please enter text or select an image/video.');
      return;
    }

    setLoading(true);

    try {
      // Build FormData with the real File object for multipart submission
      const formData = new FormData();
      formData.append('caption', caption.trim());
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      if (attachLocation && postLocation) {
        formData.append('location_str', postLocation);
      }

      // Sends authenticated multipart request to backend
      const createdPost = await createPost(formData);

      // Clean up preview object URL
      if (mediaPreview && mediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreview);
      }

      // Reset form state
      setCaption('');
      setSelectedFile(null);
      setMediaPreview(null);
      setAttachLocation(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Pass the backend-created, populated post to feed
      if (onPostCreated) {
        onPostCreated(createdPost);
      }
    } catch (err) {
      console.error('Post creation error:', err);
      setErrorMsg(err.message || 'Unable to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const authorInitial = (user?.name || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <GlassCard style={{ padding: '22px' }}>
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-dark-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '15px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(9, 99, 126, 0.2)'
            }}
          >
            {user?.profile_pic ? (
              <img
                src={resolveMediaUrl(user.profile_pic)}
                alt={user.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              authorInitial
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-dark-teal)', margin: 0 }}>
              {user ? (user.name || `@${user.username}`) : 'Create a New Post'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {user ? `@${user.username}` : 'Posting as community member'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Caption Input */}
        <textarea
          className="glass-input"
          style={{
            width: '100%',
            minHeight: '86px',
            padding: '12px 14px',
            resize: 'vertical',
            borderRadius: '12px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          placeholder="What's happening? Share thoughts, updates, or media with your network..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Media Preview Box */}
        {mediaPreview && (
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border-glass)',
              background: '#041E26',
              maxHeight: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mediaType === 'video' ? (
              <video
                src={mediaPreview}
                controls
                style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }}
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Selected Upload Preview"
                style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }}
              />
            )}

            {/* Remove Media Button */}
            <button
              type="button"
              onClick={handleRemoveMedia}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Remove media"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Location Tag */}
        {attachLocation && postLocation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary-dark-teal)', background: 'rgba(8, 131, 149, 0.08)', padding: '4px 10px', borderRadius: '8px', width: 'fit-content' }}>
            <MapPin size={13} color="var(--primary-teal)" />
            <span>Tagged: {postLocation}</span>
            <button
              type="button"
              onClick={() => setAttachLocation(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#991B1B',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={17} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Real File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-button glass-button-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', fontSize: '13px' }}
              title="Attach Image or Video"
            >
              <ImageIcon size={15} color="var(--primary-teal)" />
              <span>{selectedFile ? 'Change Media' : 'Attach Photo/Video'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleLocation}
              className={`glass-button ${attachLocation ? '' : 'glass-button-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', fontSize: '13px' }}
              title="Attach Location"
            >
              <MapPin size={14} color={attachLocation ? '#FFFFFF' : 'var(--primary-teal)'} />
              <span>{attachLocation ? 'Location Added' : 'Add Location'}</span>
            </button>
          </div>

          <GlassButton
            type="submit"
            disabled={loading || (!caption.trim() && !selectedFile)}
            icon={loading ? RefreshCw : Send}
            style={{ height: '38px', padding: '0 20px' }}
          >
            {loading ? 'Uploading & Publishing...' : 'Publish Post'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
