import { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { sessionAPI, venueAPI } from '../../services/api';
import SessionDetailsModal from '../components/sessions/SessionDetailsModal';
import LoginScreen from '../screens/auth/LoginScreen';

export default function SessionDeepLinkScreen() {
  const { id } = useLocalSearchParams();
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // id can be numeric (from in-app nav) or session_id UUID (from deep link)
  const sessionIdentifier = typeof id === 'string' ? id : String(id);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch session by identifier (backend supports both numeric and UUID)
      const sessionRes = await sessionAPI.get(sessionIdentifier);
      const sessionData = sessionRes.data.session;
      setSession(sessionData);

      // Use numeric id for participants
      const [participantsRes, venuesRes] = await Promise.all([
        sessionAPI.getParticipants(sessionData.id),
        venueAPI.list(),
      ]);
      setParticipants(participantsRes.data.participants);
      setVenues(venuesRes.data.venues || []);
    } catch (err) {
      setError('Session not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchSession();
    }
  }, [sessionIdentifier, token, user]);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!token || !user) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Session not found'}</Text>
      </View>
    );
  }

  return (
    <SessionDetailsModal
      visible={true}
      session={session}
      participants={participants}
      onClose={() => router.back()}
      onActionComplete={fetchSession}
      activeTab={null}
      userParticipation={{ [session.id]: participants.some(p => p.user_id === user.id) }}
      venues={venues}
      user={user}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
});
