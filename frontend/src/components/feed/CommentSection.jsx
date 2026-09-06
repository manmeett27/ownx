import React, { useState } from 'react';
import { Send, ShieldAlert, User } from 'lucide-react';
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

    const activeUser = user ? user.username : 'guest_user';

    try {
      await onAddComment(activeUser, newComment.trim());
      setNewComment('');
    } catch (err) {
      const modReason = err.moderation?.reason || err.message;
      setErrorAlert(modReason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
        Comments ({comments.length})
      </div>

      {comments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', padding: '8px 0' }}>
          No comments yet. Be the first to start the conversation!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
          {comments.map((c, idx) => (
            <div
              key={c.comment_id || idx}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#FFFFFF', flexShrink: 0 }}>
                {(c.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', marginBottom: '2px' }}>
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
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span><strong>Blocked by AI Moderator:</strong> {errorAlert}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <input
          type="text"
          className="glass-input"
          style={{ paddingLeft: '16px', height: '42px', fontSize: '13px' }}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="glass-button"
          style={{ padding: '0 16px', height: '42px', fontSize: '13px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
