import { Tabs } from 'expo-router';
import React, { useContext } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthContext } from '../../contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, token } = useContext(AuthContext);
  const isAuthenticated = !!(user && token);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: isAuthenticated ? undefined : { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'My Sessions',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
          href: {
            pathname: '/my-sessions',
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          href: {
            pathname: '/profile',
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
