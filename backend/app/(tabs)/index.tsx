import { useContext } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import SessionsListScreen from '../screens/sessions/SessionsListScreen';

export default function HomeScreen() {
  const { user, token, loading } = useContext(AuthContext);
  const theme = useTheme();
  const c = theme.colors;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <ActivityIndicator testID="home-loading" size="large" color={c.accent} />
      </View>
    );
  }

  if (!token || !user) {
    return <LoginScreen />;
  }

  if (!user.email_verified) {
    return <VerifyEmailScreen />;
  }

  return <SessionsListScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
});
