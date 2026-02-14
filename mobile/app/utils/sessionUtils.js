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
 * Normalize date string to YYYY-MM-DD format
 * Handles both "2026-02-16" and "2026-02-16T00:00:00.000Z" formats
 */
const normalizeDate = (dateString) => {
  if (!dateString) return '';
  // Extract YYYY-MM-DD from ISO string or keep as is
  return dateString.split('T')[0];
};

/**
 * Check if two sessions overlap in time
 * Sessions overlap if they are on the same date and their times overlap
 * Overlap condition: (start1 < end2) AND (end1 > start2)
 */
const timeOverlap = (session1, session2) => {
  // Normalize dates to YYYY-MM-DD format for comparison
  const date1 = normalizeDate(session1.scheduled_date);
  const date2 = normalizeDate(session2.scheduled_date);

  console.log(`Comparing dates: "${date1}" vs "${date2}"`);

  // Sessions must be on the same date
  if (date1 !== date2) {
    console.log(`Dates don't match, no overlap`);
    return false;
  }

  const start1 = timeToMinutes(session1.scheduled_time);
  const end1 = timeToMinutes(session1.scheduled_end_time);
  const start2 = timeToMinutes(session2.scheduled_time);
  const end2 = timeToMinutes(session2.scheduled_end_time);

  console.log(`Times: ${start1}-${end1} vs ${start2}-${end2}`);

  // Overlap: (start1 < end2) AND (end1 > start2)
  const overlaps = start1 < end2 && end1 > start2;
  console.log(`Overlap result: ${overlaps}`);
  return overlaps;
};

/**
 * Check if user has any time conflicts with existing joined sessions
 * Returns { hasConflict: boolean, conflictingSession?: Session }
 */
export const checkUserTimeConflict = async (userId, targetSession) => {
  try {
    // Fetch all sessions (both 'open' and 'full' status)
    const [openResponse, fullResponse] = await Promise.all([
      sessionAPI.list(1, 100, 'open', ''),
      sessionAPI.list(1, 100, 'full', ''),
    ]);

    const allSessions = [
      ...(openResponse.data.sessions || []),
      ...(fullResponse.data.sessions || []),
    ];

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
    console.log('════════════════════════════════════════════');
    console.log('🔍 CREATION CONFLICT CHECK START');
    console.log('User ID:', userId);
    console.log('Target Session:', JSON.stringify(targetSession, null, 2));
    console.log('════════════════════════════════════════════');

    // Fetch all sessions (both 'open' and 'full' status)
    const [openResponse, fullResponse] = await Promise.all([
      sessionAPI.list(1, 100, 'open', ''),
      sessionAPI.list(1, 100, 'full', ''),
    ]);

    const allSessions = [
      ...(openResponse.data.sessions || []),
      ...(fullResponse.data.sessions || []),
    ];
    console.log(`📋 Fetched ${allSessions.length} total sessions (open + full)`);

    // Check 1: Filter for sessions created by this user
    const userCreatedSessions = allSessions.filter(
      (session) => session.creator_id === userId
    );
    console.log(`✏️  User has created ${userCreatedSessions.length} sessions`);
    userCreatedSessions.forEach((s, i) => {
      console.log(`   ${i+1}. ${s.scheduled_date} ${s.scheduled_time}-${s.scheduled_end_time} (ID: ${s.id})`);
    });

    // Check for time conflicts with created sessions
    for (const createdSession of userCreatedSessions) {
      const overlap = timeOverlap(targetSession, createdSession);
      console.log(`⏰ Checking overlap with created session ${createdSession.id}: ${overlap}`);
      if (overlap) {
        console.log('❌ CONFLICT FOUND with created session!');
        console.log('════════════════════════════════════════════');
        return {
          hasConflict: true,
          conflictingSession: createdSession,
        };
      }
    }

    // Check 2: Filter for sessions user is already joined in
    console.log('🔍 Checking joined sessions...');
    const userJoinedSessions = [];
    let participantCheckCount = 0;
    let participantErrorCount = 0;

    for (const session of allSessions) {
      try {
        participantCheckCount++;
        const participantsRes = await sessionAPI.getParticipants(session.id);
        const participants = participantsRes.data.participants || [];

        console.log(`   Session ${session.id}: ${participants.length} participants`);
        participants.forEach(p => {
          console.log(`      - User ${p.user_id} (checking against ${userId})`);
        });

        const isUserJoined = participants.some(
          (p) => p.user_id === userId
        );

        if (isUserJoined) {
          console.log(`   ✅ User IS joined in session ${session.id}`);
          userJoinedSessions.push(session);
        } else {
          console.log(`   ⬜ User NOT joined in session ${session.id}`);
        }
      } catch (err) {
        participantErrorCount++;
        console.error(`   ⚠️  Error fetching participants for session ${session.id}:`, err.message);
        continue;
      }
    }

    console.log(`👥 Checked ${participantCheckCount} sessions for participants (${participantErrorCount} errors)`);
    console.log(`🎯 User is joined in ${userJoinedSessions.length} sessions`);
    userJoinedSessions.forEach((s, i) => {
      console.log(`   ${i+1}. ${s.scheduled_date} ${s.scheduled_time}-${s.scheduled_end_time} (ID: ${s.id})`);
    });

    // Check for time conflicts with joined sessions
    for (const joinedSession of userJoinedSessions) {
      const overlap = timeOverlap(targetSession, joinedSession);
      console.log(`⏰ Checking overlap with joined session ${joinedSession.id}: ${overlap}`);
      if (overlap) {
        console.log('❌ CONFLICT FOUND with joined session!');
        console.log('════════════════════════════════════════════');
        return {
          hasConflict: true,
          conflictingSession: joinedSession,
        };
      }
    }

    console.log('✅ No conflicts found');
    console.log('════════════════════════════════════════════');
    return { hasConflict: false };
  } catch (err) {
    console.error('💥 ERROR in checkUserCreationConflict:', err);
    console.error('Stack:', err.stack);
    console.log('════════════════════════════════════════════');
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
