import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  };

  const theme = {
    isDark: isDarkMode,
    colors: isDarkMode ? {
      background: '#0A0A0A',
      surface: '#161616',
      surfaceElevated: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      border: '#27272A',
      primary: '#D0FD3E',
      onPrimary: '#000000',
      accent: '#D0FD3E',
      success: '#4ADE80',
      danger: '#FF453A',
      warning: '#FBBF24',
      overlay: 'rgba(0, 0, 0, 0.8)',
      card: '#161616',
      tabBar: '#0A0A0A',
      tabBarActive: '#D0FD3E',
      tabBarInactive: '#52525B',
      inputBg: '#1E1E1E',
      inputBorder: '#27272A',
      headerBg: '#0A0A0A',
    } : {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#64748B',
      textMuted: '#94A3B8',
      border: '#E2E8F0',
      primary: '#059669',
      onPrimary: '#FFFFFF',
      accent: '#059669',
      success: '#22C55E',
      danger: '#EF4444',
      warning: '#F59E0B',
      overlay: 'rgba(0, 0, 0, 0.5)',
      card: '#FFFFFF',
      tabBar: '#FFFFFF',
      tabBarActive: '#059669',
      tabBarInactive: '#94A3B8',
      inputBg: '#F1F5F9',
      inputBorder: '#E2E8F0',
      headerBg: '#FFFFFF',
    },
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleDarkMode, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
