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
  Modal,
  ScrollView,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';

const MySessionsScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' or 'created'
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [joinedCount, setJoinedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  useEffect(() => {
    venueAPI.list()
      .then(res => setVenues(res.data.venues || []))
      .catch(() => {});
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Fetch both open and full sessions to see all sessions
      const openResponse = await sessionAPI.list(1, 50, 'open');
      const fullResponse = await sessionAPI.list(1, 50, 'full');
      const allSessions = [...openResponse.data.sessions, ...fullResponse.data.sessions];

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

      // Calculate both counts
      const joined = allSessions.filter((s) => participationStatus[s.id]);
      const created = allSessions.filter((s) => s.creator_id === user.id);

      // Update counts
      setJoinedCount(joined.length);
      setCreatedCount(created.length);

      // Display filtered sessions based on active tab
      if (activeTab === 'joined') {
        setSessions(joined);
      } else {
        setSessions(created);
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

  const formatDate = (dateString) => {
    // Parse ISO string and get local date (handles timezone properly)
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    // Handle HH:MM format
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString) => {
    // Just use formatDate directly - it handles ISO strings correctly
    return formatDate(dateString);
  };

  const formatEndTimeWithDate = (startTime, endTime, dateString) => {
    if (!endTime) return 'N/A';

    const formattedTime = formatTime(endTime);

    // Check if end time is next day (end time <= start time means it crossed midnight)
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes && startTime) {
      // End time is on next day - add 1 day to the date
      const date = new Date(dateString);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const formattedDate = formatDate(nextDate.toISOString());
      return `${formattedTime} (${formattedDate})`;
    }

    return formattedTime;
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

  const handleLeaveSession = async (sessionId, sessionTitle) => {
    Alert.alert(
      'Leave Session',
      `Are you sure you want to leave "${sessionTitle}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionAPI.leave(sessionId);
              Alert.alert('Success', `Left ${sessionTitle}`);
              fetchSessions();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to leave session');
            }
          },
        },
      ]
    );
  };

  const handleCancelSession = async (sessionId, sessionTitle) => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to cancel "${sessionTitle}"? This will remove the session for all participants.`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionAPI.cancel(sessionId);
              Alert.alert('Success', `Cancelled ${sessionTitle}`);
              fetchSessions();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const handleShareSession = async () => {
    if (!selectedSession) return;
    try {
      const sessionLink = `sportsapp://session/${selectedSession.session_id}`;
      const message =
        `🏆 Join my ${selectedSession.title} session!\n\n` +
        `📅 Date: ${formatDateTime(selectedSession.scheduled_date)}\n` +
        `🕐 Time: ${formatTime(selectedSession.scheduled_time)}\n` +
        `📍 Location: ${selectedSession.location_address}\n` +
        `👥 Spots: ${selectedSession.participant_count}/${selectedSession.max_participants}\n` +
        `💰 Cost: ₹${selectedSession.total_cost}\n\n` +
        `🔑 Invite Code: ${selectedSession.invite_code}\n` +
        `(Open the app → "Join by Code" → enter the code above)\n\n` +
        `📱 Or tap this link:\n${sessionLink}`;
      await Share.share({ message, title: `Join ${selectedSession.title}` });
    } catch (err) {
      Alert.alert('Error', 'Failed to share session');
    }
  };

  const renderSession = ({ item }) => (
    <View style={styles.sessionCardContainer}>
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleShowSessionDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.status, item.status === 'full' ? styles.fullStatus : styles.openStatus]}>
            {item.status.toUpperCase()}
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.leaveButton]}
          onPress={() => handleLeaveSession(item.id, item.title)}
        >
          <Text style={styles.actionButtonText}>Leave</Text>
        </TouchableOpacity>
        {activeTab === 'created' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelSession(item.id, item.title)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
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
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab} sessions yet
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'joined'
              ? 'Join sessions to see them here'
              : 'Create a session to get started'}
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

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseDetailsModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{selectedSession?.title}</Text>
              <TouchableOpacity onPress={handleCloseDetailsModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              <View style={styles.infoGrid}>
                {(() => {
                  const mapsUrl = venues.find(v => v.address === selectedSession?.location_address)?.maps_url;
                  return mapsUrl ? (
                    <TouchableOpacity
                      style={[styles.infoCard, styles.infoCardTappable]}
                      onPress={() => Linking.openURL(mapsUrl)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.infoCardLabel}>📍 Location</Text>
                      <Text style={styles.infoCardValue}>{selectedSession?.location_address}</Text>
                      <Text style={styles.mapsLinkText}>Open in Maps ↗</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardLabel}>📍 Location</Text>
                      <Text style={styles.infoCardValue}>{selectedSession?.location_address}</Text>
                    </View>
                  );
                })()}

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>📅 Date</Text>
                  <Text style={styles.infoCardValue}>
                    {selectedSession?.scheduled_date ? formatDateTime(selectedSession.scheduled_date) : ''}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>🕐 Start Time</Text>
                  <Text style={styles.infoCardValue}>
                    {selectedSession?.scheduled_time ? formatTime(selectedSession.scheduled_time) : ''}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>🕑 End Time</Text>
                  <Text style={styles.infoCardValue}>
                    {formatEndTimeWithDate(selectedSession?.scheduled_time, selectedSession?.scheduled_end_time, selectedSession?.scheduled_date)}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>💰 Total Cost</Text>
                  <Text style={styles.infoCardValue}>₹{selectedSession?.total_cost}</Text>
                </View>
              </View>

              <View style={styles.participantsSection}>
                <View style={styles.participantsHeader}>
                  <Text style={styles.participantsTitle}>
                    👥 Participants ({participants.length}/{selectedSession?.max_participants})
                  </Text>
                  <Text style={[styles.statusBadge, selectedSession?.status === 'open' ? styles.statusOpen : styles.statusFull]}>
                    {selectedSession?.status?.toUpperCase()}
                  </Text>
                </View>

                {participants.length === 0 ? (
                  <View style={styles.emptyParticipants}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.emptyText}>Loading...</Text>
                  </View>
                ) : (
                  <View>
                    {participants.map((participant) => (
                      <View key={participant.id} style={styles.participantItem}>
                        <View style={styles.participantLeft}>
                          <View style={styles.participantAvatar}>
                            <Text style={styles.participantAvatarText}>{participant.full_name.charAt(0)}</Text>
                          </View>
                          <View>
                            <Text style={styles.participantName}>{participant.full_name}</Text>
                            {participant.user_id === selectedSession?.creator_id && (
                              <Text style={styles.creatorBadge}>Creator</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.participantCost}>₹{parseFloat(participant.cost_per_person).toFixed(0)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Action Button */}
              {selectedSession && (
                activeTab === 'created' ? (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalCancelButton]}
                    onPress={() => { handleCloseDetailsModal(); handleCancelSession(selectedSession.id, selectedSession.title); }}
                  >
                    <Text style={styles.modalActionButtonText}>Cancel Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalLeaveButton]}
                    onPress={() => { handleCloseDetailsModal(); handleLeaveSession(selectedSession.id, selectedSession.title); }}
                  >
                    <Text style={styles.modalActionButtonText}>Leave Session</Text>
                  </TouchableOpacity>
                )
              )}

              {/* Invite Button */}
              <TouchableOpacity style={styles.inviteButton} onPress={handleShareSession}>
                <Text style={styles.inviteButtonIcon}>🔗</Text>
                <Text style={styles.inviteButtonText}>Invite Friends</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    backgroundColor: 'rgba(33, 150, 243, 0.6)',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sessionCardContainer: {
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  openStatus: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  fullStatus: {
    backgroundColor: '#ffcccc',
    color: '#c62828',
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
    paddingLeft: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  participantsSection: {
    marginBottom: 20,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  statusFull: {
    backgroundColor: '#ffccbc',
    color: '#d84315',
  },
  emptyParticipants: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  creatorBadge: {
    fontSize: 10,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    marginTop: 2,
  },
  participantCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  infoCardTappable: {
    borderLeftColor: '#1565C0',
  },
  mapsLinkText: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
    marginTop: 4,
  },
  modalActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  modalLeaveButton: {
    backgroundColor: '#FF9800',
  },
  modalCancelButton: {
    backgroundColor: '#f44336',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    elevation: 4,
  },
  inviteButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MySessionsScreen;
