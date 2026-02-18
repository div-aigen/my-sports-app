import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import styles from './MySessionsScreen.styles';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { formatDateTime, formatTime } from '../../../utils/dateTimeUtils';
import SessionDetailsModal from '../../components/sessions/SessionDetailsModal';

const MySessionsScreen = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('joined'); // 'joined', 'created', or 'done'
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [joinedCount, setJoinedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  useEffect(() => {
    venueAPI.list()
      .then(res => setVenues(res.data.venues || []))
      .catch(() => {});
  }, []);

  // Auto-refresh every 5 minutes to pick up completed sessions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Fetch open, full, and completed sessions
      const openResponse = await sessionAPI.list(1, 50, 'open');
      const fullResponse = await sessionAPI.list(1, 50, 'full');
      const completedResponse = await sessionAPI.list(1, 50, 'completed');
      const allSessions = [...openResponse.data.sessions, ...fullResponse.data.sessions, ...completedResponse.data.sessions];

      // Get participation status for all sessions
      const participationStatus = {};
      await Promise.all(
        allSessions.map(async (session) => {
          try {
            const participantsRes = await sessionAPI.getParticipants(session.id);
            participationStatus[session.id] = participantsRes.data.participants.some(
              (p) => p.user_id === user.id
            );
          } catch (err) {
            participationStatus[session.id] = false;
          }
        })
      );

      // Separate completed sessions that user participated in
      const done = allSessions.filter((s) => s.status === 'completed' && participationStatus[s.id]);
      const activeSessions = allSessions.filter((s) => s.status !== 'completed');
      const joined = activeSessions.filter((s) => participationStatus[s.id]);
      const created = activeSessions.filter((s) => s.creator_id === user.id);

      // Update counts
      setJoinedCount(joined.length);
      setCreatedCount(created.length);
      setDoneCount(done.length);

      // Display filtered sessions based on active tab
      if (activeTab === 'joined') {
        setSessions(joined);
      } else if (activeTab === 'created') {
        setSessions(created);
      } else {
        setSessions(done);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const handleShowSessionDetails = async (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
    try {
      const response = await sessionAPI.getParticipants(session.id);
      console.log('Participants loaded:', response.data.participants);
      setParticipants(response.data.participants);
    } catch (err) {
      console.error('Failed to load participants:', err);
      Alert.alert('Error', 'Failed to load session details');
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSession(null);
    setParticipants([]);
  };

  const renderSession = ({ item }) => (
    <View style={styles.sessionCardContainer}>
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: theme.colors.surface }, item.status === 'completed' && styles.sessionCardFull]}
        onPress={() => handleShowSessionDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.status, item.status === 'full' ? styles.fullStatus : item.status === 'completed' ? styles.completedStatus : styles.openStatus]}>
            {item.status === 'completed' ? 'DONE' : item.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.location}>{item.location_address}</Text>

        <View style={styles.sessionDetails}>
          <View>
            <Text style={styles.detailLabel}>📅 Date</Text>
            <Text style={styles.detailValue}>{formatDateTime(item.scheduled_date)}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>🕐 Time</Text>
            <Text style={styles.detailValue}>{item.scheduled_time ? formatTime(item.scheduled_time) : ''}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>💰 Cost</Text>
            <Text style={styles.detailValue}>₹{item.total_cost}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>👥 Players</Text>
            <Text style={styles.detailValue}>
              {item.participant_count}/{item.max_participants}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {item.status !== 'completed' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => Alert.alert(
              'Leave Session',
              `Are you sure you want to leave "${item.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await sessionAPI.leave(item.id);
                      Alert.alert('Success', `Left ${item.title}`);
                      fetchSessions();
                    } catch (err) {
                      Alert.alert('Error', err.response?.data?.error || 'Failed to leave session');
                    }
                  },
                },
              ]
            )}
          >
            <Text style={styles.actionButtonText}>Leave</Text>
          </TouchableOpacity>
          {activeTab === 'created' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => Alert.alert(
                'Cancel Session',
                `Are you sure you want to cancel "${item.title}"? This will remove the session for all participants.`,
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await sessionAPI.cancel(item.id);
                        Alert.alert('Success', `Cancelled ${item.title}`);
                        fetchSessions();
                      } catch (err) {
                        Alert.alert('Error', err.response?.data?.error || 'Failed to cancel session');
                      }
                    },
                  },
                ]
              )}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!theme.isDark && (
        <ImageBackground
          source={require('../../../assets/images/football-background.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      )}

      <View style={[styles.header, { backgroundColor: theme.isDark ? '#1e3a5f' : 'rgba(255, 255, 255, 0.6)' }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Sessions</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Welcome, {user?.full_name}!</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.tabActive]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.tabTextActive]}>
            Joined ({joinedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.tabActive]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.tabTextActive]}>
            Created ({createdCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'done' && styles.tabActive]}
          onPress={() => setActiveTab('done')}
        >
          <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>
            Done ({doneCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab === 'done' ? 'completed' : activeTab} sessions yet
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'joined'
              ? 'Join sessions to see them here'
              : activeTab === 'created'
              ? 'Create a session to get started'
              : 'Completed sessions will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id.toString()}
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      <SessionDetailsModal
        visible={showDetailsModal}
        session={selectedSession}
        participants={participants}
        onClose={handleCloseDetailsModal}
        onActionComplete={fetchSessions}
        activeTab={activeTab}
        userParticipation={null}
        venues={venues}
        user={user}
      />
    </View>
  );
};

export default MySessionsScreen;
