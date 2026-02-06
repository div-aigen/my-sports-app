import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        const response = await authAPI.getMe();
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, fullName, phoneNumber) => {
    try {
      const response = await authAPI.signup(email, password, fullName, phoneNumber);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      console.error('Signup error in context:', err);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      console.error('Login error in context:', err);
      throw err;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
