import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import styles from './SessionDetailScreen.styles';
import { AuthContext } from '../../../contexts/AuthContext';
import { sessionAPI } from '../../../services/api';
import { checkUserTimeConflict } from '../../../utils/sessionUtils';

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
      // Check for time conflicts with user's other joined sessions
      const conflictCheck = await checkUserTimeConflict(user.id, session);
      if (conflictCheck.hasConflict) {
        Alert.alert(
          'Time Conflict',
          "You can't join this session because you are already in another session held in the same time slot."
        );
        setActionLoading(false);
        return;
      }

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

export default SessionDetailScreen;
