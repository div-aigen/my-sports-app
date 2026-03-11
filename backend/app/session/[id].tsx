import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Share, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sessionAPI } from '../../services/api';
import { formatDateTime, formatTime, formatEndTimeWithDate } from '../../utils/dateTimeUtils';
import { checkUserTimeConflict } from '../../utils/sessionUtils';
import LoginScreen from '../screens/auth/LoginScreen';

export default function SessionDetailPage() {
  const { id } = useLocalSearchParams();
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { if (token && user) fetchSession(); }, [id, token, user]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      let res;
      try { res = await sessionAPI.get(id); } catch { res = await sessionAPI.getByCode(id); }
      setSession(res.data.session);
      const pRes = await sessionAPI.getParticipants(res.data.session.id);
      setParticipants(pRes.data.participants);
    } catch { Alert.alert('Error', 'Session not found'); }
    finally { setLoading(false); }
  };

  if (authLoading) return <View style={[ss.center, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.accent} /></View>;
  if (!token || !user) return <LoginScreen />;
  if (loading) return <View style={[ss.center, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.accent} /></View>;
  if (!session) return <View style={[ss.center, { backgroundColor: c.background }]}><Text style={{ color: c.textSecondary }}>Session not found</Text></View>;

  const isJoined = participants.some(p => p.user_id === user?.id);
  const isCreator = session.creator_id === user?.id;
  const isFull = session.status === 'full';
  const isCompleted = session.status === 'completed';
  const costPerPerson = session.participant_count > 0 ? (parseFloat(session.total_cost) / session.participant_count).toFixed(0) : 0;

  const handleJoin = async () => {
    if (!token) { Alert.alert('Sign In Required', 'Please sign in to join this session.'); return; }
    setActionLoading(true);
    try {
      const conflict = await checkUserTimeConflict(user.id, session);
      if (conflict.hasConflict) { Alert.alert('Time Conflict', `Overlaps with "${conflict.conflictingSession.title}"`); return; }
      await sessionAPI.join(session.id);
      Alert.alert('Joined!', 'You have joined the session.'); fetchSession();
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to join'); }
    finally { setActionLoading(false); }
  };

  const handleLeave = () => { Alert.alert('Leave Session', 'Sure?', [{ text: 'Cancel' }, { text: 'Leave', style: 'destructive', onPress: async () => { setActionLoading(true); try { await sessionAPI.leave(session.id); fetchSession(); } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); } finally { setActionLoading(false); } } }]); };
  const handleCancel = () => { Alert.alert('Cancel Session', 'Cancel for all?', [{ text: 'Keep' }, { text: 'Cancel', style: 'destructive', onPress: async () => { setActionLoading(true); try { await sessionAPI.cancel(session.id); router.back(); } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); } finally { setActionLoading(false); } } }]); };
  const handleShare = async () => { try { await Share.share({ message: `Join "${session.title}" on Lineup!\n\nCode: ${session.invite_code}\nhttps://lineup-sports.in/sessions/${session.session_id}` }); } catch {} };

  const venueBackgrounds = {
    'Yolo Sports Arena': require('../../assets/images/yolo_gaming_arena.png'),
    'Puff N Play Sports Arena': require('../../assets/images/aishbagh_sports_complex.jpg'),
    'D & C Sports Turf': require('../../assets/images/central_stadium.png'),
    'The Urban Turf': require('../../assets/images/jai_pakash_park.png'),
    'Dugout Sports Arena': require('../../assets/images/ram_manohar.png'),
  };
  const getVenueBg = (loc) => { for (const [name, img] of Object.entries(venueBackgrounds)) { if (loc?.includes(name)) return img; } return null; };
  const bg = getVenueBg(session.location_address);

  return (
    <View testID="session-detail-page" style={[ss.container, { backgroundColor: c.background }]}>
      <View style={[ss.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity testID="back-btn" style={[ss.backBtn, { backgroundColor: c.surface }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity testID="share-btn" style={[ss.backBtn, { backgroundColor: c.surface }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={c.accent} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        {bg ? (
          <ImageBackground source={bg} style={ss.heroBg} imageStyle={{ borderRadius: 20 }}>
            <View style={ss.heroOverlay}>
              <Text style={ss.heroTitle}>{session.title}</Text>
              {session.sport_type && <View style={[ss.sportTag, { backgroundColor: c.accent }]}><Text style={[ss.sportTagText, { color: c.onPrimary }]}>{session.sport_type}</Text></View>}
            </View>
          </ImageBackground>
        ) : (
          <View style={[ss.heroPlain, { backgroundColor: c.surface }]}>
            <Text style={[ss.heroTitle, { color: c.text }]}>{session.title}</Text>
            {session.sport_type && <View style={[ss.sportTag, { backgroundColor: c.accent }]}><Text style={[ss.sportTagText, { color: c.onPrimary }]}>{session.sport_type}</Text></View>}
          </View>
        )}

        <View style={ss.infoGrid}>
          {[
            { icon: 'location-outline', label: 'Venue', value: session.location_address },
            { icon: 'calendar-outline', label: 'Date', value: formatDateTime(session.scheduled_date) },
            { icon: 'time-outline', label: 'Time', value: `${formatTime(session.scheduled_time)}${session.scheduled_end_time ? ` - ${formatEndTimeWithDate(session.scheduled_time, session.scheduled_end_time, session.scheduled_date)}` : ''}` },
            { icon: 'people-outline', label: 'Players', value: `${session.participant_count}/${session.max_participants}` },
            { icon: 'cash-outline', label: 'Total', value: `\u20B9${parseFloat(session.total_cost).toFixed(0)}` },
            { icon: 'calculator-outline', label: 'Per Person', value: `\u20B9${costPerPerson}`, highlight: true },
          ].map((i, idx) => (
            <View key={idx} style={[ss.infoCard, { backgroundColor: i.highlight ? c.accent + '15' : c.surface, borderColor: i.highlight ? c.accent + '30' : c.border }]}>
              <View style={ss.infoTop}><Ionicons name={i.icon} size={16} color={i.highlight ? c.accent : c.textMuted} /><Text style={[ss.infoLabel, { color: c.textMuted }]}>{i.label}</Text></View>
              <Text style={[ss.infoValue, { color: i.highlight ? c.accent : c.text }]} numberOfLines={2}>{i.value}</Text>
            </View>
          ))}
        </View>

        {session.invite_code && (
          <View style={[ss.codeCard, { backgroundColor: c.accent + '10', borderColor: c.accent + '30' }]}>
            <View><Text style={[ss.codeLabel, { color: c.textSecondary }]}>INVITE CODE</Text><Text style={[ss.codeVal, { color: c.accent }]}>{session.invite_code}</Text></View>
            <TouchableOpacity style={[ss.sharePill, { backgroundColor: c.accent }]} onPress={handleShare}><Ionicons name="share-outline" size={16} color="#000" /><Text style={ss.sharePillText}>Share</Text></TouchableOpacity>
          </View>
        )}

        <Text style={[ss.secLabel, { color: c.textSecondary }]}>PLAYERS ({participants.length})</Text>
        <View style={[ss.playersList, { backgroundColor: c.surface, borderColor: c.border }]}>
          {participants.map((p, i) => (
            <View key={p.user_id || i} style={[ss.playerRow, i < participants.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
              <View style={[ss.playerAv, { backgroundColor: c.accent }]}><Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>{p.full_name?.[0]?.toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}><Text style={[ss.playerName, { color: c.text }]}>{p.full_name}{p.user_id === user?.id ? ' (You)' : ''}</Text>{p.user_id === session.creator_id && <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>Host</Text>}</View>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>{'\u20B9'}{costPerPerson}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      {!isCompleted && (
        <View style={[ss.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: insets.bottom + 16 }]}>
          {isCreator ? <TouchableOpacity testID="cancel-btn" style={[ss.fullBtn, { backgroundColor: c.danger }]} onPress={handleCancel}>{actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={ss.btnW}>Cancel Session</Text>}</TouchableOpacity>
          : isJoined ? <TouchableOpacity testID="leave-btn" style={[ss.fullBtn, { backgroundColor: c.danger }]} onPress={handleLeave}>{actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={ss.btnW}>Leave Session</Text>}</TouchableOpacity>
          : !isFull ? <TouchableOpacity testID="join-btn" style={[ss.fullBtn, { backgroundColor: c.accent }]} onPress={handleJoin}>{actionLoading ? <ActivityIndicator color="#000" /> : <Text style={ss.btnD}>Join Session</Text>}</TouchableOpacity>
          : <View style={[ss.fullBtn, { backgroundColor: c.inputBg }]}><Text style={[ss.btnM, { color: c.textMuted }]}>Session Full</Text></View>}
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 100, paddingBottom: 120 },
  heroBg: { height: 180, borderRadius: 20, overflow: 'hidden' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, justifyContent: 'flex-end' },
  heroPlain: { height: 140, borderRadius: 20, padding: 20, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  sportTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  sportTagText: { fontSize: 12, fontWeight: '800', color: '#000' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  infoCard: { width: '48%', borderRadius: 14, padding: 12, borderWidth: 1 },
  infoTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  codeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16, borderWidth: 1 },
  codeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  codeVal: { fontSize: 22, fontWeight: '900', letterSpacing: 3, marginTop: 2 },
  sharePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, gap: 6 },
  sharePillText: { fontSize: 13, fontWeight: '700', color: '#000' },
  secLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  playersList: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  playerAv: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playerName: { fontSize: 14, fontWeight: '600' },
  bottomBar: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  fullBtn: { height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  btnW: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnD: { color: '#000', fontSize: 16, fontWeight: '800' },
  btnM: { fontSize: 16, fontWeight: '700' },
});
