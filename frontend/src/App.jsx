import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';

function MainRouter() {
  const { user } = useAuth();

  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    if (['login', 'register', 'feed'].includes(hash)) return hash;
    return user ? 'feed' : 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  // Sync state with URL hash and browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['login', 'register', 'feed'].includes(hash)) {
        setCurrentView(hash);
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

  return (
    <Feed
      onNavigateAuth={() => navigateTo('login')}
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
