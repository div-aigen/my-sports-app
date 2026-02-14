import { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';

export default function SessionDeepLinkScreen() {
  const { id } = useLocalSearchParams();
  const { user, token, loading } = useContext(AuthContext);
  const router = useRouter();
  const [sessionId, setSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
      setSessionId(parsedId);
    }
  }, [id]);

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
  if (!sessionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid session link</Text>
      </View>
    );
  }

  // Show session detail screen
  return (
    <SessionDetailScreen
      route={{ params: { sessionId } }}
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
