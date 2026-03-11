import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { checkUserCreationConflict } from '../../../utils/sessionUtils';

const CreateSessionScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [totalCost, setTotalCost] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('14');
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [sportType, setSportType] = useState('');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [availableSports, setAvailableSports] = useState([]);

  useEffect(() => { venueAPI.list().then(r => setVenues(r.data.venues || [])).catch(() => {}); }, []);
  useEffect(() => { if (selectedVenue) setAvailableSports(selectedVenue.available_sports || []); }, [selectedVenue]);

  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const formatTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const formatDisplayDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDisplayTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleSubmit = async () => {
    if (!title.trim() || !selectedVenue || !totalCost || !sportType) { Alert.alert('Error', 'Please fill in all required fields'); return; }

    const scheduledDateStr = formatDate(date);
    const scheduledTimeStr = formatTime(time);
    const scheduledEndTimeStr = endTime ? formatTime(endTime) : null;

    // IST past-date/time validation
    const nowUTC = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + nowUTC.getTimezoneOffset() * 60000 + istOffsetMs);
    const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    if (scheduledDateStr < todayIST) { Alert.alert('Error', 'Cannot create a session for a past date.'); return; }
    if (scheduledDateStr === todayIST) {
      const sMin = time.getHours() * 60 + time.getMinutes();
      const nowMin = nowIST.getHours() * 60 + nowIST.getMinutes();
      if (sMin <= nowMin) { Alert.alert('Error', 'Cannot create a session for a past time. Please select a future start time.'); return; }
    }

    // Duration validation (min 1 hour)
    if (endTime) {
      const startMinutes = time.getHours() * 60 + time.getMinutes();
      let endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;
      if (endMinutes - startMinutes < 60) { Alert.alert('Error', 'Session must be at least 1 hour long'); return; }
    }

    // Participant count validation
    const maxParts = parseInt(maxParticipants) || 14;
    if (maxParts < 2 || maxParts > 50) { Alert.alert('Error', 'Max participants must be between 2 and 50'); return; }

    setLoading(true);
    try {
      const conflictResult = await checkUserCreationConflict(user.id, { scheduled_date: scheduledDateStr, scheduled_time: scheduledTimeStr, scheduled_end_time: scheduledEndTimeStr });
      if (conflictResult.hasConflict) { Alert.alert('Time Conflict', `Overlaps with "${conflictResult.conflictingSession.title}"`); setLoading(false); return; }
      await sessionAPI.create(title.trim(), description.trim(), selectedVenue.address, scheduledDateStr, scheduledTimeStr, parseFloat(totalCost), maxParts, scheduledEndTimeStr, sportType, selectedVenue.id);
      Alert.alert('Success', 'Session created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === 'NO_FIELD_AVAILABLE') {
        Alert.alert('Field Unavailable', 'All fields are booked for this time slot. Try a different time or venue.');
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to create session');
      }
    } finally { setLoading(false); }
  };

  return (
    <View testID="create-session-screen" style={[ss.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={[ss.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity testID="create-back-btn" onPress={() => navigation.goBack()} style={[ss.backBtn, { backgroundColor: c.surface }]}><Ionicons name="close" size={24} color={c.text} /></TouchableOpacity>
        <Text style={[ss.headerTitle, { color: c.text }]}>Create Session</Text>
        <View style={{ width: 48 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={ss.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[ss.label, { color: c.textSecondary }]}>SESSION NAME *</Text>
          <TextInput testID="session-name-input" style={[ss.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]} placeholder="e.g., Friday Night Football" placeholderTextColor={c.textMuted} value={title} onChangeText={setTitle} maxLength={50} />

          <Text style={[ss.label, { color: c.textSecondary }]}>DESCRIPTION</Text>
          <TextInput testID="session-desc-input" style={[ss.input, ss.textArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]} placeholder="Tell players what to expect..." placeholderTextColor={c.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={3} />

          <Text style={[ss.label, { color: c.textSecondary }]}>VENUE *</Text>
          <TouchableOpacity testID="venue-picker-btn" style={[ss.picker, { backgroundColor: c.inputBg, borderColor: selectedVenue ? c.accent : c.inputBorder }]} onPress={() => setShowVenuePicker(true)}>
            <Ionicons name="location-outline" size={20} color={selectedVenue ? c.accent : c.textMuted} />
            <Text style={[ss.pickerText, { color: selectedVenue ? c.text : c.textMuted }]} numberOfLines={1}>{selectedVenue?.name || 'Select venue'}</Text>
            <Ionicons name="chevron-down" size={18} color={c.textMuted} />
          </TouchableOpacity>

          <Text style={[ss.label, { color: c.textSecondary }]}>SPORT *</Text>
          <TouchableOpacity testID="sport-picker-btn" style={[ss.picker, { backgroundColor: c.inputBg, borderColor: sportType ? c.accent : c.inputBorder }]} onPress={() => { if (!selectedVenue) { Alert.alert('Select Venue', 'Please select a venue first'); return; } setShowSportPicker(true); }}>
            <Ionicons name="football-outline" size={20} color={sportType ? c.accent : c.textMuted} />
            <Text style={[ss.pickerText, { color: sportType ? c.text : c.textMuted }]}>{sportType || 'Select sport'}</Text>
            <Ionicons name="chevron-down" size={18} color={c.textMuted} />
          </TouchableOpacity>

          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={[ss.label, { color: c.textSecondary }]}>DATE *</Text>
              <TouchableOpacity testID="date-picker-btn" style={[ss.picker, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color={c.accent} /><Text style={[ss.pickerText, { color: c.text }]}>{formatDisplayDate(date)}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.label, { color: c.textSecondary }]}>START TIME *</Text>
              <TouchableOpacity testID="time-picker-btn" style={[ss.picker, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color={c.accent} /><Text style={[ss.pickerText, { color: c.text }]}>{formatDisplayTime(time)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[ss.label, { color: c.textSecondary }]}>END TIME</Text>
          <TouchableOpacity testID="end-time-picker-btn" style={[ss.picker, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]} onPress={() => setShowEndTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={endTime ? c.accent : c.textMuted} /><Text style={[ss.pickerText, { color: endTime ? c.text : c.textMuted }]}>{endTime ? formatDisplayTime(endTime) : 'Optional'}</Text>
          </TouchableOpacity>

          <View style={ss.row}>
            <View style={{ flex: 1 }}>
              <Text style={[ss.label, { color: c.textSecondary }]}>TOTAL COST ({'\u20B9'}) *</Text>
              <TextInput testID="cost-input" style={[ss.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]} placeholder="0" placeholderTextColor={c.textMuted} value={totalCost} onChangeText={setTotalCost} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.label, { color: c.textSecondary }]}>MAX PLAYERS</Text>
              <TextInput testID="max-players-input" style={[ss.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]} placeholder="14" placeholderTextColor={c.textMuted} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity testID="create-session-submit-btn" style={[ss.submitBtn, { backgroundColor: c.accent }, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <><Ionicons name="flash" size={20} color="#000" /><Text style={[ss.submitBtnText, { color: c.onPrimary }]}>Create Session</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date()} onChange={(e, d) => { if (Platform.OS !== 'ios') setShowDatePicker(false); if (d) setDate(d); }} />}
      {showTimePicker && <DateTimePicker value={time} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { if (Platform.OS !== 'ios') setShowTimePicker(false); if (t) setTime(t); }} />}
      {showEndTimePicker && <DateTimePicker value={endTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { if (Platform.OS !== 'ios') setShowEndTimePicker(false); if (t) setEndTime(t); }} />}

      <Modal visible={showVenuePicker} animationType="slide" transparent onRequestClose={() => setShowVenuePicker(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.modalContent, { backgroundColor: c.surface }]}>
            <View style={ss.modalHead}><Text style={[ss.modalTitle, { color: c.text }]}>Select Venue</Text><TouchableOpacity onPress={() => setShowVenuePicker(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
            <ScrollView bounces={false}>{venues.map(v => (
              <TouchableOpacity key={v.id} style={[ss.venueItem, selectedVenue?.id === v.id && { backgroundColor: c.accent + '20', borderColor: c.accent }]} onPress={() => { setSelectedVenue(v); setSportType(''); setShowVenuePicker(false); }}>
                <Text style={[ss.venueName, { color: selectedVenue?.id === v.id ? c.accent : c.text }]}>{v.name}</Text>
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{v.address}</Text>
                <View style={ss.sportTags}>{(v.available_sports || []).map(sp => <View key={sp} style={[ss.sportTag, { backgroundColor: c.inputBg }]}><Text style={{ fontSize: 11, color: c.textSecondary }}>{sp}</Text></View>)}</View>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showSportPicker} animationType="slide" transparent onRequestClose={() => setShowSportPicker(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.modalContent, { backgroundColor: c.surface }]}>
            <View style={ss.modalHead}><Text style={[ss.modalTitle, { color: c.text }]}>Select Sport</Text><TouchableOpacity onPress={() => setShowSportPicker(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity></View>
            <ScrollView bounces={false}>{availableSports.map(sp => (
              <TouchableOpacity key={sp} style={[ss.sportItem, sportType === sp && { backgroundColor: c.accent + '20' }]} onPress={() => { setSportType(sp); setShowSportPicker(false); }}>
                <Text style={[ss.sportItemText, { color: sportType === sp ? c.accent : c.text }]}>{sp}</Text>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ss = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1 },
  textArea: { height: 80, textAlignVertical: 'top' },
  picker: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 10 },
  pickerText: { flex: 1, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { height: 56, borderRadius: 9999, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  venueItem: { padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  venueName: { fontSize: 15, fontWeight: '700' },
  sportTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sportTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sportItem: { padding: 16, borderRadius: 12, marginBottom: 6 },
  sportItemText: { fontSize: 15, fontWeight: '600' },
});

export default CreateSessionScreen;
