import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';

export default function PostActions({ commentCount, onToggleComments, isCommentsOpen }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Post link copied to clipboard!');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`glass-icon-button ${liked ? 'active' : ''}`}
          style={{ gap: '6px', width: 'auto', padding: '0 14px', color: liked ? '#EF4444' : 'var(--text-muted)' }}
        >
          <Heart size={18} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : 'currentColor'} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{likeCount}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onToggleComments}
          className={`glass-icon-button ${isCommentsOpen ? 'active' : ''}`}
          style={{ gap: '6px', width: 'auto', padding: '0 14px' }}
        >
          <MessageSquare size={18} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{commentCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="glass-icon-button"
          title="Share Post"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Bookmark Button */}
      <button
        onClick={() => setBookmarked(!bookmarked)}
        className={`glass-icon-button ${bookmarked ? 'active' : ''}`}
        title="Bookmark"
      >
        <Bookmark size={18} fill={bookmarked ? 'var(--brand-primary)' : 'none'} />
      </button>
    </div>
  );
}
