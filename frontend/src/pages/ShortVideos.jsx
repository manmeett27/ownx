import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Heart, MessageSquare, Share2, Volume2, VolumeX, 
  Play, Pause, ChevronUp, ChevronDown, Music, Sparkles, Send, X 
} from 'lucide-react';
import SpatialBackground from '../components/3d/SpatialBackground';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { fetchPosts } from '../services/api';

// Curated high-quality vertical videos with smooth streaming
const DEFAULT_SHORT_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Spatial 3D Design Systems & Modern Web Aesthetics',
    author: 'design_lead',
    author_name: 'Elena Rostova',
    author_avatar: '',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-waves-coming-to-the-shore-41525-large.mp4',
    likes: 342,
    music: 'Ambient Horizons • Original Sound',
    caption: 'Building next-generation spatial web interfaces with custom light refraction and teal color tokens #3DDesign #WebDevelopment #OWNX',
    comments: [
      { id: 1, user: 'marcus_dev', text: 'The depth and glass effects are so clean!' },
      { id: 2, user: 'sophia_ui', text: 'Love the teal palette contrast here.' }
    ]
  },
  {
    id: 'vid-2',
    title: 'Cloud Architecture & Global Real-time Feeds',
    author: 'cloud_architect',
    author_name: 'David Chen',
    author_avatar: '',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-cars-on-a-highway-at-night-42171-large.mp4',
    likes: 519,
    music: 'Cybernetic Flow • Synthesizer Beats',
    caption: 'Low latency real-time streaming pipeline powered by secure server-side uploads and CDN caching #Cloud #Architecture #Engineering',
    comments: [
      { id: 1, user: 'dev_sarah', text: 'Real CDN caching makes all the difference in reels.' }
    ]
  },
  {
    id: 'vid-3',
    title: 'Urban Exploration & Creative Spaces',
    author: 'urban_lens',
    author_name: 'Maya Patel',
    author_avatar: '',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4',
    likes: 890,
    music: 'City Lights • Lo-Fi Beats',
    caption: 'Night city architecture and light reflections captured on 4K vertical #Urban #Cinematics #Explore',
    comments: [
      { id: 1, user: 'creator_kai', text: 'Stunning footage!' }
    ]
  }
];

