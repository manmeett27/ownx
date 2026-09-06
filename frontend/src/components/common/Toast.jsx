import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, details }) {
  if (!message) return null;

  const isModeration = type === 'moderation';

  return (
    <div
      className="glass-toast"
      style={{
        background: isModeration ? 'rgba(239, 68, 68, 0.16)' : type === 'success' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
        borderColor: isModeration ? 'rgba(239, 68, 68, 0.4)' : type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        color: isModeration ? '#FCA5A5' : type === 'success' ? '#6EE7B7' : '#FCA5A5'
      }}
    >
      {isModeration ? (
        <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : type === 'success' ? (
        <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      )}
      
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: details ? '4px' : '0' }}>
          {message}
        </div>
        {details && (
          <div style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.4 }}>
            {details}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.7
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
