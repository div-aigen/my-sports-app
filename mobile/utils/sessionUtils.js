import { sessionAPI } from '../services/api';

const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const normalizeDate = (dateString) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

const timeOverlap = (session1, session2) => {
  const date1 = normalizeDate(session1.scheduled_date);
  const date2 = normalizeDate(session2.scheduled_date);
  if (date1 !== date2) return false;

  const start1 = timeToMinutes(session1.scheduled_time);
  const end1 = timeToMinutes(session1.scheduled_end_time);
  const start2 = timeToMinutes(session2.scheduled_time);
  const end2 = timeToMinutes(session2.scheduled_end_time);

  return start1 < end2 && end1 > start2;
};

export const checkUserTimeConflict = async (userId, targetSession) => {
  try {
    const [openResponse, fullResponse] = await Promise.all([
      sessionAPI.list(1, 100, 'open', ''),
      sessionAPI.list(1, 100, 'full', ''),
    ]);

    const allSessions = [
      ...(openResponse.data.sessions || []),
      ...(fullResponse.data.sessions || []),
    ];

    for (const session of allSessions) {
      try {
        const participantsRes = await sessionAPI.getParticipants(session.id);
        const isUserJoined = participantsRes.data.participants.some(
          (p) => p.user_id === userId
        );
        if (isUserJoined && timeOverlap(targetSession, session)) {
          return { hasConflict: true, conflictingSession: session };
        }
      } catch {
        continue;
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.error('Error checking time conflict:', err);
    return { hasConflict: false };
  }
};

export const checkUserCreationConflict = async (userId, targetSession) => {
  try {
    const [openResponse, fullResponse] = await Promise.all([
      sessionAPI.list(1, 100, 'open', ''),
      sessionAPI.list(1, 100, 'full', ''),
    ]);

    const allSessions = [
      ...(openResponse.data.sessions || []),
      ...(fullResponse.data.sessions || []),
    ];

    // Check sessions created by this user
    const userCreatedSessions = allSessions.filter(
      (session) => session.creator_id === userId
    );

    for (const createdSession of userCreatedSessions) {
      if (timeOverlap(targetSession, createdSession)) {
        return { hasConflict: true, conflictingSession: createdSession };
      }
    }

    // Check sessions user has joined
    for (const session of allSessions) {
      try {
        const participantsRes = await sessionAPI.getParticipants(session.id);
        const isUserJoined = participantsRes.data.participants.some(
          (p) => p.user_id === userId
        );
        if (isUserJoined && timeOverlap(targetSession, session)) {
          return { hasConflict: true, conflictingSession: session };
        }
      } catch {
        continue;
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.error('Error checking creation conflict:', err);
    return { hasConflict: false };
  }
};
