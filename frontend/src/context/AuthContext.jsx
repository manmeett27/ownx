import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, checkBackendHealth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ownx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });

  useEffect(() => {
    async function verifyBackend() {
      const res = await checkBackendHealth();
      setBackendStatus({ online: res.online, checking: false });
    }
    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await loginUser(username, password);
      const userData = res.user || { user_id: 1, username };
      setUser(userData);
      localStorage.setItem('ownx_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (username, password, locationId = 1) => {
    try {
      const res = await registerUser(username, password, locationId);
      const userData = res.user || { user_id: Date.now(), username };
      setUser(userData);
      localStorage.setItem('ownx_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ownx_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, backendStatus }}>
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
