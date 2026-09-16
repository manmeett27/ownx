import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, checkBackendHealth, fetchCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ownx_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ownx_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });

  // Verify backend health and validate JWT session with backend on load
  useEffect(() => {
    async function verifyBackendAndSession() {
      const res = await checkBackendHealth();
      setBackendStatus({ online: res.online, checking: false });

      const storedToken = localStorage.getItem('ownx_token');
      if (storedToken) {
        try {
          const profileData = await fetchCurrentUser();
          if (profileData && profileData.user) {
            setUser(profileData.user);
            localStorage.setItem('ownx_user', JSON.stringify(profileData.user));
          }
        } catch (err) {
          console.warn('Session verification notice:', err.message);
          if (err.message.includes('expired') || err.message.includes('Invalid') || err.message.includes('required')) {
            logout();
          }
        }
      }
    }

    verifyBackendAndSession();
    const interval = setInterval(verifyBackendAndSession, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await loginUser(username, password);
      const authToken = res.token;
      const userData = res.user;

      if (authToken) {
        setToken(authToken);
        localStorage.setItem('ownx_token', authToken);
      }
      if (userData) {
        setUser(userData);
        localStorage.setItem('ownx_user', JSON.stringify(userData));
      }

      return { success: true, user: userData, token: authToken };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (username, password, extraData = {}) => {
    try {
      const res = await registerUser(username, password, extraData);
      const authToken = res.token;
      const userData = res.user;

      if (authToken) {
        setToken(authToken);
        localStorage.setItem('ownx_token', authToken);
      }
      if (userData) {
        setUser(userData);
        localStorage.setItem('ownx_user', JSON.stringify(userData));
      }

      return { success: true, user: userData, token: authToken };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updatedFields };
      localStorage.setItem('ownx_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const refreshUser = async () => {
    try {
      const data = await fetchCurrentUser();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('ownx_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.warn('Could not refresh user profile:', e.message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ownx_token');
    localStorage.removeItem('ownx_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, updateUser, refreshUser, backendStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
