import React, { useState } from 'react';
import { Send, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ comments = [], onAddComment }) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setErrorAlert(null);

    const activeUser = user ? user.username : 'community_guest';

    try {
      await onAddComment(activeUser, newComment.trim());
      setNewComment('');
    } catch (err) {
      setErrorAlert(err.message || 'Failed to publish comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-glass-subtle)', animation: 'fadeIn 0.25s ease' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-dark-teal)', letterSpacing: '0.2px' }}>
        Comments ({comments.length})
      </div>

      {comments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
          No comments yet. Be the first to join the conversation!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
          {comments.map((c, idx) => (
            <div
              key={c.comment_id || idx}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(235, 244, 246, 0.65)',
                border: '1px solid var(--border-glass-subtle)'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary-dark-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}
              >
                {(c.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-dark-teal)', marginBottom: '2px' }}>
                  @{c.username}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {errorAlert && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#991B1B',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
          <span>{errorAlert}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <input
          type="text"
          className="glass-input"
          style={{ paddingLeft: '14px', height: '38px', fontSize: '13px' }}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="glass-button"
          style={{ padding: '0 16px', height: '38px', fontSize: '13px' }}
          aria-label="Send Comment"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
