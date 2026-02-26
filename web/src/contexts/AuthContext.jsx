import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, fullName, phoneNumber) => {
    const response = await authAPI.signup(email, password, fullName, phoneNumber);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (err) {
      // silently fail
    }
  };

  const markEmailVerified = () => {
    setUser(prev => prev ? { ...prev, email_verified: true } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, refreshUser, markEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
};
