import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { sessionAPI } from '../../../services/api';

const SessionDetailScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const { user } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [sessionRes, participantsRes] = await Promise.all([
        sessionAPI.get(sessionId),
        sessionAPI.getParticipants(sessionId),
      ]);
      setSession(sessionRes.data.session);
      setParticipants(participantsRes.data.participants);
      setIsParticipant(participantsRes.data.participants.some(p => p.user_id === user.id));
    } catch (err) {
      Alert.alert('Error', 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await sessionAPI.join(sessionId);
      await fetchDetails();
      Alert.alert('Success', 'You joined the session!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Leave Session?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await sessionAPI.leave(sessionId);
            await fetchDetails();
            Alert.alert('Success', 'You left the session');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to leave');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  const isCreator = user.id === session.creator_id;
  const costPerPerson = session.total_cost / session.participant_count;
  const isFull = session.participant_count >= session.max_participants;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{session.title}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{session.location_address}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{session.scheduled_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{session.scheduled_time}</Text>
          </View>
        </View>

        <View style={styles.costCard}>
          <Text style={styles.costLabel}>Total Cost</Text>
          <Text style={styles.costValue}>₹{parseFloat(session.total_cost).toFixed(2)}</Text>
          <Text style={styles.costLabel}>Cost per Person</Text>
          <Text style={styles.costValue}>₹{costPerPerson.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Participants ({session.participant_count}/{session.max_participants})</Text>
          {participants.length === 0 ? (
            <Text style={styles.emptyText}>No participants yet</Text>
          ) : (
            participants.map((p) => (
              <View key={p.id} style={styles.participant}>
                <View>
                  <Text style={styles.participantName}>{p.full_name}</Text>
                  {p.email && <Text style={styles.participantEmail}>{p.email}</Text>}
                </View>
                <Text style={styles.participantCost}>₹{parseFloat(p.cost_per_person).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        {isCreator ? (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, actionLoading && styles.buttonDisabled]}
            disabled={actionLoading}
          >
            <Text style={styles.buttonText}>Cancel Session</Text>
          </TouchableOpacity>
        ) : isParticipant ? (
          <TouchableOpacity
            style={[styles.button, styles.leaveButton, actionLoading && styles.buttonDisabled]}
            onPress={handleLeave}
            disabled={actionLoading}
          >
            <Text style={styles.buttonText}>{actionLoading ? 'Leaving...' : 'Leave Session'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.joinButton, (actionLoading || isFull) && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={actionLoading || isFull}
          >
            <Text style={styles.buttonText}>{actionLoading ? 'Joining...' : isFull ? 'Session Full' : 'Join Session'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  costCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  participantEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  participantCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  actionContainer: {
    padding: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  leaveButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});

export default SessionDetailScreen;
