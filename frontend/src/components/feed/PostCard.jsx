import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, MoreHorizontal, MapPin, Calendar } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import PostActions from './PostActions';
import CommentSection from './CommentSection';
import { fetchPostComments, createComment } from '../../services/api';

export default function PostCard({ post }) {
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('image'); // 'image' | 'video'

  useEffect(() => {
    async function loadComments() {
      if (post.post_id && (!post.comments || post.comments.length === 0)) {
        const fetched = await fetchPostComments(post.post_id);
        setComments(fetched);
      }
    }
    loadComments();
  }, [post.post_id]);

  const handleAddComment = async (username, content) => {
    const created = await createComment(post.post_id, username, content);
    setComments((prev) => [...prev, created.comment || { comment_id: Date.now(), username, content }]);
    return created;
  };

  const formattedDate = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

  return (
    <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Post Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '700', fontSize: '18px', boxShadow: '0 4px 16px rgba(123, 97, 255, 0.35)' }}>
            {(post.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                @{post.username || `user_${post.user_id}`}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--brand-cyan)', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>
                Verified
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {formattedDate}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {post.location_id === 1 ? 'Lucknow' : post.location_id === 2 ? 'Delhi' : 'Global'}
              </span>
            </div>
          </div>
        </div>

        <button className="glass-icon-button" style={{ width: '34px', height: '34px' }}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Caption */}
      <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
        {post.caption}
      </p>

      {/* Media Switching Tabs (Preserving index.html Media Controls requirement) */}
      {post.image_url && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setActiveMediaTab('image')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeMediaTab === 'image' ? 'var(--brand-gradient)' : 'transparent',
                color: activeMediaTab === 'image' ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ImageIcon size={14} /> Image View
            </button>

            <button
              onClick={() => setActiveMediaTab('video')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeMediaTab === 'video' ? 'var(--brand-gradient)' : 'transparent',
                color: activeMediaTab === 'video' ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Video size={14} /> Video Stream
            </button>
          </div>

          {/* Media Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '420px',
              borderRadius: '18px',
              overflow: 'hidden',
              background: '#0D0E17',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {activeMediaTab === 'image' ? (
              <img
                src={post.image_url}
                alt="Post Media"
                style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%23121420' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239CA3AF'%3EMedia Content Preview%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'radial-gradient(circle, rgba(123, 97, 255, 0.2) 0%, rgba(9, 10, 16, 0.9) 100%)' }}>
                <Video size={48} color="var(--brand-primary)" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                  OWNX Spatial Video Stream Ready
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <PostActions
        commentCount={comments.length}
        onToggleComments={() => setShowComments(!showComments)}
        isCommentsOpen={showComments}
      />

      {/* Comments Section Drawer */}
      {showComments && (
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
        />
      )}
    </GlassCard>
  );
}
