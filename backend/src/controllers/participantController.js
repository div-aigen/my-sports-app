const Participant = require('../models/Participant');
const notificationService = require('../services/notificationService');
const pool = require('../config/database');

const joinSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    const participant = await Participant.join(sessionId, userId);

    // Emit Socket.io event
    req.io.to(`session-${sessionId}`).emit('participant-joined', {
      sessionId,
      participant,
    });

    // Send push notification if session is now full
    try {
      const sessionResult = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
      const session = sessionResult.rows[0];
      if (session && session.status === 'full') {
        const participants = await Participant.findBySessionId(sessionId);
        notificationService.notifySessionFull(session, participants);
      }
    } catch (notifErr) {
      console.error('Notification error (non-blocking):', notifErr);
    }

    res.status(201).json({
      message: 'Joined session successfully',
      participant,
    });
  } catch (err) {
    if (err.message.includes('already joined') || err.message.includes('full') || err.message.includes('not found')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Failed to join session' });
  }
};

const leaveSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    await Participant.leave(sessionId, userId);

    // Emit Socket.io event
    req.io.to(`session-${sessionId}`).emit('participant-left', {
      sessionId,
      userId,
    });

    res.json({
      message: 'Left session successfully',
    });
  } catch (err) {
    if (err.message.includes('Creator cannot') || err.message.includes('already started') || err.message.includes('not a participant')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Leave session error:', err);
    res.status(500).json({ error: 'Failed to leave session' });
  }
};

const getParticipants = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const participants = await Participant.findBySessionId(sessionId);

    res.json({
      participants,
      count: participants.length,
    });
  } catch (err) {
    console.error('Get participants error:', err);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};

module.exports = {
  joinSession,
  leaveSession,
  getParticipants,
};
