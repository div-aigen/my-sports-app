import { useContext } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';

export default function SessionDeepLinkScreen() {
  const { id } = useLocalSearchParams();
  const { user, token, loading } = useContext(AuthContext);
  const router = useRouter();

  // id can be numeric (from in-app nav) or session_id UUID (from deep link)
  const sessionIdentifier = typeof id === 'string' ? id : String(id);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!token || !user) {
    return <LoginScreen />;
  }

  // Show error if no session ID
  if (!sessionIdentifier) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid session link</Text>
      </View>
    );
  }

  // Pass the identifier as-is — SessionDetailScreen uses sessionAPI.get()
  // which supports both numeric id and session_id (UUID) lookup
  return (
    <SessionDetailScreen
      route={{ params: { sessionId: sessionIdentifier } }}
      navigation={{
        goBack: () => router.back(),
        navigate: (screen: string, params: any) => {
          if (screen === 'SessionDetail') {
            router.push(`/session/${params.sessionId}`);
          }
        },
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
});
