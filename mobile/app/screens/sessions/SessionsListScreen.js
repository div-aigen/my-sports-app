import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ImageBackground,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI } from '../../../services/api';
import { checkUserTimeConflict } from '../../utils/sessionUtils';
import CreateSessionScreen from './CreateSessionScreen';

const SessionsListScreen = ({ navigation = null }) => {
  const { user, logout } = useContext(AuthContext);
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('open');
  const [filterDate, setFilterDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userParticipation, setUserParticipation] = useState({}); // Track which sessions user has joined
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Only fetch if filterDate is empty or is a valid date format (YYYY-MM-DD)
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(filterDate);
    if (filterDate === '' || isValidDate) {
      fetchSessions();
    }
  }, [status, filterDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.list(1, 20, status, filterDate);
      const sessionsData = response.data.sessions;
      setSessions(sessionsData);

      // Fetch participant info for each session to determine if user has joined
      const participationStatus = {};
      await Promise.all(
        sessionsData.map(async (session) => {
          try {
            const participantsRes = await sessionAPI.getParticipants(session.id);
            const isParticipant = participantsRes.data.participants.some(
              (p) => p.user_id === user.id
            );
            participationStatus[session.id] = isParticipant;
          } catch (err) {
            participationStatus[session.id] = false;
          }
        })
      );
      setUserParticipation(participationStatus);
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

  const handleJoinSession = async (sessionId, sessionTitle, targetSession) => {
    try {
      // Check for time conflicts with user's other joined sessions
      const conflictCheck = await checkUserTimeConflict(user.id, targetSession);
      if (conflictCheck.hasConflict) {
        Alert.alert(
          'Time Conflict',
          "You can't join this session because you are already in another session held in the same time slot."
        );
        return;
      }

      await sessionAPI.join(sessionId);
      Alert.alert('Success', `Joined ${sessionTitle}!`);
      fetchSessions(); // Refresh to show updated participant count
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join session');
    }
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
              fetchSessions(); // Refresh to show updated list
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
              fetchSessions(); // Refresh to show updated list
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const handleCreateSession = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    fetchSessions(); // Refresh sessions list after creating
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
    setShowDetailsModal(true); // Show modal immediately
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

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      // Format date in local timezone (not UTC) to avoid off-by-one day error
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFilterDate(formattedDate);
    }
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleClearDate = () => {
    setFilterDate('');
    setSelectedDate(new Date());
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const renderSession = ({ item }) => (
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

      <Text style={[styles.location, { color: theme.colors.textSecondary }]}>{item.location_address}</Text>

      <View style={[styles.sessionDetails, { borderTopColor: theme.colors.border }]}>
        <View>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{formatDateTime(item.scheduled_date)}</Text>
          <Text style={styles.detailValue}>{item.scheduled_time ? formatTime(item.scheduled_time) : ''}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Cost</Text>
          <Text style={styles.detailValue}>₹{parseFloat(item.total_cost).toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Players</Text>
          <Text style={styles.detailValue}>
            {item.participant_count}/{item.max_participants}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.joinButton,
            (userParticipation[item.id] || item.status === 'full') && styles.buttonDisabled
          ]}
          onPress={() => handleJoinSession(item.id, item.title, item)}
          disabled={userParticipation[item.id] || item.status === 'full'}
        >
          <Text style={styles.actionButtonText}>
            {item.status === 'full' ? 'Full' : userParticipation[item.id] ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.leaveButton,
            !userParticipation[item.id] && styles.buttonDisabled
          ]}
          onPress={() => handleLeaveSession(item.id, item.title)}
          disabled={!userParticipation[item.id]}
        >
          <Text style={styles.actionButtonText}>Leave</Text>
        </TouchableOpacity>
        {item.creator_id === user.id && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelSession(item.id, item.title)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Sports Sessions</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Welcome, {user?.full_name}!</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSession}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, status === 'open' && styles.filterButtonActive]}
          onPress={() => setStatus('open')}
        >
          <Text style={status === 'open' ? styles.filterTextActive : styles.filterText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, status === 'full' && styles.filterButtonActive]}
          onPress={() => setStatus('full')}
        >
          <Text style={status === 'full' ? styles.filterTextActive : styles.filterText}>Full</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, status === 'completed' && styles.filterButtonActive]}
          onPress={() => setStatus('completed')}
        >
          <Text style={status === 'completed' ? styles.filterTextActive : styles.filterText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={handleOpenDatePicker}
        >
          <Text style={styles.datePickerIcon}>📅</Text>
          <Text style={styles.datePickerText}>
            {filterDate ? formatDate(filterDate) : 'Select Date'}
          </Text>
        </TouchableOpacity>
        {filterDate !== '' && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={handleClearDate}
          >
            <Text style={styles.clearDateText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.datePickerClearButton}
                    onPress={handleClearDate}
                  >
                    <Text style={styles.datePickerClearText}>Clear Filter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sessions available</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleCreateSession}
          >
            <Text style={styles.emptyButtonText}>Create one!</Text>
          </TouchableOpacity>
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
              <Text style={styles.modalTitle}>{selectedSession?.title}</Text>
              <TouchableOpacity onPress={handleCloseDetailsModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>📍 Location</Text>
                  <Text style={styles.infoCardValue}>{selectedSession?.location_address}</Text>
                </View>

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
                    {participants.map((participant, index) => (
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <CreateSessionScreen
          navigation={{
            goBack: handleCloseCreateModal,
            navigate: (screen, params) => {
              // Handle navigation after session creation
              handleCloseCreateModal();
            }
          }}
        />
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
  headerButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '500',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 10,
  },
  datePickerIcon: {
    fontSize: 20,
  },
  datePickerText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  clearDateButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearDateText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
  },
  datePickerActions: {
    marginTop: 15,
    alignItems: 'center',
  },
  datePickerClearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  datePickerClearText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sessionCard: {
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  leaveButton: {
    backgroundColor: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#FF9800',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
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
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
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
  emptyText: {
    color: '#999',
    fontSize: 14,
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
});

export default SessionsListScreen;
