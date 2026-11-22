import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('sms_user');
    const savedToken = localStorage.getItem('sms_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify profile in background
        api.get('/auth/profile')
          .then(res => {
            if (res.data.success) {
              setUser(res.data.user);
              localStorage.setItem('sms_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // token expired or invalid
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token, user: loggedUser } = response.data;
      localStorage.setItem('sms_token', token);
      localStorage.setItem('sms_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    }
    throw new Error(response.data.error || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
  };

  const updateUserProfile = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('sms_user', JSON.stringify(updated));
  };

  // Used by SignupPage to inject user+token after self-registration
  // token is passed directly — no fragile localStorage dance
  const setAuthUser = (loggedUser, token) => {
    localStorage.setItem('sms_token', token);
    localStorage.setItem('sms_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserProfile, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
