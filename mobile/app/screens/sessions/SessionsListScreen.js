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
import styles from './SessionsListScreen.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { formatDate, formatDateTime, formatTime } from '../../../utils/dateTimeUtils';
import CreateSessionScreen from './CreateSessionScreen';
import SessionDetailsModal from '../../components/sessions/SessionDetailsModal';

const SessionsListScreen = ({ navigation = null }) => {
  const { user, logout } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [codeSearchLoading, setCodeSearchLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [venues, setVenues] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  useEffect(() => {
    // Only fetch if filterDate is empty or is a valid date format (YYYY-MM-DD)
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(filterDate);
    if (filterDate === '' || isValidDate) {
      fetchSessions();
    }
  }, [status, filterDate, locationFilter]);

  useEffect(() => {
    venueAPI.list()
      .then(res => setVenues(res.data.venues || []))
      .catch(() => {});
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.list(1, 20, status, filterDate, locationFilter || null);
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

  const handleCreateSession = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    fetchSessions(); // Refresh sessions list after creating
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

  const handleJoinByCode = async () => {
    const code = sessionCode.trim().toLowerCase();
    if (!code) {
      Alert.alert('Error', 'Please enter a session code');
      return;
    }

    setCodeSearchLoading(true);
    try {
      const response = await sessionAPI.getByCode(code);
      const session = response.data.session;

      // Close code modal and show session details
      setShowCodeModal(false);
      setSessionCode('');
      await handleShowSessionDetails(session);
    } catch (err) {
      if (err.response?.status === 404) {
        Alert.alert('Not Found', 'No session found with that code. Please check and try again.');
      } else {
        Alert.alert('Error', 'Failed to find session. Please try again.');
      }
    } finally {
      setCodeSearchLoading(false);
    }
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
          onPress={async () => {
            try {
              await sessionAPI.join(item.id);
              Alert.alert('Success', `Joined ${item.title}!`);
              fetchSessions();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to join session');
            }
          }}
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
          disabled={!userParticipation[item.id]}
        >
          <Text style={styles.actionButtonText}>Leave</Text>
        </TouchableOpacity>
        {item.creator_id === user.id && (
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
          <TouchableOpacity
            style={styles.codeButton}
            onPress={() => setShowCodeModal(true)}
          >
            <Text style={styles.codeButtonText}>Join by Code</Text>
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

      <View style={styles.locationFilterContainer}>
        <TouchableOpacity
          style={[styles.locationDropdownButton, locationFilter && styles.locationDropdownButtonActive]}
          onPress={() => setShowLocationDropdown(true)}
        >
          <Text style={styles.locationFilterIcon}>📍</Text>
          <Text style={[styles.locationDropdownText, locationFilter && styles.locationDropdownTextActive]} numberOfLines={1}>
            {locationFilter
              ? venues.find(v => v.address === locationFilter)?.name || locationFilter
              : 'All Locations'}
          </Text>
          <Text style={styles.locationDropdownChevron}>▾</Text>
        </TouchableOpacity>
        {locationFilter !== '' && (
          <TouchableOpacity
            style={styles.clearLocationButton}
            onPress={() => setLocationFilter('')}
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
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 8 }]}
        />
      )}

      <SessionDetailsModal
        visible={showDetailsModal}
        session={selectedSession}
        participants={participants}
        onClose={handleCloseDetailsModal}
        onActionComplete={fetchSessions}
        activeTab={null}
        userParticipation={userParticipation}
        venues={venues}
        user={user}
      />

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

      {/* Location Dropdown Modal */}
      <Modal
        visible={showLocationDropdown}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLocationDropdown(false)}
      >
        <TouchableOpacity
          style={styles.locationModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationDropdown(false)}
        >
          <View style={styles.locationModalContent}>
            <Text style={styles.locationModalTitle}>Filter by Location</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.locationOption, locationFilter === '' && styles.locationOptionSelected]}
                onPress={() => { setLocationFilter(''); setShowLocationDropdown(false); }}
              >
                <Text style={[styles.locationOptionText, locationFilter === '' && styles.locationOptionTextSelected]}>
                  All Locations
                </Text>
                {locationFilter === '' && <Text style={styles.locationOptionCheck}>✓</Text>}
              </TouchableOpacity>
              {venues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[styles.locationOption, locationFilter === venue.address && styles.locationOptionSelected]}
                  onPress={() => { setLocationFilter(venue.address); setShowLocationDropdown(false); }}
                >
                  <View style={styles.locationOptionContent}>
                    <Text style={[styles.locationOptionText, locationFilter === venue.address && styles.locationOptionTextSelected]}>
                      {venue.name}
                    </Text>
                    <Text style={styles.locationOptionAddress}>{venue.address}</Text>
                  </View>
                  {locationFilter === venue.address && <Text style={styles.locationOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Join by Code Modal */}
      <Modal
        visible={showCodeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setShowCodeModal(false); setSessionCode(''); }}
      >
        <View style={styles.codeModalOverlay}>
          <View style={styles.codeModalContent}>
            <Text style={styles.codeModalTitle}>Join by Code</Text>
            <Text style={styles.codeModalSubtitle}>
              Enter the session code shared with you
            </Text>
            <TextInput
              style={styles.codeInput}
              value={sessionCode}
              onChangeText={(text) => setSessionCode(text.toUpperCase())}
              placeholder="e.g. ABCDEF"
              placeholderTextColor="#aaa"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              autoFocus={true}
            />
            <View style={styles.codeModalButtons}>
              <TouchableOpacity
                style={styles.codeModalCancel}
                onPress={() => { setShowCodeModal(false); setSessionCode(''); }}
              >
                <Text style={styles.codeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.codeModalConfirm, codeSearchLoading && styles.buttonDisabled]}
                onPress={handleJoinByCode}
                disabled={codeSearchLoading}
              >
                <Text style={styles.codeModalConfirmText}>
                  {codeSearchLoading ? 'Searching...' : 'Find Session'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SessionsListScreen;
