import React, { useState } from 'react';
import { Search, ShieldAlert, Flame } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export default function Sidebar({ onSearchChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const trendingTopics = [
    { rank: 1, tag: 'AI_Content_Moderation', posts: '12.4k posts', category: 'Technology' },
    { rank: 2, tag: 'Supabase_PostgreSQL', posts: '8.9k posts', category: 'Database' },
    { rank: 3, tag: 'VisionOS_Glass_UI', posts: '6.2k posts', category: 'Design' },
    { rank: 4, tag: 'PyTorch_CNN_Safety', posts: '4.1k posts', category: 'Machine Learning' },
    { rank: 5, tag: 'FastAPI_Microservices', posts: '3.8k posts', category: 'Backend' }
  ];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
      {/* Search Bar */}
      <GlassCard style={{ padding: '16px' }}>
        <div className="glass-input-wrapper">
          <Search className="glass-input-icon" size={18} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search posts, topics, or #hashtags..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </GlassCard>

      {/* Trending Topics */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>Trending Topics</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Realtime</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trendingTopics.map((topic) => (
            <div
              key={topic.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(123, 97, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--brand-primary)', width: '20px' }}>
                  #{topic.rank}
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                    #{topic.tag}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {topic.category}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
                {topic.posts}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* AI Content Moderation Guidelines */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldAlert size={20} color="#EF4444" />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>AI Shield Guidelines</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
          OWNX uses PyTorch CNN model inference and keyword heuristics to block unsafe media and toxic text in real time.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Alcohol & Substance Abuse',
            'Sexual & Nudity Content',
            'Violence & Weapons',
            'Hate Speech & Toxic Text'
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '12px',
                fontWeight: '600',
                color: '#FCA5A5'
              }}
            >
              <span>{item}</span>
              <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Block</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </aside>
  );
}
