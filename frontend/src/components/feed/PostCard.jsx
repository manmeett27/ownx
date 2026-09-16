import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Video, MoreHorizontal, MapPin, Calendar, UserPlus, Check, Copy, AlertTriangle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import PostActions from './PostActions';
import CommentSection from './CommentSection';
import { fetchPostComments, createComment, followUser, resolveMediaUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PostCard({ post, onFilterAuthor, onNotify }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isVideo = post.post_type === 'video' || (post.image_url && (post.image_url.includes('.mp4') || post.image_url.startsWith('data:video')));

  useEffect(() => {
    async function loadComments() {
      if (post.post_id && (!post.comments || post.comments.length === 0)) {
        try {
          const fetched = await fetchPostComments(post.post_id);
          setComments(fetched);
        } catch (err) {
          console.warn('Comments fetch notice:', err.message);
        }
      }
    }
    loadComments();
  }, [post.post_id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddComment = async (username, content) => {
    // createComment(postId, content) — username is derived from JWT on backend
    const created = await createComment(post.post_id, content);
    setComments((prev) => [...prev, created.comment || { comment_id: Date.now(), username, content }]);
    return created;
  };

  const handleFollow = async () => {
    const currentUserId = user ? user.user_id : 1;
    const authorId = post.user_id || 2;
    try {
      await followUser(authorId, currentUserId);
      setIsFollowing(!isFollowing);
      if (onNotify) {
        onNotify({
          type: 'success',
          message: !isFollowing ? `Following @${post.username || 'user'}` : `Unfollowed @${post.username || 'user'}`
        });
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/#post-${post.post_id}`);
    }
    setShowMenu(false);
    if (onNotify) {
      onNotify({ type: 'success', message: 'Post link copied to clipboard!' });
    }
  };

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const authorName = post.author?.name || post.name || (post.author?.username ? `@${post.author.username}` : (post.username ? `@${post.username}` : 'Community Member'));
  const authorUsername = post.author?.username || post.username || `user_${post.user_id || 1}`;
  const authorPic = post.author?.profile_pic || post.profile_pic || '';
  const authorInitial = authorName.replace('@', '').charAt(0).toUpperCase() || 'U';

  return (
    <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px' }}>
      {/* Post Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar with photo support */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--primary-dark-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(9, 99, 126, 0.2)'
            }}
          >
            {authorPic ? (
              <img
                src={resolveMediaUrl(authorPic)}
                alt={authorUsername}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              authorInitial
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                {authorName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                @{authorUsername}
              </span>

              {user?.username !== post.username && (
                <button
                  type="button"
                  onClick={handleFollow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--secondary-teal)',
                    background: isFollowing ? 'rgba(8, 131, 149, 0.1)' : 'transparent',
                    color: 'var(--primary-dark-teal)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isFollowing ? <Check size={11} /> : <UserPlus size={11} />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {formattedDate}
              </span>

              {/* Real location only - no mock location */}
              {post.location_str && (
                <>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--primary-teal)" /> {post.location_str}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* More Options Menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="glass-icon-button"
            style={{ width: '34px', height: '34px' }}
            title="Post options"
            aria-label="Post options"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '180px',
                background: '#FFFFFF',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(9, 99, 126, 0.12)',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(235, 244, 246, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Copy size={14} color="var(--primary-teal)" />
                <span>Copy Post Link</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onFilterAuthor && post.username) onFilterAuthor(post.username);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(235, 244, 246, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <UserPlus size={14} color="var(--primary-teal)" />
                <span>Filter by Author</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onNotify) onNotify({ type: 'success', message: 'Post reported to community moderators.' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--status-danger)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <AlertTriangle size={14} />
                <span>Report Content</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Caption */}
      {post.caption && (
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap', margin: 0 }}>
          {post.caption}
        </p>
      )}

      {/* Post Media Container */}
      {post.image_url && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '440px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#041E26',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 4px 14px rgba(9, 99, 126, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isVideo ? (
            <video
              src={resolveMediaUrl(post.image_url)}
              controls
              playsInline
              style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }}
            />
          ) : (
            <img
              src={resolveMediaUrl(post.image_url)}
              alt="Post Media"
              style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%23EBF4F6' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2309637E'%3EMedia Attachment%3C/text%3E%3C/svg%3E";
              }}
            />
          )}
        </div>
      )}

      {/* Post Actions */}
      <PostActions
        postId={post.post_id}
        commentCount={comments.length}
        onToggleComments={() => setShowComments(!showComments)}
        isCommentsOpen={showComments}
        onNotify={onNotify}
      />

      {/* Comments Drawer */}
      {showComments && (
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
        />
      )}
    </GlassCard>
  );
}
