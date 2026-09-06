import React from 'react';

export default function GlassButton({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  style = {}
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`glass-button ${variant === 'secondary' ? 'glass-button-secondary' : ''} ${className}`}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    >
      {Icon && <Icon size={18} />}
      <span>{children}</span>
    </button>
  );
}
