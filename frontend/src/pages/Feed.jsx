import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SpatialBackground from '../components/3d/SpatialBackground';
import CreatePostCard from '../components/feed/CreatePostCard';
import PostCard from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { fetchPosts, createPost } from '../services/api';

export default function Feed({ onNavigateAuth }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      details: 'Your post passed AI content moderation and is now live.'
    });
    setPosts((prev) => [newPost.post || newPost, ...prev]);
  };

  const handleModerationBlock = (reason) => {
    setToast({
      type: 'moderation',
      message: 'Blocked by AI Moderator Shield',
      details: reason
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.caption && p.caption.toLowerCase().includes(term)) ||
      (p.username && p.username.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '60px' }}>
      <SpatialBackground />
      <Navbar onNavigateAuth={onNavigateAuth} />

      {/* Main Layout Container */}
      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '110px 20px 0 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '30px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Left Column: Post Creator & Main Feed */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <CreatePostCard
            onPostCreated={handlePostCreated}
            onModerationBlock={handleModerationBlock}
          />

          {/* Posts List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                No posts found
              </div>
              <p style={{ fontSize: '14px', maxWidth: '360px' }}>
                Be the first to create a post on the OWNX spatial feed!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filteredPosts.map((post) => (
                <PostCard key={post.post_id || Math.random()} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Sidebar */}
        <Sidebar onSearchChange={(term) => setSearchTerm(term)} />
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
