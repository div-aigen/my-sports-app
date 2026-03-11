import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI, venueAPI } from '../../../services/api';
import { formatDateTime, formatTime } from '../../../utils/dateTimeUtils';
import SessionDetailsModal from '../../components/sessions/SessionDetailsModal';

const MySessionsScreen = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState('joined');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [venues, setVenues] = useState([]);
  const [userParticipation, setUserParticipation] = useState({});
  const [joinedCount, setJoinedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  useFocusEffect(useCallback(() => { fetchSessions(); venueAPI.list().then(r => setVenues(r.data.venues || [])).catch(() => {}); }, [activeTab]));

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [openRes, fullRes, completedRes] = await Promise.all([
        sessionAPI.list(1, 50, 'open'),
        sessionAPI.list(1, 50, 'full'),
        sessionAPI.list(1, 50, 'completed'),
      ]);
      const allSessions = [
        ...(openRes.data.sessions || []),
        ...(fullRes.data.sessions || []),
        ...(completedRes.data.sessions || []),
      ];

      const ps = {};
      await Promise.all(allSessions.map(async (s) => {
        try { const r = await sessionAPI.getParticipants(s.id); ps[s.id] = r.data.participants.some(p => p.user_id === user.id); } catch { ps[s.id] = false; }
      }));

      const activeSessions = allSessions.filter(s => s.status !== 'completed');
      const joined = activeSessions.filter(s => ps[s.id]);
      const created = activeSessions.filter(s => s.creator_id === user.id);
      const done = allSessions.filter(s => s.status === 'completed' && ps[s.id]);

      setJoinedCount(joined.length);
      setCreatedCount(created.length);
      setDoneCount(done.length);
      setUserParticipation(ps);

      if (activeTab === 'joined') setSessions(joined);
      else if (activeTab === 'created') setSessions(created);
      else setSessions(done);
    } catch { Alert.alert('Error', 'Failed to fetch sessions'); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchSessions(); setRefreshing(false); };

  const handleShowDetails = async (session) => {
    setSelectedSession(session); setShowDetailsModal(true);
    try { const r = await sessionAPI.getParticipants(session.id); setParticipants(r.data.participants); } catch {}
  };

  const venueBackgrounds = {
    'Yolo Sports Arena': require('../../../assets/images/yolo_gaming_arena.png'),
    'Puff N Play Sports Arena': require('../../../assets/images/aishbagh_sports_complex.jpg'),
    'D & C Sports Turf': require('../../../assets/images/central_stadium.png'),
    'The Urban Turf': require('../../../assets/images/jai_pakash_park.png'),
    'Dugout Sports Arena': require('../../../assets/images/ram_manohar.png'),
  };
  const getVenueBackground = (loc) => { for (const [name, img] of Object.entries(venueBackgrounds)) { if (loc && loc.includes(name)) return img; } return null; };

  const tabCounts = { joined: joinedCount, created: createdCount, done: doneCount };
  const tabs = [
    { key: 'joined', label: 'Joined', icon: 'people' },
    { key: 'created', label: 'Created', icon: 'flash' },
    { key: 'done', label: 'Done', icon: 'checkmark-circle' },
  ];

  const renderSession = ({ item }) => {
    const bg = getVenueBackground(item.location_address);
    return (
      <TouchableOpacity testID={`my-session-card-${item.id}`} style={[ss.card, { borderColor: c.border }]} onPress={() => handleShowDetails(item)} activeOpacity={0.8}>
        {bg ? (
          <ImageBackground source={bg} style={ss.cardBg} imageStyle={ss.cardBgImg}>
            <View style={ss.cardOverlay}>
              <Text style={ss.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={ss.cardSub} numberOfLines={1}>{item.location_address}</Text>
              <View style={ss.cardRow}>
                <View style={ss.cardStat}><Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={ss.cardStatText}>{formatDateTime(item.scheduled_date)}</Text></View>
                <View style={ss.cardStat}><Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={ss.cardStatText}>{formatTime(item.scheduled_time)}</Text></View>
                <View style={ss.cardStat}><Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={ss.cardStatText}>{item.participant_count}/{item.max_participants}</Text></View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[ss.cardPlain, { backgroundColor: c.surface }]}>
            <Text style={[ss.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[ss.cardSub, { color: c.textSecondary }]} numberOfLines={1}>{item.location_address}</Text>
            <View style={ss.cardRow}>
              <View style={ss.cardStat}><Ionicons name="calendar-outline" size={13} color={c.textMuted} /><Text style={[ss.cardStatText, { color: c.textSecondary }]}>{formatDateTime(item.scheduled_date)}</Text></View>
              <View style={ss.cardStat}><Ionicons name="time-outline" size={13} color={c.textMuted} /><Text style={[ss.cardStatText, { color: c.textSecondary }]}>{formatTime(item.scheduled_time)}</Text></View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View testID="my-sessions-screen" style={[ss.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={[ss.header, { borderBottomColor: c.border }]}>
        <Text style={[ss.title2, { color: c.text }]}>My Games</Text>
      </View>
      <View style={ss.tabRow}>{tabs.map(t => (
        <TouchableOpacity key={t.key} testID={`tab-${t.key}`} style={[ss.tab, activeTab === t.key ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]} onPress={() => setActiveTab(t.key)}>
          <Ionicons name={activeTab === t.key ? t.icon : `${t.icon}-outline`} size={16} color={activeTab === t.key ? c.onPrimary : c.textSecondary} />
          <Text style={[ss.tabText, { color: activeTab === t.key ? c.onPrimary : c.textSecondary, fontWeight: activeTab === t.key ? '800' : '500' }]}>{t.label}</Text>
          {tabCounts[t.key] > 0 && <View style={[ss.badge, { backgroundColor: activeTab === t.key ? 'rgba(0,0,0,0.2)' : c.accent }]}><Text style={[ss.badgeText, { color: activeTab === t.key ? c.onPrimary : c.onPrimary }]}>{tabCounts[t.key]}</Text></View>}
        </TouchableOpacity>
      ))}</View>

      {loading ? <View style={ss.center}><ActivityIndicator size="large" color={c.accent} /></View> : sessions.length === 0 ? (
        <View style={ss.center}>
          <Ionicons name={activeTab === 'joined' ? 'people-outline' : activeTab === 'created' ? 'flash-outline' : 'checkmark-circle-outline'} size={64} color={c.textMuted} />
          <Text style={[ss.emptyText, { color: c.textSecondary }]}>No {activeTab} sessions</Text>
        </View>
      ) : (
        <FlatList data={sessions} renderItem={renderSession} keyExtractor={i => i.id.toString()} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }} />
      )}
      <SessionDetailsModal visible={showDetailsModal} session={selectedSession} participants={participants} onClose={() => { setShowDetailsModal(false); setSelectedSession(null); setParticipants([]); }} onActionComplete={fetchSessions} activeTab={activeTab} userParticipation={userParticipation} venues={venues} user={user} />
    </View>
  );
};

const ss = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title2: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 9999, gap: 5 },
  tabText: { fontSize: 13, letterSpacing: 0.3 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  cardBg: { minHeight: 130 }, cardBgImg: { opacity: 0.5, borderRadius: 20 },
  cardOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.45)', minHeight: 130, justifyContent: 'center' },
  cardPlain: { padding: 16, minHeight: 130, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});

export default MySessionsScreen;
