import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ShortVideos from './pages/ShortVideos';

function MainRouter() {
  const { user } = useAuth();

  const getInitialView = () => {
    const raw = window.location.hash.replace('#', '');
    const clean = raw.split('-')[0]; // handle '#videos-1' or '#post-2'
    if (['login', 'register', 'feed', 'profile', 'videos'].includes(clean)) return clean;
    return user ? 'feed' : 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  // Sync state with URL hash and browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace('#', '');
      const clean = raw.split('-')[0];
      if (['login', 'register', 'feed', 'profile', 'videos'].includes(clean)) {
        setCurrentView(clean);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'login') {
    return (
      <Login
        onNavigateRegister={() => navigateTo('register')}
        onLoginSuccess={() => navigateTo('feed')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <Register
        onNavigateLogin={() => navigateTo('login')}
        onRegisterSuccess={() => navigateTo('feed')}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <Profile
        onNavigateHome={() => navigateTo('feed')}
        onLogout={() => navigateTo('login')}
      />
    );
  }

  if (currentView === 'videos') {
    return (
      <ShortVideos
        onNavigateHome={() => navigateTo('feed')}
      />
    );
  }

  return (
    <Feed
      onNavigateAuth={() => navigateTo('login')}
      onNavigateProfile={() => navigateTo('profile')}
      onNavigateVideos={() => navigateTo('videos')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
