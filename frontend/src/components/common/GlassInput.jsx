import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function GlassInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  className = '',
  name
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
          {label}
        </label>
      )}
      <div className={`glass-input-wrapper ${className}`}>
        {Icon && <Icon className="glass-input-icon" size={18} />}
        <input
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="glass-input"
          style={{
            paddingLeft: Icon ? '46px' : '16px',
            paddingRight: isPassword ? '46px' : '16px'
          }}
        />
        {isPassword && (
          <button
            type="button"
            className="glass-input-action"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Hide Password' : 'Show Password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
