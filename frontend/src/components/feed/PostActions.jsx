import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';

export default function PostActions({ postId, commentCount, onToggleComments, isCommentsOpen, onNotify }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(nextLiked ? likeCount + 1 : likeCount - 1);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/#post-${postId || ''}`);
    }
    if (onNotify) {
      onNotify({ type: 'success', message: 'Post link copied to clipboard!' });
    }
  };

  const handleBookmark = () => {
    const nextState = !bookmarked;
    setBookmarked(nextState);
    if (onNotify) {
      onNotify({
        type: 'success',
        message: nextState ? 'Post added to your bookmarks' : 'Post removed from bookmarks'
      });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-glass-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`glass-icon-button ${liked ? 'active' : ''}`}
          style={{
            gap: '6px',
            width: 'auto',
            padding: '0 12px',
            color: liked ? '#DC2626' : 'var(--text-muted)',
            borderColor: liked ? 'rgba(220, 38, 38, 0.3)' : undefined,
            background: liked ? 'rgba(220, 38, 38, 0.08)' : undefined
          }}
          aria-label="Like Post"
        >
          <Heart size={16} fill={liked ? '#DC2626' : 'none'} color={liked ? '#DC2626' : 'currentColor'} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{likeCount}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onToggleComments}
          className={`glass-icon-button ${isCommentsOpen ? 'active' : ''}`}
          style={{ gap: '6px', width: 'auto', padding: '0 12px' }}
          aria-label="Toggle Comments"
        >
          <MessageSquare size={16} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{commentCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="glass-icon-button"
          title="Share Post"
          aria-label="Share Post"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`glass-icon-button ${bookmarked ? 'active' : ''}`}
        title={bookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
        aria-label="Save to Bookmarks"
        style={{
          color: bookmarked ? 'var(--primary-dark-teal)' : undefined
        }}
      >
        <Bookmark size={16} fill={bookmarked ? 'var(--primary-dark-teal)' : 'none'} />
      </button>
    </div>
  );
}
