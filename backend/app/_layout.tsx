import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { registerForPushNotifications } from '../services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NotificationHandler() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const responseListener = useRef();

  useEffect(() => {
    if (token) {
      registerForPushNotifications();
    }
  }, [token]);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.sessionSessionId) {
        router.push(`/session/${data.sessionSessionId}`);
      }
    });
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return null;
}

const LineupDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0A0A',
    card: '#0A0A0A',
    text: '#FFFFFF',
    border: '#27272A',
    primary: '#D0FD3E',
  },
};

const LineupLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    primary: '#059669',
  },
};

function ThemedApp() {
  const theme = useTheme();

  return (
    <NavigationThemeProvider value={theme.isDark ? LineupDarkTheme : LineupLightTheme}>
      <NotificationHandler />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="sessions/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/ForgotPasswordScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/ResetPasswordScreen" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
