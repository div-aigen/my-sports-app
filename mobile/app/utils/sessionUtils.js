import { sessionAPI } from '../../services/api';

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two sessions overlap in time
 * Sessions overlap if they are on the same date and their times overlap
 * Overlap condition: (start1 < end2) AND (end1 > start2)
 */
const timeOverlap = (session1, session2) => {
  // Sessions must be on the same date
  if (session1.scheduled_date !== session2.scheduled_date) {
    return false;
  }

  const start1 = timeToMinutes(session1.scheduled_time);
  const end1 = timeToMinutes(session1.scheduled_end_time);
  const start2 = timeToMinutes(session2.scheduled_time);
  const end2 = timeToMinutes(session2.scheduled_end_time);

  // Overlap: (start1 < end2) AND (end1 > start2)
  return start1 < end2 && end1 > start2;
};

/**
 * Check if user has any time conflicts with existing joined sessions
 * Returns { hasConflict: boolean, conflictingSession?: Session }
 */
export const checkUserTimeConflict = async (userId, targetSession) => {
  try {
    // Fetch all sessions
    const response = await sessionAPI.list(1, 100, 'open', '');
    const allSessions = response.data.sessions || [];

    // Filter for sessions user is already joined in
    const userJoinedSessions = [];
    for (const session of allSessions) {
      try {
        const participantsRes = await sessionAPI.getParticipants(session.id);
        const isUserJoined = participantsRes.data.participants.some(
          (p) => p.user_id === userId
        );
        if (isUserJoined) {
          userJoinedSessions.push(session);
        }
      } catch (err) {
        // Skip if error fetching participants
        continue;
      }
    }

    // Check for time conflicts
    for (const joinedSession of userJoinedSessions) {
      if (timeOverlap(targetSession, joinedSession)) {
        return {
          hasConflict: true,
          conflictingSession: joinedSession,
        };
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.error('Error checking time conflict:', err);
    // If there's an error checking conflicts, allow the join
    // (better to fail gracefully than block legitimate joins)
    return { hasConflict: false };
  }
};

/**
 * Check if user has any time conflicts with sessions they have created or joined
 * Returns { hasConflict: boolean, conflictingSession?: Session }
 */
export const checkUserCreationConflict = async (userId, targetSession) => {
  try {
    // Fetch all sessions
    const response = await sessionAPI.list(1, 100, 'open', '');
    const allSessions = response.data.sessions || [];

    // Check 1: Filter for sessions created by this user
    const userCreatedSessions = allSessions.filter(
      (session) => session.creator_id === userId
    );

    // Check for time conflicts with created sessions
    for (const createdSession of userCreatedSessions) {
      if (timeOverlap(targetSession, createdSession)) {
        return {
          hasConflict: true,
          conflictingSession: createdSession,
        };
      }
    }

    // Check 2: Filter for sessions user is already joined in
    const userJoinedSessions = [];
    for (const session of allSessions) {
      try {
        const participantsRes = await sessionAPI.getParticipants(session.id);
        const isUserJoined = participantsRes.data.participants.some(
          (p) => p.user_id === userId
        );
        if (isUserJoined) {
          userJoinedSessions.push(session);
        }
      } catch (err) {
        // Skip if error fetching participants
        continue;
      }
    }

    // Check for time conflicts with joined sessions
    for (const joinedSession of userJoinedSessions) {
      if (timeOverlap(targetSession, joinedSession)) {
        return {
          hasConflict: true,
          conflictingSession: joinedSession,
        };
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.error('Error checking creation conflict:', err);
    // If there's an error checking conflicts, allow the creation
    // (better to fail gracefully than block legitimate creations)
    return { hasConflict: false };
  }
};

export default {
  timeToMinutes,
  timeOverlap,
  checkUserTimeConflict,
  checkUserCreationConflict,
};
