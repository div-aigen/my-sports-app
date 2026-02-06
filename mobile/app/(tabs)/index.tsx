import { useContext, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SessionsListScreen from '../screens/sessions/SessionsListScreen';

export default function HomeScreen() {
  const { user, token, loading } = useContext(AuthContext);
  const router = useRouter();

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

  // Show sessions list if authenticated
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
