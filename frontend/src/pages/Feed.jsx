import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SpatialBackground from '../components/3d/SpatialBackground';
import CreatePostCard from '../components/feed/CreatePostCard';
import PostCard from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { fetchPosts, createPost } from '../services/api';
import { Compass, Sparkles, RefreshCw, Filter } from 'lucide-react';

export default function Feed({ onNavigateAuth }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore'

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePostCreated = async (postPayload) => {
    const newPost = await createPost(postPayload);
    setToast({
      type: 'success',
      message: 'Post Published Successfully!',
      details: 'Your post passed AI content moderation and is live.'
    });
    setPosts((prev) => [newPost.post || newPost, ...prev]);
  };

  const handleModerationBlock = (reason) => {
    setToast({
      type: 'moderation',
      message: 'Blocked by AI Content Shield',
      details: reason
    });
  };

  // Filter posts based on search term or explore recommendations
  const filteredPosts = posts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().replace('#', '');
    const inCaption = p.caption && p.caption.toLowerCase().includes(term);
    const inUsername = p.username && p.username.toLowerCase().includes(term);
    return inCaption || inUsername;
  });

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '60px' }}>
      <SpatialBackground />
      <Navbar
        onNavigateAuth={onNavigateAuth}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onNavigateHome={() => {
          setActiveTab('home');
          setSearchTerm('');
        }}
      />

      {/* Main Layout Container */}
      <main
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          padding: '100px 20px 0 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Left Column: Post Creator & Main Feed */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Explore Mode Header Banner */}
          {activeTab === 'explore' && (
            <div
              className="glass-panel"
              style={{
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(8, 131, 149, 0.08)',
                borderColor: 'var(--primary-teal)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <Compass size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                    Explore Recommendations
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Curated content powered by implicit feedback algorithms & safety filters
                  </p>
                </div>
              </div>

              <button
                onClick={loadPosts}
                className="glass-button glass-button-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
                title="Refresh recommendations"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>
          )}

          {/* Search/Tag Filter Active Indicator */}
          {searchTerm && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--primary-dark-teal)', fontWeight: '600' }}>
                <Filter size={15} color="var(--primary-teal)" />
                <span>Filtering by: <em>"{searchTerm}"</em> ({filteredPosts.length} posts)</span>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-teal)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Clear Filter
              </button>
            </div>
          )}

          <CreatePostCard
            onPostCreated={handlePostCreated}
            onModerationBlock={handleModerationBlock}
          />

          {/* Posts List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                No posts found
              </div>
              <p style={{ fontSize: '13px', maxWidth: '360px', lineHeight: '1.5' }}>
                {searchTerm ? 'No results matched your search term. Try another query.' : 'Be the first to share an update with your community!'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="glass-button glass-button-secondary"
                  style={{ marginTop: '6px' }}
                >
                  Show All Posts
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.post_id || Math.random()}
                  post={post}
                  onFilterAuthor={(username) => setSearchTerm(username)}
                  onNotify={(notif) => setToast(notif)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Sidebar */}
        <section style={{ maxWidth: '360px', width: '100%' }}>
          <Sidebar onSearchChange={(term) => setSearchTerm(term)} />
        </section>
      </main>

      {/* Global Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
