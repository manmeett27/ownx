import React, { useState } from 'react';
import { Search, Flame, X, ChevronRight, Compass, Film, User, BookOpen } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export default function Sidebar({ onSearchChange, onNavigateProfile, onNavigateVideos }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const trendingTopics = [
    { rank: 1, tag: 'Modern_Web_Design', posts: '14.2k posts', category: 'Technology' },
    { rank: 2, tag: 'Cloudinary_Media', posts: '9.8k posts', category: 'Architecture' },
    { rank: 3, tag: 'Creative_Shorts', posts: '7.5k posts', category: 'Media' },
    { rank: 4, tag: 'Spatial_UI_3D', posts: '5.4k posts', category: 'Design' },
    { rank: 5, tag: 'Community_Network', posts: '4.2k posts', category: 'Community' }
  ];

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSelectedTag(null);
    if (onSearchChange) onSearchChange(val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTag(null);
    if (onSearchChange) onSearchChange('');
  };

  const handleTopicClick = (tag) => {
    if (selectedTag === tag) {
      handleClearSearch();
    } else {
      setSelectedTag(tag);
      setSearchTerm(tag);
      if (onSearchChange) onSearchChange(tag);
    }
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'sticky', top: '90px' }}>
      {/* Search Bar with Clear Button */}
      <GlassCard style={{ padding: '12px 14px' }}>
        <div className="glass-input-wrapper">
          <Search className="glass-input-icon" size={17} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingRight: searchTerm ? '38px' : '14px', height: '42px', fontSize: '13px' }}
            placeholder="Search posts, topics, or #hashtags..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="glass-input-action"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </GlassCard>

      {/* Trending Topics (Fully Clickable Filter) */}
      <GlassCard style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="var(--primary-dark-teal)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
              Trending Topics
            </h3>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--secondary-teal)' }}>
            Live Feed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trendingTopics.map((topic) => {
            const isSelected = selectedTag === topic.tag;
            return (
              <button
                key={topic.rank}
                type="button"
                onClick={() => handleTopicClick(topic.tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(8, 131, 149, 0.12)' : 'rgba(235, 244, 246, 0.65)',
                  border: `1px solid ${isSelected ? 'var(--primary-teal)' : 'var(--border-glass-subtle)'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(235, 244, 246, 0.95)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(235, 244, 246, 0.65)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-dark-teal)', width: '18px' }}>
                    #{topic.rank}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                      #{topic.tag}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {topic.category}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>
                    {topic.posts}
                  </span>
                  <ChevronRight size={14} color="var(--secondary-teal)" />
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Community Resources & Guidelines */}
      <GlassCard style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <BookOpen size={18} color="var(--primary-teal)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
            Community Standards
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
          OWNX is built on open collaboration, creative design sharing, and respectful conversations.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              if (onNavigateVideos) onNavigateVideos();
              else window.location.hash = 'videos';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(235, 244, 246, 0.7)',
              border: '1px solid var(--border-glass-subtle)',
              cursor: 'pointer',
              color: 'var(--primary-dark-teal)',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={15} color="var(--primary-teal)" />
              <span>Explore Short Videos</span>
            </div>
            <ChevronRight size={14} color="var(--secondary-teal)" />
          </button>

          <button
            onClick={() => {
              if (onNavigateProfile) onNavigateProfile();
              else window.location.hash = 'profile';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(235, 244, 246, 0.7)',
              border: '1px solid var(--border-glass-subtle)',
              cursor: 'pointer',
              color: 'var(--primary-dark-teal)',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={15} color="var(--primary-teal)" />
              <span>Profile & Settings</span>
            </div>
            <ChevronRight size={14} color="var(--secondary-teal)" />
          </button>
        </div>
      </GlassCard>
    </aside>
  );
}
