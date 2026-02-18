import React, { useState } from 'react';
import {
  Share,
  Linking,
  Modal,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styles from './SessionDetailsModal.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { sessionAPI } from '../../../services/api';
import { formatTime, formatDateTime, formatEndTimeWithDate } from '../../../utils/dateTimeUtils';
import { checkUserTimeConflict } from '../../../utils/sessionUtils';

/**
 * SessionDetailsModal
 *
 * Props:
 *   visible          {bool}    - whether the modal is visible
 *   session          {object}  - the selected session object
 *   participants     {array}   - array of participant objects for this session
 *   onClose          {func}    - called when the modal should close
 *   onActionComplete {func}    - called after join/leave/cancel completes so the
 *                                parent can refresh its data
 *   activeTab        {string|null} - 'joined' | 'created' | null
 *                                   Used by MySessionsScreen; pass null from
 *                                   SessionsListScreen.
 *   userParticipation {object|null} - map of sessionId -> bool indicating whether
 *                                     the current user has joined each session.
 *                                     Used by SessionsListScreen; pass null from
 *                                     MySessionsScreen.
 *   venues           {array}   - list of venue objects (for maps URL lookup)
 *   user             {object}  - the current authenticated user
 */
const SessionDetailsModal = ({
  visible,
  session,
  participants,
  onClose,
  onActionComplete,
  activeTab,
  userParticipation,
  venues,
  user,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [modalActionLoading, setModalActionLoading] = useState(false);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleJoinSession = async (sessionId, sessionTitle, targetSession) => {
    try {
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
      if (onActionComplete) onActionComplete();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join session');
    }
  };

  const handleLeaveSession = (sessionId, sessionTitle) => {
    Alert.alert(
      'Leave Session',
      `Are you sure you want to leave "${sessionTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionAPI.leave(sessionId);
              Alert.alert('Success', `Left ${sessionTitle}`);
              if (onActionComplete) onActionComplete();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to leave session');
            }
          },
        },
      ]
    );
  };

  const handleCancelSession = (sessionId, sessionTitle) => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to cancel "${sessionTitle}"? This will remove the session for all participants.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionAPI.cancel(sessionId);
              Alert.alert('Success', `Cancelled ${sessionTitle}`);
              if (onActionComplete) onActionComplete();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const handleShareSession = async () => {
    if (!session) return;
    try {
      const sessionLink = `sportsapp://session/${session.session_id}`;
      const message =
        `🏆 Join my ${session.title} session!\n\n` +
        `📅 Date: ${formatDateTime(session.scheduled_date)}\n` +
        `🕐 Time: ${formatTime(session.scheduled_time)}\n` +
        `📍 Location: ${session.location_address}\n` +
        `👥 Spots: ${session.participant_count}/${session.max_participants}\n` +
        `💰 Cost: ₹${session.total_cost}\n\n` +
        `🔑 Invite Code: ${session.invite_code}\n` +
        `(Open the app → "Join by Code" → enter the code above)\n\n` +
        `📱 Or tap this link:\n${sessionLink}`;

      const result = await Share.share(
        { message, title: `Join ${session.title}` },
        { dialogTitle: 'Invite friends to join' }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('Session shared successfully');
        }
      }
    } catch (err) {
      console.error('Error sharing session:', err);
      Alert.alert('Error', 'Failed to share session');
    }
  };

  // ── Determine which action button to render ────────────────────────────────
  //
  // Two usage modes:
  //
  // 1. SessionsListScreen (activeTab === null, userParticipation is a map):
  //    - Creator  → "Cancel Session"
  //    - Joined   → "Leave Session"
  //    - Neither  → "Join Session" (with loading state + inline participant refresh)
  //
  // 2. MySessionsScreen (activeTab is 'joined' | 'created', userParticipation is null):
  //    - 'created' → "Cancel Session" (closes modal first)
  //    - 'joined'  → "Leave Session"  (closes modal first)

  const renderActionButton = () => {
    if (!session) return null;
    if (session.status === 'completed') return null;

    // ── MySessionsScreen mode ──────────────────────────────────────────────
    if (activeTab !== null && activeTab !== undefined) {
      if (activeTab === 'created') {
        return (
          <TouchableOpacity
            style={[styles.modalActionButton, styles.modalCancelButton]}
            onPress={() => {
              onClose();
              handleCancelSession(session.id, session.title);
            }}
          >
            <Text style={styles.modalActionButtonText}>Cancel Session</Text>
          </TouchableOpacity>
        );
      }
      // activeTab === 'joined'
      return (
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalLeaveButton]}
          onPress={() => {
            onClose();
            handleLeaveSession(session.id, session.title);
          }}
        >
          <Text style={styles.modalActionButtonText}>Leave Session</Text>
        </TouchableOpacity>
      );
    }

    // ── SessionsListScreen mode ────────────────────────────────────────────
    const isCreator = session.creator_id === user.id;
    const isJoined = userParticipation ? userParticipation[session.id] : false;
    const isFull = session.status === 'full';

    if (isCreator) {
      return (
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalCancelButton, modalActionLoading && styles.buttonDisabled]}
          onPress={() => handleCancelSession(session.id, session.title)}
          disabled={modalActionLoading}
        >
          <Text style={styles.modalActionButtonText}>Cancel Session</Text>
        </TouchableOpacity>
      );
    }

    if (isJoined) {
      return (
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalLeaveButton, modalActionLoading && styles.buttonDisabled]}
          onPress={() => handleLeaveSession(session.id, session.title)}
          disabled={modalActionLoading}
        >
          <Text style={styles.modalActionButtonText}>
            {modalActionLoading ? 'Leaving...' : 'Leave Session'}
          </Text>
        </TouchableOpacity>
      );
    }

    // Not joined, not creator
    return (
      <TouchableOpacity
        style={[styles.modalActionButton, styles.modalJoinButton, (isFull || modalActionLoading) && styles.buttonDisabled]}
        onPress={async () => {
          setModalActionLoading(true);
          await handleJoinSession(session.id, session.title, session);
          setModalActionLoading(false);
        }}
        disabled={isFull || modalActionLoading}
      >
        <Text style={styles.modalActionButtonText}>
          {modalActionLoading ? 'Joining...' : isFull ? 'Session Full' : 'Join Session'}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const mapsUrl = venues
    ? venues.find(v => v.address === session?.location_address)?.maps_url
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{session?.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          >
            {/* Info grid */}
            <View style={styles.infoGrid}>
              {mapsUrl ? (
                <TouchableOpacity
                  style={[styles.infoCard, styles.infoCardTappable]}
                  onPress={() => Linking.openURL(mapsUrl)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.infoCardLabel}>📍 Location</Text>
                  <Text style={styles.infoCardValue}>{session?.location_address}</Text>
                  <Text style={styles.mapsLinkText}>Open in Maps ↗</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>📍 Location</Text>
                  <Text style={styles.infoCardValue}>{session?.location_address}</Text>
                </View>
              )}

              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>📅 Date</Text>
                <Text style={styles.infoCardValue}>
                  {session?.scheduled_date ? formatDateTime(session.scheduled_date) : ''}
                </Text>
                {session?.scheduled_date && (
                  <Text style={styles.infoCardSubtext}>
                    {new Date(session.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </Text>
                )}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>🕐 Start Time</Text>
                <Text style={styles.infoCardValue}>
                  {session?.scheduled_time ? formatTime(session.scheduled_time) : ''}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>🕑 End Time</Text>
                <Text style={styles.infoCardValue}>
                  {formatEndTimeWithDate(
                    session?.scheduled_time,
                    session?.scheduled_end_time,
                    session?.scheduled_date
                  )}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>💰 Total Cost</Text>
                <Text style={styles.infoCardValue}>₹{session?.total_cost}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>🏅 Sport</Text>
                <Text style={styles.infoCardValue}>{session?.sport_type || '-'}</Text>
              </View>

              <View style={[styles.infoCard, styles.infoCardFullWidth]}>
                <Text style={styles.infoCardLabel}>📝 Description</Text>
                <Text style={styles.infoCardValue}>
                  {session?.description ? session.description.slice(0, 100) : '-'}
                </Text>
              </View>
            </View>

            {/* Participants section */}
            <View style={styles.participantsSection}>
              <View style={styles.participantsHeader}>
                <Text style={styles.participantsTitle}>
                  👥 Participants ({participants.length}/{session?.max_participants})
                </Text>
                <Text
                  style={[
                    styles.statusBadge,
                    session?.status === 'open' ? styles.statusOpen : styles.statusFull,
                  ]}
                >
                  {session?.status?.toUpperCase()}
                </Text>
              </View>

              {participants.length === 0 ? (
                <View style={styles.emptyParticipants}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.emptyParticipantsText}>Loading...</Text>
                </View>
              ) : (
                <View>
                  {participants.map((participant) => (
                    <View key={participant.id} style={styles.participantItem}>
                      <View style={styles.participantLeft}>
                        <View style={styles.participantAvatar}>
                          <Text style={styles.participantAvatarText}>
                            {participant.full_name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.participantName}>{participant.full_name}</Text>
                          {participant.user_id === session?.creator_id && (
                            <Text style={styles.creatorBadge}>Creator</Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.participantCost}>
                        ₹{parseFloat(participant.cost_per_person).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action button */}
            {renderActionButton()}

            {/* Invite / share button */}
            {session?.status !== 'completed' && (
              <TouchableOpacity style={styles.inviteButton} onPress={handleShareSession}>
                <Text style={styles.inviteButtonIcon}>🔗</Text>
                <Text style={styles.inviteButtonText}>Invite Friends</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SessionDetailsModal;
