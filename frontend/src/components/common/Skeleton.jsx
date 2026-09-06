import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '12px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width="46px" height="46px" borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
          <Skeleton width="35%" height="16px" />
          <Skeleton width="20%" height="12px" />
        </div>
      </div>
      <Skeleton width="90%" height="16px" />
      <Skeleton width="75%" height="16px" />
      <Skeleton width="100%" height="240px" borderRadius="16px" />
    </div>
  );
}
