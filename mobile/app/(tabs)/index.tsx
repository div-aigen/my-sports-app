import { useContext } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import SessionsListScreen from '../screens/sessions/SessionsListScreen';

export default function HomeScreen() {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!token || !user) {
    return <LoginScreen />;
  }

  // Show verification screen if email not verified
  if (!user.email_verified) {
    return <VerifyEmailScreen />;
  }

  // Show sessions list if authenticated and verified
  return <SessionsListScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
