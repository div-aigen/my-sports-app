import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { user, token } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = !!(user && token);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: isAuthenticated ? {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: (Platform.OS === 'ios' ? 88 : 64) + insets.bottom,
          paddingTop: 8,
          paddingBottom: (Platform.OS === 'ios' ? 28 : 8) + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        } : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'My Games',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({});
