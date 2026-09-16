import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, details }) {
  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      className="glass-toast"
      style={{
        background: '#FFFFFF',
        borderColor: isError ? 'rgba(220, 38, 38, 0.4)' : isSuccess ? 'rgba(13, 148, 136, 0.4)' : 'rgba(122, 178, 178, 0.5)',
        color: isError ? '#991B1B' : isSuccess ? '#0F766E' : '#09637E'
      }}
    >
      {isError ? (
        <AlertCircle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : isSuccess ? (
        <CheckCircle size={22} color="#0D9488" style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <AlertTriangle size={22} color="#088395" style={{ flexShrink: 0, marginTop: '2px' }} />
      )}
      
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: details ? '4px' : '0' }}>
          {message}
        </div>
        {details && (
          <div style={{ fontSize: '12px', color: '#486E78', lineHeight: 1.4 }}>
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
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
