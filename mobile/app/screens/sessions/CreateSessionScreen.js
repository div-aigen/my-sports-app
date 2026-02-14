import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { checkUserCreationConflict } from '../../utils/sessionUtils';

const CreateSessionScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateString, setDateString] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cost, setCost] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('14');
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  const timeOptions = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];

  // Fetch venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await venueAPI.list();
      setVenues(response.data.venues);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      Alert.alert('Error', 'Failed to load venues');
    }
  };

  // Get available sports for selected venue
  const availableSports = selectedVenueId
    ? venues.find(v => v.id === selectedVenueId)?.available_sports || []
    : [];

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      // Format date in local timezone (not UTC) to avoid off-by-one day error
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDateString(formattedDate);
    }
  };

  const handleCreate = async () => {
    if (!title || !selectedVenueId || !selectedSport || !dateString || !startTime || !endTime || !cost || !maxParticipants) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate that end time is after start time and at least 1 hour duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // If end time is earlier than start time, assume it's next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < 60) {
      Alert.alert('Error', 'Session must be at least 1 hour long');
      return;
    }

    const maxParts = parseInt(maxParticipants);
    if (maxParts < 2 || maxParts > 50) {
      Alert.alert('Error', 'Max participants must be between 2 and 50');
      return;
    }

    setLoading(true);
    try {
      // Create target session object for conflict checking
      const targetSession = {
        scheduled_date: dateString,
        scheduled_time: startTime,
        scheduled_end_time: endTime,
      };

      // Check for time conflicts with user's other created sessions
      const conflictCheck = await checkUserCreationConflict(user.id, targetSession);
      if (conflictCheck.hasConflict) {
        Alert.alert(
          'Time Conflict',
          "You already have another session scheduled at this time. Please choose a different time slot."
        );
        setLoading(false);
        return;
      }

      // Create session with sport type and venue ID
      const response = await sessionAPI.create(
        title,
        description,
        selectedLocation,
        dateString,
        startTime,
        parseFloat(cost),
        maxParts,
        endTime,
        selectedSport,     // Send sport type
        selectedVenueId    // Send venue ID
      );
      Alert.alert('Success', 'Session created!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SessionDetail', { sessionId: response.data.session.id }),
        },
      ]);
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      const errorMessage = err.response?.data?.error || 'Failed to create session';

      if (errorCode === 'NO_FIELD_AVAILABLE') {
        Alert.alert(
          'Field Unavailable',
          'All fields are booked for this time slot. Try a different time or venue.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.backgroundImage, { backgroundColor: theme.colors.background }]}>
      {!theme.isDark && (
        <ImageBackground
          source={require('../../../assets/images/football-background.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.header, { backgroundColor: theme.isDark ? '#1e3a5f' : 'rgba(255, 255, 255, 0.6)' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButtonBox, { borderColor: theme.colors.text }]}
        >
          <Text style={[styles.backButton, { color: theme.colors.text}]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Session</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Title *</Text>
        <TextInput
          style={[styles.input, {
            color: '#000',
            borderColor: theme.isDark ? '#444' : '#ddd',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)'
          }]}
          placeholder="e.g., Friday Evening Football"
          placeholderTextColor={theme.isDark ? '#ccc' : '#666'}
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, {
            color: '#000',
            borderColor: theme.isDark ? '#444' : '#ddd',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)'
          }]}
          placeholder="Add details..."
          placeholderTextColor={theme.isDark ? '#ccc' : '#666'}
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!loading}
        />

        <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Location *</Text>
        <TouchableOpacity
          style={[styles.dropdown, { borderColor: theme.isDark ? '#444' : '#ddd', backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}
          onPress={() => setShowLocationModal(true)}
          disabled={loading}
        >
          <Text style={[styles.dropdownText, { color: selectedLocation ? theme.colors.text : '#999' }]}>
            {selectedLocation || 'Select Location'}
          </Text>
          <Text style={[styles.dropdownArrow, { color: theme.colors.text }]}>▼</Text>
        </TouchableOpacity>

        {selectedLocation && (
          <>
            <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Sport *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: theme.isDark ? '#444' : '#ddd', backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}
              onPress={() => setShowSportModal(true)}
              disabled={loading}
            >
              <Text style={[styles.dropdownText, { color: selectedSport ? theme.colors.text : '#999' }]}>
                {selectedSport || 'Select Sport'}
              </Text>
              <Text style={[styles.dropdownArrow, { color: theme.colors.text }]}>▼</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: theme.isDark ? '#444' : '#ddd', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)' }]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text style={[styles.dropdownText, { color: dateString ? '#000' : '#999' }]}>
                {dateString || 'Select Date'}
              </Text>
              <Text style={[styles.dropdownArrow, { color: '#000' }]}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.datePickerButtons}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerButton}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Start Time *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: theme.isDark ? '#444' : '#ddd', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)' }]}
              onPress={() => setShowStartTimeModal(true)}
              disabled={loading}
            >
              <Text style={[styles.dropdownText, { color: startTime ? '#000' : '#999' }]}>
                {startTime || 'Select Time'}
              </Text>
              <Text style={[styles.dropdownArrow, { color: '#000' }]}>🕐</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>End Time *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: theme.isDark ? '#444' : '#ddd', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)' }]}
              onPress={() => setShowEndTimeModal(true)}
              disabled={loading}
            >
              <Text style={[styles.dropdownText, { color: endTime ? '#000' : '#999' }]}>
                {endTime || 'Select Time'}
              </Text>
              <Text style={[styles.dropdownArrow, { color: '#000' }]}>🕐</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Total Cost (₹) *</Text>
        <TextInput
          style={[styles.input, {
            color: '#000',
            borderColor: theme.isDark ? '#444' : '#ddd',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)'
          }]}
          placeholder="e.g., 500"
          placeholderTextColor={theme.isDark ? '#ccc' : '#666'}
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={[styles.hint, { color: theme.isDark ? '#ddd' : '#fff' }]}>This will be split equally among all participants</Text>

        <Text style={[styles.label, { color: theme.isDark ? '#fff' : '#fff' }]}>Max Participants *</Text>
        <TextInput
          style={[styles.input, {
            color: '#000',
            borderColor: theme.isDark ? '#444' : '#ddd',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)'
          }]}
          placeholder="e.g., 14 (min: 2, max: 50)"
          placeholderTextColor={theme.isDark ? '#ccc' : '#666'}
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="number-pad"
          editable={!loading}
        />
        <Text style={[styles.hint, { color: theme.isDark ? '#ddd' : '#fff' }]}>Maximum number of people who can join this session</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Session'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

    {/* Location Modal */}
    <Modal visible={showLocationModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.isDark ? '#444' : '#eee' }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={venues}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedVenueId === item.id && styles.modalOptionSelected,
                  { borderColor: theme.isDark ? '#444' : '#eee' }
                ]}
                onPress={() => {
                  setSelectedVenueId(item.id);
                  setSelectedLocation(item.address);
                  setSelectedSport(''); // Reset sport when venue changes
                  setShowLocationModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.modalSubtext, { color: theme.isDark ? '#aaa' : '#666' }]}>
                  {item.available_sports?.join(', ') || 'No sports available'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* Sport Modal */}
    <Modal visible={showSportModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.isDark ? '#444' : '#eee' }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Sport</Text>
            <TouchableOpacity onPress={() => setShowSportModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableSports}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedSport === item && styles.modalOptionSelected,
                  { borderColor: theme.isDark ? '#444' : '#eee' }
                ]}
                onPress={() => {
                  setSelectedSport(item);
                  setShowSportModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* Start Time Modal */}
    <Modal visible={showStartTimeModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.isDark ? '#444' : '#eee' }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Start Time</Text>
            <TouchableOpacity onPress={() => setShowStartTimeModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={timeOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  startTime === item && styles.modalOptionSelected,
                  { borderColor: theme.isDark ? '#444' : '#eee' }
                ]}
                onPress={() => {
                  setStartTime(item);
                  setShowStartTimeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* End Time Modal */}
    <Modal visible={showEndTimeModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#2d2d2d' : 'white' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.isDark ? '#444' : '#eee' }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select End Time</Text>
            <TouchableOpacity onPress={() => setShowEndTimeModal(false)}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={timeOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              // Check if this time is on next day (earlier than start time)
              const [itemHour, itemMin] = item.split(':').map(Number);
              const [startHour, startMin] = startTime.split(':').map(Number);
              const itemMinutes = itemHour * 60 + itemMin;
              const startMinutes = startHour * 60 + startMin;
              const isNextDay = itemMinutes <= startMinutes && startTime !== '';

              return (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    endTime === item && styles.modalOptionSelected,
                    { borderColor: theme.isDark ? '#444' : '#eee' }
                  ]}
                  onPress={() => {
                    setEndTime(item);
                    setShowEndTimeModal(false);
                  }}
                >
                  <View style={styles.timeOptionContainer}>
                    <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item}</Text>
                    {isNextDay && startTime && (
                      <Text style={[styles.nextDayLabel, { color: theme.isDark ? '#aaa' : '#999' }]}>Next Day</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'rgba(33, 150, 243, 0.6)',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButtonBox: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: -8,
    marginBottom: 16,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOption: {
    borderBottomWidth: 1,
    padding: 16,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  modalOptionText: {
    fontSize: 14,
  },
  modalSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeOptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextDayLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
  },
});

export default CreateSessionScreen;
