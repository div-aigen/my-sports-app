import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, ActivityIndicator, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI } from '../../../services/api';
import { formatDateTime, formatTime, formatEndTimeWithDate } from '../../../utils/dateTimeUtils';
import { checkUserTimeConflict } from '../../../utils/sessionUtils';

const SessionDetailsModal = ({ visible, session, participants, onClose, onActionComplete, activeTab, userParticipation, venues, user: propUser }) => {
  const { user: ctxUser } = useContext(AuthContext);
  const theme = useTheme();
  const c = theme.colors;
  const user = propUser || ctxUser;
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  if (!session) return null;

  const mapsUrl = venues?.find(v => v.address === session?.location_address)?.maps_url;

  const isCreator = session.creator_id === user?.id;
  const isJoined = userParticipation?.[session.id] || participants.some(p => p.user_id === user?.id);
  const isFull = session.status === 'full';
  const isCompleted = session.status === 'completed';
  const costPerPerson = session.participant_count > 0 ? (parseFloat(session.total_cost) / session.participant_count).toFixed(0) : 0;

  const handleJoin = async () => {
    setLoading(true);
    try {
      const conflict = await checkUserTimeConflict(user.id, session);
      if (conflict.hasConflict) { Alert.alert('Time Conflict', `Overlaps with "${conflict.conflictingSession.title}"`); setLoading(false); return; }
      await sessionAPI.join(session.id);
      Alert.alert('Joined!', 'You have joined the session.');
      onActionComplete?.(); onClose();
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to join session'); }
    finally { setLoading(false); }
  };

  const handleLeave = async () => {
    Alert.alert('Leave Session', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Leave', style: 'destructive', onPress: async () => {
      setLoading(true);
      try { await sessionAPI.leave(session.id); onActionComplete?.(); onClose(); }
      catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to leave session'); }
      finally { setLoading(false); }
    }}]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Session', 'This will cancel the session for all participants.', [{ text: 'Keep', style: 'cancel' }, { text: 'Cancel Session', style: 'destructive', onPress: async () => {
      setLoading(true);
      try { await sessionAPI.cancel(session.id); onActionComplete?.(); onClose(); }
      catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to cancel session'); }
      finally { setLoading(false); }
    }}]);
  };

  const handleShare = async () => {
    try {
      const url = `https://lineup-sports.in/sessions/${session.session_id}`;
      await Share.share({ message: `Join my session "${session.title}" on Lineup!\n\nCode: ${session.invite_code}\n${url}` });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[ss.overlay, { backgroundColor: c.overlay }]}>
        <View style={[ss.container, { backgroundColor: c.surface }]}>
          {/* Header */}
          <View style={ss.header}>
            <View style={{ flex: 1 }}>
              <Text style={[ss.title, { color: c.text }]}>{session.title}</Text>
              {session.sport_type && <View style={[ss.sportBadge, { backgroundColor: c.accent + '20' }]}><Text style={[ss.sportBadgeText, { color: c.accent }]}>{session.sport_type}</Text></View>}
            </View>
            <TouchableOpacity testID="close-details-modal" onPress={onClose} style={[ss.closeBtn, { backgroundColor: c.inputBg }]}><Ionicons name="close" size={22} color={c.text} /></TouchableOpacity>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={ss.scrollContent}>
            {/* Info Grid */}
            <View style={ss.infoGrid}>
              {mapsUrl ? (
                <TouchableOpacity style={[ss.infoCard, { backgroundColor: c.inputBg, borderColor: 'transparent' }]} onPress={() => Linking.openURL(mapsUrl)} activeOpacity={0.7}>
                  <View style={ss.infoCardTop}><Ionicons name="location-outline" size={16} color={c.textMuted} /><Text style={[ss.infoLabel, { color: c.textMuted }]}>Venue</Text></View>
                  <Text style={[ss.infoValue, { color: c.text }]} numberOfLines={2}>{session.location_address}</Text>
                  <Text style={[ss.mapsLink, { color: c.accent }]}>Open in Maps ↗</Text>
                </TouchableOpacity>
              ) : (
                <InfoCard icon="location-outline" label="Venue" value={session.location_address} c={c} />
              )}
              <InfoCard icon="calendar-outline" label="Date" value={formatDateTime(session.scheduled_date)} c={c} />
              <InfoCard icon="time-outline" label="Time" value={`${formatTime(session.scheduled_time)}${session.scheduled_end_time ? ` - ${formatEndTimeWithDate(session.scheduled_time, session.scheduled_end_time, session.scheduled_date)}` : ''}`} c={c} />
              <InfoCard icon="people-outline" label="Players" value={`${session.participant_count} / ${session.max_participants}`} c={c} />
              <InfoCard icon="cash-outline" label="Total Cost" value={`\u20B9${parseFloat(session.total_cost).toFixed(0)}`} c={c} />
              <InfoCard icon="calculator-outline" label="Per Person" value={`\u20B9${costPerPerson}`} c={c} highlight />
            </View>

            {session.description ? <Text style={[ss.desc, { color: c.textSecondary }]}>{session.description}</Text> : null}

            {/* Invite Code */}
            {session.invite_code && (
              <View style={[ss.codeSection, { backgroundColor: c.accent + '10', borderColor: c.accent + '30' }]}>
                <View>
                  <Text style={[ss.codeSectionLabel, { color: c.textSecondary }]}>INVITE CODE</Text>
                  <Text style={[ss.codeText, { color: c.accent }]}>{session.invite_code}</Text>
                </View>
                <TouchableOpacity testID="share-session-btn" style={[ss.shareBtn, { backgroundColor: c.accent }]} onPress={handleShare}>
                  <Ionicons name="share-outline" size={18} color={c.onPrimary} />
                  <Text style={[ss.shareBtnText, { color: c.onPrimary }]}>Share</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Participants */}
            <Text style={[ss.sectionLabel, { color: c.textSecondary }]}>PLAYERS ({participants.length})</Text>
            <View style={[ss.participantsList, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              {participants.length === 0 ? (
                <Text style={[ss.noParticipants, { color: c.textMuted }]}>No players yet - be the first!</Text>
              ) : (
                participants.map((p, i) => (
                  <View key={p.user_id || i} style={[ss.participantRow, i < participants.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
                    <View style={[ss.participantAvatar, { backgroundColor: c.accent }]}>
                      <Text style={[ss.participantInitial, { color: c.onPrimary }]}>{p.full_name?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ss.participantName, { color: c.text }]}>{p.full_name}{p.user_id === user?.id ? ' (You)' : ''}</Text>
                      {p.user_id === session.creator_id && <Text style={[ss.creatorTag, { color: c.accent }]}>Host</Text>}
                    </View>
                    <Text style={[ss.participantCost, { color: c.textSecondary }]}>{'\u20B9'}{costPerPerson}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          {!isCompleted && (
            <View style={[ss.actions, { borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
              {isCreator ? (
                <View style={{ gap: 10 }}>
                  <TouchableOpacity testID="leave-session-btn" style={[ss.actionBtn, { backgroundColor: c.inputBg }]} onPress={handleLeave} disabled={loading}>
                    {loading ? <ActivityIndicator color={c.text} /> : <><Ionicons name="exit-outline" size={20} color={c.text} /><Text style={[ss.actionBtnTextMuted, { color: c.text }]}>Leave Session</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity testID="cancel-session-btn" style={[ss.actionBtn, { backgroundColor: c.danger }]} onPress={handleCancel} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="close-circle-outline" size={20} color="#fff" /><Text style={ss.actionBtnTextWhite}>Cancel Session</Text></>}
                  </TouchableOpacity>
                </View>
              ) : isJoined ? (
                <TouchableOpacity testID="leave-session-btn" style={[ss.actionBtn, { backgroundColor: c.danger }]} onPress={handleLeave} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="exit-outline" size={20} color="#fff" /><Text style={ss.actionBtnTextWhite}>Leave Session</Text></>}
                </TouchableOpacity>
              ) : !isFull ? (
                <TouchableOpacity testID="join-session-btn" style={[ss.actionBtn, { backgroundColor: c.accent }]} onPress={handleJoin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#000" /> : <><Ionicons name="flash" size={20} color="#000" /><Text style={[ss.actionBtnTextDark]}>Join Session</Text></>}
                </TouchableOpacity>
              ) : (
                <View style={[ss.actionBtn, { backgroundColor: c.inputBg }]}>
                  <Ionicons name="lock-closed" size={20} color={c.textMuted} />
                  <Text style={[ss.actionBtnTextMuted, { color: c.textMuted }]}>Session Full</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const InfoCard = ({ icon, label, value, c, highlight }) => (
  <View style={[ss.infoCard, { backgroundColor: highlight ? c.accent + '15' : c.inputBg, borderColor: highlight ? c.accent + '30' : 'transparent' }]}>
    <View style={ss.infoCardTop}>
      <Ionicons name={icon} size={16} color={highlight ? c.accent : c.textMuted} />
      <Text style={[ss.infoLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
    <Text style={[ss.infoValue, { color: highlight ? c.accent : c.text }]} numberOfLines={2}>{value}</Text>
  </View>
);

const ss = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, gap: 12 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  sportBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  sportBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 16 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  infoCard: { width: '48%', borderRadius: 14, padding: 12, borderWidth: 1 },
  infoCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  mapsLink: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  desc: { fontSize: 14, lineHeight: 20, marginTop: 16 },
  codeSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16, borderWidth: 1 },
  codeSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  codeText: { fontSize: 22, fontWeight: '900', letterSpacing: 3, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999, gap: 6 },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  participantsList: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  noParticipants: { padding: 20, textAlign: 'center', fontSize: 14 },
  participantRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  participantAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  participantInitial: { fontSize: 15, fontWeight: '800' },
  participantName: { fontSize: 14, fontWeight: '600' },
  creatorTag: { fontSize: 11, fontWeight: '700' },
  participantCost: { fontSize: 13, fontWeight: '600' },
  actions: { padding: 24, borderTopWidth: 1 },
  actionBtn: { flexDirection: 'row', height: 56, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnTextWhite: { color: '#fff', fontSize: 16, fontWeight: '800' },
  actionBtnTextDark: { color: '#000', fontSize: 16, fontWeight: '800' },
  actionBtnTextMuted: { fontSize: 16, fontWeight: '700' },
});

export default SessionDetailsModal;
