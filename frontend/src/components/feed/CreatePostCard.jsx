import React, { useState } from 'react';
import { Send, Image as ImageIcon, ShieldAlert, Sparkles } from 'lucide-react';
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
        message: 'Blocked by AI Shield',
        details: modReason
      });
      if (onModerationBlock) onModerationBlock(modReason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 14px rgba(123, 97, 255, 0.3)' }}>
          {user ? (user.username || 'U').charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>Create a New Post</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Content Moderation active</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          className="glass-input"
          style={{ width: '100%', minHeight: '100px', padding: '14px', resize: 'vertical', borderRadius: '16px' }}
          placeholder="What's happening? (Toxic captions or prohibited media will be flagged by AI Shield)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {alert && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>{alert.message}:</strong> {alert.details}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
            <ImageIcon size={18} color="var(--brand-primary)" />
            <select
              className="glass-select"
              style={{ flexGrow: 1, maxWidth: '340px' }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            >
              <option value="">No Media (Text Only)</option>
              <option value="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%231a103c' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%237B61FF'%3EHealthy Safe Spatial Content%3C/text%3E%3C/svg%3E">Safe Image (Healthy Content)</option>
              <option value="media/images/alchol (1).jpg">Test Image: Alcohol (Undesired)</option>
              <option value="media/images/drugs (2).jpg">Test Image: Drugs (Undesired)</option>
              <option value="media/images/sexual (1).jpg">Test Image: Nudity/Sexual (Undesired)</option>
              <option value="media/images/smoking (1).jpg">Test Image: Smoking (Undesired)</option>
              <option value="media/images/violence (1).jpg">Test Image: Violence (Undesired)</option>
              <option value="media/images/weapons (1).jpg">Test Image: Weapons (Undesired)</option>
            </select>
          </div>

          <GlassButton type="submit" disabled={loading} icon={Send}>
            {loading ? 'Publishing...' : 'Publish Post'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
