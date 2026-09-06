import React from 'react';

export default function GlassCard({ children, className = '', interactive = false, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`}
      style={{
        padding: '24px',
        ...style
      }}
    >
      {children}
    </div>
  );
}
