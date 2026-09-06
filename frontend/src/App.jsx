import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';

function MainRouter() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    return user ? 'feed' : 'login';
  });

  if (currentView === 'login') {
    return (
      <Login
        onNavigateRegister={() => setCurrentView('register')}
        onLoginSuccess={() => setCurrentView('feed')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <Register
        onNavigateLogin={() => setCurrentView('login')}
        onRegisterSuccess={() => setCurrentView('feed')}
      />
    );
  }

  return (
    <Feed
      onNavigateAuth={() => setCurrentView('login')}
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
