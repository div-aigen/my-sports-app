import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal, ScrollView, Platform, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { formatDate, formatDateTime, formatTime } from '../../../utils/dateTimeUtils';
import CreateSessionScreen from './CreateSessionScreen';
import SessionDetailsModal from '../../components/sessions/SessionDetailsModal';

const SessionsListScreen = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('open');
  const [filterDate, setFilterDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userParticipation, setUserParticipation] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [codeSearchLoading, setCodeSearchLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [venues, setVenues] = useState([]);
  const [sportFilter, setSportFilter] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);

  useEffect(() => {
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(filterDate);
    if (filterDate === '' || isValidDate) fetchSessions();
  }, [status, filterDate, locationFilter, sportFilter]);

  useEffect(() => { venueAPI.list().then(res => setVenues(res.data.venues || [])).catch(() => {}); }, []);
  useEffect(() => { const i = setInterval(fetchSessions, 300000); return () => clearInterval(i); }, [status, filterDate, locationFilter, sportFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.list(1, 20, status, filterDate, locationFilter || null, sportFilter || null);
      const data = response.data.sessions;
      setSessions(data);
      const ps = {};
      await Promise.all(data.map(async (s) => {
        try { const r = await sessionAPI.getParticipants(s.id); ps[s.id] = r.data.participants.some(p => p.user_id === user.id); }
        catch { ps[s.id] = false; }
      }));
      setUserParticipation(ps);
    } catch { Alert.alert('Error', 'Failed to fetch sessions'); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchSessions(); setRefreshing(false); };

  const handleShowSessionDetails = async (session) => {
    setSelectedSession(session); setShowDetailsModal(true);
    try { const r = await sessionAPI.getParticipants(session.id); setParticipants(r.data.participants); }
    catch { Alert.alert('Error', 'Failed to load session details'); }
  };

  const handleJoinByCode = async () => {
    const code = sessionCode.trim().toLowerCase();
    if (!code) { Alert.alert('Error', 'Please enter a session code'); return; }
    setCodeSearchLoading(true);
    try { const r = await sessionAPI.getByCode(code); setShowCodeModal(false); setSessionCode(''); await handleShowSessionDetails(r.data.session); }
    catch (err) { Alert.alert(err.response?.status === 404 ? 'Not Found' : 'Error', err.response?.status === 404 ? 'No session found with that code.' : 'Failed to find session.'); }
    finally { setCodeSearchLoading(false); }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (Platform.OS === 'android' && event.type === 'dismissed') return;
    if (date) { setSelectedDate(date); const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); setFilterDate(`${y}-${m}-${d}`); }
  };

  const venueBackgrounds = {
    'Yolo Sports Arena': require('../../../assets/images/yolo_gaming_arena.png'),
    'Puff N Play Sports Arena': require('../../../assets/images/aishbagh_sports_complex.jpg'),
    'D & C Sports Turf': require('../../../assets/images/central_stadium.png'),
    'The Urban Turf': require('../../../assets/images/jai_pakash_park.png'),
    'Dugout Sports Arena': require('../../../assets/images/ram_manohar.png'),
  };

  const getVenueBackground = (loc) => {
    for (const [name, img] of Object.entries(venueBackgrounds)) { if (loc && loc.includes(name)) return img; }
    return null;
  };

  const renderSession = ({ item }) => {
    const bgImage = getVenueBackground(item.location_address);
    const isJoined = userParticipation[item.id];
    return (
      <TouchableOpacity testID={`session-card-${item.id}`} style={[ss.card, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => handleShowSessionDetails(item)} activeOpacity={0.8}>
        {bgImage ? (
          <ImageBackground source={bgImage} style={ss.cardBg} imageStyle={ss.cardBgImg}>
            <View style={ss.cardOverlay}>
              <CardContent item={item} c={c} isJoined={isJoined} theme={theme} />
            </View>
          </ImageBackground>
        ) : (
          <View style={ss.cardInner}>
            <CardContent item={item} c={c} isJoined={isJoined} theme={theme} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const activeFilterCount = [filterDate, locationFilter, sportFilter].filter(Boolean).length;

  return (
    <View testID="sessions-list-screen" style={[ss.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[ss.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[ss.greeting, { color: c.textSecondary }]}>Welcome back,</Text>
          <Text style={[ss.userName, { color: c.text }]}>{user?.full_name}</Text>
        </View>
        <View style={ss.headerBtns}>
          <TouchableOpacity testID="join-by-code-btn" style={[ss.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => setShowCodeModal(true)}>
            <Ionicons name="keypad-outline" size={20} color={c.accent} />
          </TouchableOpacity>
          <TouchableOpacity testID="create-session-btn" style={[ss.createBtn, { backgroundColor: c.accent }]} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={20} color={c.onPrimary} />
            <Text style={[ss.createBtnText, { color: c.onPrimary }]}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filter */}
      <View style={ss.statusRow}>
        {['open', 'full'].map((s) => (
          <TouchableOpacity key={s} testID={`filter-${s}-btn`} style={[ss.statusPill, status === s ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]} onPress={() => setStatus(s)}>
            <Text style={[ss.statusText, { color: status === s ? c.onPrimary : c.textSecondary, fontWeight: status === s ? '800' : '500' }]}>{s === 'open' ? 'Open' : 'Full'}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity testID="filter-btn" style={[ss.filterPill, activeFilterCount > 0 ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? c.onPrimary : c.textSecondary} />
          {activeFilterCount > 0 && <View style={ss.filterBadge}><Text style={ss.filterBadgeText}>{activeFilterCount}</Text></View>}
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity testID="clear-filters-btn" onPress={() => { setFilterDate(''); setSelectedDate(new Date()); setLocationFilter(''); setSportFilter(''); }}>
            <Ionicons name="close-circle" size={22} color={c.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={ss.center}><ActivityIndicator size="large" color={c.accent} /></View>
      ) : sessions.length === 0 ? (
        <View style={ss.center}>
          <Ionicons name="football-outline" size={64} color={c.textMuted} />
          <Text style={[ss.emptyText, { color: c.textSecondary }]}>No sessions available</Text>
          <TouchableOpacity testID="create-empty-btn" style={[ss.emptyBtn, { backgroundColor: c.accent }]} onPress={() => setShowCreateModal(true)}>
            <Text style={[ss.emptyBtnText, { color: c.onPrimary }]}>Create one!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={sessions} renderItem={renderSession} keyExtractor={i => i.id.toString()} style={ss.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }} />
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal visible={showDetailsModal} session={selectedSession} participants={participants} onClose={() => { setShowDetailsModal(false); setSelectedSession(null); setParticipants([]); }} onActionComplete={fetchSessions} activeTab={null} userParticipation={userParticipation} venues={venues} user={user} />

      {/* Create Session Modal */}
      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => { setShowCreateModal(false); fetchSessions(); }}>
        <CreateSessionScreen navigation={{ goBack: () => { setShowCreateModal(false); fetchSessions(); }, navigate: () => { setShowCreateModal(false); fetchSessions(); } }} />
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.modalContent, { backgroundColor: c.surface }]}>
            <View style={ss.modalHeader}>
              <Text style={[ss.modalTitle, { color: c.text }]}>Filters</Text>
              <TouchableOpacity testID="close-filter-modal" onPress={() => setShowFilterModal(false)}><Ionicons name="close" size={28} color={c.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <Text style={[ss.filterLabel, { color: c.textSecondary }]}>DATE</Text>
              <View style={ss.filterRow}>
                <TouchableOpacity style={[ss.filterOption, { backgroundColor: filterDate ? c.accent + '20' : c.inputBg, borderColor: filterDate ? c.accent : c.inputBorder }]} onPress={() => setShowDatePicker(true)}>
                  <Text style={[ss.filterOptionText, { color: filterDate ? c.accent : c.textSecondary }]}>{filterDate ? formatDate(filterDate) : 'Any Date'}</Text>
                </TouchableOpacity>
                {filterDate && <TouchableOpacity onPress={() => { setFilterDate(''); setSelectedDate(new Date()); if (Platform.OS === 'ios') setShowDatePicker(false); }}><Ionicons name="close-circle" size={22} color={c.danger} /></TouchableOpacity>}
              </View>
              {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { handleDateChange(e, d); if (Platform.OS === 'android') setShowDatePicker(false); }} />}
              {Platform.OS === 'ios' && showDatePicker && <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: c.accent, fontWeight: '700', textAlign: 'right', marginTop: 8 }}>Done</Text></TouchableOpacity>}

              <Text style={[ss.filterLabel, { color: c.textSecondary }]}>LOCATION</Text>
              <TouchableOpacity style={[ss.dropdownTrigger, { backgroundColor: c.inputBg, borderColor: locationFilter ? c.accent : c.inputBorder }]} onPress={() => { setShowLocationPicker(!showLocationPicker); setShowSportPicker(false); }}>
                <Text style={[ss.dropdownText, { color: locationFilter ? c.text : c.textMuted }]} numberOfLines={1}>{locationFilter ? venues.find(v => v.address === locationFilter)?.name || locationFilter : 'All Locations'}</Text>
                <Ionicons name={showLocationPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
              </TouchableOpacity>
              {showLocationPicker && (
                <View style={[ss.dropdownList, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ScrollView nestedScrollEnabled bounces={false} style={{ maxHeight: 180 }}>
                    <TouchableOpacity style={[ss.dropdownItem, !locationFilter && { backgroundColor: c.accent + '20' }]} onPress={() => { setLocationFilter(''); setShowLocationPicker(false); }}><Text style={[ss.dropdownItemText, { color: !locationFilter ? c.accent : c.text }]}>All Locations</Text></TouchableOpacity>
                    {venues.map(v => (
                      <TouchableOpacity key={v.id} style={[ss.dropdownItem, locationFilter === v.address && { backgroundColor: c.accent + '20' }]} onPress={() => { setLocationFilter(v.address); setShowLocationPicker(false); }}>
                        <Text style={[ss.dropdownItemText, { color: locationFilter === v.address ? c.accent : c.text }]}>{v.name}</Text>
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{v.address}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={[ss.filterLabel, { color: c.textSecondary }]}>SPORT</Text>
              <TouchableOpacity style={[ss.dropdownTrigger, { backgroundColor: c.inputBg, borderColor: sportFilter ? c.accent : c.inputBorder }]} onPress={() => { setShowSportPicker(!showSportPicker); setShowLocationPicker(false); }}>
                <Text style={[ss.dropdownText, { color: sportFilter ? c.text : c.textMuted }]}>{sportFilter || 'All Sports'}</Text>
                <Ionicons name={showSportPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
              </TouchableOpacity>
              {showSportPicker && (
                <View style={[ss.dropdownList, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ScrollView nestedScrollEnabled bounces={false} style={{ maxHeight: 180 }}>
                    <TouchableOpacity style={[ss.dropdownItem, !sportFilter && { backgroundColor: c.accent + '20' }]} onPress={() => { setSportFilter(''); setShowSportPicker(false); }}><Text style={[ss.dropdownItemText, { color: !sportFilter ? c.accent : c.text }]}>All Sports</Text></TouchableOpacity>
                    {[...new Set(venues.flatMap(v => v.available_sports || []))].sort().map(sp => (
                      <TouchableOpacity key={sp} style={[ss.dropdownItem, sportFilter === sp && { backgroundColor: c.accent + '20' }]} onPress={() => { setSportFilter(sp); setShowSportPicker(false); }}>
                        <Text style={[ss.dropdownItemText, { color: sportFilter === sp ? c.accent : c.text }]}>{sp}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity testID="apply-filters-btn" style={[ss.applyBtn, { backgroundColor: c.accent }]} onPress={() => setShowFilterModal(false)}>
              <Text style={[ss.applyBtnText, { color: c.onPrimary }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join by Code Modal */}
      <Modal visible={showCodeModal} animationType="fade" transparent onRequestClose={() => { setShowCodeModal(false); setSessionCode(''); }}>
        <View style={[ss.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[ss.codeModal, { backgroundColor: c.surface }]}>
            <View style={[ss.codeIconWrap, { backgroundColor: c.accent }]}><Ionicons name="keypad" size={28} color="#000" /></View>
            <Text style={[ss.codeTitle, { color: c.text }]}>Join by Code</Text>
            <Text style={[ss.codeSubtitle, { color: c.textSecondary }]}>Enter the session invite code</Text>
            <TextInput testID="code-input" style={[ss.codeInput, { color: c.text, borderColor: c.accent, backgroundColor: c.inputBg }]} value={sessionCode} onChangeText={t => setSessionCode(t.toUpperCase())} placeholder="ABCDEF" placeholderTextColor={c.textMuted} autoCapitalize="characters" autoCorrect={false} maxLength={6} autoFocus />
            <View style={ss.codeBtns}>
              <TouchableOpacity testID="cancel-code-btn" style={[ss.codeCancelBtn, { borderColor: c.border }]} onPress={() => { setShowCodeModal(false); setSessionCode(''); }}>
                <Text style={[ss.codeCancelText, { color: c.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="find-session-btn" style={[ss.codeFindBtn, { backgroundColor: c.accent }, codeSearchLoading && { opacity: 0.6 }]} onPress={handleJoinByCode} disabled={codeSearchLoading}>
                <Text style={[ss.codeFindText, { color: c.onPrimary }]}>{codeSearchLoading ? 'Finding...' : 'Find'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CardContent = ({ item, c, isJoined, theme }) => (
  <View>
    <View style={ss.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[ss.cardTitle, { color: '#fff' }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[ss.cardLocation, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{item.location_address}</Text>
      </View>
      <View style={[ss.statusChip, item.status === 'full' ? { backgroundColor: 'rgba(255,69,58,0.9)' } : item.status === 'completed' ? { backgroundColor: 'rgba(100,100,100,0.9)' } : { backgroundColor: 'rgba(74,222,128,0.9)' }]}>
        <Text style={ss.statusChipText}>{item.status === 'completed' ? 'DONE' : item.status.toUpperCase()}</Text>
      </View>
    </View>
    <View style={ss.cardStats}>
      <View style={ss.statItem}><Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" /><Text style={ss.statText}>{formatDateTime(item.scheduled_date)}</Text></View>
      <View style={ss.statItem}><Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" /><Text style={ss.statText}>{item.scheduled_time ? formatTime(item.scheduled_time) : ''}</Text></View>
      <View style={ss.statItem}><Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.7)" /><Text style={ss.statText}>{'\u20B9'}{parseFloat(item.total_cost).toFixed(0)}</Text></View>
      <View style={ss.statItem}><Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.7)" /><Text style={ss.statText}>{item.participant_count}/{item.max_participants}</Text></View>
    </View>
    {isJoined && <View style={[ss.joinedBadge, { backgroundColor: c.accent }]}><Text style={[ss.joinedBadgeText, { color: c.onPrimary }]}>JOINED</Text></View>}
  </View>
);

const ss = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  createBtn: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 16, borderRadius: 9999, gap: 6 },
  createBtnText: { fontSize: 14, fontWeight: '800' },
  statusRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8, alignItems: 'center' },
  statusPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999 },
  statusText: { fontSize: 13, letterSpacing: 0.3 },
  filterPill: { width: 44, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF453A', alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 },
  emptyBtnText: { fontSize: 14, fontWeight: '800' },
  list: { flex: 1 },
  card: { borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  cardBg: { minHeight: 160 },
  cardBgImg: { opacity: 0.5, borderRadius: 20 },
  cardOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.45)', minHeight: 160, justifyContent: 'space-between' },
  cardInner: { padding: 16, backgroundColor: 'rgba(0,0,0,0.7)', minHeight: 160, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  cardLocation: { fontSize: 13, marginTop: 4 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusChipText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  joinedBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
  joinedBadgeText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  filterLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  filterOptionText: { fontSize: 14, fontWeight: '600' },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
  dropdownText: { fontSize: 14, flex: 1 },
  dropdownList: { borderRadius: 12, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.2)' },
  dropdownItemText: { fontSize: 14, fontWeight: '500' },
  applyBtn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  applyBtnText: { fontSize: 16, fontWeight: '800' },
  codeModal: { margin: 24, borderRadius: 28, padding: 28, alignItems: 'center' },
  codeIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  codeTitle: { fontSize: 22, fontWeight: '800' },
  codeSubtitle: { fontSize: 14, marginTop: 8, marginBottom: 24 },
  codeInput: { width: '100%', borderWidth: 2, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, fontSize: 22, letterSpacing: 6, textAlign: 'center', marginBottom: 24 },
  codeBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  codeCancelBtn: { flex: 1, height: 48, borderRadius: 9999, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  codeCancelText: { fontSize: 15, fontWeight: '600' },
  codeFindBtn: { flex: 1, height: 48, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  codeFindText: { fontSize: 15, fontWeight: '800' },
});

export default SessionsListScreen;
