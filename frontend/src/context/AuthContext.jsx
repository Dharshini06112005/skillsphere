import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync state with LocalStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      
      // If 2FA is required, we don't save token yet; return code to page handler
      if (response.data.twoFactorRequired) {
        return { twoFactorRequired: true, userId: response.data.userId };
      }

      const { token: jwtToken, user: userData } = response.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwtToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed. Please try again.';
    }
  };

  // 2FA Validation handler
  const validate2FA = async (userId, otpToken) => {
    try {
      const response = await API.post('/auth/2fa/validate', { userId, token: otpToken });
      const { token: jwtToken, user: userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwtToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      throw error.response?.data?.message || 'Invalid two-factor code.';
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      const response = await API.post('/auth/register', { name, email, password, role });
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed. Please try again.';
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Google OAuth Login handler (triggered on redirection callback)
  const loginWithOAuth = (jwtToken, userData) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        validate2FA,
        register,
        logout,
        loginWithOAuth,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