export default function ShortVideos({ onNavigateHome }) {
  const { user } = useAuth();
  const [videos, setVideos] = useState(DEFAULT_SHORT_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);

  // Load any user-uploaded video posts from backend to supplement feed
  useEffect(() => {
    async function loadBackendVideos() {
      try {
        const posts = await fetchPosts();
        const videoPosts = posts.filter(p => p.post_type === 'video' || (p.image_url && p.image_url.includes('.mp4')));
        if (videoPosts.length > 0) {
          const mapped = videoPosts.map(p => ({
            id: `post-${p.post_id}`,
            title: p.caption || 'Community Video',
            author: p.username || 'user',
            author_name: p.name || p.username || 'Community Member',
            author_avatar: p.profile_pic || '',
            url: p.image_url,
            likes: 42,
            music: 'Original Audio',
            caption: p.caption || '',
            comments: []
          }));
          setVideos(prev => [...mapped, ...prev]);
        }
      } catch (err) {
        console.warn('Could not fetch backend video posts:', err);
      }
    }
    loadBackendVideos();
  }, []);

  const currentVideo = videos[currentIndex] || videos[0];

  // Auto-play current video on index change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy might require mute
        setIsMuted(true);
      });
      setIsPlaying(true);
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  };

  const handleLike = () => {
    const videoId = currentVideo.id;
    const isCurrentlyLiked = likedVideos[videoId];
    setLikedVideos(prev => ({ ...prev, [videoId]: !isCurrentlyLiked }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/#videos-${currentVideo.id}`);
    }
    setToast({
      type: 'success',
      message: 'Video Link Copied',
      details: 'Shareable short video link is on your clipboard.'
    });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const author = user?.username || 'viewer';
    const commentObj = {
      id: Date.now(),
      user: author,
      text: newComment.trim()
    };

    setVideos(prev => prev.map((v, i) => {
      if (i === currentIndex) {
        return { ...v, comments: [...(v.comments || []), commentObj] };
      }
      return v;
    }));

    setNewComment('');
  };

  // Keyboard navigation (Arrow up/down)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        handleNextVideo();
      } else if (e.key === 'ArrowUp') {
        handlePrevVideo();
      } else if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#09637E' }}>
      <SpatialBackground />

      {/* Top Header Navigation */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          background: 'linear-gradient(to bottom, rgba(9, 99, 126, 0.85) 0%, transparent 100%)'
        }}
      >
        <button
          onClick={onNavigateHome}
          className="glass-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(235, 244, 246, 0.2)',
            color: '#FFFFFF',
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Feed</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#7AB2B2" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
            OWNX <span style={{ color: '#7AB2B2' }}>Shorts</span>
          </span>
        </div>

        <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(235, 244, 246, 0.8)', background: 'rgba(9, 99, 126, 0.4)', padding: '5px 12px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          {currentIndex + 1} / {videos.length}
        </div>
      </header>

      {/* Main Video Viewport */}
      <main
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 50,
          padding: '70px 20px 20px 20px'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '430px',
            height: 'calc(100vh - 100px)',
            maxHeight: '780px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            background: '#041E26'
          }}
        >
          {/* Video Player Element */}
          <video
            ref={videoRef}
            src={currentVideo.url}
            loop
            playsInline
            autoPlay
            muted={isMuted}
            onClick={togglePlay}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
          />

          {/* Pause/Play Center Icon Overlay */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(9, 99, 126, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
                }}
              >
                <Play size={32} style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}

          {/* Right Floating Action Rail */}
          <div
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '90px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              zIndex: 80
            }}
          >
            {/* Creator Avatar */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--primary-teal)',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '15px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
              }}
            >
              {currentVideo.author.charAt(0).toUpperCase()}
            </div>

            {/* Like Button */}
            <button
              onClick={handleLike}
              style={{
                background: 'none',
                border: 'none',
                color: likedVideos[currentVideo.id] ? '#EF4444' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Like video"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <Heart
                  size={22}
                  fill={likedVideos[currentVideo.id] ? '#EF4444' : 'none'}
                  color={likedVideos[currentVideo.id] ? '#EF4444' : '#FFFFFF'}
                />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {currentVideo.likes + (likedVideos[currentVideo.id] ? 1 : 0)}
              </span>
            </button>

            {/* Comments Toggle Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
              title="View comments"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <MessageSquare size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {currentVideo.comments?.length || 0}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Share video"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <Share2 size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Share
              </span>
            </button>

            {/* Mute/Unmute Toggle */}
            <button
              onClick={toggleMute}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          {/* Bottom Gradient & Video Info */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '28px 18px 20px 18px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              color: '#FFFFFF',
              zIndex: 70
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                @{currentVideo.author}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  background: 'var(--primary-teal)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}
              >
                Follow
              </span>
            </div>

            <p style={{ fontSize: '13px', lineHeight: '1.4', margin: '0 0 10px 0', textShadow: '0 1px 2px rgba(0,0,0,0.8)', maxWidth: '320px' }}>
              {currentVideo.caption}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#EBF4F6', opacity: 0.9 }}>
              <Music size={13} />
              <span>{currentVideo.music}</span>
            </div>
          </div>

          {/* Comments Sliding Sheet */}
          {showComments && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(16px)',
                zIndex: 90,
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass-subtle)' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-dark-teal)' }}>
                  Comments ({currentVideo.comments?.length || 0})
                </span>
                <button
                  onClick={() => setShowComments(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 0' }}>
                {(currentVideo.comments || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '30px 0' }}>
                    No comments yet. Say something friendly!
                  </div>
                ) : (
                  currentVideo.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(235, 244, 246, 0.7)',
                        border: '1px solid var(--border-glass-subtle)'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-dark-teal)', marginBottom: '2px' }}>
                        @{c.user}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        {c.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-glass-subtle)' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="glass-input"
                  style={{ flex: 1, height: '40px', fontSize: '13px', paddingLeft: '14px' }}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="glass-button"
                  style={{ height: '40px', padding: '0 16px' }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Up / Down Navigation Controls (Beside player on desktop) */}
        <div
          style={{
            position: 'absolute',
            right: 'calc(50% - 280px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 60
          }}
        >
          <button
            onClick={handlePrevVideo}
            disabled={currentIndex === 0}
            className="glass-icon-button"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#FFFFFF',
              color: 'var(--primary-dark-teal)',
              opacity: currentIndex === 0 ? 0.4 : 1
            }}
            title="Previous video (Up Arrow)"
          >
            <ChevronUp size={22} />
          </button>

          <button
            onClick={handleNextVideo}
            className="glass-icon-button"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#FFFFFF',
              color: 'var(--primary-dark-teal)'
            }}
            title="Next video (Down Arrow)"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </main>

      {/* Toast Feedback */}
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
