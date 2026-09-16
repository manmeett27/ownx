import React, { useState } from 'react';
import { Send, Image as ImageIcon, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import GlassButton from '../common/GlassButton';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostCard({ onPostCreated, onModerationBlock }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!caption.trim() && !imageUrl) {
      setAlert({ type: 'error', message: 'Post content cannot be empty.' });
      return;
    }

    setLoading(true);

    const postPayload = {
      user_id: user ? user.user_id : 1,
      caption: caption.trim(),
      image_url: imageUrl || null,
      post_type: imageUrl ? 'image' : 'text',
      category_id: 1,
      interest_id: 1,
      location_id: user ? user.location_id : 1
    };

    try {
      await onPostCreated(postPayload);
      setCaption('');
      setImageUrl('');
      setAlert(null);
    } catch (err) {
      const modReason = err.moderation?.reason || err.message;
      setAlert({
        type: 'moderation',
        message: 'Blocked by AI Content Shield',
        details: modReason
      });
      if (onModerationBlock) onModerationBlock(modReason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={{ padding: '20px' }}>
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
              boxShadow: '0 2px 8px rgba(9, 99, 126, 0.2)'
            }}
          >
            {user ? (user.username || 'U').charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
              Create a New Post
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user ? `Posting as @${user.username}` : 'Posting as community member'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--primary-teal)',
            background: 'rgba(8, 131, 149, 0.08)',
            padding: '3px 8px',
            borderRadius: '6px'
          }}
        >
          <Sparkles size={12} />
          <span>Real-time Safety Check</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <textarea
          className="glass-input"
          style={{
            width: '100%',
            minHeight: '88px',
            padding: '12px 14px',
            resize: 'vertical',
            borderRadius: '12px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          placeholder="What's happening? Share thoughts, news, or updates with your network..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {alert && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#991B1B',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{alert.message}:</strong> {alert.details || 'Content violates community guidelines.'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
            <ImageIcon size={16} color="var(--primary-teal)" />
            <select
              className="glass-select"
              style={{ flexGrow: 1, maxWidth: '320px', height: '38px', fontSize: '13px' }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            >
              <option value="">Text Only (No Attachment)</option>
              <option value="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%23EBF4F6' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2309637E'%3ESafe Content Preview%3C/text%3E%3C/svg%3E">Safe Graphic: Healthy Content</option>
              <option value="media/images/alchol (1).jpg">Test AI Shield: Alcohol</option>
              <option value="media/images/drugs (2).jpg">Test AI Shield: Drugs</option>
              <option value="media/images/sexual (1).jpg">Test AI Shield: Nudity/Sexual</option>
              <option value="media/images/smoking (1).jpg">Test AI Shield: Smoking</option>
              <option value="media/images/violence (1).jpg">Test AI Shield: Violence</option>
              <option value="media/images/weapons (1).jpg">Test AI Shield: Weapons</option>
            </select>
          </div>

          <GlassButton
            type="submit"
            disabled={loading || (!caption.trim() && !imageUrl)}
            icon={Send}
            style={{ height: '38px', padding: '0 18px' }}
          >
            {loading ? 'Analyzing...' : 'Publish Post'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
